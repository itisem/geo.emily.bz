import openDB from './open-db';

export default function getQuizPlayers(user, quiz = undefined){
	const db = openDB();
	let results = {};
	if(quiz){
		const results = db.prepare(`
			SELECT COUNT(DISTINCT player) AS players, COUNT(*) AS plays
			FROM quizPlays
			WHERE creator=? AND id=?
			`).get([user, quiz]);
	}
	else{
		const results = db.prepare(`
			SELECT COUNT(DISTINCT player) AS players, COUNT(*) AS plays, id
			FROM quizPlays
			WHERE creator=?
			GROUP BY id
		`).all(user);
		let final = {};
		for(let result of results){
			final[result.id] = {players: result.players, plays: result.plays};
		}
		return final;
	}
}