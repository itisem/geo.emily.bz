import openDB from "./open-db";
export default function logout(sessionId){
	if(!sessionId) sessionId="";
	const db = openDB();
	db.prepare(`DELETE FROM sessions WHERE sessionId = ?`).run(sessionId);
	return true;
}