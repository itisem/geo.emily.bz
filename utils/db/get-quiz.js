import openDB from './open-db';
import splitFields from './split-fields';

export default function getQuiz(user, id, useDisplayName = true){
	const db = openDB();
	const usedUser = useDisplayName ? user.toLowerCase() : user;
	const queryText = useDisplayName ?
		`SELECT * FROM quizzes WHERE id = ? AND user = (SELECT id FROM users WHERE LOWER(displayName) = ? LIMIT 1)` : 
		`SELECT * FROM quizzes WHERE id = ? AND user = ?`;
	const query = db.prepare(queryText);
	return query.all([id, usedUser]).map(x => splitFields(x, ['displayValues', 'categoryId']))[0];
}