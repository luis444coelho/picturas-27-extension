import json

import pika

from utils.rabbit_mq import Rabbit_MQ

import config


class VideoRabbitMQ(Rabbit_MQ):
    """Rabbit_MQ for the video worker (ADD T-02, T-03).

    The base class is reused without changes. What video needs differently lives
    here: the operations queue is declared with its quorum arguments, messages
    are consumed with auto_ack=False and prefetch_count=1, and replies are
    persistent and published straight to the replies queue.
    """

    def declare_queues(self):
        self._channel.queue_declare(
            queue=config.OPERATIONS_QUEUE,
            durable=True,
            arguments=config.OPERATIONS_QUEUE_ARGUMENTS,
        )
        self._channel.queue_declare(queue=config.REPLIES_QUEUE, durable=True)

    def consume(self, callback):
        self._queue = config.OPERATIONS_QUEUE
        self._channel.basic_qos(prefetch_count=1)
        self._channel.basic_consume(
            queue=config.OPERATIONS_QUEUE,
            on_message_callback=callback,
            auto_ack=False,
        )
        self._channel.start_consuming()

    def publish_reply(self, message):
        self._channel.basic_publish(
            exchange='picturas',
            routing_key=config.REPLIES_QUEUE,
            body=json.dumps(message),
            properties=pika.BasicProperties(delivery_mode=2, content_type='application/json'),
        )

    def pump(self):
        """Serve heartbeats during long work, without blocking (ADD T-03)."""
        self._connection.process_data_events(time_limit=0)
