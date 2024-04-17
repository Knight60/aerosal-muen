//client side script
async function AQI_Entities() {
    const response = await fetch('/proxy/air4thai.com/forweb/getAQI_JSON.php');
    const data = await response.json();
    const stations = data.stations;
    console.log(stations);
    if (!(stations && stations.length)) {
        console.log('load air4thai data fail');
        return;
    }
    let Air4ThaiStations = {};
    for (var station of stations) {
        var color = station.AQILast.AQI.color_id;
        switch (color) {
            case "0":
                color = Cesium.Color.fromCssColorString("#FFFFFF");
                break;
            case "1":
                color = Cesium.Color.fromCssColorString("#3BCCFF");
                break;
            case "2":
                color = Cesium.Color.fromCssColorString("#92D050");
                break;
            case "3":
                color = Cesium.Color.fromCssColorString("#FFFF00");
                break;
            case "4":
                color = Cesium.Color.fromCssColorString("#FFA200");
                break;
            case "5":
                color = Cesium.Color.fromCssColorString("#FFA200");
                break;
            default:
                color = Cesium.Color.fromCssColorString("#555555");
        }
        Air4ThaiStations[station.stationID] = viewer.entities.add({
            id: [station.stationID, station.nameTH].join(" : "),
            properties: { 'a': 1, 'b': 2 },
            position: Cesium.Cartesian3.fromDegrees(station.long, station.lat),
            point: {
                pixelSize: 15,
                outlineWidth: 3,
                color: color, //Cesium.Color.CORNFLOWERBLUE,
                outlineColor: Cesium.Color.fromCssColorString("#000000"),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            /*
                        label: {
                            text: station.stationID,
                            font: "14pt sans-serif",
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            verticalOrigin: Cesium.VerticalOrigin.BASELINE,
                            fillColor: Cesium.Color.GHOSTWHITE,
                            showBackground: false,
                            backgroundColor: Cesium.Color.DARKSLATEGREY.withAlpha(0.8),
                            backgroundPadding: new Cesium.Cartesian2(8, 4),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            pixelOffset: new Cesium.Cartesian2(15, 6),
                            //eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                            disableDepthTestDistance: 1.2742018 * 10 ** 7,
                        },*/
        })
    }
}