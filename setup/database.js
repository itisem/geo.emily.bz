import Database from 'better-sqlite3';

const db = new Database("../data/geoguessr.db");
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
	function createCountriesTable(db){
		db.prepare(`
			CREATE TABLE IF NOT EXISTS countries(
				id TEXT PRIMARY KEY NOT NULL,
				englishName TEXT NOT NULL,
				localName TEXT NOT NULL,
				wikidataCode TEXT NOT NULL
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
				CREATE TABLE IF NOT EXISTS quizzes(
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