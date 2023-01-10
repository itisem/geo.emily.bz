import openDB from "../db/open-db";

export default function deleteWordReport(language, localName, englishName){
	const db = openDB();
	db.prepare(`
		DELETE FROM wordReports
		WHERE language = :language AND localName = :localName AND englishName = :englishName`).run({
			language, localName, englishName
	});
	return 1;
}