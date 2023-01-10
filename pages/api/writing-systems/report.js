import openDB from "/utils/db/open-db";
import checkSession from "/utils/db/check-session";

export default function reportWord(req, res){
	const {language, localName, englishName, notes} = req.query;
	const db = openDB();
	let reportedBy;
	try{
		const sessionInfo = checkSession(req.cookies.sessionId);
		reportedBy = sessionInfo.user.displayName;
	}
	catch{
		reportedBy = "";
	}
	db.prepare(`
		INSERT INTO wordReports(language, localName, englishName, notes, reportedBy)
		VALUES(:language, :localName, :englishName, :notes, :reportedBy)`).run({
			language, localName, englishName, notes, reportedBy
	});
	res.send(1);
}