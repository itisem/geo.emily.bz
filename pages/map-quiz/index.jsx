import Head from "next/head";
import {useState} from "react";

import FavouriteQuizzes from "/components/map-quiz/favourite-quizzes";
import SearchWrapper from "/components/search-wrapper";
import HighlightedQuizzes from "/components/map-quiz/highlighted-quizzes";

import openDB from "/utils/db/open-db";
import checkSession from "/utils/users/check-session";
import getFavouriteQuizzes from "/utils/map-quiz/get-favourite-quizzes";

export default function MapQuizPage({quizzes, favouriteQuizzes, categoryInfo}){
	quizzes.forEach(quiz => {quiz.id = quiz.alias; quiz.value = categoryInfo[quiz.category].name + " " + quiz.altTitle;});

	return (
		<>
			<Head>
				<title>map quizzes</title>
			</Head>
			<h1>map quizzes</h1>
			<FavouriteQuizzes quizzes={favouriteQuizzes} includeButton={true} />
			<SearchWrapper
				searchBarText="find quiz"
				sizeLimit="0"
				items={quizzes}
			>
				<HighlightedQuizzes categoryInfo={categoryInfo} />
			</SearchWrapper>
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