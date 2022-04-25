# Standard packages
import datetime
import os

# Third-party packages
import redis
import requests
from flask import jsonify, make_response, request, send_from_directory
from flask_session import Session
from opentelemetry.instrumentation.redis import RedisInstrumentor

# Service packages
from common import app, config, logger

# Configure Redis client
RedisInstrumentor().instrument()

# Configure application
app.static_folder=(os.environ.get('STATIC_PATH') or '/service/dist')

# Configure session management
app.secret_key = '3c194bbeaf650bcc0389667386d3bdd1'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(minutes=5)
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_COOKIE_NAME'] = 'session_id'
app.config['SESSION_KEY_PREFIX'] = 's:'
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_REDIS'] = redis.from_url("redis://{}:{}".format(
    os.environ.get('SERVICE_HOST_SESSION_DATA') or 'localhost',
    os.environ.get('SERVICE_PORT_SESSION_DATA') or 6379
))
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_USE_SIGNER'] = True
Session(app)


####  HTTP Handlers  ###########################################################

@app.route('/<path:path>.<extension>')
def send_static(path, extension):
    """
    Serve static assets.
    """
    return send_from_directory(app.static_folder, request.path.lstrip('/'))

@app.route('/api/v1/<path:path>', methods=['GET','POST','PUT','DELETE',])
def proxy(path):
    """
    Forward API requests to api-gateway.
    """
    url = "http://{}:{}/api/v1/{}".format(
        config.get('SERVICE_HOST_API_GATEWAY'),
        config.get('SERVICE_PORT_API_GATEWAY'),
        path
    )
    headers = dict(request.headers)
    headers.pop('Connection', None)
    headers.pop('Content-Encoding', None)
    headers.pop('Content-Length', None)
    headers.pop('Transfer-Encoding', None)
    headers.pop('Host', None)
    r = requests.request(request.method, url,
        headers=dict(headers),
        params=request.args,
        data=request.get_data(),
        timeout=60
    )
    response = make_response(r.content), r.status_code
    return response

@app.route('/<path:path>')
@app.route('/')
def home(path=None):
    """
    Serve index.html for all other requests.
    """
    return send_from_directory(app.static_folder, 'index.html')


####  Main  ####################################################################

if __name__ == '__main__':
    app.run(config.get('SERVICE_BIND_HOST'), config.get('SERVICE_BIND_PORT'))
