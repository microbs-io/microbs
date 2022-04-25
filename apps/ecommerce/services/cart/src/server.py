# Standard packages
import json
import os
import re

# Third-party packages
import redis
from flask import jsonify, request
from opentelemetry.instrumentation.redis import RedisInstrumentor

# Service packages
from common import app, config, logger

# Configure Redis client
RedisInstrumentor().instrument()
r = redis.Redis(
    host=(os.environ.get('SERVICE_HOST_CART_DATA') or 'cart-data'),
    port=(os.environ.get('SERVICE_PORT_CART_DATA') or 6379),
    db=0,
    decode_responses=True
)

def get_cart_id(session_id):
    """
    Transform the value of a "session_id" cookie to its key in session-store.
    """
    logger.info(session_id)
    matches = re.findall(r'^([^.]*)\.', session_id)
    logger.info(matches)
    if matches:
        return "s:{}".format(matches[0])
    raise Exception('Cannot find cart')

def get_cart(cart_id):
    logger.debug("Getting cart {}".format(cart_id))
    return r.hgetall(cart_id)

def clear_cart(cart_id):
    logger.debug("Deleting cart {}".format(cart_id))
    return r.delete(cart_id)

def set_cart_item(cart_id, product_id, quantity):
    logger.debug("Adding product {} x {} to cart {}".format(product_id, quantity, cart_id))
    return r.hset(cart_id, product_id, quantity)

def remove_cart_item(cart_id, product_id):
    logger.debug("Removing product {} from cart {}".format(product_id, cart_id))
    return r.hdel(cart_id, product_id)


####  HTTP Handlers  ###########################################################

@app.route('/', methods=['POST',])
def get_cart_products():
    """
    Get products from a cart.
    """
    session_id = request.get_json().get('session_id')
    cart_id = get_cart_id(session_id)
    reply = get_cart(cart_id)
    return jsonify({ 'message': 'success', 'data': reply })

@app.route('/', methods=['DELETE',])
def delete_cart():
    """
    Delete a cart.
    """
    session_id = request.get_json().get('session_id')
    cart_id = get_cart_id(session_id)
    reply = clear_cart(cart_id)
    return jsonify({ 'message': 'success', 'data': reply })


@app.route('/<product_id>/<quantity>', methods=['PUT',])
def put_cart_product(product_id, quantity):
    """
    Add a product to a cart.
    """
    session_id = request.get_json().get('session_id')
    cart_id = get_cart_id(session_id)
    reply = set_cart_item(cart_id, product_id, quantity)
    return jsonify({ 'message': 'success', 'data': reply })

@app.route('/<product_id>', methods=['DELETE',])
def delete_cart_product(product_id):
    """
    Remove a product from a cart.
    """
    session_id = request.get_json().get('session_id')
    cart_id = get_cart_id(session_id)
    reply = remove_cart_item(cart_id, product_id)
    return jsonify({ 'message': 'success', 'data': reply })

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
