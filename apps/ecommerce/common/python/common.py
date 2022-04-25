"""
Configuration, tracing, and logging common to all Python services in the
microbs ecommerce application and its variants. This file must be copied to the
./src directory of any service that imports it. Currently the Dockerfile of each
service is responsible for copying this file.
"""

import gevent.monkey
gevent.monkey.patch_all()

# Standard packages
import datetime
import logging
import os
import re
import sys
import traceback


####  Configuration  ###########################################################

config = {}
config['DEBUG'] = os.environ.get('DEBUG') or False
config['DEPLOYMENT_ENVIRONMENT'] = os.environ.get('DEPLOYMENT_ENVIRONMENT') or 'development'
config['LOG_LEVEL'] = 'DEBUG' if config.get('DEBUG') else (os.environ.get('LOG_LEVEL') or 'INFO').upper()
config['SERVICE_NAME'] = os.environ.get('SERVICE_NAME') or 'service'
config['SERVICE_BIND_HOST'] = os.environ.get('SERVICE_BIND_HOST') or '0.0.0.0'
config['SERVICE_BIND_PORT'] = os.environ.get('SERVICE_BIND_PORT') or 80
config['SERVICE_HOST_API_GATEWAY'] = os.environ.get('SERVICE_HOST_API_GATEWAY') or 'localhost'
config['SERVICE_PORT_API_GATEWAY'] = os.environ.get('SERVICE_PORT_API_GATEWAY') or 8080
config['SERVICE_VERSION'] = os.environ.get('SERVICE_VERSION') or ''
config['OTLP_RECEIVER_HOST'] = os.environ.get('OTLP_RECEIVER_HOST') or 'localhost'
config['OTLP_RECEIVER_PORT'] = os.environ.get('OTLP_RECEIVER_PORT') or 4317


####  Tracing  #################################################################

from opentelemetry import trace
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.trace.status import Status, StatusCode
RequestsInstrumentor().instrument()


####  Logging  #################################################################

RE_ESCAPABLE = re.compile(r'([\=\ \\\\"])')

def logfmt_value(value):
    """
    Format a value in logfmt format.
        - Null values must be empty strings.
        - Boolean values must be 'true' or 'false'.
        - Values with spaces must be quoted.
        - Escape reserved characters only if the value is unquoted to minimize escaping.
    """
    if value is None:
        return ''
    if isinstance(value, bool):
        return 'true' if value else 'false'
    value = str(value)
    if ' ' in value:
        if '"' in value:
            value = value.replace('"', '\\"')
        return '"{}"'.format(value)
    return re.sub(RE_ESCAPABLE, r'\\\1', value)

def logfmt_key_value(key, value):
    """
    Format a key-value pair in logfmt format.
    """
    return '='.join([ key, logfmt_value(value) ])

def logfmt(key_value_pairs):
    """
    Format a log line in logfmt format.
    """
    log_formatted = []
    for key, value in key_value_pairs:
        log_formatted.append(logfmt_key_value(key, value))
    return ' '.join(log_formatted)

class LogfmtFormatter(logging.Formatter):

    def format(self, log):
        """
        Format a log line in logfmt format.
        Allow arbitrary tags as key-value tuples.
        Add OpenTelemetry data if applicable.
        """
        log_formatted = [
            ( 'ts', datetime.datetime.utcfromtimestamp(log.created).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'),
            ( 'level', log.levelname.lower() ),
            ( 'msg', log.getMessage() ),
        ]
        for key, value in getattr(log, 'tags', []):
            log_formatted.append(( key, value ))
        if trace.get_current_span().is_recording():
            log_formatted.append(( 'endpoint', trace.get_current_span().name ))
            log_formatted.append(( 'traceID', trace.format_trace_id(trace.get_current_span().get_span_context().trace_id) ))
            log_formatted.append(( 'spanID', trace.format_span_id(trace.get_current_span().get_span_context().span_id) ))
        if log.exc_info:
            log_formatted.append(('exception', '\\n'.join(self.formatException(log.exc_info).split('\n'))))
        if log.stack_info:
            log_formatted.append(('stack', '\\n'.join(self.formatStack(log.stack_info).split('\n'))))
        return logfmt(log_formatted)

# Use logfmt with tags OpenTelemetry data
logger = logging.getLogger(config.get('SERVICE_NAME'))
logHandler = logging.StreamHandler(stream=sys.stdout)
logHandler.setFormatter(LogfmtFormatter())
logger.addHandler(logHandler)
logger.setLevel(config.get('LOG_LEVEL'))

# Suppress default Flask logger except in the case of errors
loggerWerkzeug = logging.getLogger('werkzeug')
logHandlerWerkzeug = logging.StreamHandler(stream=sys.stdout)
logHandlerWerkzeug.setFormatter(LogfmtFormatter())
loggerWerkzeug.addHandler(logHandlerWerkzeug)
loggerWerkzeug.setLevel(logging.ERROR)


####  App  #####################################################################

from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from werkzeug.exceptions import HTTPException

# Log requests and responses using logfmt, tags, and OpenTelemetry data
def response_hook(span, status, response_headers):
    logger.info('{} {}'.format(request.method, request.path), extra={
        'tags': [
            ( 'ip', request.environ.get('REMOTE_ADDR') ),
            ( 'method', request.method ),
            ( 'path', request.path ),
            ( 'status', status.split(' ')[0] ),
        ]
    })

# Instantiate application
app = Flask(config.get('SERVICE_NAME'))
FlaskInstrumentor().instrument_app(app, response_hook=response_hook)

# Enable CORS
cors = CORS(app, resources={r'*': {'origins': '*'}})

# Common routes
@app.route('/healthz')
@cross_origin()
def healthz():
    """
    Handle liveness and readiness probes.
    """
    return jsonify({ 'healthy': True })

# Unhandled exceptions
@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e
    logger.exception(e, extra={
        'tags': [
            ( 'ip', request.environ.get('REMOTE_ADDR') ),
            ( 'method', request.method ),
            ( 'path', request.path ),
        ]
    })
    span = trace.get_current_span()
    span.record_exception(e)
    span.set_attribute('event.outcome', 'failure')
    span.set_status(Status(StatusCode.ERROR))
    return jsonify({
        'message': getattr(e, 'message', repr(e)),
        'stacktrace': traceback.format_exc()
    })
