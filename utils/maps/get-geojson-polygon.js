export default function getGeoJSONPolygon(geoJSON){
	let json = geoJSON;
	while(typeof json === "object"){
		if(json.type === "Polygon" | json.type === "MultiPolygon"){
			return json;
		}
		json = json.geometry;
	}
	return [];
}