import voronoi from "@turf/voronoi";
import bbox from "@turf/bbox";
import pointOnFeature from "@turf/point-on-feature";
import area from "@turf/area";
import pointsWithinPolygon from "@turf/points-within-polygon";
import difference from "@turf/difference";
import union from "@turf/union";
import convex from "@turf/convex";
import intersect from "@turf/intersect";

function itemCounts(array){
	let counts = {};
	for(let item of array){
		counts[item] = counts[item] ? counts[item] + 1 : 1;
	}
	return counts;
}

function uniqueNeighbours(array){
	const counts = itemCounts(array);
	let uniques = [];
	for(let vertex in counts){
		if(counts[vertex] == 1){
			uniques.push(vertex);
		}
	}
	return uniques;
}

function findNextNeighbour(neighbours, validNeighbours, used){
	for(let neighbour of neighbours){
		if(validNeighbours.includes(neighbour) && !used.includes(neighbour)){
			return neighbour;
		}
	}
	return undefined;
}

function findEnclosing(start, point, polygons){
	for(let i = 0; i < polygons.length; i++){
		if(pointsWithinPolygon(point, polygons[i]).features.length > 0) return i + start;
	}
	return undefined;
}

const range = n => [...Array(n).keys()];

// generates a gapless / overlapless set of borders given a featurecollection of points with attributes
export default function groupBorders(featureCollection, propertyName){
	const tessellation = voronoi(featureCollection, {bbox: bbox(featureCollection)});
	const hull = convex(featureCollection, {concavity: 2});
	let categories = {};
	let categoryNeighbours = {};
	for(let i = 0; i < featureCollection.features.length; i++){
		const prop = featureCollection.features[i].properties[propertyName];
		if(prop == undefined) continue;
		if(!categories[prop]){
			categories[prop] = [];
			categoryNeighbours[prop] = {};
		}
		if(tessellation.features[i] && tessellation.features[i].geometry.type == "Polygon"){ // takes care of duplicates and weird edges
			const vertices = tessellation.features[i].geometry.coordinates[0].map(x => x.join(",")).slice(1); // stringifying everything saves time on array comparisons and removing duplicate vertices from the beginning / end
			categories[prop].push(vertices);
			let l = vertices.length;
			for(let i = 0; i < l; i++){
				let currentVertex = vertices[i];
				if(!categoryNeighbours[prop][currentVertex]){
					categoryNeighbours[prop][currentVertex] = [];
				}
				categoryNeighbours[prop][currentVertex].push(vertices[(i-1+l) % l]);
				categoryNeighbours[prop][currentVertex].push(vertices[(i+1) % l]);
			}
		}
	}
	let finalFeatures = [];
	for(let category in categories){
		const neighbours = categoryNeighbours[category];
		const edgeNeighbours = Object.entries(neighbours).map(([k, v]) => [k, uniqueNeighbours(v)]).filter(([k, v]) => v.length == 2);
		let edgeVertices = edgeNeighbours.map(([k, v]) => k);
		let polygons = [];
		const reducedNeighbours = Object.fromEntries(edgeNeighbours);
		while(edgeVertices.length > 0){
			let nextNeighbour = edgeVertices[0];
			let currentPolygon = [];
			while(nextNeighbour){
				currentPolygon.push(nextNeighbour);
				nextNeighbour = findNextNeighbour(reducedNeighbours[nextNeighbour], edgeVertices, currentPolygon);
			}
			currentPolygon.push(currentPolygon[0]);
			edgeVertices = edgeVertices.filter(x => !currentPolygon.includes(x));
			if(currentPolygon.length > 3){
				polygons.push(currentPolygon.map(x => x.split(",").map(x => +x)));
			}
		}
		const polygonsWithArea = polygons.map(x => {return {type: "Feature", properties: {}, geometry: {type: "Polygon", coordinates: [x]}}}).map(x => {x.properties.area = area(x); return x;});
		let polygonsSorted = polygonsWithArea.sort((b, a) => b.properties.area - a.properties.area);
		const randomPoints = polygonsSorted.map(x => pointOnFeature(x));
		const enclosingPolygons = range(randomPoints.length).map(x => findEnclosing(x, randomPoints[x], polygonsSorted.slice(x+1)));
		let finalPolygons = [];
		for(let i = 0; i < randomPoints.length; i++){
			delete polygonsSorted[i].properties.area;
			if(enclosingPolygons[i]){
				polygonsSorted[enclosingPolygons[i]] = difference(polygonsSorted[enclosingPolygons[i]], polygonsSorted[i]);
			}
			else{
				finalPolygons.push(polygonsSorted[i]);
			}
		}
		let combined = finalPolygons[0];
		if(finalPolygons.length > 1){
			for(let i = 0; i < finalPolygons.length; i ++){
				combined = union(combined, finalPolygons[i]);
			}
		}
		combined = intersect(combined, hull);
		combined.properties[propertyName] = category;
		finalFeatures.push(combined);
	}
	return {type: "FeatureCollection", features: finalFeatures, properties: {}};
}