// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Default entry point for App Engine Node.js runtime. Defines a
 * web service which returns the mapid to be used by clients to display map
 * tiles showing slope computed in real time from SRTM DEM data. See
 * accompanying README file for instructions on how to set up authentication.
 */
("use strict");
const PORT = parseInt(process.env.PORT) || 9999;
const ee = require("@google/earthengine");
const privateKey = require("./System/.private-key.json");
const request = require('request');
const path = require("path");
const GEE = require("./Script/GEE.js");

//const ee = require("@google/earthengine");
//const privateKey = require("./System/watkaonoi-964fc4de4261.json");

// [START gae_flex_quickstart]
const express = require("express");
var parserBody = require("body-parser");

// RAW POST BODY
var parserPDF = parserBody.raw({
    limit: "50mb",
    extended: true,
    type: "application/pdf",
});
// RAW POST BODY
var parserRAW = parserBody.raw({
    limit: "50mb",
    extended: true,
});
// JSON POST BODY
var parserJSON = parserBody.json({
    limit: "50mb",
    extended: true,
});
// URL GET KVP
var parserURL = parserBody.urlencoded({
    limit: "50mb",
    extended: false,
    parameterLimit: 50000,
});

const app = express();
app.use(parserPDF);
app.use(parserRAW);
app.use(parserJSON);
app.use(parserURL);
//npm install --save body-parser multer
var multer = require("multer");
var upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });
//app.use(upload.array());

app.use("/three.js", express.static("three.js"));

app.use("/Build", express.static("Build"));
app.use("/CSS", express.static("CSS"));
app.use("/Image", express.static("Image"));
app.use("/Script", express.static("Script"));
app.use("/Data", express.static("Data"));

//This part working only npm start, not gcloud app deploy
//It was mentioned in the .gcloudignore
app.use("/Source", express.static("Source"));
app.use("/ThirdParty", express.static("ThirdParty"));

app.get("/Data/*", (req, res) => {
    if (req.url.startsWith('/proxy/tile.forest.go.th/')) {
        req.pipe(request('https://' + req.url.slice('/proxy/'.length))).pipe(res);
    } else {
        res.send("{error:'url not allow'}");
        res.end();
    }
});

/*
const StreamZip = require('node-stream-zip');
const MapZip = new StreamZip.async({
    file: 'Data/klongyong-map.zip',
    storeEntries: true
});
app.get("/map/:z/:x/:y.png", async (req, res, next) => {
    const { z, x, y } = req.params;
    //console.log(`${z}/${x}/${y}.png`);
    try {
        const content = await MapZip.stream(`${z}/${x}/${y}.png`);//.toString('utf8');
        res.setHeader("content-type", "image/png");
        res.setHeader("Access-Control-Allow-Origin", "*");
        content.pipe(res);
    } catch (error) {
        //next(error);
        res.status(500).json({
            error: 'file not found'
        });
    }
});
*/
//////////////////////////////////////////////////////
/*          Dynamic Content                 */
//////////////////////////////////////////////////////
app.get("/favicon.ico", (req, res) => {
    //res.status(200).send('Hello, world!').end();
    res.sendFile(path.join(__dirname, "/favicon.ico"));
});
app.get("/index.html", (req, res) => {
    //res.status(200).send('Hello, world!').end();
    res.sendFile(path.join(__dirname, "/index.html"));
});
app.get("/index2d.html", (req, res) => {
    //res.status(200).send('Hello, world!').end();
    res.sendFile(path.join(__dirname, "/index2d.html"));
});
app.get("/index.css", (req, res) => {
    //res.status(200).send('Hello, world!').end();
    res.sendFile(path.join(__dirname, "/index.css"));
});

app.get("/index.js", (req, res) => {
    //res.status(200).send('Hello, world!').end();
    res.sendFile(path.join(__dirname, "/index.js"));
});
app.get("/blank.png", (req, res) => {
    //res.status(200).send('Hello, world!').end();
    res.sendFile(path.join(__dirname, "/blank.png"));
});
app.get("/favicon.ico", (req, res) => {
    //res.status(200).send('Hello, world!').end();
    res.sendFile(path.join(__dirname, "/favicon.ico"));
});
app.get("/", (req, res) => {
    //res.status(200).send('Hello, world!').end();
    res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/mapid/landsat/:date", (req, res, next) => {
    try {
        res.send(GEE.GetMap_LS_Date(req.params.date));
    } catch (error) {
        GEEAuthenticate();
        res.send(GEE.GetMap_LS_Date(req.params.date));
        next(error);
    }
});

app.get("/mapid/aod/:sDate/:eDate", (req, res, next) => {
    try {
        res.send(GEE.GetTilesAOD(req.params.sDate, req.params.eDate));
    } catch (error) {
        GEEAuthenticate();
        res.send(GEE.GetTilesAOD(req.params.sDate, req.params.eDate));
        next(error);
    }
});

/* Skip for listen after GEE Authen
let Listening = false;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log("Press Ctrl+C to quit.");
});
console.log(`Listening on port ${PORT}`);
*/
GEEAuthenticate();

// app.listen(PORT, () => {
//     console.log(`App listening on port ${PORT}`);
//     console.log('Press Ctrl+C to quit.');
// });
// module.exports = app;

//////////////////////////////////////////////////////
let Listening = false;

function GEEAuthenticate() {
    ee.data.authenticateViaPrivateKey(
        privateKey,
        () => {
            console.log("Google Authentication successful.");
            ee.initialize(
                null,
                null,
                (success) => {
                    console.log("Earth Engine client library initialized.");
                    if (!Listening) {
                        Listening = true;
                        app.listen(PORT, () => {
                            console.log(`App listening on http://localhost:${PORT}`);
                            console.log("Press Ctrl+C to quit.");
                        });
                    }
                },
                (err) => {
                    console.log(err);
                    console.log(
                        `Please make sure you have created a service account and have been approved.
    Visit https://developers.google.com/earth-engine/service_account#how-do-i-create-a-service-account to learn more.`
                    );
                }
            );
        },
        (err) => {
            console.log(err);
        }
    );
}


app.get("/proxy/*", (req, res) => {
    if (req.url.startsWith('/proxy/tile.forest.go.th/')) {
        var z = req.url.split('/').slice(-3)[0];
        var y = req.url.split('/').slice(-1)[0];
        var e = y.split('.').length > 1 ? y.split('.')[1] : 'jpg';
        y = y.split('.')[0];
        var tms = y.startsWith('-');
        var url = req.url.slice('/proxy/'.length);
        url = url.slice(0, url.lastIndexOf('/') + 1);
        y = !tms ? y : Math.pow(2, parseInt(z)) - (parseInt(y) * -1) - 1;
        url = 'https://' + url + y + '.' + e;
        //console.log(y);
        try {
            //console.log(req.url);
            //console.log(url);
            req.pipe(request(url)).pipe(res);
        } catch (error) {
            res.send(error);
        }
    } else if (req.url.startsWith('/proxy/air4thai.com/')) {
        try {
            var url = 'http://' + req.url.slice('/proxy/'.length);
            //console.log(req.url);
            //console.log(url);
            req.pipe(request(url)).pipe(res);
        } catch (error) {
            res.send(error);
        }
    } else {
        res.send("{error:'url not allow'}");
        res.end();
    }
});