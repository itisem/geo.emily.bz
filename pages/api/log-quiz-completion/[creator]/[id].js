import Database from "better-sqlite3";
import * as appRoot from "app-root-path";
import checkSession from "/utils/db/check-session";

export default function logPlay(req, res){
	const db = new Database(`${appRoot}/data/data.db`);
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