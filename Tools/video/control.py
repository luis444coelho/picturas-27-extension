import json
import time

CONTROL_EXCHANGE = 'video_control'

# Longer than the longest a task can wait in the queue: the maintenance routine
# closes a task after 3 h 10 min without a transition (D-41), so 4 h covers it.
CANCELLED_TTL_S = 4 * 60 * 60


class CancelledTasks:
    """taskIds cancelled by the projects service, kept for a TTL (ADD T-03)."""

    def __init__(self, ttl=CANCELLED_TTL_S, clock=time.monotonic):
        self._ttl = ttl
        self._clock = clock
        self._expires = {}

    def add(self, task_id):
        self._purge()
        self._expires[str(task_id)] = self._clock() + self._ttl

    def __contains__(self, task_id):
        self._purge()
        return str(task_id) in self._expires

    def _purge(self):
        now = self._clock()
        for task_id in [t for t, at in self._expires.items() if at <= now]:
            del self._expires[task_id]


class ControlChannel:
    """Second channel on the worker's connection (ADD T-03): an exclusive queue
    bound to the fanout exchange video_control. Its messages are delivered by
    the same loop that serves heartbeats and follows FFmpeg, with no threads."""

    def __init__(self, connection, cancelled=None, on_cancel=None):
        self.cancelled = cancelled or CancelledTasks()
        self._on_cancel = on_cancel
        self._channel = connection.channel()
        self._channel.exchange_declare(exchange=CONTROL_EXCHANGE, exchange_type='fanout', durable=True)
        queue = self._channel.queue_declare(queue='', exclusive=True, auto_delete=True).method.queue
        self._channel.queue_bind(queue=queue, exchange=CONTROL_EXCHANGE)
        self._channel.basic_consume(queue=queue, on_message_callback=self._on_message, auto_ack=True)

    def _on_message(self, channel, method, properties, body):
        try:
            task_id = json.loads(body.decode()).get('taskId')
        except (ValueError, AttributeError):
            return
        if task_id:
            self.cancelled.add(task_id)
            if self._on_cancel:
                self._on_cancel(task_id)
