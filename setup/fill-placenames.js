const Database = require('better-sqlite3');
const countries = require('./country-info');
const languages = require('./language-info');
const axios = require('axios');
const url = require('url');

for(let key in countries){
	let query = db.prepare(`
		REPLACE INTO countries (id, englishName, localName, wikidataCode)
		VALUES (?, ?, ?, ?)
	`);
	let transaction = db.transaction( () => {
		query.run([key, countries[key].englishName, countries[key].localName, countries[key].wikidataCode]);
	});
	transaction();
}

for(let key in languages){
	let query = db.prepare(`
		REPLACE INTO languages (id, englishName, localName, ttsCode)
		VALUES (?, ?, ?, ?)
	`);
	let transaction = db.transaction( () => {
		query.run([key, languages[key].englishName, languages[key].localName, languages[key].ttsCode]);
	});
	transaction();
	let langTemp = languages[key];
	langTemp["key"] = key;
	langTemp["countriesCode"] = langTemp.countries.map(c => countries[c].wikidataCode);
	populateWords(langTemp);
}

function simpleUnion(dataID, data){
	data = data.map(d => `{?place wdt:${dataID} wd:${d}.}`);
	return data.join(" UNION ")
}

function getCountry(country, language){
	for(let i = 0; i < language.countries.length; i++){
		if("http://www.wikidata.org/entity/" + language.countriesCode[i] == country){
			return language.countries[i];
		}
	}
	return null;
}

async function populateWords(language){

	let placeTypes = ["Q515", "Q3957", "Q532", "Q7930989", "Q486972"]; // city, town, village, city/town, human settlement, respectively
	placeTypes.push(...language.extraPlaceCodes);
	let query = `
		SELECT ?localName (SAMPLE(?englishName) AS ?englishName)(SAMPLE(?country) AS ?country)
		WHERE{
			${simpleUnion("P31", placeTypes)}.
			${simpleUnion("P17", language.countriesCode)}.
			OPTIONAL { ?place wdt:P17 ?country } .
			?place rdfs:label ?englishName filter (lang(?englishName) = "en").
			?place rdfs:label ?localName filter (lang(?localName) = "${language.key}").
		}
		GROUP BY ?localName
	`;
	const params = {
		"query": query
	};
	await axios.get(`https://query.wikidata.org/sparql?${new url.URLSearchParams(params)}`, {
		"headers": {'Accept': 'application/sparql-results+json'}
	}).then(
		response => {
			let data = response.data.results.bindings;
			let insertQuery;
			for(let element of data){
				let localName = element.localName.value;
				let englishName = element.englishName.value;
				let country = getCountry(element.country.value, language);
				language.deletions.local.map(
					regex => {localName = localName.replace(regex, "")}
				);
				language.deletions.english.map(
					regex => {englishName = englishName.replace(regex, "")}
				);
				localName = localName.replace(/\(.*\)/gmiu, "");
				englishName = englishName.replace(/\(.*\)/gmiu, "");
				localName = localName.split(",")[0];
				englishName = englishName.split(",")[0];
				insertQuery = db.prepare(`
					REPLACE INTO words (localName, englishName, languageId, country)
					VALUES (?, ?, ?, ?)
				`);
				if(country){
					if(englishName.match(/^[a-zA-Z \-]+$/)){
						insertQuery.run([localName, englishName, language.key, country]);
					}
				}
			}
		}
	);
}