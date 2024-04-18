// server side script
const ee = require("@google/earthengine");

const composites = {
    Natural: {
        bands: ["SR_B4", "SR_B3", "SR_B2"],
        min: 0.006000243146300037,
        max: 0.10160716690382254,
    },
    Infrared: {
        bands: ["SR_B5", "SR_B4", "SR_B3"],
        min: 0.006000243146300037,
        max: 0.10160716690382254,
    },
    ShortWave: {
        bands: ["SR_B7", "SR_B6", "SR_B4"],
        min: 0.006000243146300037,
        max: 0.10160716690382254,
    },
    Agriculture: {
        bands: ["SR_B6", "SR_B5", "SR_B2"],
        min: -0.011992063021072946,
        max: 0.3491176974295852,
    },
    False: {
        bands: ["SR_B5", "SR_B6", "SR_B4"],
        min: -0.011992063021072946,
        max: 0.3491176974295852,
    },
    NDVI: {
        min: 0.0,
        max: 1.0,
        palette: [
            "FFFFFF",
            "CE7E45",
            "DF923D",
            "F1B555",
            "FCD163",
            "99B718",
            "74A901",
            "66A000",
            "529400",
            "3E8601",
            "207401",
            "056201",
            "004C00",
            "023B01",
            "012E01",
            "011D01",
            "011301",
        ],
    },
};

function ToISOString(date) {
    var tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? "+" : "-",
        pad = function (num) {
            return (num < 10 ? "0" : "") + num;
        };

    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        "T" +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds()) +
        dif +
        pad(Math.floor(Math.abs(tzo) / 60)) +
        ":" +
        pad(Math.abs(tzo) % 60)
    );
}

function GetMap_LS_Date(isodate) {
    var Thailand = ee
        .FeatureCollection("USDOS/LSIB_SIMPLE/2017")
        .filter(ee.Filter.eq("country_na", "Thailand"));
    //Map.centerObject(Thailand, 7);
    /****************************************************/
    var date = new Date(isodate);
    var visualize = composites.False;
    /****************************************************/
    var next = new Date(date.getTime() + 1000 * 60 * 60 * 24);
    var dataset = ee
        .ImageCollection("LANDSAT/LC08/C02/T1_L2")
        .merge(ee.ImageCollection("LANDSAT/LC09/C02/T1_L2"))
        .filter(
            ee.Filter.and(
                ee.Filter.gte("WRS_PATH", 126),
                ee.Filter.lte("WRS_PATH", 132)
            )
        )
        .filterDate(date, next)
        .filterBounds(Thailand)
        .select(visualize.bands)
        .map(function (image) {
            var opticalBands = image.select("SR_B.").multiply(0.0000275).add(-0.2);
            //var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
            return image.addBands(opticalBands, null, true);
            //.addBands(thermalBands, null, true)
        });
    var hist = dataset.aggregate_histogram("WRS_PATH");
    var paths = ee.Dictionary(hist).keys();
    //print(dataset.first());
    var datamap = dataset.median().getMap(visualize);
    var result = {};
    result.date = isodate;
    result.mapid = datamap.mapid;
    result.urlFormat = datamap.urlFormat;
    result.paths = ee
        .Dictionary(dataset.aggregate_histogram("WRS_PATH"))
        .keys()
        .getInfo();
    result.spacecrafts = ee
        .Dictionary(dataset.aggregate_histogram("SPACECRAFT_ID"))
        .keys()
        .getInfo();
    return result;
}


function GetTilesAOD(sDate, eDate) {
    var aodImages = ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
        .select('Optical_Depth_047')
        .filterDate(sDate, eDate);

    var aodViz = {
        min: 200,
        max: 1000,
        palette: ['yellow', 'orange', 'red'],
        opacity: 0.5,
    };

    var aodImage = aodImages.mean();
    aodImage = aodImage.mask(aodImage.gte(aodViz.min));
    return { urlFormat: aodImage.getMap(aodViz).urlFormat };
}

//************************************************** */
module.exports = {
    composites: composites,
    GetMap_LS_Date: GetMap_LS_Date,
    ToISOString: ToISOString,
    GetTilesAOD: GetTilesAOD,
}