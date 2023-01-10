import openDB from "../db/open-db";

export default function checkSession(sessionId, refreshSession = true){
	if(!sessionId) throw "no session";
	const db = openDB();
	let session = db.prepare(`SELECT * FROM sessions INNER JOIN users ON sessions.userId = users.id WHERE sessionId = ?`).get(sessionId);
	if(!session) throw "session not found";
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
			permissions: session.permissions.split("\x1d"),
			memberSince: session.memberSince
		},
		expiry: session.expiry
	};
}