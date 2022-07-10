// OSM Tilelayer
let OSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
});

let cartoLight = layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
   attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 20,
   minZoom: 0
});

let cartoDark = layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
   attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 20,
   minZoom: 0
});

// Leaflet Initialisation
let map = L.map('map', {
    center: [-33.801518, 150.911068],
    zoom: 10,
    layers: [OSM]
});

L.control.layers({
    "OpenStreetMap": OSM,
    "Carto Light": cartoLight,
    "Carto Dark": cartoDark
}).addTo(map);

let latestLayer;

// Get all the data from the rainradar capabilities endpoint.
const getTimestamps = async(callback) => {
    return $.getJSON('https://api.weather.bom.gov.au/v1/rainradarlayer/capabilities', {
        format: 'json',
    }) 
}

// get the timestamps from above, check if we have already pushed a layer, if no, then push one, if yes, update the time and redraw it.
const drawLayer = async() => {
    let data = await getTimestamps();
    let latest = data.data.timesteps[data.data.timesteps.length - 1];

    if(typeof(latestLayer) == "undefined") {
        console.log(latest);
        latestLayer = L.tileLayer(`https://radar-tiles.service.bom.gov.au/tiles/{time}/{z}/{x}/{y}.png`, {
            opacity: 0.5,
            tileSize: 256,
            maxNativeZoom: 10,
            minZoom: 3,
            time: latest
        })
    
        latestLayer.addTo(map);
    } else {
        latestLayer.options.time = latest
        latestLayer.redraw();
        console.log("redrawing: " + latest);
    }

    // This is a very rough solution, but works.
    let d = new Date(`${latest.slice(0,4)}-${latest.slice(4,6)}-${latest.slice(6,8)}T${latest.slice(8,10)}:${latest.slice(10,12)}:00Z`)
    $('.latestTileTime').text(d.toLocaleString());
}

// Initially draw layer, and then every 2 minutes, run the method again.
// BOM only publishes every 10 minutes or so, but I find it easier to set to 2 minutes refresh.
drawLayer();
setInterval(function() {
    drawLayer();
}, 2*60*1000);

// When the user uses the layer selector to change the base map, bring the weather overlay to the front.
map.on("baselayerchange", function(e) {
    latestLayer.bringToFront();
})

