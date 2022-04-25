# Standard packages
import json
import os

# Third-party packages
import requests
from flask import jsonify, request, Response

# Service packages
from common import app, config, logger

# Configure content source
CONTENT_BASE_PATH = "https://storage.googleapis.com/cdn.microbs.io/apps/ecommerce/main/content/images"


####  HTTP Handlers  ###########################################################

@app.route('/<path:filename>', methods=['GET',])
def get_content(filename):
    """
    Get content.
    """
    response = requests.request(
        method=request.method,
        url="{}/{}".format(CONTENT_BASE_PATH, filename),
        headers={ k: v for (k, v) in request.headers if k != 'Host' },
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False
    )
    excl = ( 'content-encoding', 'content-length', 'transfer-encoding', 'connection' )
    headers = [ (name, value) for (name, value) in response.raw.headers.items() if name.lower() not in excl ]
    return Response(response.content, response.status_code, headers)

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
