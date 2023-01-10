import validateUsername from "./validate-username";

describe("invalid usernames", () => {
	it("rejects reserved names", () => {
		expect(validateUsername("system")).toBe(false);
		expect(validateUsername("ADMIN")).toBe(false);
	});
	it("rejects short names", () => {
		expect(validateUsername("aa")).toBe(false);
	});
	it("rejects long names", () => {
		expect(validateUsername("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBe(false);
	});
	it("rejects non-alnum+hyphen", () => {
		expect(validateUsername("United Kingdom")).toBe(false);
		expect(validateUsername("United_Kingdom")).toBe(false);
	});
	it("rejects hyphen at the ends", () => {
		expect(validateUsername("-user")).toBe(false);
		expect(validateUsername("user-")).toBe(false);
	});
});

describe("valid usernames" , () => {
	it("accepts valid usernames", () => {
		expect(validateUsername("United-Kingdom")).toBe(true);
		expect(validateUsername("aaa")).toBe(true);
		expect(validateUsername("01234567890123456789")).toBe(true);
	});
});