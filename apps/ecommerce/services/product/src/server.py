# Standard packages
import json
import os

# Third-party packages
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

# Configure Postgres
import psycopg2
import psycopg2.extras
def postgres():
    return psycopg2.connect(
        dbname='products',
        user=(os.environ.get('SERVICE_USERNAME_PRODUCT_DATA') or 'postgres'),
        password=(os.environ.get('SERVICE_PASSWORD_PRODUCT_DATA') or 'password'),
        host=(os.environ.get('SERVICE_HOST_PRODUCT_DATA') or 'localhost'),
        port=(os.environ.get('SERVICE_PORT_PRODUCT_DATA') or 5432)
    )

def parse_result(rows):
    response = []
    for row in rows:
        result = {}
        for key, value in row.items():
            result[key] = value
        response.append(result)
    return response

def parse_results(rows):
    response = {
        'meta': {
            'page': {
                'total_results': len(rows)
            }
        },
        'results': []
    }
    for row in rows:
        result = {}
        for key, value in row.items():
            result[key] = value
        response['results'].append(result)
    return response


####  HTTP Handlers  ###########################################################

@app.route('/documents', methods=['POST','GET',])
@cross_origin()
def get_products():
    """
    Get products.
    """
    with postgres() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        ids = (request.get_json() or [])
        if not ids:
            cursor.execute(
                "select * from products order by rating desc"
            )
        else:
            cursor.execute(
                "select * from products where id in ( {} ) order by rating desc".format(', '.join([ "'{}'".format(id) for id in ids ]))
            )
        rows = cursor.fetchall()
    return jsonify(parse_result(rows))

@app.route('/search', methods=['POST','GET',])
@cross_origin()
def search_products():
    """
    Search products.
    """
    with postgres() as connection:
        query = (request.get_json() or { 'query': '' }).get('query', '')
        size = (request.get_json() or { 'page': {}}).get('page', { 'size': 'all' }).get('size', 'all')
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        if query == '':
            cursor.execute(
                "select * from products order by rating desc limit {};".format(size)
            )
        else:
            cursor.execute(
                "select * from products where name ilike '%{}%' or description ilike '%{}%' order by rating desc limit {};".format(query, query, size)
            )
        rows = cursor.fetchall()
    return jsonify(parse_results(rows))

@app.route('/suggestions', methods=['POST','GET',])
@cross_origin()
def get_suggestions():
    """
    Get product suggestions.
    """
    with postgres() as connection:
        query = (request.get_json() or { 'query': '' }).get('query', '')
        size = (request.get_json() or { 'page': {}}).get('page', { 'size': 'all' }).get('size', 'all')
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        if query == '':
            cursor.execute(
                "select * from products order by rating desc limit {};".format(size)
            )
        else:
            cursor.execute(
                "select * from products where name ilike '%{}%' or description ilike '%{}%' order by rating desc limit {};".format(query, query, size)
            )
        rows = cursor.fetchall()
    return jsonify(parse_results(rows))

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
