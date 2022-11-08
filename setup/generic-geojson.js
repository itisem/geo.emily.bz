import * as fs from "fs";
import Database from 'better-sqlite3';
import simplifyFurther from '../utils/maps/simplify-further.js';
import titleCase from '../utils/misc/title-case.js';

function load(country, subdivisionName = "state"){
	const json = JSON.parse(fs.readFileSync(`./geojsons/${country}.geojson`, {encoding:'utf8'}));
	const db = new Database("../data/geoguessr.db");

	const features = [];
	const properties = [];
	const categories = [];

	for(let feature of json.features){
		const id = `${country}-${subdivisionName}/${feature.properties.shapeName}`;
		features.push({
			id: id,
			json: JSON.stringify(simplifyFurther(feature, {tolerance: 0.01, highQuality: true, mutate: true})),
			user: "import"
		});
		properties.push({
			id: id,
			user: "import",
			name: "name",
			value: feature.properties.shapeName
		});
		properties.push({
			id: id,
			user: "import",
			name: "source",
			value: "https://github.com/wmgeolab/geoBoundaries/tree/main/releaseData/gbOpen"
		});
		categories.push({
			id: id,
			user: "import",
			categoryId: `${country}-${subdivisionName}`,
			categoryUser: "import"
		});
	}

	let transaction = db.transaction( () => {
		const insertJson = db.prepare(`REPLACE INTO geoJSONs (id, shape, user) VALUES (:id, :json, :user)`);
		features.map(x => insertJson.run(x));
		const insertProperties = db.prepare(`REPLACE INTO geoJSONProperties (id, user, propertyName, value) VALUES (:id, :user, :name, :value)`);
		properties.map(x => insertProperties.run(x))
		const insertCategory = db.prepare(`REPLACE INTO geoJSONCategories (geoJSONId, geoJSONuser, categoryId, categoryUser) VALUES (:id, :user, :categoryId, :categoryUser)`);
		categories.map(x => insertCategory.run(x));
		const insertCategoryTitle = db.prepare(`REPLACE INTO categories (id, title, user) VALUES (:id, :title, :user)`);
		insertCategoryTitle.run({id: `${country}-${subdivisionName}`, title: `${titleCase(country)} ${subdivisionName}`, user: "import"});
		const insertQuiz = db.prepare(`REPLACE INTO quizzes (id, user, title, categoryId, categoryUser, displayValues) VALUES (:id, 'import', :quizTitle, :categoryId, 'import', 'name')`);
		insertQuiz.run({id: `${country}/${subdivisionName}`, categoryId: `${country}-${subdivisionName}`, quizTitle: `${titleCase(country)} ${subdivisionName}`});
	});
	transaction();
}