import openDB from "/utils/db/open-db";

export default function getLanguage(req, res){
	const db = openDB();
	const query = db.prepare(`
		SELECT * FROM languages
		WHERE id = ?
	`);
	const {language} = req.query;
	res.status(200).json({error: false, language: query.get(language))};
}