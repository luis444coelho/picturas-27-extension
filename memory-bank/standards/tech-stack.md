# Tech Stack

## Overview

PictuRAS is a full-stack web application implemented as a Docker Compose microservices system. The stack combines a Next.js frontend, Node.js services, Python image-processing workers, and self-hosted infrastructure.

## Languages

- TypeScript and JavaScript for the frontend and Node.js services
- Python for image-processing and AI microservices

TypeScript provides type safety in the frontend while JavaScript remains consistent with the existing Node.js services. Python is used where the image-processing and AI ecosystem is strongest.

## Framework

- Next.js 15 with React 19 and Tailwind CSS for the frontend
- Express for Node.js backend services
- Python worker services using the existing service-specific libraries and runtimes

Next.js supports the interactive SSR frontend, while the service-oriented backend keeps user, project, subscription, storage, and gateway responsibilities separated.

## Authentication

Custom JWT-based authentication shared across the gateway, user service, and WebSocket gateway.

Authentication is already integrated with the existing service boundaries and uses a shared JWT secret for request and WebSocket validation.

## Infrastructure & Deployment

Docker Compose orchestrates the application services and supporting infrastructure. Nginx terminates TLS and acts as the external reverse proxy. MongoDB, RabbitMQ, SeaweedFS, and the image-processing workers run as containerized services.

This preserves reproducible local deployment and matches the existing microservices architecture.

## Package Manager

- Bun for the frontend, as indicated by `frontend/bun.lockb`
- npm for the Node.js services
- pip with `requirements.txt` for Python services

The project keeps the package managers already established by each runtime and service.

## Decision Relationships

- Next.js and React define the frontend structure and TypeScript tooling.
- Docker Compose packages all language runtimes and infrastructure consistently.
- JWT authentication is shared by the API and WebSocket gateways.
- RabbitMQ connects the backend orchestration layer to Python processing workers.
