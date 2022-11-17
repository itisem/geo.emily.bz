import * as fs from "fs";
import Database from 'better-sqlite3';
import simplifyFurther from '../utils/maps/simplify-further.js';

const quizUserId = "2e0e3ebf-2527-4ccb-801a-c7bd01b37f17";

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
			user: "system"
		});
		properties.push({
			id: id,
			user: "system",
			name: "name",
			value: feature.properties.shapeName
		});
		properties.push({
			id: id,
			user: "system",
			name: "source",
			value: "https://github.com/wmgeolab/geoBoundaries/tree/main/releaseData/gbOpen"
		});
		categories.push({
			id: id,
			user: "system",
			categoryId: `${country}-${subdivisionName}`,
			categoryUser: "system"
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
		insertCategoryTitle.run({id: `${country}-${subdivisionName}`, title: `${country} ${subdivisionName}`, user: "system"});
		const insertQuiz = db.prepare(`REPLACE INTO quizzes (id, user, title, categoryId, categoryUser, displayValues) VALUES (:id, :user, :quizTitle, :categoryId, 'system', 'name')`);
		insertQuiz.run({id: `${country}/${subdivisionName}`, categoryId: `${country}-${subdivisionName}`, quizTitle: `${country} ${subdivisionName}`, user: quizUserId});
	});
	transaction();
}