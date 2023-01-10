import openDB from "../db/open-db";

export default function deleteWord(language, localName, englishName){
	const db = openDB();
	db.prepare(`
		DELETE FROM words
		WHERE languageId=?
		AND localName=?
		AND englishName=?`).run([
			language, localName, englishName
	]);
	return true;
}