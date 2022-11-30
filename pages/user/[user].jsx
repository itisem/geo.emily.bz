import getUserQuizzes from "/utils/db/get-user-quizzes";
import Head from "next/head";

export default function CategoryPage(props){
	const quizClass = x => x.frontpageURL ? "highlighted" : "normal";
	const quizURL = x => x.frontpageURL ? x.frontpageURL : `@${x.user}/${x.id}`;
	switch(props.pageType){
		case "error":
			return (
				<>
					<Head>
						<title>user not found</title>
					</Head>
					<h1>error: {props.errorMessage}</h1>
					<div className="centered"><a href="/">return to home</a></div>
				</>
			);
		case "user":
			const quizList = props.quizzes.map(x => <section key={x.id} className={quizClass(x)}><a href={quizURL(x)}>{x.title}</a></section>);
			const quizItem = props.quizzes.length > 0 ? <>{quizList}</> : <p className='centered'>This user has not made any quizzes yet.</p>;
			return (
				<>
					<Head>
						<title>Quizzes by {props.user}</title>
					</Head>
					<h1>Quizzes by {props.user}</h1>
					<main 
						style={{
							display: "grid",
							gridGap: "0.5em",
							gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
							gridAutoFlow: "dense"
						}}
					>
						{quizItem}
					</main>
				</>
			)
	}
}

export async function getStaticPaths(){
		return {
				paths: [],
				fallback: 'blocking'
		};
}

export function getStaticProps({params}){
	const user = params.user[0] === "@" ? params.user.slice(1) : params.user;
	let details;
	try{
		details = getUserQuizzes(pageParam);
	}
	catch(e){
		return {props: {pageType: "error", errorMessage: e}};
	}
	details.sort((a, b) => a.title.localeCompare(b.title));
	return {
		props: {
			pageType: "user",
			quizzes: details,
			category: pageParam
		}
	}
}