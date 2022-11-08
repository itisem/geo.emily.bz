import simplify from '@turf/simplify';
import area from '@turf/area';
import getGeoJSONPolygon from "./get-geojson-polygon.js";

export default function simplifyFurther(geo, props){
	if(!props.threshold) props.threshold = 20 * 1000 * 1000; // default to 20km removed
	const baseSimplified = simplify(geo, props);
	let finalSimplified = {type: "Feature", properties: geo.properties};
	let polygon = getGeoJSONPolygon(baseSimplified);
	if(polygon.type === "Polygon"){
		return baseSimplified;
	}
	let goodPolygons = [];
	for(let poly of polygon.coordinates){
		const polyGeo = {type: "Polygon", coordinates: poly};
		if(area(polyGeo) > props.threshold){
			goodPolygons.push(poly);
		}
	}
	if(goodPolygons.length > 0){
		polygon.coordinates = goodPolygons;
		finalSimplified.geometry = polygon;
		return finalSimplified;
	}
	else{
		finalSimplified.geometry = baseSimplified;
		return baseSimplified;
	}
}