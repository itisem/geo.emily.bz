import openDB from "../db/open-db";
import createAccount from "./create-account";

beforeAll(() => {
	var db = openDB();
	db.prepare("INSERT INTO users(id, displayName, password, permissions) VALUES ('testUserId', 'testUserName', '0', 0)").run();
});

describe("erroneous accounts", () => {
	it("rejects invalid usernames", () => {
		expect(createAccount("aa", "01234567891011a")).rejects.toBe("invalid username");
		expect(createAccount("aa123412341234123412341234", "01234567891011a")).rejects.toBe("invalid username");
		expect(createAccount("aa/bc", "01234567891011a")).rejects.toBe("invalid username");
		expect(createAccount("system", "01234567891011a")).rejects.toBe("invalid username");
		expect(createAccount("-aaa", "01234567891011a")).rejects.toBe("invalid username");
	});
	it("rejects invalid passwords", () => {
		expect(createAccount("system", "8letters", {__testAllowReserved: true})).rejects.toBe("invalid password");
		expect(createAccount("system", "01234567891011", {__testAllowReserved: true})).rejects.toBe("invalid password");
		expect(createAccount("system", "abcdefghijklmnopQRSTUVWXYZ", {__testAllowReserved: true})).rejects.toBe("invalid password");
	});
	it("rejects existing users", () => {
		expect(createAccount("testUserName", "01234567891011a")).rejects.toBe("user already exists");
	});
});

describe("working accounts", () => {
	it("creates accounts", async () => {
		const checkAccount = () => {var db = openDB(); return !!db.prepare("SELECT * FROM users WHERE displayName='system'").get();};
		await expect(createAccount("system", "01234567891011a", {__testAllowReserved: true})).resolves.toBe(true);
		expect(checkAccount()).toBe(true);
	});
})

afterAll(() => {
	var db = openDB();
	db.prepare("DELETE FROM users WHERE id='testUserId'").run();
	db.prepare("DELETE FROM users WHERE displayName='system'").run();
});