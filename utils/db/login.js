import openDB from "./open-db";
import validateUsername from "./validate-username";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

export default function login(username, password, settings = {}){
	const sessionDuration = +process.env.SESSION_DURATION || 1000*60*60*24*14;
	const db = openDB();
	if(!validateUsername(username, settings)) return Promise.reject("invalid username");
	const userData = db.prepare("SELECT * FROM users WHERE LOWER(displayName) = ?").get([username.toLowerCase()]);
	if(!userData) return Promise.reject("username does not exist");
	return bcrypt.compare(password, userData.password).then(result => {
		if(!result) return Promise.reject("incorrect password");
		const sessionId = crypto.randomBytes(32).toString("base64");
		const expiry = Date.now() + sessionDuration;
		db.prepare("INSERT INTO sessions(sessionId, userId, expiry) VALUES (:sessionId, :userId, :expiry)").run({
			sessionId: sessionId,
			userId: userData.id,
			expiry: expiry
		});
		return {
			sessionId: sessionId, 
			user: {
				id: userData.id,
				displayName: userData.displayName
			},
			duration: sessionDuration
		};
	});
}