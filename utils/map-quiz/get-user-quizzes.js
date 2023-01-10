import openDB from "../db/open-db";

export default function getUserQuizzes(user){
	const db = openDB();
	return db.prepare(`
		SELECT quizzes.id, quizzes.title, users.displayName
		FROM quizzes LEFT JOIN users ON (quizzes.user = users.id)
		WHERE LOWER(users.displayName) = ?
		ORDER BY quizzes.title ASC
	`).all(user.toLowerCase());
}