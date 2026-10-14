# Data Stack

## Overview

PictuRAS uses service-owned MongoDB databases for domain data, SeaweedFS for encrypted image/object storage, and RabbitMQ for asynchronous processing messages.

## Database

MongoDB 4.4, deployed as separate instances for the users, projects, and subscriptions services.

MongoDB matches the existing document-oriented service models and allows each service to own its persistence boundary. The databases are self-hosted through Docker Compose and are backed up by the MongoDB backup sidecar.

SeaweedFS provides S3-compatible object storage for image data and is separate from the domain databases. Encryption at rest is enabled through the existing SeaweedFS configuration.

## ORM / Database Client

Mongoose for Node.js services.

Mongoose provides schema modeling, validation, and MongoDB access for the existing Express services. Python processing workers primarily consume image files and messages rather than owning MongoDB domain data.

## Decision Relationships

- Each domain service owns its MongoDB instance and models.
- SeaweedFS stores image objects rather than domain records.
- RabbitMQ transports asynchronous tool requests and results rather than persistent domain state.
- Docker Compose manages the local database, storage, queue, and backup services together.
