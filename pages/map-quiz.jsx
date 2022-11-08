import Database from "better-sqlite3";
import * as appRoot from "app-root-path";
import {flag} from "country-emoji";
import titleCase from "/utils/misc/title-case";
import Head from "next/head";

const redoTitle = (title, country) => {const r = title.replace(new RegExp(`^${country} `, "i"), ""); return r[0].toUpperCase()+r.slice(1);};

const emoji = country => {if(country=="eswatini")return "🇸🇿"; return flag(country);}

function CountryContainer({quizzes, country}){
	const allUpper = ["uae", "usa", "uk"];
	return (
		<section key={country}>
			<h2 style={{textAlign: "center"}}>{emoji(country)} {allUpper.includes(country) ? country.toUpperCase() : titleCase(country)}</h2>
			<ul>
				{quizzes.map(quiz => <li key={quiz.id}><a href={"/map-quiz/"+quiz.id}>{redoTitle(quiz.title, country)}</a></li>)}
			</ul>
		</section>
	);
}

export default function MapQuiz({quizzes}){
	return (
		<>
			<Head><title>Map quizzes</title></Head>
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
				{Object.keys(quizzes).map(country => <CountryContainer quizzes={quizzes[country]} country={country} key={country} />)}
			</main>
		</>
	)
}


export function getStaticProps(){
		const db = new Database(`${appRoot}/data/geoguessr.db`);
		const quizzes = db.prepare(`
			SELECT id, title
			FROM QUIZZES
			WHERE user = 'import'
			ORDER BY id ASC
		`).all();
		let quizzesByCountry = {};
		for(let quiz of quizzes){
			const country = quiz.id.split("/")[0];
			if(!quizzesByCountry[country]){
				quizzesByCountry[country] = [];
			}
			quizzesByCountry[country].push(quiz);
		}
		return {
			props: {
				quizzes: quizzesByCountry
			}
		}
}