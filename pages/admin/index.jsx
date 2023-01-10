import isAdmin from "/utils/users/is-admin";
import ErrorPage from "/components/error-page";
import Head from "next/head";

export default function AdminHome(props){
	if(props.error){
		return <ErrorPage errorMessage={props.errorMessage} />;
	}
	return (
		<>
			<Head>
				<title>admin pages</title>
			</Head>
			<h1>admin pages</h1>
			<ul style={{textAlign: "center"}}>
				<li><a href="/admin/writing-systems">writing systems quiz</a></li>
			</ul>
		</>
	);
}

export function getServerSideProps(context){
	if(!isAdmin(context.req.cookies.sessionId)){
		return {
			props: {
				error: true,
				errorMessage: "you need to be an admin to view this page"
			}
		}
	}
	return {
		props: {
			error: false
		}
	}
}