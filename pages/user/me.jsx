import checkSession from "/utils/db/check-session";
import ErrorPage from "/components/error-page";

export default function Me(props){
	if(props.error){
		return (<ErrorPage errorMessage={props.errorMessage} />);
	}
	return (<>
		<h1>your profile</h1>
		<section id="user-info" className="centered">
			<p>you are logged in as <b>{props.message.user.displayName}</b></p>
			<p>member since: {new Date(props.message.user.memberSince).toLocaleDateString("en-GB")}</p> 
		</section>
	</>);
}

export function getServerSideProps(context){
	try{
		let sessionInfo = checkSession(context.req.cookies.sessionId);
		return {
			props: {
				error: false,
				message: sessionInfo
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