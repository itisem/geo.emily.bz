import openDB from "../db/open-db";

export default function getReports(){
	const db = openDB();
	return db.prepare("SELECT * FROM wordReports").all();
}