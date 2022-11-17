import openDB from './open-db';
import getQuiz from './get-quiz';

export default function getOfficialQuiz(id){
	const db = openDB();
	const quiz = db.prepare(`SELECT * FROM quizAliases WHERE alias = ?`).get([id]);
	if(!quiz){
		return;
	}
	else{
		return getQuiz(quiz.user, quiz.id, false);
	}
}