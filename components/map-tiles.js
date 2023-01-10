import {BitmapLayer} from '@deck.gl/layers';
import {TileLayer} from '@deck.gl/geo-layers';

const mapModes = {
	osm: {
		url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
	},
	gm: {
		url: "https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}",
		subdomains: ["mt0", "mt1", "mt2", "mt3"],
		maxZoom: 20
	},
	gmHybrid: {
		url: "https://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}",
		subdomains: ["mt0", "mt1", "mt2", "mt3"],
		maxZoom: 20
	},
	gmSatellite: {
		url: "https://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}",
		subdomains: ["mt0", "mt1", "mt2", "mt3"],
		maxZoom: 20
	},
	gmTerrain: {
		url: "https://{s}.google.com/vt?lyrs=p&x={x}&y={y}&z={z}",
		subdomains: ["mt0", "mt1", "mt2", "mt3"],
		maxZoom: 20
	},
	gmNoLabels: {
		url: "https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i623356252!3m17!2sen-GB!3sUS!5e18!12m4!1e68!2m2!1sset!2sRoadmap!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!2zcy5lOmx8cC52Om9mZixzLnQ6MjF8cC52Om9mZixzLnQ6MjB8cC52Om9mZg!4e0!23i1379903",
		maxZoom: 20
	}
};

const mapDefaults = {
	url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
	subdomains: ["a", "b", "c"],
	attribution: "",
	maxZoom: 19,
	tileSize: 256
};

export default function MapTiles(map){
	if(map === "noMap") return null;
	let mapSettings = (map && map in mapModes) ? mapModes[map] : mapModes.osm;
	for(let key in mapDefaults){
		if(!(key in mapSettings)){
			mapSettings[key] = mapDefaults[key];
		}
	}

	return new TileLayer({
		data: mapSettings.subdomains.map(x => mapSettings.url.replace("{s}",x)),

		minZoom: 0,
		maxZoom: mapSettings.maxZoom,
		tileSize: mapSettings.tileSize,

		renderSubLayers: props => {
			const {
				bbox: {west, south, east, north}
			} = props.tile;

			return new BitmapLayer(props, {
				data: null,
				image: props.data,
				bounds: [west, south, east, north]
			});
		}
	});
}