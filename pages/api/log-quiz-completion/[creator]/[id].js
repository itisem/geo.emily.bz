import openDB from "/utils/db/open-db";
import checkSession from "/utils/users/check-session";

export default function logPlay(req, res){
	const db = openDB();
	let userId;
	try{
		const sessionInfo = checkSession(req.cookies.sessionId);
		userId = sessionInfo.user.id;
	}
	catch{
		userId = "";
	}
	const {id, creator} = req.query;
	db.prepare(`INSERT INTO quizPlays VALUES (:id, :creator, :player, :playedAt)`).run({
		id,
		creator,
		player: userId,
		playedAt: new Date().getTime()
	});
	res.send(1);
}