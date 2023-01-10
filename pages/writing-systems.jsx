import Head from "next/head";
import Button from "/components/button";
import SelectorButtonGroup from "/components/selector-button-group";
import openDB from "/utils/db/open-db";
import {useEffect, useState, useCallback} from 'react';
import WritingGame from '/utils/writing-systems/game';

const game = new WritingGame(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);

export default function WritingSystems({languages}){
	const languageButtons = languages.map(l => {
		return {
			"id": `language-selector-${l.id}`,
			"text": l.englishName,
			"value": l.id,
		};
	});

	let [reportInfo, setReportInfo] = useState({language: "ru", englishName: "", localName: ""});
	let [question, setQuestion] = useState("");
	let [answerText, setAnswerText] = useState("");
	let [correctness, setCorrectness] = useState(true);
	let [currentGuess, setCurrentGuess] = useState("");
	let [hasTTS, setHasTTS] = useState(true);
	let [isReported, setIsReported] = useState(false);
	let [freshWords, setFreshWords] = useState(true);

	const report = () => {
		setIsReported(true);
		fetch("/api/writing-systems/report?" + new URLSearchParams(reportInfo));
	}

	const reportButton = isReported ? <b>question reported</b> : <a onClick={report} style={{cursor: "pointer"}}>report incorrect question</a>;

	const guess = useCallback(() => {
		if(game.validate(currentGuess)){
			setCorrectness(true);
			setAnswerText(`correct! ${game.question} is ${game.answer}`);
			nextWord();
		}
		else{
			setCorrectness(false);
			setAnswerText(`incorrect! ${game.question} is not ${currentGuess}`);
		}
	});
	const giveUp = useCallback(() => {
		setCorrectness(false);
		setAnswerText(`unlucky! ${game.question} is ${game.answer}`);
		nextWord();
	});
	const nextWord = useCallback(async (isFirst = false) => {
		setCurrentGuess("");
		if(!isFirst){
			setFreshWords(false);
			setReportInfo({
				language: game.language,
				englishName: game.answer,
				localName: game.question
			})
		}
		setIsReported(false);
		setQuestion(await game.nextWord());
	});
	const selectLanguage = useCallback(async(language) => {
		localStorage.setItem("selectedLanguage", language);
		game.setLanguage(language).then(() =>{
			setHasTTS(game.hasTTS);
			nextWord(true);
		})
	});

	useEffect(() => {
		let selectedLanguage = localStorage.getItem("selectedLanguage");
		selectedLanguage = selectedLanguage || "ru"; // default to russian because it's what most people want
		selectLanguage(selectedLanguage, game);
		document.getElementById(`language-selector-${selectedLanguage}`).checked = true;
	}, []);

	return (
		<>
			<Head>
				<title>geoguessr language learning tools</title>
				<meta charSet="utf-8" />
			</Head>
			<menu id="language-selector" className="centered">
					<SelectorButtonGroup buttons={languageButtons} name="language-selector" onChange={e => selectLanguage(e.target.value)} />
			</menu>
			<section id="question" className="centered">
				<span
					id="current-question"
					style={{
						margin: "10px 0 10px 0",
						fontSize: "2em",
						fontWeight: "bold"
					}}
				>
					{question}
				</span>
				{hasTTS ? 
					<Button
						id="audio-button"
						onClick={() => game.listen()}
						style={{
							height: "3em",
							margin: "auto 10px"
						}}
					>
						🔊
					</Button>
					:
					""
				}
			</section>
			<section
				id="answer"
				style={{
					textAlign: "center",
					color: correctness ? "var(--success)" : "var(--error)"
				}}
			>
				{answerText} <br />
				{!freshWords ? reportButton : ""}
			</section>
			<div id="guessOrGiveUp" className="centered">
				<input
					type="text"
					id="guess"
					onKeyUp={(e) => {if(e.keyCode == 13)guess();}}
					onChange={(e) => setCurrentGuess(e.target.value)}
					value={currentGuess}
				/>
				<Button id="guessButton" onClick={guess}>guess</Button>
				<Button id="giveUp" onClick={giveUp}>give up</Button>
			</div>
			<div
				id="faq"
				style={{
					maxWidth: 800,
					margin: "0 auto",
					textAlign: "justify"
				}}
			>
				<h2>faq & notes</h2>
				<p>all data comes from wikidata. this means two things:<br/>
				a) transliterations may occasionally be different than the ones that google maps provides.
				in my experience, this mainly occurs for russian, but it may happen in other languages as well.<br/>
				b) transliterations can occasionally be completely wrong altogether, if someone has made a
				disruptive edit when data was collected.</p>
				<p>i am planning to add more languages soon, but each one requires some adjustments, and therefore
				i will add them as they come.</p>
				<details>
				<summary>changelog (click to expand):</summary>
					<ul>
						<li>2023-01-10: added khmer</li>
						<li>2022-10-18: all data is now stored on my server. this improves loading times considerably, and fixes a bug where the same few questions would repeat</li>
						<li>2021-12-31: initial version</li>
					</ul>
				</details>
			</div>
		</>
	);
}

export function getStaticProps(){
	const db = openDB();
	const languages = db.prepare(`
		SELECT * FROM languages
	`).all().sort((a, b) => a.englishName.localeCompare(b.englishName));
	return {
		props: {
			languages: languages
		}
	};
}