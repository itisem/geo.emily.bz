import Database from "better-sqlite3";
import {flag as emoji} from "country-emoji";

const db = new Database("../data/data.db");
const structureQueries = [
	function createLanguagesTable(db){
		db.prepare(`
			CREATE TABLE IF NOT EXISTS languages(
				-- language two letter code
				id TEXT PRIMARY KEY NOT NULL,
				englishName TEXT NOT NULL,
				localName TEXT NOT NULL,
				ttsCode TEXT NOT NULL
			)
		`).run();
	},
	function createWordsTable(db){
		db.prepare(`
			CREATE TABLE IF NOT EXISTS words(
				localName TEXT PRIMARY KEY NOT NULL,
				englishName TEXT NOT NULL,
				languageId TEXT NOT NULL,
				-- 2 letter iso code
				country TEXT NOT NULL
			)
		`).run();
	},
	function createGeoJSONTable(db){
		db.prepare(`
				CREATE TABLE IF NOT EXISTS geoJSONs(
				id TEXT NOT NULL,
				user TEXT NOT NULL,
				name TEXT NOT NULL,
				shape TEXT NOT NULL,
				source TEXT,
				UNIQUE(id, user)
			)
		`).run();
	},
	function createQuizzesTable(db){
		db.prepare(`
				CREATE TABLE IF NOT EXISTS mapQuizzes(
				id TEXT NOT NULL,
				user TEXT NOT NULL,
				title TEXT NOT NULL,
				quizType TEXT NOT NULL,
				categoryId TEXT NOT NULL,
				categoryUser TEXT,
				displayValues TEXT NOT NULL,
				answerValues TEXT,
				UNIQUE(id, user)
			)
		`).run();
		db.prepare(`
				CREATE TABLE IF NOT EXISTS categories(
				id TEXT PRIMARY KEY NOT NULL,
				title TEXT NOT NULL,
				user TEXT,
				UNIQUE(id, user)
			)
		`).run();
	},
	function createGeoJsonsPropertiesTable(db){
		try{
			db.prepare(`ALTER TABLE geoJSONs DROP COLUMN name`).run();
			db.prepare(`ALTER TABLE geoJSONs DROP COLUMN source`).run();
		}
		catch{
			// we don't need to do anything, it just means this has already been run
		}
		db.prepare(`
				CREATE TABLE IF NOT EXISTS geoJSONProperties(
				id TEXT NOT NULL,
				user TEXT NOT NULL,
				propertyName TEXT NOT NULL,
				propertyType TEXT DEFAULT "text" NOT NULL,
				value TEXT NOT NULL,
				UNIQUE(id, propertyName)
			)
		`).run();
		db.prepare(`CREATE TABLE IF NOT EXISTS geoJSONCategories(
				geoJSONId TEXT NOT NULL,
				geoJSONUser TEXT NOT NULL, 
				categoryId TEXT NOT NULL,
				categoryUser TEXT,
				UNIQUE(geojsonId, categoryId, categoryUser)
			)
		`).run();
	},
	function removeQuizType(db){
		try{
			db.prepare(`ALTER TABLE quizzes DROP COLUMN quizType`).run();
			db.prepare(`ALTER TABLE quizzes DROP COLUMN answerValues`).run();
		}
		catch{
			// we don't need to do anything, it just means this has already been run
		}
	},
	function addDefaultMap(db){
		db.prepare(`ALTER TABLE quizzes ADD COLUMN defaultMap TEXT DEFAULT "gm" NOT NULL`);
	},
	function addUsers(db){
		db.prepare(`CREATE TABLE IF NOT EXISTS quizAliases(
				alias TEXT PRIMARY KEY NOT NULL,
				id TEXT NOT NULL, 
				user TEXT NOT NULL,
				frontpageCategory TEXT
			)
		`).run();
		db.prepare(`CREATE TABLE IF NOT EXISTS users(
				id TEXT PRIMARY KEY NOT NULL,
				displayName TEXT UNIQUE NOT NULL, 
				password TEXT NOT NULL,
				salt TEXT NOT NULL
			)
		`).run();
		db.prepare(`CREATE TABLE IF NOT EXISTS sessions(
				sessionKey TEXT PRIMARY KEY NOT NULL,
				userId TEXT NOT NULL, 
				expiry INTEGER NOT NULL
			)
		`).run();
	},
	function userFixes(db){
		db.prepare(`ALTER TABLE users DROP COLUMN salt`).run();
		db.prepare(`ALTER TABLE users ADD COLUMN permissions INTEGER DEFAULT 3 NOT NULL`).run();
		db.prepare(`ALTER TABLE quizAliases ADD COLUMN frontpageTitle TEXT`).run();
	},
	function moreUserFixes(db){
		const oldPermissions = {
			1: "addQuiz",
			2: "addGeoJSON",
			4: "admin"
		};
		const convertPermissions = permNum => {
			let perms = [];
			for(let num in oldPermissions){
				if(num & permNum){
					perms.push(oldPermissions[num]);
				}
			}
			return perms.join("\x1d");
		}
		db.prepare(`ALTER TABLE sessions RENAME COLUMN sessionKey to sessionId`).run();
		const permissions = db.prepare(`SELECT id, permissions FROM users`).all();
		const permissionsFixed = permissions.map(x => {x.permissions = convertPermissions(x.permissions); return x});
		db.prepare(`ALTER TABLE users DROP COLUMN permissions`).run();
		db.prepare(`ALTER TABLE users ADD COLUMN permissions TEXT`).run();
		permissionsFixed.map(x => db.prepare(`UPDATE users SET permissions=? WHERE id=?`).run(x.permissions, x.id));
	},
	function frontpageFixes(db){
		db.prepare(`CREATE TABLE IF NOT EXISTS quizCategories(
			category TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			emoji TEXT,
			isCountry INTEGER DEFAULT 1 NOT NULL
		)`).run();
		const quizzes = db.prepare(`SELECT * FROM quizAliases`).all();
		db.prepare(`ALTER TABLE quizAliases RENAME COLUMN frontpageCategory TO category`).run();
		db.prepare(`ALTER TABLE quizAliases RENAME COLUMN frontpageTitle TO altTitle`).run();
		db.prepare(`ALTER TABLE quizAliases ADD COLUMN isFrontPage INTEGER DEFAULT 0 NOT NULL`).run();
		let categoryNames = {};
		for(let quiz of quizzes){
			const alias = quiz.alias;
			const category = alias.split("/")[0];
			const isFrontPage = + (!!quiz.frontpageCategory);
			db.prepare(`UPDATE quizAliases
				SET category = :category, isFrontPage = :isFrontPage
				WHERE alias = :alias
			`).run({category, isFrontPage, alias});
			if(quiz.frontpageCategory){
				categoryNames[category] = quiz.frontpageCategory;
			}
		}
		for(let category in categoryNames){
			db.prepare(`INSERT INTO quizCategories(category, name, emoji) VALUES(:category, :name, :emoji)`).run({
				category: category,
				name: categoryNames[category],
				emoji: emoji(categoryNames[category])
			});
		}
	}
]; // adding / removing columns should be done by a new query here to ensure database is versioned correctly

const version = db.pragma("user_version", {simple: true});
if(version < structureQueries.length){
	let transaction = db.transaction( () => {
		for(let i = version; i < structureQueries.length; i++){
			structureQueries[i](db);
		}
		db.pragma(`user_version=${structureQueries.length}`);
	});
	transaction();
}