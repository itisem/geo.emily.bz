import getGeoJSONPolygon from "./get-geojson-polygon";

const polygon = {type: "Polygon", "coordinates": [[1, 2], [2, 2], [2, 1], [1, 1]]};
const multipolygon = {type: "MultiPolygon", "coordinates": [[[1, 2], [2, 2], [2, 1], [1, 1]], [[3, 4], [4, 4], [4, 3], [3, 3]]]};
const feature1 = {type: "Feature", "geometry": polygon};
const feature2 = {type: "Feature", "geometry": multipolygon};

test("polygons work", () =>
	expect(getGeoJSONPolygon(polygon)).toBe(polygon)
);
test("multipolygons work", () =>
	expect(getGeoJSONPolygon(multipolygon)).toBe(multipolygon)
);
test("features work", () =>
	expect(getGeoJSONPolygon(feature1)).toBe(polygon)
);
test("features work on multipolygons too", () =>
	expect(getGeoJSONPolygon(feature2)).toBe(multipolygon)
);