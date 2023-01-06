import loginUser from "/utils/db/login";
import cookie from "cookie";

export default function login(req, res){
	if(req.method !== "POST"){
		res.status(405).json({error: true, message: "POST_REQUESTS_ONLY"});
		return;
	}
	const {username, password} = req.body;
	loginUser(username, password).then(data => {
		res.setHeader("Set-Cookie", cookie.serialize("sessionId", data.sessionId, {maxAge: (data.duration / 1000) - 1, path: "/"}));
		res.status(200).json({error: false, message: data});
		return;
	}).catch(e => {
		res.status(400).json({error: true, message: e})
	})
}