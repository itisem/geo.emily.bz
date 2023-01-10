import openDB from "../db/open-db";
export default function addWord(language, localName, englishName){
	const db = openDB();
	db.prepare(`INSERT INTO words(languageId, localName, englishName) VALUES(:language, :localName, :englishName)`).run({language, localName, englishName});
	return 1;
}