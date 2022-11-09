export default function taggedMapGeoJSON(map, includedTags = []){
	const includeAll = !!includedTags;
	let features = []; 
	for(let loc of map.customCoordinates){
		if(!loc.extra.tags) loc.extra.tags = [];
		let tags = includeAll ? loc.extra.tags : loc.extra.tags.filter(x => includedTags.includes(x));
		features.push({
			type: "Feature",
			properties: {tags: tags},
			geometry: {
				type: "Point",
				coordinates: [loc.lng, loc.lat]
			}
		});
	}
	return {type: "FeatureCollection", features: features};
}