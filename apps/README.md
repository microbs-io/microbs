## App requirements

- `./skaffold.yaml` contains instructions for building and deploying services under the `main` profile


## Service requirements


### Structural requirements

- `./services/${SERVICE_NAME}/src/` contains source code for service
- `./services/${SERVICE_NAME}/k8s/` contains Kubernetes manifest for service
- `./services/${SERVICE_NAME}/Dockerfile` accepts all required environment variables
- `./services/${SERVICE_NAME}/Dockerfile` exposes `${SERVICE_PORT}`
- `./services/${SERVICE_NAME}/README.md` explains the service


### Configuration requirements

Environment variables unique to each service:

- `SERVICE_NAME`
- `SERVICE_HOST` (default: `localhost`)
- `SERVICE_PORT` (default: `80`)

Environment variables common to all services:

- `ENVIRONMENT`
- `OTLP_RECEIVER_HOST`
- `OTLP_RECEIVER_PORT`


### Functional requirements

- Service is instrumented with OpenTelemetry
- Service accepts and responds with `application/json` content
- Service logs using a standard format
- Service correlates logs with traces


### Test requirements

- Service exposes a `GET /healthz` endpoint
    - Expect success status code (`200`)
    - Expect success message (`{"healthy":true}`)
- Service exposes a `GET /test/success` endpoint
    - Expect success status code (`200`)
    - Expect trace captured
    - Expect trace linked to log message
    - Expect trace with `test_run_id` attribute
- Service exposes a `GET /test/failure` endpoint
    - Expect failure status code (`500`)
    - Expect failure message (`{"success":false}`)
    - Expect trace captured
    - Expect trace linked to log message
    - Expect trace with `test_run_id` attribute
    - Expect trace with error attributes
