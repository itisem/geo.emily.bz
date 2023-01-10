import checkSession from "/utils/users/check-session";

import getQuiz from "/utils/map-quiz/get-quiz";
import getOfficialQuiz from "/utils/map-quiz/get-official-quiz";
import getGeoJSONFromCategory from "/utils/map-quiz/get-geojson-from-category";
import MapQuiz from "/utils/map-quiz/game";
import quizIsFavourited from "/utils/map-quiz/is-favourited";

import getViewStateFromBounds from "/utils/maps/get-viewstate-from-bounds";
import bboxFromMany from "/utils/maps/bbox-from-many";

import MapTiles from "/components/map-tiles";
import ErrorPage from "/components/error-page";
import SelectorButtonGroup from "/components/selector-button-group";
import Button from "/components/button";

import RightIcons from "/components/map-quiz/right-icons";
import GameOver from "/components/map-quiz/game-over";
import TopBar from "/components/map-quiz/top-bar";
import QuizProgress from "/components/map-quiz/quiz-progress";

import * as crypto from "crypto";
import prettyMs from "pretty-ms";

import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {PostProcessEffect, MapView} from '@deck.gl/core';
import {triangleBlur} from '@luma.gl/shadertools';

import {useState, useEffect, useCallback, useMemo} from 'react';
import Head from "next/head";

const mapButtons = (defaultChecked) => {
	let defaultMap = "gm";
	if(["noMap", "gm", "gmNoLabels", "osm"].includes(defaultMap)) defaultMap = defaultChecked;
	return [
		{
			text: "no map",
			value: "noMap",
			defaultChecked: defaultMap === "noMap"
		},
		{
			text: "google maps",
			value: "gm",
			defaultChecked: defaultMap === "gm"
		},
		{
			text: "no labels",
			value: "gmNoLabels",
			defaultChecked: defaultMap === "gmNoLabels"
		},
		{
			text: "openstreetmap",
			value: "osm",
			defaultChecked: defaultMap === "osm"
		}
	];
}

const correctnessStyles = {
	wrong: [139, 0, 0],
	correct: [0, 139, 0],
	unselected: [70, 12, 104],
	force: [255, 255, 0],
	roundWrong: [139, 64, 0],
	hovering: [33, 8, 73]
};

export default function MapQuizPage(props){
	if(props.error){
		return (<ErrorPage errorMessage={props.errorMessage} />)
	}
	const totalQuestions = props.geoJSONs.length;

	const [viewState, setViewState] = useState(getViewStateFromBounds(props.bbox, 1920, 1080)); //avoids hydration errors since window.innerWidth only works in the browser
	const quiz = useMemo(() => new MapQuiz(props), []);

	const [mapType, setMapType] = useState(props.defaultMap);
	const [visibleMenu, setVisibleMenu] = useState("");
	const [forceClick, setForceClick] = useState(true);
	const [displayBorders, setDisplayBorders] = useState(true);
	const [hardMode, setHardMode] = useState(false);
	const [maxTries, setMaxTries] = useState(1);
	const [hovering, setHovering] = useState("");
	const [roundWrong, setRoundWrong] = useState([]);
	const [startTime, setStartTime] = useState(0);
	const [timeDiff, setTimeDiff] = useState(0);
	const [currentQuestion, setCurrentQuestion] = useState(quiz.currentQuestionHTML);

	const changeForceClick = (e) => setForceClick(e.target.checked);
	const changeTries = (e) => setMaxTries(e.target.value);
	const changeDisplayBorders = (e) => setDisplayBorders(e.target.checked);
	const changeHardMode = (e) => setHardMode(e.target.checked);

	const checkAnswer = useCallback((jsonKey) => {
		if(quiz.questions.length === 0) return;
		const isCorrect = quiz.checkAnswer(jsonKey);
		if(roundWrong.length < maxTries && (quiz.correctness[jsonKey] === 0 || isCorrect || hardMode)){
			quiz.setCorrectness(isCorrect);
			if(!isCorrect){
				setRoundWrong([...roundWrong, jsonKey]);
			}
		}
		if(isCorrect || !forceClick){
			setRoundWrong([]);
			setCurrentQuestion(quiz.nextQuestion());
		}
		if(quiz.questions.length == 0){
			setTimeDiff(new Date().getTime() - startTime);
			setVisibleMenu("game-over");
			fetch(`/api/log-quiz-completion/${props.creatorId}/${props.quizId}`);
		}
	}, [forceClick, currentQuestion, roundWrong])

	const skipQuestion = () => {
		if(roundWrong.length == 0) setCurrentQuestion(quiz.skipQuestion());
		else setCurrentQuestion(quiz.nextQuestion());
		setRoundWrong([]);
	}

	const prevQuestion = () => {
		setCurrentQuestion(quiz.prevQuestion(roundWrong.length !== 0));
		setRoundWrong([]);
	}

	const restartQuiz = () => {
		if(visibleMenu){
			setVisibleMenu("");
		}
		setRoundWrong([]);
		quiz.randomiseQuestions();
		setCurrentQuestion(quiz.currentQuestionHTML);
		setStartTime(new Date().getTime());
	}

	const getColour = (key) => {
		if(key === quiz.currentQuestionId){
			if(roundWrong.length < maxTries) return correctnessStyles.unselected;
			return correctnessStyles.force;
		}
		if(hardMode) return correctnessStyles.unselected;
		if(roundWrong.includes(key)) return correctnessStyles.roundWrong;
		switch(quiz.correctness[key]){
			case -1: return correctnessStyles.wrong;
			case 0: return correctnessStyles.unselected;
			case 1: return correctnessStyles.correct;
		}
	}

	const questionLayer = new GeoJsonLayer({
		id: "questions",
		data: props.geoJSONs,
		getFillColor: (x => [...getColour(x.properties.key), 100]),
		stroked: displayBorders,
		getLineColor: (x => [...getColour(x.properties.key), displayBorders ? 255 : 0]),
		getLineWidth: 2,
		lineWidthUnits: "pixels",
		pickable: true,
		updateTriggers: {
			getFillColor: [roundWrong, currentQuestion, hardMode],
			getLineColor: [roundWrong, currentQuestion, hardMode, displayBorders]
		},
		onClick: (e) => checkAnswer(e.object.properties.key)
	});

	const [hoveringLayer, setHoveringLayer] = useState(null);

	const refreshHovering = () => displayBorders && visibleMenu !== "game-over" ?
		setHoveringLayer(new GeoJsonLayer({
			id: "hovering",
			data: props.geoJSONs.filter(x => x.properties.key === hovering),
			getFillColor: [...correctnessStyles.hovering, 100],
			stroked: displayBorders,
			getLineColor: [...correctnessStyles.hovering, 255],
			getLineWidth: 2,
			lineWidthUnits: "pixels",
			pickable: false
		})) :
		setHoveringLayer([]);

	useEffect(() => refreshHovering(), [hovering]);

	useEffect(() => {
		quiz.randomiseQuestions(); // moved here to avoid hydration errors
		setCurrentQuestion(quiz.currentQuestionHTML);
		setViewState(getViewStateFromBounds(props.bbox, window.innerWidth, window.innerHeight - 40));
		setStartTime(new Date().getTime());
	}, []);

	return (
		<>
			<Head><title>{props.title} map quiz</title></Head>
			<DeckGL
				controller={visibleMenu !== "game-over"}
				initialViewState={viewState}
				views={new MapView({repeat:true})}
				layers={[MapTiles(mapType), questionLayer, hoveringLayer]}
				effects={visibleMenu === "game-over" ? [new PostProcessEffect(triangleBlur,{radius: 5})] : []}
				repeat={true}
				onHover={({object}) => {
					if(!object){if(hovering) setHovering("");}
					else{if(object.properties.key !== hovering) setHovering(object.properties.key);}
				}}
				getCursor={({isDragging}) => isDragging ? "grabbing" : (hovering ? "pointer" : "default")}
				style={{
					position: "absolute",
					width: "100%",
					height: "calc(100vh - 40px)",
					top: "40px",
					margin: "0 auto",
					background: "#eeeeee"
				}}
			/>

			<TopBar
				visibility={visibleMenu !== "game-over"}
				controls={{
					prev: prevQuestion,
					next: skipQuestion,
					restart: restartQuiz
				}}
				question={{
					html: currentQuestion,
					imageQuestion: quiz.isImageQuestion
				}}
			/>

			<QuizProgress 
				total={totalQuestions}
				current={totalQuestions - quiz.questionOrder.length}
			/>

			<RightIcons
				isLoggedIn={props.isLoggedIn}
				quiz={{
					isFavourited: props.isFavourited,
					id: props.quizId,
					creator: props.creatorId
				}}
				onClick={
					() => {
						if(visibleMenu !== "settings") setVisibleMenu("settings");
						else setVisibleMenu("");
					}
				}
				visibility={visibleMenu !== "game-over"}
			/>

			<div
				id="settings"
				style={{
					position: "absolute",
					right: "10px",
					top: "110px",
					textAlign: "right",
					zIndex: "2",
					background: "var(--bglight)",
					borderRadius: "10px",
					padding: "10px",
					visibility: visibleMenu === "settings" ? "visible" : "hidden",
					padding: 0,
					margin: 0,
					padding: "5px",
					paddingTop: "8px",
					fontFamily: "Manrope",
					maxWidth: "400px"
				}}
			>
				<SelectorButtonGroup buttons={mapButtons(props.defaultMap)} onChange={e => setMapType(e.target.value)} name="select-map" /> <br />
				<input type="checkbox" id="force-click" onChange={changeForceClick} checked={forceClick} />
				<label htmlFor="force-click">force click on correct answer</label>
				<input type="checkbox" id="display-borders" onChange={changeDisplayBorders} checked={displayBorders} />
				<label htmlFor="display-borders">show borders</label><br />
				<input type="checkbox" id="hard-mode" onChange={changeHardMode} checked={hardMode} />
				<label htmlFor="hard-mode">hard mode</label><br />
				<label htmlFor="max-tries">maximum tries: </label>
				<input type="number" value={maxTries} size="3" min="0" onChange={changeTries} /><br />
			</div>

			<GameOver
				visibility={visibleMenu === "game-over"}
				onClick={restartQuiz}
				stats={{
					correct: quiz.totalCorrect,
					total: totalQuestions,
					time: prettyMs(timeDiff, {verbose: true, secondsDecimalDigits: 0})
				}}
			/>
		</>
	);
}

export function getServerSideProps(context){
	const params = context.params;
	let isFavourited = false;
	let isLoggedIn;
	let loggedInAs = "";
	try{
		const sessionInfo = checkSession(context.req.cookies.sessionId);
		loggedInAs = sessionInfo.user.id;
		isLoggedIn = !!sessionInfo.user.id;
	}
	catch{
		isLoggedIn = false;
	}

	let quizDetails;
	if(params.id[0][0] == "@"){ // user-made quizzes
			quizDetails = getQuiz(params.id[0].slice(1), params.id[1]);
	}
	else{
			quizDetails = getOfficialQuiz(params.id.join("/"));
	}
	if(quizDetails === undefined){
		return {
				props: {
						error: true,
						errorMessage: "quiz not found"
				}
		};
	}

	isFavourited = quizIsFavourited({
		creator: quizDetails.user,
		id: quizDetails.id,
		user: loggedInAs
	});

	let geoJSONs = getGeoJSONFromCategory(quizDetails.categoryId, quizDetails.categoryUser, quizDetails.displayValues, quizDetails.user);
	if(geoJSONs.length === 0){
		return {
				props: {
						error: true,
						errorMessage: "quiz has no questions"
				}
		};
	}
	geoJSONs = geoJSONs.map(geo => {
		let newGeo = JSON.parse(geo.shape);
		const hash = crypto.createHash('sha256');
		hash.update(geo.user+"/"+geo.id);
		newGeo.properties = {
			key: hash.digest('hex'),
			display: {
				type: geo.propertyType,
				value: geo.value
			}
		}
		return newGeo;
	});

	return {
			props: {
					geoJSONs,
					creatorId: quizDetails.user,
					quizId: quizDetails.id,
					title: quizDetails.title,
					defaultMap: quizDetails.defaultMap,
					displayValues: quizDetails.displayValues,
					bbox: bboxFromMany(geoJSONs),
					error: false,
					isLoggedIn,
					isFavourited
			}
	};
}