import openDB from "../db/open-db";
import createAccount from "./create-account";
import login from "./login";

beforeAll(async () => {
	await createAccount("system", "password101112ABC", {__testAllowReserved: true});
});

describe("bad logins", () => {
	it("rejects invalid usernames", () => {
		expect(login("admin", "password101112ABCD")).rejects.toBe("invalid username");
		expect(login("admin/aaa", "password101112ABCD")).rejects.toBe("invalid username");
		expect(login("admin", "password101112ABCD", {__testAllowReserved: true})).rejects.toBe("username does not exist");
	});
	it("rejects invalid passwords", () => {
		expect(login("system", "password101112ABCD", {__testAllowReserved: true})).rejects.toBe("incorrect password");
	});
});

describe("good logins", () => {
	it("logs in successfully", () => {
		expect(login("system", "password101112ABC", {__testAllowReserved: true})).resolves.toMatchObject({user: {displayName: "system"}});
	});
});

afterAll(() => {
	var db = openDB();
	const systemId = db.prepare("SELECT * FROM users WHERE displayName='system'").get().id;
	db.prepare("DELETE FROM sessions WHERE userId=?").run(systemId);
	db.prepare("DELETE FROM users WHERE displayName='system'").run();
});