import openDB from "./open-db";

export default function checkSession(sessionId, refreshSession = true){
	const db = openDB();
	if(!sessionId) throw "NO_SESSION";
	let session = db.prepare(`SELECT * FROM sessions INNER JOIN users ON sessions.userId = users.id WHERE sessionId = ?`).get(sessionId);
	if(!session) throw "SESSION_NOT_FOUND";
	if(session.expiry < Date.now()){
		db.prepare(`DELETE FROM sessions WHERE sessionId = ?`).run(sessionId);
		throw "SESSION_EXPIRED";
	}
	if(refreshSession){
		const sessionDuration = +process.env.SESSION_DURATION || 1000*60*60*24*14;
		session.expiry = Date.now() + sessionDuration;
		db.prepare(`UPDATE sessions SET expiry = :expiry WHERE sessionId = :sessionId`).run({sessionId: sessionId, expiry: session.expiry});
	}
	return {
		user: {
			id: session.id,
			displayName: session.displayName,
			permissions: session.permissions
		},
		expiry: session.expiry
	};
}