import Database from "better-sqlite3";
import * as appRoot from "app-root-path";

export default function getLanguage(req, res){
	const db = new Database(`${appRoot}/data/data.db`);
	const query = db.prepare(`
		SELECT * FROM languages
		WHERE id = ?
	`);
	const {language} = req.query;
	res.status(200).json(query.all(language)[0]);
}