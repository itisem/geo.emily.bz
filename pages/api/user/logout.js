import cookie from "cookie";
import logoutUser from "/utils/users/logout";
export default function logout(req, res){
	logoutUser(req.cookies.sessionId);
	res.setHeader("Set-Cookie", cookie.serialize("sessionId", "", {maxAge: - 1, path: "/"}));
	res.redirect("/");
}