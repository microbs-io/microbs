# Standard packages
import json
import uuid

# Third-party packages
import requests
from flask import jsonify, request
from opentelemetry import trace
from opentelemetry.trace.status import Status, StatusCode

# Service packages
from common import app, config, logger

def generate_transaction_id():
    return str(uuid.uuid4())


####  HTTP Handlers  ###########################################################

BASE_URL_API_GATEWAY = "http://{}:{}/api/v1".format(
    config.get('SERVICE_HOST_API_GATEWAY'),
    config.get('SERVICE_PORT_API_GATEWAY')
)

@app.route('/process', methods=['POST',])
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
        span = trace.get_current_span()
        span.set_attribute('event.outcome', 'failure')
        span.set_status(Status(StatusCode.ERROR))
        return jsonify({ 'message': 'failure' }), response.status_code

    # Clear the cart
    data_cart = {
        'session_id': data.get('session_id')
    }
    url="{}/cart".format(BASE_URL_API_GATEWAY)
    response = requests.delete(url, json=data_cart)
    if response.status_code != 200:
        span = trace.get_current_span()
        span.set_attribute('event.outcome', 'failure')
        span.set_status(Status(StatusCode.ERROR))
        return jsonify({ 'message': 'failure' }), response.status_code
    return jsonify({ 'message': 'success' })

@app.route('/')
def home():
    """
    Handle base path.
    """
    return app.response_class(
        response=json.dumps(config, indent=2, sort_keys=True),
        mimetype='application/json',
        status=200
    )


####  Main  ####################################################################

if __name__ == '__main__':
    app.run(config.get('SERVICE_BIND_HOST'), config.get('SERVICE_BIND_PORT'))
