import bbox from "@turf/bbox";
import getGeoJSONPolygon from "./get-geojson-polygon";

export default function bboxFromMany(geoJSONs){
	const coordsOnly = geoJSONs.map(geo => {
		const poly = getGeoJSONPolygon(geo);
		if(poly.type == "Polygon"){
			return poly.coordinates;
		}
		if(poly.type == "MultiPolygon"){
			return poly.coordinates[0];
		}
		return [];
	});
	return bbox({type: "MultiPolygon", coordinates: coordsOnly});
}