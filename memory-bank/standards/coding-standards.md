# Coding Standards

## Overview

Code should follow the conventions already established by the PictuRAS services while keeping new work consistent, testable, and suitable for a multi-language microservices repository.

## Code Formatting

- Use Prettier for TypeScript and JavaScript, preserving the repository's existing configuration.
- Follow PEP 8 conventions for Python.
- Use two spaces in TypeScript/JavaScript and four spaces in Python unless an existing file establishes a different local convention.
- Keep formatting automated and avoid unrelated formatting churn.

## Linting Rules

- Use the configured ESLint rules for the frontend and Node.js services.
- Keep TypeScript checks strict where the existing project configuration supports them.
- Avoid introducing `any` when a precise type or `unknown` is appropriate.
- Use Python linting and type checks for new or substantially changed Python code when the service tooling supports them.
- Do not commit secrets, tokens, credentials, or commented-out production code.

## Naming Conventions

- JavaScript/TypeScript variables and functions use camelCase.
- JavaScript/TypeScript classes, React components, interfaces, and types use PascalCase.
- Constants use UPPER_SNAKE_CASE when they are module-level fixed values.
- React hooks use the `use` prefix.
- Python variables, functions, and modules use snake_case; Python classes use PascalCase.
- Boolean values should communicate intent with names such as `isActive`, `hasAccess`, or `canEdit`.

## File & Folder Organization

- Keep frontend code organized by feature and existing component boundaries.
- Keep each backend service independently organized around its routes, controllers, models, middleware, and utilities.
- Keep Python processing tools isolated by tool responsibility.
- Place tests close to the code they exercise or in the service's established test directory.
- Prefer local types and helpers over broad shared abstractions unless a cross-service contract requires one.
- Avoid unrelated repository-wide reorganizations.

## Testing Strategy

- Add unit tests for non-trivial domain logic and transformations.
- Add integration tests for service boundaries, persistence, authentication, queues, and storage interactions where practical.
- Cover critical workflows including authentication, project operations, image processing orchestration, and subscription limits.
- Prefer behavior-focused tests with Arrange-Act-Assert structure.
- Mock external boundaries such as databases, queues, object storage, and third-party APIs; do not mock the behavior under test.
- Add regression tests for fixed defects.

## Error Handling Patterns

- Handle asynchronous failures explicitly and route service errors through centralized handlers where available.
- Use appropriate HTTP status codes and consistent error response shapes within each API boundary.
- Keep technical error details out of user-facing messages and never expose secrets or stack traces in production responses.
- Use custom error types or stable error codes when callers need to distinguish domain failures.
- Treat validation errors, authentication failures, authorization failures, not-found results, and infrastructure failures distinctly.

## Logging Standards

- Use structured logs where the service supports them.
- Include service, operation, request or correlation identifiers, and relevant non-sensitive context.
- Never log passwords, JWTs, encryption keys, payment data, or unredacted sensitive user fields.
- Log failures with enough context to diagnose them without duplicating sensitive payloads.
