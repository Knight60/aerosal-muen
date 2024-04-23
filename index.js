if (localStorage.getItem('skipinfo') == 'true') {
    console.log('skip showinfo');
    ToggleInfographic(false);
} else {
    console.log('showinfo');
    localStorage.setItem('skipinfo', true);
    ToggleInfographic(true);
}

let z = 5;
let ext = 0.01;
//let longitude = 104.6208500000000;
//let latitude = 15.897682067553923;

let longitude = 99.15552547451955 - 0.0003;
let latitude = 14.128423673875403 + 0.0008;

let xmin = longitude - ext;
let xmax = longitude + ext;
let ymin = latitude - ext;
let ymax = latitude + ext;

let extent = Cesium.Rectangle.fromDegrees(xmin, ymin, xmax, ymax);
var local = document.location.href.startsWith('http://local');
//var gcloud = 'https://storage.cloud.google.com/muka-3d.appspot.com'; // Authenicated Only
var gcloud = 'https://storage.googleapis.com/muka-3d.appspot.com'; // Publick URL


Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZjNiMDUzYi1iZDVmLTQ5NzItOWVlNy03MWZkYjAxNGIzZmMiLCJpZCI6ODU1NTIsImlhdCI6MTY0NzEwMDczMX0.iiAAYF3zGdCrP255yIjT3XQMrOHizEIeLPpw11Abjbk";
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent;
Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

function LookAtRelease() {
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}

let Models = {};
let Home = {
    AutoDate: false,
    MinDate: Cesium.JulianDate.fromIso8601('2000-03-01'), //2000-02-24
    MaxDate: Cesium.JulianDate.fromIso8601(moment().toISOString()),
    ThisDate: Cesium.JulianDate.fromIso8601(moment().toISOString()),
    //Center: Models[Object.keys(Models)[0]].Center, // for model
    Position: {
        "x": -1557763.3335331632,
        "y": 7863606.30927015,
        "z": 436405.19512673817
    },
    Orientation: {
        "heading": 6.283185307179582,
        "pitch": -1.0587170964238677,
        "roll": 6.283185307179586
    },
    Rotate: -1, //-1 = counter-clockwise; +1 would be clockwise
    SMOOTHNESS: 1200, //it would make one full circle in roughly 600 frames
};

function GetMapCenter() {
    var windowPosition = new Cesium.Cartesian2(viewer.container.clientWidth / 2, viewer.container.clientHeight / 2);
    var pickRay = viewer.scene.camera.getPickRay(windowPosition);
    var pickPosition = viewer.scene.globe.pick(pickRay, viewer.scene);
    var pickPositionCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(pickPosition);
    console.log(pickPositionCartographic);
    var Center = {
        height: pickPositionCartographic.height,
        longitude: pickPositionCartographic.longitude * (180 / Math.PI),
        latitude: pickPositionCartographic.latitude * (180 / Math.PI)
    }
    console.log(Center);
    return Center;
}

function HeadNorth() {
    let Center = GetMapCenter();
    //viewer.camera.setView({
    viewer.scene.camera.flyTo({
        duration: 2,
        destination: viewer.camera.positionWC.clone(),
        //destination: Cesium.Cartesian3.fromDegrees(Center.longitude, Center.latitude, viewer.camera.positionWC.clone().height),
        orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90), //viewer.camera.pitch,
            roll: Cesium.Math.toRadians(0), //viewer.camera.roll,
        }
    });

}

function FlyToModel(ID) {
    var ModelConfig = Models[ID];
    if (!ModelConfig) ModelConfig = Home;
    viewer.scene.camera.flyTo({ //not equalto viewer.flyTo
        duration: 2,
        //maximumHeight: 1000,
        //pitchAdjustHeight: 1000,
        destination: ModelConfig.Position,
        orientation: ModelConfig.Orientation
    });
}

function NavigationResetAsHeadNorth() {
    console.log("Navigation Reset AsHeadNorth");
    let reset = viewer.cesiumNavigation.container.querySelector('div[title="Reset View"]');
    if (!reset) return; // no reset button of navigation plugin
    var clone = reset.cloneNode(true);
    clone.onclick = HeadNorth;
    reset.parentNode.replaceChild(clone, reset);
}

async function ImportModel(ModelID, flyTo) {
    Loading.style.display = 'inline';
    var ModelConfig = Models[ModelID];
    console.log('Loading Model');
    //try {
    const heading = Cesium.Math.toRadians(180);
    const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
    if (ModelConfig.Type == "gltf") {
        var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(ModelConfig.Center, hpr);
        ModelConfig.Model = await Cesium.Model.fromGltfAsync({
            id: ModelID,
            url: ModelConfig.URL,
            modelMatrix: modelMatrix,
            upAxis: Cesium.Axis.Y,
            forwardAxis: Cesium.Axis.Z,
        });
    } else {
        const offset = new Cesium.Cartesian3(ModelConfig.Offset.North, ModelConfig.Offset.East, ModelConfig.Offset.Height);
        const transform = Cesium.Matrix4.fromTranslation(offset);
        ModelConfig.Model = await Cesium.Cesium3DTileset.fromUrl(ModelConfig.URL, {
            maximumScreenSpaceError: 1,
            modelMatrix: transform,
            //enablePick: true,
        });
    }
    var tileset = viewer.scene.primitives.add(ModelConfig.Model);
    /*
    tileset.readyPromise.then(function (tileset) {
        var boundingSphere = tileset.boundingSphere;
        viewer.camera.viewBoundingSphere(boundingSphere, new Cesium.HeadingPitchRange(0, -2.0, 0));
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        // Position tileset
        var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
        var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        console.log(tileset.modelMatrix);
    });
    */
    console.log(ModelConfig.Model);
    console.log('Loaded Primitive Model');

    //viewer.zoomTo(ModelConfig.Model);
    //viewer.camera.lookAt(Home.Center, Home.HPR);
    //HeadNorth();
    //MoveAround();
    SceneRefresh();
    console.log('finished');

    Loading.style.display = 'none';
    if (flyTo) {
        viewer.scene.camera.flyTo({ //not equalto viewer.flyTo
            destination: ModelConfig.Position,
            orientation: ModelConfig.Orientation
        });
    }
    //} catch (error) {
    //    console.log(`Failed to load model. ${error}`);
    //}
}


function Main(body) {
    var CesiumViewer = document.querySelector("Viewer");
    globalThis.viewer = new Cesium.Viewer("Viewer", {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        //mapProjection: new Cesium.WebMercatorProjection(),
        /* old version
        terrainProvider: new Cesium.CesiumTerrainProvider({
            url: Cesium.IonResource.fromAssetId(1),
        }),
        */
        vrButton: true,
        geocoder: false,
        timeline: false,
        animation: false,
        baseLayerPicker: true,
        selectionIndicator: false,
        requestRenderMode: true, //fixed gpu too high
        selectionIndicator: false,
        //geocoder: new OpenStreetMapNominatimGeocoder(),
        //imageryProvider: new Cesium.IonImageryProvider({ assetId: 3954 }),
        //for using "viewer.render(); temp1.src = viewer.canvas.toDataURL();"
        contextOptions: {
            webgl: { preserveDrawingBuffer: true }
        },
    });
    viewer.scene.globe.depthTestAgainstTerrain = true;
    //* Switch to Sentinel-2 Image at first use
    viewer.baseLayerPicker.viewModel.imageryProviderViewModels.forEach((x) => {
        if (x.name == "Sentinel-2") {
            viewer.baseLayerPicker.viewModel.selectedImagery = x;
        }
    });
    /**/
    /* //hide globe
    viewer.scene.globe.show = false;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.skyBox.show = false;
    viewer.scene.sun.show = false;
    viewer.scene.moon.show = false;

    viewer.bottomContainer.style.display = "NONE"; //capitalized
    viewer.fullscreenButton.container.style.display = "none"; //not capitalized
    viewer.homeButton.container.style.display = "none";
    viewer.navigationHelpButton.container.style.display = "none";
    //viewer.timeline.container.style.display = "none";
    /**/

    viewer.extend(Cesium.viewerCesiumNavigationMixin, {});
    NavigationResetAsHeadNorth();
    /* Cesium Inspector
    viewer.extend(Cesium.viewerCesiumInspectorMixin);
    */
    globalThis.viewer = viewer;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.verticalExaggeration = 2.0;
    viewer.scene.light = new Cesium.DirectionalLight({
        direction: viewer.camera.directionWC, // Updated every frame
        intensity: 1.0,
    });
    viewer.scene.globe.dynamicAtmosphereLighting = false;
    updateMaterial(false);
    //------------------------------------------
    /*
    viewer.timeline.zoomTo(Cesium.JulianDate.addDays(Home.MaxDate, -365, new Cesium.JulianDate()), Home.MaxDate);
    */
    viewer.clock.onTick.addEventListener(DetectTimeChange);
    globalThis.WeekPicker = $("#WeekPicker").weekpicker();
    //------------------------------------------
    const imageryLayers = viewer.scene.imageryLayers;

    // The viewModel tracks the state of our mini application.
    const viewModel = {
        brightness: 0,
        contrast: 0,
        hue: 0,
        saturation: 0,
        gamma: 0,
    };
    // Convert the viewModel members into knockout observables.
    Cesium.knockout.track(viewModel);

    // Bind the viewModel to the DOM elements of the UI that call for it.
    const toolbar = document.getElementById("Toolbar");
    Cesium.knockout.applyBindings(viewModel, toolbar);
    subscribeLayerParameter(viewModel, "brightness");
    subscribeLayerParameter(viewModel, "contrast");
    subscribeLayerParameter(viewModel, "hue");
    subscribeLayerParameter(viewModel, "saturation");
    subscribeLayerParameter(viewModel, "gamma");
    imageryLayers.layerAdded.addEventListener(() => {
        updateViewModel(viewModel);
    });
    imageryLayers.layerRemoved.addEventListener(() => {
        updateViewModel(viewModel);
    });
    imageryLayers.layerMoved.addEventListener(() => {
        updateViewModel(viewModel);
    });
    updateViewModel(viewModel);
    //------------------------------
    AddImageProvince();
    /* script when always change date at first time
    let eDate = new Date(Home.ThisDate.toString().split('T')[0]);
    let sDate = new Date(eDate.getTime() - (1000 * 60 * 60 * 24 * 7));
    AddImageAOD(sDate.toISOString().split('T')[0], eDate.toISOString().split('T')[0]);
    */
    //------------------------------
    viewer.toolbar = document.querySelector(".cesium-viewer-toolbar");
    //------------------------------
    /*
    let toolModel = document.createElement("button");
    toolModel.id = "ToggleModel";
    toolModel.classList.add("cesium-button");
    toolModel.classList.add("cesium-toolbar-button");
    toolModel.classList.add("material-icons");
    toolModel.innerHTML = "view_in_ar";
    toolModel.onclick = ToggleModel;
    viewer.toolbar.insertBefore(toolModel, viewer.toolbar.children[0]);
    */
    //------------------------------
    let toolInfograph = document.createElement("button");
    toolInfograph.id = "ToggleInfographic";
    toolInfograph.classList.add("cesium-button");
    toolInfograph.classList.add("cesium-toolbar-button");
    toolInfograph.classList.add("material-icons");
    toolInfograph.innerHTML = "info";
    toolInfograph.onclick = ToggleInfographic;
    viewer.toolbar.insertBefore(toolInfograph, viewer.toolbar.children[0]);
    //------------------------------
    let toolMoveAround = document.createElement("button");
    toolMoveAround.id = "ToggleMoveAround";
    toolMoveAround.classList.add("cesium-button");
    toolMoveAround.classList.add("cesium-toolbar-button");
    toolMoveAround.classList.add("material-icons");
    toolMoveAround.innerHTML = "flip_camera_android";
    toolMoveAround.onclick = ToggleMoveAround;
    viewer.toolbar.insertBefore(toolMoveAround, viewer.toolbar.children[0]);
    //------------------------------
    let toolPan = document.createElement("button");
    toolPan.id = "ToggleMovePan";
    toolPan.classList.add("cesium-button");
    toolPan.classList.add("cesium-toolbar-button");
    toolPan.classList.add("material-icons");
    toolPan.innerHTML = "pan_tool";
    toolPan.onclick = TogglePan;
    viewer.toolbar.insertBefore(toolPan, viewer.toolbar.children[0]);
    //------------------------------
    //*
    let toolHome = document.createElement("button");
    toolHome.id = "ToggleMoveAround";
    toolHome.classList.add("cesium-button");
    toolHome.classList.add("cesium-toolbar-button");
    toolHome.classList.add("material-icons");
    toolHome.innerHTML = "home";
    toolHome.onclick = FlyToModel;
    viewer.toolbar.insertBefore(toolHome, viewer.toolbar.children[0]);
    /**/
    /*
    let toolFlyTo = document.createElement("select");
    toolFlyTo.id = 'SelectFlyTo';
    toolFlyTo.onchange = function (event) {
        var ID = event.target.selectedOptions[0].value;
        console.log(ID);
        FlyToModel(ID);
    };

    var opt = document.createElement("option");
    opt.value = null;//Overview
    opt.innerHTML = "Overview";
    toolFlyTo.appendChild(opt);
    for (var ID of Object.keys(Models)) {
        var opt = document.createElement("option");
        opt.value = ID;
        opt.innerHTML = Models[ID].Name;
        toolFlyTo.appendChild(opt);
    }
    viewer.toolbar.insertBefore(toolFlyTo, viewer.toolbar.children[0]);
    */


    // Mouse over the globe to see the cartographic position
    const entity = viewer.entities.add({
        label: {
            show: false,
            showBackground: true,
            font: "14px monospace",
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(15, 0),
        },
    });
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(
        function(movement) {
            MoveEnd();
        },
        Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(
        function(movement) {
            //Home.Orientation.heading = viewer.camera.heading;
        },
        Cesium.ScreenSpaceEventType.LEFT_UP);

    for (var ID of Object.keys(Models)) {
        ImportModel(ID, false);
    }

    viewer.scene.camera.flyTo({
        destination: Home.Position,
        orientation: Home.Orientation
    });

    var home = document.querySelector('[title="View Home"]');
    if (home) home.style.display = 'none';
    Loading.style.display = 'none';
    AQI_Entities();
}

function SaveCamera() {
    Home.Position = viewer.camera.positionWC.clone();
    Home.Orientation.heading = viewer.camera.heading;
    Home.Orientation.pitch = viewer.camera.pitch;
    Home.Orientation.roll = viewer.camera.roll;
    console.log({ Position: Home.Position, Orientation: Home.Orientation });
};

function LoadCamera() {
    viewer.scene.camera.flyTo({
        destination: Home.Position.clone(),
        orientation: Home.Orientation
    });
};

function UTM47N2LonLat(X, Y) {
    let Prj1 = "+proj=utm +zone=47N +datum=WGS84 +units=m +no_defs +type=crs";
    let Prj2 = "EPSG:4326";
    return proj4(Prj1, Prj2).forward([X, Y], true);
}

function updateMaterial(visualizeRelativeHeight = false) {
    if (visualizeRelativeHeight) {
        const height = viewwer.scene.globe.terrainExaggerationRelativeHeight;
        const exaggeration = viewwer.scene.globe.terrainExaggeration;
        const alpha = Math.min(1.0, exaggeration * 0.25);
        const layer = {
            extendUpwards: true,
            extendDownwards: true,
            entries: [{
                    height: height + 100.0,
                    color: new Cesium.Color(0.0, 1.0, 0.0, alpha * 0.25),
                },
                {
                    height: height + 50.0,
                    color: new Cesium.Color(1.0, 1.0, 1.0, alpha * 0.5),
                },
                {
                    height: height,
                    color: new Cesium.Color(1.0, 1.0, 1.0, alpha),
                },
                {
                    height: height - 50.0,
                    color: new Cesium.Color(1.0, 1.0, 1.0, alpha * 0.5),
                },
                {
                    height: height - 100.0,
                    color: new Cesium.Color(1.0, 0.0, 0.0, alpha * 0.25),
                },
            ],
        };
        viewer.scene.globe.material = Cesium.createElevationBandMaterial({
            scene: viewer.scene,
            layers: [layer],
        });
    } else {
        viewer.scene.globe.material = undefined;
    }
}

// Make the active imagery layer a subscriber of the viewModel.
function subscribeLayerParameter(viewModel, name) {
    const imageryLayers = viewer.scene.imageryLayers;
    Cesium.knockout.getObservable(viewModel, name).subscribe(function(newValue) {
        if (imageryLayers.length > 0) {
            const layer = imageryLayers.get(0);
            layer[name] = newValue;
        }
    });
}


// Make the viewModel react to base layer changes.
function updateViewModel(viewModel) {
    const imageryLayers = viewer.scene.imageryLayers;
    if (imageryLayers.length > 0) {
        const layer = imageryLayers.get(0);
        viewModel.brightness = layer.brightness;
        viewModel.contrast = layer.contrast;
        viewModel.hue = layer.hue;
        viewModel.saturation = layer.saturation;
        viewModel.gamma = layer.gamma;
    }
}



function ToggleModel() {
    let modelID = 'MUKA-LECT';
    /*
    let modelEntity = viewer.entities.getById(modelID);
    if (!modelEntity) {
        ImportModel(ModelURL, modelID);
    } else {
        modelEntity.visible = !modelEntity.visible;
        SceneRefresh();
    }
    */
    if (viewer.scene.primitives.length > 1) {
        viewer.scene.primitives.show = !viewer.scene.primitives.show;
        SceneRefresh();
    } else {
        for (var ID of Object.keys(Models)) {
            ImportModel(ID, false);
        }
    }

}

function GetHeight(longitude, latitude) {
    Home.Height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(longitude, latitude));
    if (!Home.Height || Home.Height < 0) {
        setTimeout(GetHomeHeight, 50);
    }
    Home.Height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(longitude, latitude));
    console.log('height', Home.Height);
}

function SceneRefresh() {
    viewer.scene.requestRender();
    //viewer.camera.lookUp(0.00000000001);
    //viewer.forceResize(); //TODO: Test this
}

function ToggleMoveAround() {
    if (window.StopMoving) {
        MoveEnd();
        LookAtRelease();
    } else {
        MoveAround();
    }
}




function TogglePan() {
    MoveEnd();
    LookAtRelease();
}

function MoveEnd() {
    if (window.StopMoving) window.StopMoving();
    window.StopMoving = null;
}

function MoveAround() {
    //viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    window.StopMoving = viewer.clock.onTick.addEventListener(() => {
        //Home.HPR.heading += Home.Rotate * Math.PI / Home.SMOOTHNESS;
        //viewer.camera.lookAt(Home.Center, Home.HPR);
        var ray = viewer.camera.getPickRay(new Cesium.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas.clientHeight / 2));
        var pos = viewer.scene.globe.pick(ray, viewer.scene);
        viewer.camera.lookAt(pos);
        viewer.camera.rotateRight(0.005);
    });
}

async function AddImageProvince() {
    const layerProvince = new Cesium.ImageryLayer(
        new Cesium.WebMapServiceImageryProvider({
            url: 'https://iforms-api.dnp.go.th/geoserver/iforms/wms?service=WMS&version=1.1.0',
            layers: 'iforms:Province_wgs84',
            enablePickFeatures: false,
            proxy: new Cesium.DefaultProxy('/proxy/'),
            parameters: {
                transparent: true,
                format: 'image/png',
            }
        })
    );
    viewer.imageryLayers.add(layerProvince);
}

function GetImageAOD() {
    let layers = [];
    for (var i = 0; i < viewer.imageryLayers.length; i++) {
        let provider = viewer.imageryLayers.get(i).imageryProvider;
        if (!provider) break;
        let resouce = provider._resource;
        if (resouce && resouce.url && resouce.url.startsWith('https://earthengine')) {
            layers.push(viewer.imageryLayers.get(i));
        }
    }
    return layers;
}

async function AddImageAOD(sDate, eDate, signal) {
    let layers = GetImageAOD();
    layers.forEach((layer) => { viewer.imageryLayers.remove(layer) });

    var response = await fetch('/mapid/aod/' + sDate + '/' + eDate, {
        method: 'get',
        signal: signal,
    });
    console.log(await response.clone().json());
    var Map = await response.clone().json();
    if (!Map.urlFormat.startsWith('https')) {
        console.log('Get GEE Map ERror', Map.urlFormat)
        return;
    }
    const layerAOD = new Cesium.UrlTemplateImageryProvider({
        id: 'AOD',
        url: Map.urlFormat,
    });
    if (signal.aborted) return;
    viewer.imageryLayers.addImageryProvider(layerAOD, 1);
}

function DetectTimeChange(clock) {
    //console.log(viewer.clock.currentTime);
    //detect only day change
    if (viewer.clock.currentTime.dayNumber == Home.ThisDate.dayNumber) return;
    if (Cesium.JulianDate.compare(viewer.clock.currentTime, Home.MaxDate) > 0) viewer.clock.currentTime = Home.MaxDate;
    if (Cesium.JulianDate.compare(viewer.clock.currentTime, Home.MinDate) < 0) viewer.clock.currentTime = Home.MinDate;

    let Moment = moment(Cesium.JulianDate.toIso8601(viewer.clock.currentTime));
    //console.log(Moment);
    //console.log(Moment.toISOString(true));
    //console.log(Moment.day());
    if (Moment.day() != 0) return; //skip if not sunday
    console.log(Moment.toISOString(true));

    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(Moment.day(0).toISOString(true));
    Home.ThisDate = viewer.clock.currentTime;

    console.log(moment(Cesium.JulianDate.toIso8601(Home.ThisDate)).toISOString(true));

    let sDate = moment(Home.ThisDate.toString());
    let eDate = sDate.clone().add(6, 'days');

    globalThis.WeekPicker.setCurrentDate(sDate, false);

    //* fake day for new data
    if (moment().subtract(3, 'days').isBefore(moment(sDate))) {
        sDate = moment().subtract(5, 'days');
    }
    /**/

    if (globalThis.AbortAOD && !globalThis.AbortAOD.signal.aborted) {
        globalThis.AbortAOD.abort()
    }
    globalThis.AbortAOD = new AbortController();

    AddImageAOD(sDate.toISOString(true).split('T')[0], eDate.toISOString(true).split('T')[0], globalThis.AbortAOD.signal);
    console.log("Added Image AOD", sDate.toISOString(true), "to", eDate.toISOString(true));


    let LastAOI = WeekPicker.getYear() == moment().year() && WeekPicker.getWeek() == moment().week();
    VisibleAQI.checked = LastAOI;
    ToggleAQI(VisibleAQI);

}

function AutoTimeChange() {
    if (!Home.AutoDate) return;
    viewer.clock.currentTime = Cesium.JulianDate.addDays(viewer.clock.currentTime, -7, new Cesium.JulianDate());
    window.setTimeout(AutoTimeChange, 1000 * 10);
}

function ToggleAQI(checkbox) {
    //console.log(checkbox);
    viewer.entities.values.forEach((entity) => {
        if (!entity.id.startsWith('AQI')) return;
        entity.show = checkbox.checked;
    })
    SceneRefresh();

}

function ToggleAOD(checkbox) {
    //console.log(checkbox);
    let layers = GetImageAOD();
    layers.forEach((layer) => { layer.show = checkbox.checked });
    SceneRefresh();

}

async function ToggleInfographic(force = null) {
    if (force == null) {
        force = Infographic.style.display == 'none' ? true : false;
    };
    if (force) {
        Infographic.style.display = 'inline';
        InfographicShowAgain.checked = false;
        localStorage.setItem('skipinfo', false);
    } else {
        Infographic.style.display = 'none';
    }
    const content = await fetch('/infographic.html');
    InfographicContent.innerHTML = await content.text();
}