def post_fork(server, worker):
    
    # Service packages
    from common import config
    
    # Configure tracing
    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
    tracer_provider = TracerProvider(resource=Resource.create({
        'deployment.environment': config.get('DEPLOYMENT_ENVIRONMENT'),
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
