import Database from "better-sqlite3";
import * as appRoot from "app-root-path";
import Head from "next/head";

function CountryContainer({quizzes, category}){
	return (
		<section key={category}>
			<h2 style={{textAlign: "center", fontFamily: "TwemojiFlags, Manrope"}}>{quizzes[0].emoji} {category}</h2>
			<ul>
				{quizzes.map(quiz => <li key={quiz.alias}><a href={"/map-quiz/" + quiz.alias}>{quiz.altTitle}</a></li>)}
			</ul>
		</section>
	);
}

export default function MapQuiz({quizzes}){
	return (
		<>
			<Head>
				<title>Map quizzes</title>
			</Head>
			<h1>Map quizzes</h1>
			<main 
				id="quizzes"
				style={{
					display: "grid",
					gridGap: "0.25em",
					gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
					gridAutoFlow: "dense"
				}}
			>
				{Object.keys(quizzes).map(category => <CountryContainer quizzes={quizzes[category]} category={category} key={category} />)}
			</main>
		</>
	);
}


export function getStaticProps(){
	const db = new Database(`${appRoot}/data/data.db`);
	const quizzes = db.prepare(`
		SELECT alias, altTitle, name, emoji, isCountry
		FROM quizAliases INNER JOIN quizCategories ON quizAliases.category = quizCategories.category
		WHERE isFrontPage = 1
		ORDER BY name ASC
	`).all();
	let quizzesByCategory = {};
	for(let quiz of quizzes){
		const category = quiz.name;
		if(!quizzesByCategory[category]){
			quizzesByCategory[category] = [];
		}
		quizzesByCategory[category].push(quiz);
	}
	return {
		props: {
			quizzes: quizzesByCategory
		}
	}
}