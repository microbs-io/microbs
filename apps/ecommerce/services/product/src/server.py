# Standard packages
import json
import os

# Third-party packages
import psycopg2
import psycopg2.extras
from flask import jsonify, request
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

# Service packages
from common import app, config, logger

# Configure Postgres
Psycopg2Instrumentor().instrument()
def postgres():
    return psycopg2.connect(
        dbname='products',
        user=(os.environ.get('SERVICE_USERNAME_PRODUCT_DATA') or 'postgres'),
        password=(os.environ.get('SERVICE_PASSWORD_PRODUCT_DATA') or 'password'),
        host=(os.environ.get('SERVICE_HOST_PRODUCT_DATA') or 'localhost'),
        port=(os.environ.get('SERVICE_PORT_PRODUCT_DATA') or 5432),
        cursor_factory=psycopg2.extras.DictCursor
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
def get_products():
    """
    Get products.
    """
    with postgres() as connection:
        cursor = connection.cursor()
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
def search_products():
    """
    Search products.
    """
    with postgres() as connection:
        query = (request.get_json() or { 'query': '' }).get('query', '')
        size = (request.get_json() or { 'page': {}}).get('page', { 'size': 'all' }).get('size', 'all')
        cursor = connection.cursor()
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
def get_suggestions():
    """
    Get product suggestions.
    """
    with postgres() as connection:
        query = (request.get_json() or { 'query': '' }).get('query', '')
        size = (request.get_json() or { 'page': {}}).get('page', { 'size': 'all' }).get('size', 'all')
        cursor = connection.cursor()
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
