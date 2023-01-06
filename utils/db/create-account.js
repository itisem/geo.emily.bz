import openDB from './open-db';
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import validateUsername from "./validate-username";
import validatePassword from "./validate-password";

export default function createAccount(username, password, settings = {}){
	const db = openDB();
	const usernameCheck = /^[a-zA-Z][a-zA-Z0-9\-]{1,18}[a-zA-Z]$/;
	if(!validateUsername(username, settings)) return Promise.reject("invalid username");

	const usernameExists = !!db.prepare("SELECT * FROM users WHERE LOWER(displayName) = ?").get([username.toLowerCase()]);
	if(usernameExists) return Promise.reject("user already exists");

	if(!validatePassword(password)) return Promise.reject("invalid password");

	const id = crypto.randomUUID();
	const saltRounds = 10;
	return bcrypt.hash(password, saltRounds).then(hash =>{
		db.prepare("INSERT INTO users (id, displayName, password) VALUES (:id, :username, :password)").run({id: id, username: username, password: hash});
		return "ACCOUNT_CREATED";
	});

}