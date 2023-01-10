import openDB from "../db/open-db";
export default function isFavourited({creator, id, user}){
	const db = openDB();
	return !!db.prepare(`SELECT * FROM favouriteQuizzes WHERE creator = :creator AND id = :id AND user = :user`).get({
		creator,
		id,
		user
	});
}