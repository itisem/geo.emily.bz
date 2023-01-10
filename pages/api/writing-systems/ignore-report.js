import isAdmin from "/utils/db/is-admin";
import getWordReports from "/utils/writing-systems/get-reports";
import deleteReport from "/utils/writing-systems/delete-report";

export default function ignoreWordReport(req, res){
	const {language, localName, englishName} = req.query;
	if(!isAdmin(req.cookies.sessionId)){
		res.send(403).json({error: true, message: "no permissions"});
		return;
	}
	deleteReport(language, localName, englishName);
	res.json({error: false, reports: getWordReports()});
}