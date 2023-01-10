import checkSession from "./check-session";

export default function isAdmin(sessionId){
	try{
		const session = checkSession(sessionId);
		return session.user.permissions.includes("admin");
	}
	catch{
		return false;
	}
}