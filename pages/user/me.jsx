import checkSession from "/utils/users/check-session";
import getUserQuizzes from "/utils/map-quiz/get-user-quizzes";
import getFavouriteQuizzes from "/utils/map-quiz/get-favourite-quizzes";
import getQuizPlayers from "/utils/map-quiz/get-quiz-players";
import Button from "/components/button";
import QuizContainer from "/components/quiz-container";
import FavouriteQuizzes from "/components/favourite-quizzes";
import ErrorPage from "/components/error-page";

export default function Me(props){
	if(props.error){
		return (<ErrorPage errorMessage={props.errorMessage} />);
	}
	const playInfo = id => {if(!props.players[id]) return {players: 0, plays: 0}; return props.players[id];}
	const quizzes = <>
		<h2>your quizzes</h2>
		<QuizContainer
			quizzes={props.quizzes}
			quizInfo={quiz => (<i>{playInfo(quiz.id).players} players, {playInfo(quiz.id).plays} plays</i>)}
		/>
	</>;
	return (<>
		<h1>your profile</h1>
		<section id="user-info" className="centered">
			<p>you are logged in as <b>{props.message.user.displayName}</b></p>
			<p>member since: {new Date(props.message.user.memberSince).toLocaleDateString("en-GB")}</p>
			<p><Button onClick={() => window.location.replace("/user/logout")}>log out</Button></p>
		</section>
		{props.quizzes.length > 0 ? quizzes : ""}
		<FavouriteQuizzes quizzes={props.favourites} />
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
		const favourites = getFavouriteQuizzes(sessionInfo.user.id);
		const players = getQuizPlayers(sessionInfo.user.id);
		return {
			props: {
				error: false,
				message: sessionInfo,
				quizzes,
				favourites,
				players
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