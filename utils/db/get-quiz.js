import relativePathDB from './relative-path-db';
import splitFields from './split-fields';

export default function getQuiz(user, id){
	const db = relativePathDB("/data/geoguessr.db");
	const query = db.prepare(`SELECT * FROM quizzes WHERE id = ? AND user = ?`);
	return query.all([id, user]).map(x => splitFields(x, ['displayValues', 'categoryId']))[0];
}