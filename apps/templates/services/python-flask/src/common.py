"""
Configuration, tracing, and logging.
"""

# Standard packages
import logging
import os
import sys


####  Configuration  ###########################################################

config = {}
config['DEBUG'] = os.environ.get('DEBUG') or False
config['ENVIRONMENT'] = os.environ.get('ENVIRONMENT') or 'development'
config['LOG_LEVEL'] = 'DEBUG' if config.get('DEBUG') else (os.environ.get('LOG_LEVEL') or 'INFO').upper()
config['SERVICE_NAME'] = os.environ.get('SERVICE_NAME') or 'service'
config['SERVICE_BIND_HOST'] = os.environ.get('SERVICE_BIND_HOST') or '0.0.0.0'
config['SERVICE_BIND_PORT'] = os.environ.get('SERVICE_BIND_PORT') or 80
config['OTLP_RECEIVER_HOST'] = os.environ.get('OTLP_RECEIVER_HOST') or 'localhost'
config['OTLP_RECEIVER_PORT'] = os.environ.get('OTLP_RECEIVER_PORT') or 4317


####  Tracing  #################################################################

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.trace.status import Status, StatusCode
RequestsInstrumentor().instrument()
tracer_provider = TracerProvider(resource=Resource.create({
    'deployment.environment': config.get('ENVIRONMENT'),
    'service.name': config.get('SERVICE_NAME')
}))
tracer_provider.add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(endpoint="http://{}:{}".format(
            config.get('OTLP_RECEIVER_HOST'),
            config.get('OTLP_RECEIVER_PORT')
        ))
    )
)
if config.get('DEBUG'):
    tracer_provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(config.get('SERVICE_NAME'))


####  Logging  #################################################################

import ecs_logging
logger = logging.getLogger(config.get('SERVICE_NAME'))
logHandler = logging.StreamHandler(stream=sys.stdout)
logHandler.setFormatter(ecs_logging.StdlibFormatter())
logger.addHandler(logHandler)
logger.setLevel(config.get('LOG_LEVEL'))
