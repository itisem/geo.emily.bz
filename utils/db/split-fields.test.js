import splitFields from "./split-fields";

const obj = {a: "b c d e", f: "g\x1dhi\x1dj", k: "l\x1dm"};

describe("single fields are split properly", () => {
	it("splits stuff", () => {
		expect(splitFields(obj, "f")).toMatchObject({a: "b c d e", f:["g", "hi", "j"], k: "l\x1dm"});
	});
	it("works with custom separators", () => {
		expect(splitFields(obj, "a", " ")).toMatchObject({a: ["b", "c", "d", "e"], f: "g\x1dhi\x1dj", k: "l\x1dm"});
	});
});

describe("multiple fields are split properly", () => {
	it("splits stuff", () => {
		expect(splitFields(obj, ["f", "k"])).toMatchObject({a: "b c d e", f:["g", "hi", "j"], k: ["l", "m"]});
	});
	it("works with custom separators", () => {
		expect(splitFields(obj, ["a", "f"], " ")).toMatchObject({a: ["b", "c", "d", "e"], f: ["g\x1dhi\x1dj"], k: "l\x1dm"});
	});
})