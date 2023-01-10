import openDB from "../db/open-db";
import checkSession from "./check-session";

beforeAll(() => {
	var db = openDB();
	db.prepare("INSERT INTO users(id, displayName, password) VALUES ('testUserId', 'testUserName', '0')").run();
	db.prepare("INSERT INTO sessions(sessionId, userId, expiry) VALUES ('expired', 'testUserId', ?)").run(Date.now() - 1);
	db.prepare("INSERT INTO sessions(sessionId, userId, expiry) VALUES ('notExpired', 'testUserId', ?)").run(Date.now() + 60*1000);
});

describe("incorrect sessions", () => {
	it("throws no session if there is no session id", () => {
		expect(() => checkSession(undefined)).toThrow("no session");
	});
	it("throws session not found if the session is fake", () => {
		expect(() => checkSession("fakeSession")).toThrow("session not found");
	});
	it("throws session expired if the session is old", () => {
		expect(() => checkSession("expired")).toThrow("session expired");
	});
});

describe("correct sessions", () => {
	const baseInfo = {
		user: {
			id: "testUserId",
			displayName: "testUserName",
			permissions: []
		}
	}
	it("returns the user data correctly", () => {
		expect(checkSession("notExpired", false)).toMatchObject(baseInfo);
		expect(checkSession("notExpired", false).expiry).toBeLessThan(Date.now() + 60*1000);
	});
	it("refreshes sessions correctly", () => {
		expect(checkSession("notExpired")).toMatchObject(baseInfo);
		expect(checkSession("notExpired").expiry).toBeGreaterThan(Date.now() + 60*1000);
	});
});

afterAll(() => {
	var db = openDB();
	db.prepare("DELETE FROM users WHERE id='testUserId'").run();
	db.prepare("DELETE FROM sessions WHERE userId='testUserId'").run();
});