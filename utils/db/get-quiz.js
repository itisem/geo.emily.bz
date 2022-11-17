import openDB from './open-db';
import splitFields from './split-fields';

export default function getQuiz(user, id, useDisplayName = true){
	const db = openDB();
	const queryText = useDisplayName ?
		`SELECT * FROM quizzes LEFT JOIN users ON quizzes.user = users.id WHERE quizzes.id = ? AND displayName = ?` : 
		`SELECT * FROM quizzes WHERE id = ? AND user = ?`;
	const query = db.prepare(queryText);
	return query.all([id, user]).map(x => splitFields(x, ['displayValues', 'categoryId']))[0];
}