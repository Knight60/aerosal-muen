############################################################################
"""
https://flask.palletsprojects.com/en/2.3.x/deploying/nginx/
https://flask.palletsprojects.com/en/2.3.x/quickstart/#a-minimal-application
https://pypi.org/project/flask-swagger-ui/
"""
############################################################################
"""
py -m flask --app app run
"""
############################################################################
from PIL import Image, ImageOps
from io import StringIO, BytesIO
import io, base64
import re
from markupsafe import escape
from werkzeug.utils import secure_filename
from werkzeug.datastructures import ImmutableMultiDict
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
from flask import Flask
from flask import jsonify
from flask import json
from flask import request
from flask import redirect
from flask import make_response
from flask import send_file
from flask import send_from_directory
from flask import stream_with_context
from datetime import datetime
import os, sys, pickle
import pandas as pd

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
app.config["CLIENT_MAX_BODY_SIZE"] = 10 * 1024 * 1024


@app.route("/", defaults=dict(filename=None))
@app.route("/<path:filename>", methods=["GET", "POST"])
def index(filename):
    filename = filename or "index.html"
    # if filename == "index.html":
    #    return redirect("/ai-spatial.html")

    if request.method == "GET":
        if (
            filename.endswith(".html")
            or filename.endswith(".js")
            or filename.endswith(".css")
            or filename.endswith(".jpg")
            or filename.endswith(".png")
            or filename.endswith(".json")
            or filename.startswith("assets")
        ):
            return send_from_directory(".", filename)

    return jsonify({"error": "not support this url"})


if __name__ == "__main__":
    app.run(debug=True, port=8888, host="0.0.0.0")
