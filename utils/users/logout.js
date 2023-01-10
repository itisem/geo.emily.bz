import openDB from "../db/open-db";
export default function logout(sessionId){
	if(!sessionId) return;
	const db = openDB();
	db.prepare(`DELETE FROM sessions WHERE sessionId = ?`).run(sessionId);
	return true;
}