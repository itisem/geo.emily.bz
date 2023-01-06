export default function validateUsername(username, settings = {}){
	const reservedNames = ["system", "admin", "login", "logout", "edit"];
	const usernameCheck = /^[a-zA-Z0-9][a-zA-Z0-9\-]{1,18}[a-zA-Z0-9]$/;
	if(reservedNames.includes(username.toLowerCase()) && !settings.__testAllowReserved) return false;
	if(!username.match(usernameCheck)) return false;
	return true;
}