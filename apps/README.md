## App requirements

- `./skaffold.yaml` contains instructions for building and deploying services under the `main` profile


## Service requirements


### Structural requirements

- `./services/${SERVICE_NAME}/src/` contains source code for service
- `./services/${SERVICE_NAME}/k8s/` contains Kubernetes manifest for service
- `./services/${SERVICE_NAME}/Dockerfile` accepts all required environment variables
- `./services/${SERVICE_NAME}/Dockerfile` exposes `${SERVICE_BIND_PORT}`
- `./services/${SERVICE_NAME}/README.md` explains the service


### Configuration requirements

Environment variables unique to each service:

- `SERVICE_NAME`
- `SERVICE_BIND_HOST` (default: `localhost`)
- `SERVICE_BIND_PORT` (default: `80`)

Environment variables common to all services:

- `ENVIRONMENT` (default: `development`)
- `OTLP_RECEIVER_HOST` (default: `localhost`)
- `OTLP_RECEIVER_PORT` (default: `4317`)


### Functional requirements

- Service is instrumented with OpenTelemetry (OTLP/gRPC)
- Service accepts and responds with `application/json` content
- Service logs using logfmt syntax
- Service correlates logs with traces


### Test requirements

- Service exposes a `GET /healthz` endpoint
    - Expect success status code (`200`)
    - Expect success message (`{"healthy":true}`)
