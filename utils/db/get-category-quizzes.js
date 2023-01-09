import openDB from './open-db';

export default function getCategoryQuizzes(category){
	const db = openDB();
	return db.prepare(`
		SELECT quizAliases.id, quizAliases.alias, quizAliases.altTitle, users.displayName
		FROM quizAliases LEFT JOIN users ON quizAliases.user = users.id
		WHERE category = ?
		ORDER BY quizAliases.altTitle ASC
	`).all(category);
}