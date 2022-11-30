import openDB from './open-db';

export default function getUserQuizzes(user){
	const db = openDB();
	const quizzes = db.prepare(`
		SELECT quizzes.id, quizzes.title, users.displayName
		FROM quizzes LEFT JOIN users ON quizzes.user = users.id 
		WHERE LOWER(displayName) = ?
	`).all([user.toLowerCase()]);
	const frontpageQuizzes = db.prepare(`
		SELECT quizAliases.id, quizAliases.alias, users.displayName
		FROM quizAliases LEFT JOIN users ON quizAliases.user = users.id
		WHERE 
			LOWER(displayName) = ?
			AND frontpageTitle IS NOT NULL
	`).all([user.toLowerCase()]);
	if(quizzes.length === 0){
		const usernameExists = !!db.prepare("SELECT * FROM users WHERE LOWER(displayName) = ?").get([user.toLowerCase()]);
		if(!usernameExists) throw "user does not exist";
	}
	const frontpageFilter = (id) => frontpageQuizzes.filter(x => x.id === id);
	let finalQuizzes = [];
	if(!quizzes){
		return [];
	}
	for(let quiz of quizzes){
		const frontpageDetails = frontpageFilter(quiz.id);
		if(frontpageDetails){
			finalQuizzes.push({
				id: quiz.id,
				title: quiz.title,
				frontpageURL: frontpageDetails[0].alias,
				user: quiz.displayName
			});
		}
		else{
			finalQuizzes.push({
				id: quiz.id,
				title: quiz.title,
				frontpageURL: undefined,
				user: quiz.displayName
			});
		}
	}
	return finalQuizzes;
}