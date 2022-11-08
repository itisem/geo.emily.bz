import coordinateDistance from "./coordinate-distance";

const groningenUni = {lat: 53.21932788791653, lng: 6.5629009539685494};
const groningenStation = {lat: 53.21075012004524, lng: 6.564476324071029};
const invercargillStation = {lat: -46.411958994521235, lng: 168.3445269525039};

describe("close distances", () => {
	test("Groningen: university to train station is 960m", () => 
		expect(coordinateDistance(groningenStation, groningenUni)).toBeGreaterThan(959)
	);
	test("Groningen: university to train station is 960m", () => 
		expect(coordinateDistance(groningenStation, groningenUni)).toBeLessThan(961)
	);
});

describe("larger distances", () => {
	test("Groningen train station to Invercargill tran station is roughly 18500km", () =>
		expect(coordinateDistance(groningenStation, invercargillStation)).toBeLessThan(18600000)
	);
	test("Groningen train station to Invercargill tran station is roughly 18500 km", () =>
		expect(coordinateDistance(groningenStation, invercargillStation)).toBeGreaterThan(18500000)
	);
}); // only using rough distances because the earth is not actually a sphere