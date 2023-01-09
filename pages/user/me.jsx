import checkSession from "/utils/db/check-session";
import getUserQuizzes from "/utils/db/get-user-quizzes";
import Button from "/components/button";
import QuizContainer from "/components/quiz-container";
import ErrorPage from "/components/error-page";

export default function Me(props){
	if(props.error){
		return (<ErrorPage errorMessage={props.errorMessage} />);
	}
	const quizzes = <><h2>your quizzes</h2><QuizContainer quizzes={props.quizzes} quizInfo={() => ""} /></>
	return (<>
		<h1>your profile</h1>
		<section id="user-info" className="centered">
			<p>you are logged in as <b>{props.message.user.displayName}</b></p>
			<p>member since: {new Date(props.message.user.memberSince).toLocaleDateString("en-GB")}</p>
			<p><Button onClick={() => window.location.replace("/user/logout")}>log out</Button></p>
		</section>
		{props.quizzes.length > 0 ? quizzes : ""}
	</>);
}

export function getServerSideProps(context){
	try{
		let sessionInfo = checkSession(context.req.cookies.sessionId);
		if(!sessionInfo.user.displayName){
			return {
				props: {
					error: true,
					message: "session expired"
				}
			}
		}
		let quizzes = getUserQuizzes(sessionInfo.user.displayName);
		quizzes = quizzes.map(x => {
			x.url = x.frontpageURL || `@${x.displayName}/${x.id}`;
			return x;
		});
		return {
			props: {
				error: false,
				message: sessionInfo,
				quizzes: quizzes
			}
		}
	}
	catch(e){
		return {
			props: {
				error: true,
				message: e
			}
		};
	}
}