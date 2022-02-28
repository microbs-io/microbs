# Standard packages
import json
import random
import re
import time

# Third-party packages
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from opentelemetry.instrumentation.flask import FlaskInstrumentor

# Service packages
from common import config, logger, tracer

RE_NON_DIGITS = re.compile(r'[^0-9]')

# Instantiate application
app = Flask(config.get('SERVICE_NAME'))
FlaskInstrumentor().instrument_app(app)

# Enable CORS
cors = CORS(app, resources={r'*': {'origins': '*'}})

def process_payment(card_number, amount):
    """
    Process a payment. Wait for a random time to simulate processing.
    """
    time.sleep(random.uniform(1.0, 4.0))

def validate_card_number(card_number):
    """
    Validate the Luhn checksum of a given card number.
    """
    def digits_of(n):
        return [ int(d) for d in str(n) ]
    digits = digits_of(re.sub(RE_NON_DIGITS, '', card_number))
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    checksum = 0
    checksum += sum(odd_digits)
    for d in even_digits:
        checksum += sum(digits_of(d * 2))
    return checksum % 10 == 0


####  HTTP Handlers  ###########################################################

@app.route('/process', methods=['POST',])
@cross_origin()
def post_payment():
    """
    Process a payment.
    """
    data = request.get_json()
    if not validate_card_number(data.get('card', {}).get('number')):
        return jsonify({ 'message': 'failure', 'reason': 'Invalid card number' }), 400
    process_payment(data.get('card', {}).get('number'), data.get('amount'))
    return jsonify({ 'message': 'success' })

@app.route('/healthz')
@cross_origin()
def healthz():
    """
    Handle liveness and readiness probes.
    """
    logger.debug('GET /healthz')
    return jsonify({ 'healthy': True })

@app.route('/')
@cross_origin()
def home():
    """
    Handle base path.
    """
    logger.debug('GET /')
    return app.response_class(
        response=json.dumps(config, indent=2, sort_keys=True),
        mimetype='application/json',
        status=200
    )


####  Main  ####################################################################

if __name__ == '__main__':
    app.run(config.get('SERVICE_BIND_HOST'), config.get('SERVICE_BIND_PORT'))
