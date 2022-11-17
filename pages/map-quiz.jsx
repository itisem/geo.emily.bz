import Database from "better-sqlite3";
import * as appRoot from "app-root-path";
import {flag} from "country-emoji";
import Head from "next/head";

const redoTitle = (title, country) => {const r = title.replace(new RegExp(`^${country} `, "i"), ""); return r[0].toUpperCase()+r.slice(1);};

const emoji = country => {if(country=="Eswatini")return "🇸🇿"; return flag(country);}

function CountryContainer({quizzes, category}){
	return (
		<section key={category}>
			<h2 style={{textAlign: "center", fontFamily: "TwemojiFlags, Manrope"}}>{emoji(category)} {category}</h2>
			<ul>
				{quizzes.map(quiz => <li key={quiz.id}><a href={"/map-quiz/"+quiz.alias}>{quiz.frontpageTitle}</a></li>)}
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
		const db = new Database(`${appRoot}/data/geoguessr.db`);
		const quizzes = db.prepare(`
			SELECT alias, frontpageTitle, frontpageCategory
			FROM quizAliases
			WHERE frontpageCategory IS NOT NULL
			ORDER BY frontpageCategory ASC
		`).all();
		let quizzesByCategory = {};
		for(let quiz of quizzes){
			const category = quiz.frontpageCategory;
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