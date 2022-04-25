# Standard packages
import json

# Third-party packages
import requests
from flask import jsonify, make_response, request

# Service packages
from common import app, config, logger


####  HTTP Handlers  ###########################################################

@app.route('/api/v1/<service>/<path:path>', methods=['GET','POST','PUT','DELETE',])
def proxy(service, path):
    """
    Forward API requests to services.
    """
    url = "http://{}/{}".format(service, path)
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
    
@app.route('/api/v1/<service>', methods=['GET','POST','PUT','DELETE',])
def proxy_base(service):
    """
    Forward API requests to services.
    """
    url = "http://{}.default.svc.cluster.local/".format(service)
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
