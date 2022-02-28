# Standard packages
import json
import uuid

# Third-party packages
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from opentelemetry.instrumentation.flask import FlaskInstrumentor

# Service packages
from common import config, logger, tracer

# Instantiate application
app = Flask(config.get('SERVICE_NAME'))
FlaskInstrumentor().instrument_app(app)

# Enable CORS
cors = CORS(app, resources={r'*': {'origins': '*'}})

def generate_transaction_id():
    return str(uuid.uuid4())


####  HTTP Handlers  ###########################################################

BASE_URL_API_GATEWAY = "http://{}:{}/api/v1".format(
    config.get('SERVICE_HOST_API_GATEWAY'),
    config.get('SERVICE_PORT_API_GATEWAY')
)

@app.route('/process', methods=['POST',])
@cross_origin()
def post_checkout():
    """
    Process an order submission.
    """
    data = request.get_json()

    # Process the payment
    data_payment = {
        'amount': data.get('amount'),
        'card': data.get('billing', {}).get('card', {}),
        'transaction_id': generate_transaction_id()
    }
    url = "{}/payment/process".format(BASE_URL_API_GATEWAY)
    response = requests.post(url, json=data_payment)
    if response.status_code != 200:
        return jsonify({ 'message': 'failure' }), response.status_code

    # Clear the cart
    data_cart = {
        'session_id': data.get('session_id')
    }
    url="{}/cart".format(BASE_URL_API_GATEWAY)
    response = requests.delete(url, json=data_cart)
    if response.status_code != 200:
        return jsonify({ 'message': 'failure' }), response.status_code
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
