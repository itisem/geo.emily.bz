import openDB from "/utils/db/open-db";
import getFavourites from "/utils/map-quiz/get-favourite-quizzes";
import checkSession from "/utils/users/check-session";

export default function modifyFavourite(req, res){
	const db = openDB();
	let sessionInfo;
	try{
		sessionInfo = checkSession(req.cookies.sessionId);
	}
	catch{
		res.status(400).json([]);
		return;
	}
	const {id, creator} = req.query;
	const user = sessionInfo.user.id;
	const addedAt = new Date().getTime();
	switch(req.method){
		case "PUT":
			db.prepare(`REPLACE INTO favouriteQuizzes (id, creator, user, addedAt) VALUES (:id, :creator, :user, :addedAt)`).run({id, creator, user, addedAt});
			break;
		case "DELETE":
			db.prepare(`DELETE FROM favouriteQuizzes WHERE id = :id AND creator = :creator AND user = :user`).run({id, creator, user});
			break;
	}
	res.json(getFavourites(user));
}