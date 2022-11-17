import openDB from './open-db.js';
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

export default function createAccount(username, password){
	const db = openDB();
	const usernameCheck = /^[a-zA-Z][a-zA-Z0-9\-]{1,18}[a-zA-Z]$/;
	if(!username.match(usernameCheck)) return {error: true, message: "Invalid username"};

	const usernameExists = !!db.prepare("SELECT * FROM users WHERE LOWER(displayName) = ?").get([username.toLowerCase()]);
	if(usernameExists) return Promise.reject({error: true, message: "Username already exists"});

	const passwordChecks = [/^.{0,12}$/, /^[a-zA-Z]*$/];
	const validPassword = passwordChecks.map(check => !password.match(check)).every(x => x);
	if(!validPassword) return Promise.reject({error: true, message: "Invalid password"});

	const id = crypto.randomUUID({disableEntropyCache: true});
	const saltRounds = 10;
	return bcrypt.hash(password, saltRounds).then(hash =>{
		db.prepare("INSERT INTO users (id, displayName, password) VALUES (:id, :username, :password)").run({id: id, username: username, password: hash});
		return {error: false, message: "Account created"};
	});

}