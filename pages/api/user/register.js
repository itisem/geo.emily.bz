import createAccount from "/utils/db/create-account";
import login from "/utils/db/login";
import cookie from "cookie";
export default function register(req, res){
	if(req.method !== "POST"){
		res.status(405).json({error: true, message: "POST requests only"});
		return;
	}
	const {username, password} = req.body;
	createAccount(username, password).then(
		x => login(username, password).then(
			data => {
				res.setHeader("Set-Cookie", cookie.serialize("sessionId", data.sessionId, {maxAge: (data.duration / 1000) - 1, path: "/"}));
				res.status(200).json({error: false, message: data});
			}
		).catch(e => res.status(400).json({error: true, message: e}))
	).catch(e => res.status(400).json({error: true, message: e}))
}