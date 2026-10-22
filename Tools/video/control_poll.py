"""D-56: receive control inside Pika's synchronous delivery callback.

Nested process_data_events serves I/O but defers consumer callbacks. A second
exclusive queue on the existing control channel permits explicit basic_get,
reusing the same cancellation handler, connection and main thread.
"""
from control import CONTROL_EXCHANGE


class ControlPoller:
    def __init__(self, control):
        self._control = control
        self._channel = control._channel
        self._queue = self._channel.queue_declare(
            queue='', exclusive=True, auto_delete=True).method.queue
        self._channel.queue_bind(queue=self._queue, exchange=CONTROL_EXCHANGE)

    def poll(self):
        # Bound each turn so heartbeats/progress still run under a control burst.
        for _ in range(100):
            method, properties, body = self._channel.basic_get(
                queue=self._queue, auto_ack=True)
            if method is None:
                return
            self._control._on_message(self._channel, method, properties, body)
