import Head from "next/head";
import {Index} from "flexsearch";
import {useState} from "react";

import FavouriteQuizzes from "/components/favourite-quizzes";

import openDB from "/utils/db/open-db";
import checkSession from "/utils/users/check-session";
import getFavouriteQuizzes from "/utils/map-quiz/get-favourite-quizzes";

function getQuizzesByCategory(quizzes){
	let quizzesByCategory = {};
	for(let quiz of quizzes){
		if(!quizzesByCategory[quiz.category]) quizzesByCategory[quiz.category] = [];
		quizzesByCategory[quiz.category].push(quiz);
	}
	return quizzesByCategory;
}

function CountryContainer({quizzes, category, categoryInfo, frontPageOnly}){
	const linkMore = !quizzes.every(x => x.isFrontPage) && frontPageOnly;
	return (
		<section key={category} style={{borderRadius: 30, background: "rgb(0,0,0,0.1)", maxWidth: 290}}>
			<h2 style={{
				textAlign: "center",
				fontFamily: "TwemojiFlags, Manrope",
				background: "rgb(0,0,0,0.2)",
				borderRadius: "30px 30px 0px 0px",
				margin: 0
			}}>
				{categoryInfo.emoji} {categoryInfo.name}
			</h2>
			<ul>
				{quizzes.map(quiz => {
					if(quiz.isFrontPage || !frontPageOnly){
						return (<li key={quiz.alias}><a href={"/map-quiz/" + quiz.alias}>{quiz.altTitle}</a></li>)
					}
				})}
			</ul>
			{linkMore ? <p className="centered"><a href={`/map-quiz/${category}`}>more quizzes</a></p> : ""}
		</section>
	);
}

export default function MapQuizPage({quizzes, favouriteQuizzes, categoryInfo}){
	const [searchText, setSearchText] = useState("");
	const index = new Index({tokenize: "full"});
	quizzes.forEach(quiz => index.add(quiz.alias, categoryInfo[quiz.category].name + " " + quiz.altTitle));
	const searchResults = index.search(searchText);
	const displayedQuizzes = searchText ? quizzes.filter(x => searchResults.includes(x.alias)) : quizzes;
	const quizzesByCategory = getQuizzesByCategory(displayedQuizzes);

	return (
		<>
			<Head>
				<title>map quizzes</title>
			</Head>
			<h1>map quizzes</h1>
			<FavouriteQuizzes quizzes={favouriteQuizzes} includeButton={true} />
			<h2>highlighted quizzes</h2>
			search quizzes: <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
			<section 
				id="all-quizzes"
				style={{
					display: "grid",
					gridGap: "10px",
					gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
					gridAutoFlow: "dense",
				}}
			>
				{Object.keys(quizzesByCategory).map(category => 
					<CountryContainer
						quizzes={quizzesByCategory[category]}
						category={category}
						categoryInfo={categoryInfo[category]}
						key={category}
						frontPageOnly={!searchText}
					/>
				)}
			</section>
		</>
	);
}


export function getServerSideProps(context){
	let favourites;
	try{
		const sessionInfo = checkSession(context.req.cookies.sessionId);
		favourites = getFavouriteQuizzes(sessionInfo.user.id);
	}
	catch(e){
		favourites = [];
	}
	favourites = favourites.map(x => {x.url = `@${x.user.displayName}/${x.id}`; return x;});
	const db = openDB();
	const quizzes = db.prepare(`
		SELECT alias, altTitle, name, emoji, isCountry, isFrontPage, quizCategories.category
		FROM quizAliases INNER JOIN quizCategories ON quizAliases.category = quizCategories.category
		ORDER BY name ASC
	`).all();
	let categoryInfo = {};
	for(let quiz of quizzes){
		if(!categoryInfo[quiz.category]){
			categoryInfo[quiz.category] = {
				emoji: quiz.emoji,
				name: quiz.name,
				isCountry: quiz.isCountry
			}
		}
	}
	return {
		props: {
			quizzes,
			favouriteQuizzes: favourites,
			categoryInfo
		}
	}
}