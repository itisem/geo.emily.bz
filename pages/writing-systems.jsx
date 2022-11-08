import Head from "next/head";
import SelectorButtonGroup from "/components/selector-button-group";
import Database from "better-sqlite3";
import * as appRoot from "app-root-path";
import {useEffect, useState, useCallback} from 'react';
import WritingGame from '/browser-modules/writing-game';

const game = new WritingGame(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);

export default function WritingSystems( {languages}){
	const languageButtons = languages.map( l => {
		return {
			"id": `language-selector-${l.id}`,
			"text": l.englishName,
			"value": l.id,
		};
	});

	let [question, setQuestion] = useState("");
	let [answerText, setAnswerText] = useState("");
	let [correctness, setCorrectness] = useState("correct");

	const guess = useCallback( () => {
		const guess=document.getElementById("guess").value;
		if(game.validate(guess)){
			setCorrectness("correct");
			setAnswerText(`correct! ${game.question} is ${game.answer}`);
			nextWord();
		}
		else{
			setCorrectness("incorrect");
			setAnswerText(`incorrect! ${game.question} is not ${guess}`);
		}
	});
	const giveUp = useCallback( () => {
		setCorrectness("incorrect");
		setAnswerText(`unlucky! ${game.question} is ${game.answer}`);
		nextWord();
	});
	const nextWord = useCallback( async () => {
		document.getElementById("guess").value = "";
		setQuestion(await game.nextWord());
	});
	const selectLanguage = useCallback( async(language) => {
		localStorage.setItem("selectedLanguage", language);
		await game.setLanguage(language);
		nextWord(game);
	});

	useEffect( () => {
		let selectedLanguage = localStorage.getItem("selectedLanguage");
		selectedLanguage = selectedLanguage === null ? "ru" : selectedLanguage;
		selectLanguage(selectedLanguage, game);
		document.getElementById(`language-selector-${selectedLanguage}`).checked = true;
		const selectorButtons = document.getElementsByName("language-selector");
		for(let button of selectorButtons){
			button.onchange = () => selectLanguage(button.value);
		}
	}, []);

	return (
		<>
			<Head>
				<title>geoguessr language learning tools</title>
				<meta charSet="utf-8" />
				<link rel="stylesheet" href="/styles/writing-systems.css"/>
			</Head>
			<div id="language-selector" className="centered">language: 
					<SelectorButtonGroup buttons={languageButtons} name="language-selector" />
			</div>
			<div id="question" className="centered">
				<span id="current-question">{question}</span>
				<button id="audio-button" onClick={()=>game.listen()}>🔊</button>
			</div>
			<div id="answer" className={"centered " + correctness}>
				{answerText}
			</div>
			<div id="guessOrGiveUp" className="centered">
				<input type="text" id="guess" onKeyUp ={(e) => {if(e.keyCode == 13)guess();}}/>
				<button id="guessButton" onClick={guess}>guess</button>
				<button id="giveUp" onClick={giveUp}>give up</button>
			</div>
			<div id="faq">
				<h2>faq & notes</h2>
				<p>all data comes from wikidata. this means two things:<br/>
				a) transliterations may occasionally be different than the ones that google maps provides.
				in my experience, this mainly occurs for russian, but it may happen in other languages as well.<br/>
				b) transliterations can occasionally be completely wrong altogether, if someone has made a
				disruptive edit when data was collected.</p>
				<p>i am planning to add more languages soon, but each one requires some adjustments, and therefore
				i will add them as they come.</p>
				<details>
				<summary>changelog:</summary>
					<ul>
						<li>2022-10-18: all data is now stored on my server. this improves loading times considerably, and fixes a bug where the same few questions would repeat</li>
						<li>2021-12-31: initial version</li>
					</ul>
				</details>
			</div>
		</>
	);
}

export function getStaticProps(){
	const db = new Database(`${appRoot}/data/geoguessr.db`);
	const languages = db.prepare(`
		SELECT * FROM languages
	`).all();
	return {
		props: {
			languages: languages
		}
	};
}