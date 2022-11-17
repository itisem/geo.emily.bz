import openDB from './open-db.js';
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

export default function login(username, password){
	const sessionDuration = 60*60*24;
	const db = openDB();
	const usernameCheck = /^[a-zA-Z][a-zA-Z0-9\-]{1,18}[a-zA-Z]$/;
	if(!username.match(usernameCheck)) return Promise.reject({error: true, message: "User does not exist"});
	const userData = db.prepare("SELECT * FROM users WHERE LOWER(displayName) = ?").get([username.toLowerCase()]);
	if(!userData) return Promise.reject({error: true, message: "User does not exist"});
	return bcrypt.compare(password, userData.password).then(result => {
		if(!result) throw {error: true, message: "Incorrect password"};
		const sessionKey = crypto.randomUUID({disableEntropyCache: true});
		db.prepare("INSERT INTO sessions(sessionKey, userId, expiry) VALUES (:key, :id, :expiry)").run({
			key: sessionKey,
			id: userData.id,
			expiry: Date.now() + sessionDuration
		});
		return {error: false, message: sessionKey};
	});
}