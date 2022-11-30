import Database from "better-sqlite3";
import axios from "axios";
import from "url";

const countries = {
	"bd": {
		"englishName": "Bangladesh",
		"wikidataCode": "Q902",
		"localName": "বাংলাদেশ"
	},
	"jo":{
		"englishName": "Jordan",
		"wikidataCode": "Q810",
		"localName": " الأردن"
	},
	"kr": {
		"englishName": "South Korea",
		"wikidataCode": "Q884",
		"localName": "남한"
	},
	"ps": {
		"englishName": "Palestine",
		"wikidataCode": "Q219060",
		"localName": "فلسطين"
	},
	"ru": {
		"englishName": "Russia",
		"wikidataCode": "Q159",
		"localName": "Россия"
	},
	"th":{
		"englishName": "Thailand",
		"wikidataCode": "Q869",
		"localName": "ประเทศไทย"
	},
	"tn": {
		"englishName": "Tunisia",
		"wikidataCode": "Q948",
		"localName": "تونس"
	}
};

const languages = {
	"ar": {
		"englishName": "Arabic",
		"localName": "اَلْعَرَبِيَّةُ",
		"ttsCode": "ar-XA",
		"countries": [
			"jo",
			"ps",
			"tn"
		],
		"extraPlaceCodes": [],
		"deletions": {
			"english": [],
			"local": []
		} 
	},
	"bn": {
		"englishName": "Bengali",
		"localName": "বাংলা",
		"ttsCode": "bn-IN",
		"countries": [
			"bd"
		],
		"extraPlaceCodes": [
			"Q152732", //district of bangladesh
			"Q620471" // upazila of bangladesh
		],
		"deletions": {
			"english": [
				/ district/ui,
				/ (sadar )?upazila/ui
			],
			"local": [
				/ জেলা/ui,
				/ (সদর )?উপজেলা/ui
			]
		}
	},
	"ko": {
		"englishName": "Korean",
		"localName": "한국어",
		"ttsCode": "ko-KR",
		"countries": [
			"kr"
		],
		"extraPlaceCodes": [
			"Q29045252", // city of South Korea
			"Q483515", // myeon
			"Q42132", // eup
			"Q483519" // ri
		],
		"deletions": {
			"english": [
				/[ -]?myeon/ui,
				/[ -]?ri$/ui
			],
			"local": [
				/면/ui,
				/리$/ui,
				/시$/ui,
				/광역/ui,
				/특별/ui
			]
		}
	},
	"ru": {
		"englishName": "Russian",
		"localName": "Русский",
		"ttsCode": "ru-RU",
		"countries": [
			"ru"
		],
		"extraPlaceCodes": [
			"Q2514025" // posylok
		],
		"deletions": {
			"english": [],
			"local": []
		}
	},
	"th": {
		"englishName": "Thai",
		"localName": "ไทย",
		"ttsCode": "th-TH",
		"countries": [
			"th"
		],
		"extraPlaceCodes": [
			"Q50198", // province of Thailand
			"Q1077097" // tambon
		],
		"deletions":{
			"english": [],
			"local": [
				/(เทศบาล)?เมือง"/ui,
				/จังหวัด/ui,
				/แหล่งโบราณคดี/ui,
				/ตำบล/ui
			]
		}
	}
};

const db = new Database("../data/data.db");


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
	await axios.get(`https://query.wikidata.org/sparql?${new url.URLSearchParams(params)}&format=json`, {
		headers: {
			"Accept-Encoding": "*"
		}
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