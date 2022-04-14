# Build
FROM node:16-slim as build

# Requirements for service
WORKDIR /
COPY ./services/synthetics/.nvmrc .
COPY ./services/synthetics/package.json .
COPY ./services/synthetics/babel.config.json .
COPY ./services/synthetics/webpack.config.js .
COPY ./services/synthetics/src ./src

# Build
RUN npm install
RUN npm run build

# Run
FROM grafana/k6:0.37.0

# Copy build
WORKDIR /
COPY --from=build /dist ./dist

# Configuration inputs
ARG DEPLOYMENT_ENVIRONMENT
ARG SERVICE_NAME
ARG SERVICE_HOST_WEB_GATEWAY
ARG SERVICE_PORT_WEB_GATEWAY
ENV DEPLOYMENT_ENVIRONMENT=${DEPLOYMENT_ENVIRONMENT}
ENV SERVICE_NAME=${SERVICE_NAME}
ENV SERVICE_HOST_WEB_GATEWAY=${SERVICE_HOST_WEB_GATEWAY}
ENV SERVICE_PORT_WEB_GATEWAY=${SERVICE_PORT_WEB_GATEWAY}

CMD [ "run", "./dist/app.bundle.js", "--no-summary", "--no-usage-report", "-q" ]
