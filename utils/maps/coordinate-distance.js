export default function coordinateDistance (coordinate1, coordinate2){ // haversine formula stuff
	const earthRadius = 6378137;
	const radianMultiplier = Math.PI / 180;
	const radian1 = {
		"lat": coordinate1.lat * radianMultiplier,
		"lng": coordinate1.lng * radianMultiplier
	};
	const radian2 = {
		"lat": coordinate2.lat * radianMultiplier,
		"lng": coordinate2.lng * radianMultiplier
	};
	let tempCalc = 0.5 - Math.cos(radian2.lat - radian1.lat)/2 +  Math.cos(radian1.lat) * Math.cos(radian2.lat) * (1 - Math.cos(radian2.lng - radian1.lng))/2;
	return 2 * earthRadius * Math.asin(Math.sqrt(tempCalc));
}