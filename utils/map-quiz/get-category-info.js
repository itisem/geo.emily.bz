import openDB from "../db/open-db";

export default function getCategory(category){
	const db = openDB();
	return db.prepare(`SELECT * FROM quizCategories WHERE category = ?`).get(category);
}