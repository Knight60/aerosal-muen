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
from pisut import AiTaxonomy
from pisut import AiSpatial
import os, sys, pickle
import pandas as pd

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
app.config["CLIENT_MAX_BODY_SIZE"] = 10 * 1024 * 1024
app.config["UPLOAD_FOLDER"] = "D:/AiGreenTaxonomyy/Predicted/"

### swagger specific ###
app.config["PictPath"] = "D:/AiGreenTaxonomy/Plant for Ai Pictures/"

SWAGGER_URL = "/api/doc"
API_URL = "https://aigreen.dcce.go.th/rest/"
SWAGGERUI_BLUEPRINT = get_swaggerui_blueprint(
    SWAGGER_URL, API_URL, config={"app_name": "AI Green Area - REST"}
)
app.register_blueprint(SWAGGERUI_BLUEPRINT, url_prefix=SWAGGER_URL)

"""
@app.errorhandler(413)
def request_entity_too_large(error):
    return 'File larger than 10MB is not allow', 413
"""


@app.route("/", defaults=dict(filename=None))
@app.route("/<path:filename>", methods=["GET", "POST"])
def index(filename):
    filename = filename or "index.html"
    if filename == "index.html":
        return redirect("/ai-spatial.html")

    if request.method == "GET":
        if (
            filename.endswith(".html")
            or filename.endswith(".js")
            or filename.endswith(".css")
            or filename.startswith("assets")
        ):
            return send_from_directory(".", filename)

    return jsonify({"error": "not support this url"})


def TaxoOverall(token, filename, predicted):
    overallFile = os.path.join(app.config["UPLOAD_FOLDER"], token, "overall.pkl")
    # print(overallFile)
    if not os.path.isfile(overallFile):
        overallResults = {filename: predicted}
    else:
        with open(overallFile, "rb") as f:
            overallResults = pickle.load(f)
        overallResults[filename] = predicted

    with open(overallFile, "wb") as f:
        pickle.dump(overallResults, f, pickle.HIGHEST_PROTOCOL)

    # print(overallResults)
    overallDataFrame = pd.DataFrame(
        sum(overallResults.values(), []), columns=["species", "confident"]
    )
    # print(overallDataFrame)
    overallTop3 = (
        overallDataFrame.groupby("species")
        .sum()
        .sort_values("confident", ascending=False)
        .head(3)
    )
    overallTop3["confident"] = overallTop3["confident"] / len(overallResults.keys())

    return overallTop3.reset_index().to_numpy().tolist(), len(overallResults.keys())


@app.route("/ai/taxonomy/<token>", methods=["GET", "POST"])
def Taxonomy(token):
    if request.method == "POST":
        try:
            formImage = request.files.get("image")
            # print('get image', request.files)
            formDatas = request.form
            formToken = formDatas.get("token", None)
            if (
                not formToken
                or formToken.lower() == "new"
                or formToken.lower() == "null"
                or formToken.lower() == "undefined"
                or formToken.lower() == ""
            ):
                formToken = datetime.now().isoformat().replace(":", ".")
            os.makedirs(
                os.path.join(app.config["UPLOAD_FOLDER"], formToken), exist_ok=True
            )

            imageType = formDatas.get("type", None)
            imageType = imageType if imageType else "bark"

            # supporting base64
            # data:image/png;base64,
            if formImage:
                formFile = os.path.join(
                    app.config["UPLOAD_FOLDER"],
                    formToken,
                    imageType + "@" + formImage.filename,
                )
                formImage.stream.seek(0)
                formImage.save(formFile)
            else:
                # headImage = formImage.stream.read(8 * 10).decode("utf8")
                formImage = formDatas.get("image")
                # print(formImage)
                if formImage.find("base64"):
                    typeImage = formImage.split(";")[0].split(":")[1].split("/")[1]
                    # print("----", typeImage)
                    convImage = Image.open(
                        io.BytesIO(
                            base64.b64decode(
                                formImage.replace(
                                    formImage.split(";base64,")[0] + ";base64,",
                                    "",
                                )
                            )
                        )
                    )
                    # neee just only when send text file
                    """
                    formImage.stream.seek(0)
                    byteText = formImage.stream.read()
                    convImage = Image.open(
                        io.BytesIO(
                            base64.b64decode(
                                byteText.decode("utf8").replace(
                                    formImage.split(";base64,")[0] + ";base64,",
                                    "",
                                )
                            )
                        )
                    )
                    """
                    formFile = os.path.join(
                        app.config["UPLOAD_FOLDER"],
                        formToken,
                        imageType + "@" + typeImage,
                    )
                    print(formFile)
                    convImage.save(formFile, typeImage)
                else:
                    return app.response_class(
                        status=500,
                        mimetype="application/json",
                        response=json.dumps(
                            {
                                "error": "not support image",
                                "file": "base64",
                            },
                            ensure_ascii=False,
                        ),
                    )

            predicted = AiTaxonomy.Predicted(formFile)
            overall, count = TaxoOverall(
                formToken,
                imageType + "@" + os.path.split(formFile)[1],
                predicted["predicted"],
            )

            results = {
                "filename": imageType + "@" + os.path.split(formFile)[1],
                "token": formToken,
                "source": predicted["source"],
                "predicted": list(
                    map(lambda x: (x[0], "{:.2f}".format(x[1])), predicted["predicted"])
                ),
                "overall": list(map(lambda x: (x[0], "{:.2f}".format(x[1])), overall)),
                "count": count,
            }
            return app.response_class(
                status=200,
                mimetype="application/json",
                # mimetype='image/jpeg',
                response=json.dumps(results, ensure_ascii=False),
            )
        except Exception as error:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            return app.response_class(
                status=500,
                mimetype="application/json",
                response=json.dumps(
                    {"error": str(error), "file": fname, "line": exc_tb.tb_lineno},
                    ensure_ascii=False,
                ),
            )
    else:
        return app.response_class(
            status=200,
            mimetype="application/json",
            response=json.dumps(
                {
                    "source": "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
                    "predicted": [
                        ["API not support method " + request.method, "error"]
                    ],
                    "token": token,
                },
                ensure_ascii=False,
            ),
        )


def decode_base64(data, altchars=b"+/"):
    """Decode base64, padding being optional.

    :param data: Base64 data as an ASCII byte string
    :returns: The decoded byte string.

    """
    data = re.sub(rb"[^a-zA-Z0-9%s]+" % altchars, b"", data)  # normalize
    missing_padding = len(data) % 4
    if missing_padding:
        data += b"=" * (4 - missing_padding)
    return base64.b64decode(data, altchars)


# REF: https://stackoverflow.com/questions/10434599/get-the-data-received-in-a-flask-request


@app.route("/pictures", methods=["GET", "POST"])
def GetPictures():
    plot = request.args.get("plot", None)
    tag = request.args.get("tag", None)
    pictPath = app.config["PictPath"]
    pictPlots = list(filter(lambda x: x.startswith(plot), os.listdir(pictPath)))
    if len(pictPlots) == 0:
        return app.response_class(
            status=200,
            mimetype="application/json",
            response=json.dumps(
                {
                    # "url": request.url_root,
                    "plot": plot,
                    "tag": "tag",
                    "error": "folder " + plot + " not found",
                },
                ensure_ascii=False,
            ),
        )
    else:
        pictPlot = os.path.join(pictPath, pictPlots[0])
        print(pictPlot)
        pictTags = list(
            map(
                lambda x: os.path.join(pictPlots[0], x).replace("\\", "/"),
                filter(
                    lambda x: x.startswith(tag),
                    os.listdir(pictPlot),
                ),
            )
        )
        print(pictTags)
        return app.response_class(
            status=200,
            mimetype="application/json",
            response=json.dumps(
                {
                    # "url": request.url_root,
                    "plot": plot,
                    "tag": "tag",
                    "pictures": pictTags,
                },
                ensure_ascii=False,
            ),
        )


@app.route("/thumbnail", methods=["GET", "POST"])
def GetThumbnail():
    pictPath = app.config["PictPath"]
    pictFile = request.args.get("picture", None)
    # if True:
    try:
        pictImage = Image.open(os.path.join(pictPath, pictFile))
        pictImage = ImageOps.exif_transpose(pictImage)
        pictImage.thumbnail((512, 512), Image.LANCZOS)
        with io.BytesIO() as pictStream:
            pictImage.save(pictStream, format="JPEG")
            pictStream.seek(0)
            pictBytes = pictStream.getvalue()
            pictBase64 = base64.b64encode(pictBytes)
            # pictBase64 = ("data:image/png;base64,"+ pictBase64).encode('utf-8')
        response = make_response(pictBytes, 200)
        response.mimetype = "image/jpeg"
        return response
    # else:
    except Exception as error:
        return app.response_class(
            status=500,
            mimetype="application/json",
            response=json.dumps(
                {
                    "error": error.args,
                    "trace": dir(error),
                    "path": os.path.join(pictPath, pictFile),
                },
                ensure_ascii=False,
            ),
        )


if __name__ == "__main__":
    app.run(debug=True, port=8888, host="0.0.0.0")
