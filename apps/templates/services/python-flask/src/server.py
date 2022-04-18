# Standard packages
import json
import os

# Third-party packages
from flask import jsonify, request
from flask_cors import cross_origin

# Service packages
from common import app, cors, config, logger, tracer


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
        port=os.environ.get('SERVICE_PORT_POSTGRES'),
        cursor_factory=psycopg2.extras.DictCursor
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

@app.route('/test/elasticsearch/<id>')
@cross_origin()
def test_elasticsearch(id):
    """
    Test communication with elasticsearch.
    """
    logger.info('GET /test/elasticsearch/<id>')
    try:
        res = elasticsearch_client().search(index="test", body={"query": {"term": { "key": id }}})
        return jsonify({ 'message': res['hits']['hits'][0]['_source']['value'] })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/test/mongodb/<id>')
@cross_origin()
def test_mongodb(id):
    """
    Test communication with mongodb.
    """
    logger.info('GET /test/mongodb/<id>')
    try:
        docs = list(mongodb_client().test.test.find({ "key": id }))
        return jsonify({ 'message': docs[0]["value"] })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/test/postgres/<id>')
@cross_origin()
def test_postgres(id):
    """
    Test communication with postgres.
    """
    logger.info('GET /test/postgres/<id>')
    try:
        rows = []
        with postgres_client() as connection:
            cursor = connection.cursor()
            cursor.execute("select * from test.test where key = %s", ( id, ))
            rows = cursor.fetchall()
        return jsonify({ 'message': rows[0]["value"] })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/test/redis/<id>')
@cross_origin()
def test_redis(id):
    """
    Test communication with redis.
    """
    logger.info('GET /test/redis/<id>')
    try:
        reply = redis_client().hget(id)
        return jsonify({ 'message': reply })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/test/failure')
@cross_origin()
def test_failure():
    """
    Test a failure response.
    """
    logger.info('GET /test/failure')
    try:
        raise "failure"
        return jsonify({ 'message': 'success' })
    except Exception as e:
        logger.exception(e)
        return jsonify({ 'message': 'failure' }), 500

@app.route('/test/success')
@cross_origin()
def test_success():
    """
    Test a successful response.
    """
    logger.info('GET /test/success')
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
