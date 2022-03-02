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


####  Data Store Client Configurations  ########################################

from elasticsearch import Elasticsearch
def elasticsearch_client():
    """
    Return an elasticsearch client.
    """
    return Elasticsearch([
        {
            "host": os.environ.get('SERVICE_HOST_ELASTICSEARCH'),
            "port": int(os.environ.get('SERVICE_PORT_ELASTICSEARCH'))
        }
    ])

import pymongo
def mongodb_client():
    """
    Return a mongodb client.
    """
    return pymongo.MongoClient(
        host=os.environ.get('SERVICE_HOST_MONGODB'),
        port=int(os.environ.get('SERVICE_PORT_MONGODB')),
        username=os.environ.get('SERVICE_USERNAME_MONGODB'),
        password=os.environ.get('SERVICE_PASSWORD_MONGODB')
    )

import psycopg2
import psycopg2.extras
def postgres_client():
    """
    Return a postgres client.
    """
    return psycopg2.connect(
        dbname=os.environ.get('SERVICE_DB_POSTGRES'),
        user=os.environ.get('SERVICE_USERNAME_POSTGRES'),
        password=os.environ.get('SERVICE_PASSWORD_POSTGRES'),
        host=os.environ.get('SERVICE_HOST_POSTGRES'),
        port=os.environ.get('SERVICE_PORT_POSTGRES')
    )

import redis
def redis_client():
    """
    Return a redis client.
    """
    return redis.Redis(
        host=os.environ.get('SERVICE_HOST_REDIS'),
        port=os.environ.get('SERVICE_PORT_REDIS'),
        db=0,
        decode_responses=True
    )


####  HTTP Handlers  ###########################################################

@app.route('/_test/elasticsearch/<id>')
@cross_origin()
def _test_elasticsearch(id):
    """
    Test communication with elasticsearch.
    """
    logger.info('GET /_test/elasticsearch/<id>')
    try:
        res = elasticsearch_client().search(index="test", body={"query": {"term": { "key": id }}})
        return jsonify({ 'message': res['hits']['hits'][0]['_source']['value'] })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/_test/mongodb/<id>')
@cross_origin()
def _test_mongodb(id):
    """
    Test communication with mongodb.
    """
    logger.info('GET /_test/mongodb/<id>')
    try:
        docs = list(mongodb_client().test.test.find({ "key": id }))
        return jsonify({ 'message': docs[0]["value"] })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/_test/postgres/<id>')
@cross_origin()
def _test_postgres(id):
    """
    Test communication with postgres.
    """
    logger.info('GET /_test/postgres/<id>')
    try:
        rows = []
        with postgres_client() as connection:
            cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
            cursor.execute("select * from test.test where key = %s", ( id, ))
            rows = cursor.fetchall()
        return jsonify({ 'message': rows[0]["value"] })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/_test/redis/<id>')
@cross_origin()
def _test_redis(id):
    """
    Test communication with redis.
    """
    logger.info('GET /_test/redis/<id>')
    try:
        reply = redis_client().hget(id)
        return jsonify({ 'message': reply })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/_test/failure')
@cross_origin()
def _test_failure():
    """
    Test a failure response.
    """
    logger.info('GET /_test/failure')
    try:
        raise "failure"
        return jsonify({ 'message': 'success' })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/_test/success')
@cross_origin()
def _test_success():
    """
    Test a successful response.
    """
    logger.info('GET /_test/success')
    try:
        return jsonify({ 'message': 'success' })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

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
