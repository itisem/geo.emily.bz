import deleteReport from "/utils/writing-systems/delete-report";
import getWordReports from "/utils/writing-systems/get-reports";
import deleteWord from "/utils/writing-systems/delete-word";
import addWord from "/utils/writing-systems/add-word";
import isAdmin from "/utils/users/is-admin";

export default function fixWord(req, res){
	let {language, localName, englishName, newLocalName, newEnglishName} = req.body;
	if(!isAdmin(req.cookies.sessionId)){
		res.send(403).json({error: true, message: "no permissions"});
		return;
	}
	if(!(language && localName && englishName)){
		res.send(400).json({error: true, message: "incorrect data"});
		return;
	}
	switch(req.method){
		case "DELETE":
			deleteWord(language, localName, englishName);
			deleteReport(language, localName, englishName);
			break;
		case "PATCH":
			if(!newEnglishName || !newLocalName){
				res.json({error: false, reports: getWordReports()});
				return false;
			}
			deleteWord(language, localName, englishName);
			deleteReport(language, localName, englishName);
			addWord(language, newLocalName, newEnglishName);
			break;
	}
	res.json({error: false, reports: getWordReports()});
}