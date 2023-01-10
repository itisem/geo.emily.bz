import openDB from "../db/open-db";

export default function getQuiz(user, id, useDisplayName = true){
	const db = openDB();
	const usedUser = useDisplayName ? user.toLowerCase() : user;
	const queryText = useDisplayName ?
		`SELECT * FROM quizzes WHERE id = ? AND user = (SELECT id FROM users WHERE LOWER(displayName) = ? LIMIT 1)` : 
		`SELECT * FROM quizzes WHERE id = ? AND user = ?`;
	const query = db.prepare(queryText);
	return query.get([id, usedUser]);
}