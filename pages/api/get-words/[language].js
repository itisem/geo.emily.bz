import openDB from "/utils/db/open-db";

export default function getLanguage(req, res){
	const db = openDB();
	const query = db.prepare(`
		SELECT * FROM words
		WHERE languageId = ?
		ORDER BY RANDOM()
		LIMIT 100
	`);
	const {language} = req.query;
	res.status(200).json(query.all(language));
}