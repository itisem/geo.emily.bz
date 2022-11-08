import groupBorders from "../utils/maps/group-borders.js";
import fs from "fs";
import Database from 'better-sqlite3';

const db = new Database("../data/geoguessr.db");

const postcodes = JSON.parse(fs.readFileSync(`./postcodes/mexico.json`, {encoding:'utf8'}));

const points = postcodes.filter(x => !!x.geometry).map(x => {
	return {type: "Feature", geometry: x.geometry, properties: {postcode: x.fields.postal_code.slice(0,2)}}
});

let borders = groupBorders({type: "FeatureCollection", features: points}, "postcode");

const features = [];
const properties = [];
const categories = [];

for(let border of borders.features){
	const key = border.properties.postcode;
	const id = `mexico-postcodes[2]/${key}`;
	features.push({
		id: id,
		user: "import",
		json: JSON.stringify(border),
	});
	properties.push({
		id: id,
		user: "import",
		name: "code",
		value: key
	});
	categories.push({
		id: id,
		user: "import",
		categoryId: "mexico-postcodes[2]",
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
	insertCategoryTitle.run({id: `mexico-postcodes[2]`, title: `Mexico postcodes (2 digits)`, user: "import"});
	const insertQuiz = db.prepare(`REPLACE INTO quizzes (id, user, title, categoryId, categoryUser, displayValues) VALUES (:id, 'import', :quizTitle, :categoryId, 'import', 'name')`);
	insertQuiz.run({id: `mexico/postcodes`, categoryId: `mexico-postcodes[2]`, quizTitle: `Mexico postcodes`});
});
transaction();