function bodyLoaded(pageLoaded = () => { }) {
    w3.includeHTML(() => {
        ActivateMenu();
        CreateMap();
        Main();
        pageLoaded();
        if (document.location.pathname.endsWith("ai-spatial.html")) {
            globalThis.PivotMode = "AreaRai";
            createPivot("PRV", null, "ภาพรวมประเทศ");
            createDropdown("https://aigreen.dcce.go.th/rest/BBoxProvince", '#selectProvince', 'prov_code', 'prov_namt');
        }
    });
}

function iframeLoaded(iframe) {
    if (!iframe) return;
    iframe.height = "";
    iframe.height = iframe.contentWindow.document.body.scrollHeight + "px";

}

function ActivateMenu() {
    let menus = Array.from(document.querySelectorAll("a.nav-link.collapsed"));
    menus.filter((x) => x.href == document.location.href)
        .map((x) => x.classList.remove('collapsed'));
}

function CreateMap() {
    //epsg.io //notworking
    //proj4.defs("EPSG:32647", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs +type=crs");
    //ol.proj.proj4.register(proj4);
    let epsg3857 = { proj: new ol.proj.get("EPSG:3857"), size: null, resolutions: null, matrixIds: null };
    let epsg4326 = { proj: new ol.proj.get("EPSG:4326"), size: null, resolutions: null, matrixIds: null };

    epsg3857.size = ol.extent.getTopLeft(epsg3857.proj.getExtent()) / 256;
    epsg3857.resolutions = new Array(19);
    epsg3857.matrixIds = new Array(19);
    for (let z = 0; z < 19; ++z) {
        // generate resolutions and matrixIds arrays for this WMTS
        epsg3857.resolutions[z] = epsg3857.size / Math.pow(2, z);
        epsg3857.matrixIds[z] = z;
    }
    epsg4326.size = ol.extent.getTopLeft(epsg4326.proj.getExtent()) / 256;
    epsg4326.resolutions = new Array(19);
    epsg4326.matrixIds = new Array(19);
    for (let z = 0; z < 19; ++z) {
        // generate resolutions and matrixIds arrays for this WMTS
        epsg4326.resolutions[z] = epsg4326.size / Math.pow(2, z);
        epsg4326.matrixIds[z] = z;
    }

    var map = document.querySelector('#map');
    if (!(map && map.tagName == "DIV")) return;
    //************************************** */
    var wmsUrl = 'https://aigreen.dcce.go.th/geoserver/aigreen/wms';
    var wmtsUrl = 'https://aigreen.dcce.go.th/geoserver/gwc/service/wmts';
    var xyzGreenLevel = 'https://earthengine.googleapis.com/v1/projects/ee-pisut-nakmuenwai/maps/fea9698b9349ce614d3de7fc0855d225-d25fc82b1784d874ab9aec7fd6b10e2e/tiles/{z}/{x}/{y}';

    var gridsetName = 'UTM47WGS84Quad';
    var gridNames = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
    var style = '';
    var format = 'image/png';
    var infoFormat = 'text/html';
    //overlay
    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');
    const overlay = new ol.Overlay({
        element: container,
        autoPan: {
            animation: {
                duration: 250,
            },
        },
    });
    closer.onclick = function () {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    };


    function XYZ(baseUrl) {
        return new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: baseUrl,
                projection: epsg4326.proj,
            }),
        })
    }
    //https://aigreen.dcce.go.th/geoserver/gwc/demo

    function WMS(baseUrl, layers, projection, visible, filter) {
        return new ol.layer.Tile({
            visible: visible,
            source: new ol.source.TileWMS({
                url: baseUrl,
                projection: projection.proj,
                serverType: 'geoserver',
                params: {
                    FORMAT: format,
                    VERSION: '1.1.1',
                    tiled: true,
                    STYLES: '',
                    LAYERS: layers,
                    exceptions: 'application/vnd.ogc.se_inimage',
                    transition: 0,
                    filter: filter,
                }
            })
        });
    };
    /*
    //https://gist.github.com/ThomasG77/21192c7045ab8f50e22e
    var gmap = new google.maps.Map(document.getElementById('gmap'), {
        disableDefaultUI: true,
        keyboardShortcuts: false,
        draggable: false,
        disableDoubleClickZoom: true,
        scrollwheel: false,
        streetViewControl: false
    });
    */
    //https://aigreen.dcce.go.th/geoserver/gwc/service/wmts
    function WMTS(baseUrl, layerName, projection, visible) {
        var gridsetName = 'EPSG:4326';
        var gridNames = ['EPSG:4326:0', 'EPSG:4326:1', 'EPSG:4326:2', 'EPSG:4326:3', 'EPSG:4326:4', 'EPSG:4326:5', 'EPSG:4326:6', 'EPSG:4326:7', 'EPSG:4326:8', 'EPSG:4326:9', 'EPSG:4326:10', 'EPSG:4326:11', 'EPSG:4326:12', 'EPSG:4326:13', 'EPSG:4326:14', 'EPSG:4326:15', 'EPSG:4326:16', 'EPSG:4326:17', 'EPSG:4326:18'];
        var baseUrl = 'https://aigreen.dcce.go.th/geoserver/gwc/service/wmts';
        var style = '';
        var format = 'image/png';
        var infoFormat = 'text/html';
        var layerName = 'aigreen:AiGreenTypes';
        var projection = new ol.proj.Projection({
            code: 'EPSG:4326',
            units: 'degrees',
            axisOrientation: 'neu'
        });
        var resolutions = [0.703125, 0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 6.866455078125E-4, 3.4332275390625E-4, 1.71661376953125E-4, 8.58306884765625E-5, 4.291534423828125E-5, 2.1457672119140625E-5, 1.0728836059570312E-5, 5.364418029785156E-6, 2.682209014892578E-6];
        baseParams = ['VERSION', 'LAYER', 'STYLE', 'TILEMATRIX', 'TILEMATRIXSET', 'SERVICE', 'FORMAT'];

        params = {
            'VERSION': '1.0.0',
            'LAYER': layerName,
            'STYLE': style,
            'TILEMATRIX': gridNames,
            'TILEMATRIXSET': gridsetName,
            'SERVICE': 'WMTS',
            'FORMAT': format
        };

        function constructSource() {
            var url = baseUrl + '?'
            for (var param in params) {
                if (baseParams.indexOf(param.toUpperCase()) < 0) {
                    url = url + param + '=' + params[param] + '&';
                }
            }
            url = url.slice(0, -1);

            var source = new ol.source.WMTS({
                url: url,
                layer: params['LAYER'],
                matrixSet: params['TILEMATRIXSET'],
                format: params['FORMAT'],
                projection: projection,
                tileGrid: new ol.tilegrid.WMTS({
                    tileSize: [256, 256],
                    extent: [-180.0, -90.0, 180.0, 90.0],
                    origin: [-180.0, 90.0],
                    resolutions: resolutions,
                    matrixIds: params['TILEMATRIX']
                }),
                style: params['STYLE'],
                wrapX: true
            });
            return source;
        }

        return layer = new ol.layer.Tile({
            visible: visible,
            source: constructSource()
        });

    };

    globalThis.Layers = {
        OSM: new ol.layer.Tile({ source: new ol.source.OSM(), }),
        Sentinel2RGB: WMS(wmsUrl, 'aigreen:Sentinel2-2023', epsg4326, false),
        Sentinel1HHHV: WMS(wmsUrl, 'aigreen:Sentinel1-2023', epsg4326, false),
        GreenClasses: WMS(wmsUrl, 'aigreen:AiGreenClassesTif', epsg4326, false),
        GreenTypes: WMS(wmsUrl, 'aigreen:AiGreenTypesTIF', epsg4326, true),
        //GreenTypes: WMTS(wmsUrl, 'aigreen:AiGreenTypes', epsg4326, false),
        //Administration: WMS(wmsUrl, 'aigreen:Administration', epsg4326, true),
        LocalAdmin: WMS(wmsUrl, 'aigreen:AiGreenDLA,aigreen:Administration', epsg4326, true,
            //'<Filter><PropertyIsEqualTo><PropertyName>dla_code</PropertyName><Literal>06740116</Literal></PropertyIsEqualTo></Filter>'
        ),
        FieldTags: WMS(wmsUrl, 'aigreen:FieldDataPlots,aigreen:FieldDataTags', epsg4326, true),
    };

    globalThis.OLMap = new ol.Map({
        target: 'map',
        overlays: [overlay],
        layers: Object.values(globalThis.Layers),
        view: new ol.View({ projection: epsg4326.proj })
    });
    var extent = window.location.hash.slice(1).split(',');
    if (extent.length == 3) {
        try {
            extent = extent.map(x => parseFloat(x));
            globalThis.OLMap.getView().setZoom(extent[0]);
            globalThis.OLMap.getView().setCenter([extent[1], extent[2]]);
        } catch (error) { console.log(error) }
    } else {
        var bounds = [96.6928914535875, 5.122222768581152, 106.19285393883509, 21.402443793019795];
        globalThis.OLMap.getView().fit(bounds, globalThis.OLMap.getSize());
    }
    globalThis.OLMap.on('singleclick', function (evt) {
        //document.getElementById('info').innerHTML = '';
        const viewResolution = /** @type {number} */ (globalThis.OLMap.getView().getResolution());
        const wms = WMS(wmsUrl, 'aigreen:AiGreenTypes', epsg4326, false);
        console.log(wms);
        const cols = 'gtype,prov_code,amp_code,tam_code,prov_namt,amp_namt,tam_namt,dla_code,dla_type,dla_name,area_rai,coabsorb';
        const url = wms.getSource().getFeatureInfoUrl(
            evt.coordinate,
            viewResolution,
            'EPSG:4326',
            { 'INFO_FORMAT': 'application/json', "EXCEPTION": 'application/json', 'PROPERTYNAME': cols }
        );
        if (url) {
            console.log(evt);
            if (evt.originalEvent.ctrlKey) {
                closer.onclick();
                window.open(url);
            } else {
                fetch(url)
                    .then((response) => response.json())
                    .then((json) => {
                        if (json.features.length == 0) {
                            closer.onclick();
                            return;
                        }
                        console.log(json);
                        let props = Object.assign({}, { id: json.features[0].id }, json.features[0].properties);
                        let rows = Object.keys(props).map((k) => "<tr><td><b>" + k + " </b></td><td>:&nbsp;&nbsp;</td><td>"
                            + props[k].toLocaleString("en-US", { maximumFractionDigits: 2 }) + "</td></tr>").join('')
                        content.innerHTML = "<table>" + rows + "</table>";
                        overlay.setPosition(evt.coordinate);
                    });
            }
        }
    });
    globalThis.OLMap.on("moveend", ev => {
        //window.location.hash = globalThis.OLMap.getView().calculateExtent(globalThis.OLMap.getSize()).join(',');
        var view = globalThis.OLMap.getView();
        window.location.hash = view.getZoom() + ',' + view.getCenter().join(',');
    })
}

function ToggleLayer(button) {
    console.log(button);
    var name = button.getAttribute('name');
    var status = button.getAttribute('status') == 'true';
    var layer = globalThis.Layers[name];
    console.log(layer.getVisible(), status);

    status = !status;
    layer.setVisible(status);
    button.setAttribute('status', status);
    button.style.backgroundColor = status ? '#3d8c14' : null;

}

async function createDropdown(url, target, value, text) {
    const response = await fetch(url);
    const records = await response.json();
    //console.log(records);
    let sel = document.querySelector(target);
    clearOptions(sel);
    sel.value = "all";
    records.forEach((record) => {
        let opt = document.createElement('option');
        opt.setAttribute(value, record[value]);
        opt.innerText = record[text];
        opt.setAttribute('XMin', record.XMin);
        opt.setAttribute('YMin', record.YMin);
        opt.setAttribute('XMax', record.XMax);
        opt.setAttribute('YMax', record.YMax);
        sel.appendChild(opt);
    });
    if (target == '#selectAmphoe') {
        let tam = document.querySelector("#selectTambon");
        tam.value = "all";
        clearOptions(tam);
    }
}

function clearOptions(sel) {
    var i, L = sel.options.length - 1;
    for (i = L; i >= 1; i--) {
        sel.remove(i);
    }
}

function changeExcent(opt) {
    let xmin = parseFloat(opt.getAttribute('xmin'));
    let ymin = parseFloat(opt.getAttribute('ymin'));
    let xmax = parseFloat(opt.getAttribute('xmax'));
    let ymax = parseFloat(opt.getAttribute('ymax'));
    OLMap.getView().fit([xmin, ymin, xmax, ymax], OLMap.getSize());
}

function changeProvince(sel) {
    let opt = sel.selectedOptions[0];
    var prv = opt.getAttribute("prov_code");
    createPivot("PRV", prv, opt.text);
    changeExcent(opt);
    createDropdown("https://aigreen.dcce.go.th/rest/BBoxAmphoe?prov_code=like." + prv, '#selectAmphoe', 'amp_code', 'amp_namt');
}

function changeAmphoe(sel) {
    let opt = sel.selectedOptions[0];
    var amp = opt.getAttribute("amp_code");
    createPivot("AMP", amp, opt.text);
    changeExcent(opt);
    createDropdown("https://aigreen.dcce.go.th/rest/BBoxTambon?amp_code=like." + amp, '#selectTambon', 'tam_code', 'tam_namt');
}

function changeTambon(sel) {
    let opt = sel.selectedOptions[0];
    var tam = opt.getAttribute("tam_code");
    changeExcent(opt);
}

function tabAreaRai(tab) {
    globalThis.PivotMode = 'AreaRai';
    createPivot(globalThis.LastLevel, globalThis.LastValue, globalThis.LastLabel);
}

function tabCoAbsorb(tab) {
    globalThis.PivotMode = 'CoAbsorb';
    createPivot(globalThis.LastLevel, globalThis.LastValue, globalThis.LastLabel);
}

async function createPivot(level, value, label) {
    globalThis.LastLevel = level;
    globalThis.LastValue = value;
    globalThis.LastLabel = label;
    console.log(level, value);
    let pivotURL = "https://aigreen.dcce.go.th/rest/AiGreenCluster_PivotPRV";
    let headers = ['prov_code', 'prov_namt', 'arearai_P', 'arearai_MG', 'arearai_MP', 'arearai_S', 'arearai_E',
        'arearai_NCO', 'arearai_NCM', 'arearai_NOO', 'arearai_NOM', 'arearai_W', 'arearai_Total', 'arearai_Overall'
    ];
    if (level == "PRV") {
        if (value) {
            pivotURL = "https://aigreen.dcce.go.th/rest/AiGreenCluster_PivotAMP?order=amp_code&prov_code=like." + value;
            headers[0] = "amp_code";
            headers[1] = "amp_namt";
            document.querySelector('#AiGreenTitle').innerHTML = 'จังหวัด' + label;
        } else {
            pivotURL = "https://aigreen.dcce.go.th/rest/AiGreenCluster_PivotPRV?order=prov_code";
            document.querySelector('#AiGreenTitle').innerHTML = 'ภาพรวมทั้งประเทศ';
        }
    } else if (level == "AMP") {
        if (value) {
            pivotURL = "https://aigreen.dcce.go.th/rest/AiGreenCluster_PivotTAM?order=tam_code&amp_code=like." + value;
            headers[0] = "tam_code";
            headers[1] = "tam_namt";
            document.querySelector('#AiGreenTitle').innerHTML = 'อำเภอ' + label;
        } else {
            pivotURL = "https://aigreen.dcce.go.th/rest/AiGreenCluster_PivotAMP?order=amp_code&prov_code=like." + value;
            headers[0] = "amp_code";
            headers[1] = "amp_namt";
            document.querySelector('#AiGreenTitle').innerHTML = 'จังหวัด' + label;
        }

    }
    const response = await fetch(pivotURL);
    const records = await response.json();
    console.log(records);
    console.log(PivotMode);
    if (PivotMode == "CoAbsorb") { //AreaRai
        headers = headers.map((x) => x.replace('arearai', 'coabsorb'));
    }
    CreateTableCarbon(records, headers);
}

function CreateTableCarbon(records, headers) {
    let keycode = Object.keys(records[0]).filter((x) => x.endsWith('code'))[0];
    heading = records.filter((x) => x[keycode] != ' ')
        .map((x) => Object.entries(x))
        .map((x) => x.filter((y) => headers.indexOf(y[0]) >= 0))
        .map((x) => x.map((y) => y[0]))[0];

    headers = headers.filter((y) => heading.indexOf(y) >= 0);
    console.log(headers);
    records = records.filter((x) => x[keycode] != ' ')
        .map((x) => Object.fromEntries(headers.map((h) => [h, x[h]])))
        .map((x) => Object.keys(x).map((k) => x[k] ? x[k].toLocaleString("en-US", { maximumFractionDigits: 2 }) : '-'));
    let total = Array(records[0].length).fill(0);
    total[0] = '';
    total[1] = 'รวม';
    for (var r = 0; r < records.length; r++) {
        for (var c = 2; c < records[r].length; c++) {
            val = records[r][c].replace(',', '');
            total[c] += isNaN(val) ? 0 : parseFloat(val);
        }
    };
    headers = headers.map((x) => x.split('_')[1].replace('code', 'รหัส').replace('namt', 'ชื่อ'));

    total = total.map((y) => y ? y.toLocaleString("en-US", { maximumFractionDigits: 2 }) : '-');
    records.push(total);


    console.log(headers);
    console.log(records);
    //https://fiduswriter.github.io/simple-datatables/documentation/
    if (globalThis.AiGreenTable.destroy) globalThis.AiGreenTable.destroy();
    globalThis.AiGreenTable = new simpleDatatables.DataTable("#AiGreenTable", {
        paging: false,
        tabIndex: 1,
        perPage: 10,
        scrollY: "100%",
        rowNavigation: true,
        perPageSelect: [10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000],
        data: {
            "headings": headers,
            "data": records,
        },
        columns: [{
            select: 0,
            sort: "asc",
            type: "date",
            format: "YYYY/DD/MM",
        }],
    });
}

function FormatAreaRai(record, col) {
    if (col.startsWith('prov') || col.startsWith('amp') || col.startsWith('tam')) {
        switch (col) {
            case "prov_namt":
                return "จ." + record[col];
                break;
            case "amp_namt":
                return "อ." + record[col];
                break;
            case "tam_namt":
                return "ต." + record[col];
                break;
            default:
                return record[col];
                break;

        }
    }
    return record['arearai_' + col] ? record['arearai_' + col].toLocaleString("en-US", { maximumFractionDigits: 2 }) : '';
}

function FormatCoAbsorb(record, col) {
    if (col.startsWith('prov') || col.startsWith('amp') || col.startsWith('tam')) {
        return record[col];
    }
    return record['coabsorb_' + col] ? record['coabsorb_' + col].toLocaleString("en-US", { maximumFractionDigits: 2 }) : '';
}