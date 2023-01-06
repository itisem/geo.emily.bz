import checkSession from "/utils/db/check-session";
import getQuiz from "/utils/db/get-quiz";
import getOfficialQuiz from "/utils/db/get-official-quiz";
import getGeoJSONFromCategory from "/utils/db/get-geojson-from-category";
import getGeoJSONPolygon from "/utils/maps/get-geojson-polygon";
import getViewStateFromBounds from "/utils/maps/get-viewstate-from-bounds";

import bbox from "@turf/bbox";
import * as crypto from "crypto";
import prettyMs from "pretty-ms";
import Database from "better-sqlite3";
import * as appRoot from "app-root-path";

import DeckGL from '@deck.gl/react';
import MapTiles from "/components/map-tiles";
import {GeoJsonLayer} from '@deck.gl/layers';
import {PostProcessEffect, MapView} from '@deck.gl/core';
import {triangleBlur} from '@luma.gl/shadertools';

import {useState, useEffect, useCallback} from 'react';
import Head from "next/head";

import SelectorButtonGroup from "/components/selector-button-group";
import Footer from "/components/footer";
import Button from "/components/button";
import FavouriteButton from "/components/favourite-button";
import ErrorPage from "/components/error-page";

import MapQuiz from "/browser-modules/map-quiz";

const gmButtons = [
	{
		text: "roadmap",
		value: "gm",
		defaultChecked: true
	},
	{
		text: "no labels",
		value: "gmNoLabels"
	},
	,
	{
		text: "terrain",
		value: "gmTerrain"
	}
];

const osmButtons = [
	{
		text: "roadmap",
		value: "osm",
	}
];

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
	const [quiz, setQuiz] = useState(new MapQuiz(props));

	const [mapType, setMapType] = useState(props.defaultMap);
	const [visibleMenu, setVisibleMenu] = useState("");
	const [forceClick, setForceClick] = useState(true);
	const [displayBorders, setDisplayBorders] = useState(true);
	const [maxTries, setMaxTries] = useState(1);
	const [hovering, setHovering] = useState("");
	const [roundWrong, setRoundWrong] = useState([]);
	const [startTime, setStartTime] = useState(0);
	const [timeDiff, setTimeDiff] = useState(0);
	const [currentQuestion, setCurrentQuestion] = useState(quiz.currentQuestionHTML);

	const changeForceClick = (e) => setForceClick(e.target.checked);
	const changeTries = (e) => setMaxTries(e.target.value);
	const changeDisplayBorders = (e) => setDisplayBorders(e.target.checked);

	const checkAnswer = useCallback((layerKey, jsonKey) => {
		if(quiz.questions.length === 0) return;
		if(layerKey == "correct" || layerKey == "wrong") return;
		const isCorrect = quiz.checkAnswer(jsonKey, roundWrong.length < maxTries);
		if(!isCorrect){
			setRoundWrong([...roundWrong, jsonKey]);
		}
		if(isCorrect || !forceClick){
			setRoundWrong([]);
			setCurrentQuestion(quiz.nextQuestion());
		}
		if(quiz.questions.length == 0){
			setTimeDiff(prettyMs(new Date().getTime() - startTime, {verbose: true, secondsDecimalDigits: 0}));
			setVisibleMenu("game-over");
		}
	}, [forceClick, currentQuestion, roundWrong])

	const skipQuestion = () => {
		if(roundWrong.length == 0) setCurrentQuestion(quiz.skipQuestion());
		else setCurrentQuestion(quiz.nextQuestion());
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

	const getColour = useCallback(key => {
		if(roundWrong.includes(key)) return correctnessStyles.roundWrong;
		if(quiz.currentQuestionId === key && roundWrong.length >= maxTries) return correctnessStyles.force;
		switch(quiz.correctness[key]){
			case -1:
				return correctnessStyles.wrong;
			case 0:
				return correctnessStyles.unselected;
			case 1:
				return correctnessStyles.correct;
		}
	}, [forceClick, currentQuestion, roundWrong]);

	const getGeoJSONLayers = () => {
		let layers = {
			"current": [],
			"wrong": [],
			"unselected": [],
			"correct": [],
			"roundWrong": [],
			"hovering": []
		};
		if(!quiz.correctness){ // ensures that un-initialised quizzes work
			props.geoJSONs.map(x => layers.current.push(x));
			return layers;
		}
		for(let geo of props.geoJSONs){
			if(geo.key == hovering){
				layers.hovering.push(geo);
			}
			if(geo.key == quiz.currentQuestionId){
				layers.current.push(geo);
			}
			else{
				if(roundWrong.includes(geo.key) && roundWrong.length < maxTries){
					layers.roundWrong.push(geo);
				}
				else{
					switch(quiz.correctness[geo.key]){
						case -1:
							layers.wrong.push(geo);
							break;
						case 0:
							layers.unselected.push(geo);
							break;
						case 1:
							layers.correct.push(geo);
							break;
					}
				}
			}
		}
		return [
			createGeoJSON("wrong", layers.wrong, correctnessStyles.wrong),
			createGeoJSON("correct", layers.correct, correctnessStyles.correct),
			createGeoJSON("unselected", layers.unselected, correctnessStyles.unselected),
			createGeoJSON("roundWrong", layers.roundWrong, correctnessStyles.roundWrong),
			createGeoJSON("current", layers.current, roundWrong.length >= maxTries ? correctnessStyles.force : correctnessStyles.unselected),
		];
	}

	const createGeoJSON = (id, jsons, colour, pickable = true) => {return new GeoJsonLayer({
		id: id,
		data: jsons.map(geoJSON => geoJSON.shape),
		getFillColor: [...colour, 100],
		stroked: displayBorders,
		getLineColor: [...colour, 255],
		getLineWidth: 2,
		lineWidthUnits: "pixels",
		pickable,
		onClick: (e) => checkAnswer(id, e.object.properties.__key)
	})};

	const [questionLayers, setQuestionLayers] = useState(getGeoJSONLayers());
	const [hoveringLayer, setHoveringLayer] = useState(null);

	const refreshQuestions = () => setQuestionLayers(getGeoJSONLayers());

	const refreshHovering = () => displayBorders && visibleMenu !== "game-over" ?
		setHoveringLayer(new GeoJsonLayer({
			id: "hovering",
			data: props.geoJSONs.filter(x => x.key === hovering).map(x => x.shape),
			getFillColor: [...correctnessStyles.hovering, 100],
			stroked: displayBorders,
			getLineColor: [...correctnessStyles.hovering, 255],
			getLineWidth: 2,
			lineWidthUnits: "pixels",
			pickable: false
		})) :
		setHoveringLayer([]);

	useEffect(() => refreshQuestions(), [roundWrong, currentQuestion, displayBorders, forceClick]);
	useEffect(() => refreshHovering(), [hovering]);

	useEffect(() => {
		quiz.randomiseQuestions(); // moved here to avoid hydration errors
		setCurrentQuestion(quiz.currentQuestionHTML);
		setViewState(getViewStateFromBounds(props.bbox, window.innerWidth, window.innerHeight - 200));
		setStartTime(new Date().getTime());
	}, []);

	return (
		<>
			<Head><title>{props.title} map quiz</title></Head>
			<DeckGL
				controller={visibleMenu !== "game-over"}
				initialViewState={viewState}
				views={new MapView({repeat:true})}
				layers={[MapTiles(mapType), ...questionLayers, hoveringLayer]}
				effects={visibleMenu === "game-over" ? [new PostProcessEffect(triangleBlur,{radius: 5})] : []}
				repeat={true}
				onHover={({object}) => {
					if(!object){if(hovering) setHovering("");}
					else{if(object.properties.__key !== hovering) setHovering(object.properties.__key);}
				}}
				getCursor={({isDragging}) => isDragging ? "grabbing" : (hovering ? "pointer" : "default")}
				style={{
					position: "absolute",
					width: "100%",
					height: "calc(100vh - 40px)",
					top: "40px",
					margin: "0 auto"
				}}
			/>

			<div
				id="top-bar"
				style={{
					position: "absolute",
					top: "60px",
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: "98",
					padding: 0,
					margin: 0,
					paddingTop: "5px",
					paddingBottom: "5px",
					background: quiz.isImageQuestion ? "none" : "var(--bglight)",
					fontFamily: "Manrope",
					visibility: visibleMenu === "game-over" ? "hidden" : "visible",
					fontSize: "1.5em",
					maxWidth: "33vw",
					textAlign: "center",
					borderRadius: "10px"
				}}
			>
				<div id="question" dangerouslySetInnerHTML={{__html: currentQuestion}}></div>
				<div id="skip-button" style={{textAlign: "center"}}>
					<Button id="skip" onClick={skipQuestion}>Skip</Button>
					<Button id="restart" onClick={restartQuiz}>Restart</Button>
				</div>
			</div>

			<progress 
				max={totalQuestions}
				value={totalQuestions - quiz.questionOrder.length}
				style={{
					zIndex: "1",
					position: "absolute",
					bottom: "20px",
					left: "50%",
					transform: "translateX(-50%)",
					width: "min(25%, 150px)",
				}}
			/>

			<div
				id="top-right-icons"
				style={{
					position: "absolute",
					top: "60px",
					right: "10px",
					zIndex: "99",
					fontSize: "24px",
					visibility: visibleMenu === "game-over" ? "hidden" : "visible",
				}}
			>
				<FavouriteButton isLoggedIn={props.isLoggedIn} isFavourited={props.isFavourited} quizId={props.quizId} creatorId={props.creatorId} />
				<Button
					dark={true}
					onClick={
						() => {
							if(visibleMenu !== "settings") setVisibleMenu("settings");
							else setVisibleMenu("");
						}
					}
				>
					⚙️
				</Button>
			</div>

			<div
				id="settings"
				style={{
					position: "absolute",
					right: "10px",
					top: "110px",
					textAlign: "right",
					zIndex: "99",
					background: "var(--bglight)",
					borderRadius: "10px",
					padding: "10px",
					visibility: visibleMenu === "settings" ? "visible" : "hidden",
					padding: 0,
					margin: 0,
					paddingTop: "5px",
					fontFamily: "Manrope"
				}}
			>
				select map: 
					<b>google maps</b>: <SelectorButtonGroup buttons={gmButtons} onChange={e => setMapType(e.target.value)} name="select-map" />
					<b>osm</b>: <SelectorButtonGroup buttons={osmButtons} onChange={e => setMapType(e.target.value)} name="select-map" /><br/>
					<input type="checkbox" id="force-click" name="force-click" onChange={changeForceClick} checked={forceClick} />
					<label htmlFor="force-click">force click on correct answer</label>
					<input type="checkbox" id="display-borders" name="display-borders" onChange={changeDisplayBorders} checked={displayBorders} />
					<label htmlFor="display-borders">show borders</label><br />
					<label htmlFor="max-tries">maximum tries: </label>
					<input type="number" id="max-tries" name="max-tries" value={maxTries} size="3" min="0" onChange={changeTries} /><br />
			</div>

			<div
				id="game-over"
				style={{
					visibility: visibleMenu === "game-over" ? "visible" : "hidden",
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					background: "var(--bglight)",
					fontFamily: "Manrope",
					zIndex: "999",
					padding: "2em",
					fontSize: "1.5em",
					textAlign: "center",
					borderRadius: "30px"
				}}
			>
				<div style={{fontSize: "2em"}}>
					Game over!
				</div>
				You got {quiz.totalCorrect} out of {totalQuestions} questions correct in {timeDiff}. <br/>
				<Button
					id="restart-button"
					onClick = {restartQuiz}
					style = {{
						fontSize: "1em"
					}}
				>
					Restart
				</Button><br/>
				<a href="/map-quiz">&lt; Back to quizzes</a>
			</div>
		</>
	);
}

export function getServerSideProps(context){
	const params = context.params;
	let loggedInAs = "";
	let isFavourited = false;
	try{
		const sessionInfo = checkSession(context.req.cookies.sessionId);
		loggedInAs = "";
		loggedInAs = sessionInfo.user.id;
	}
	catch{
		loggedInAs = "";
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

	const db = new Database(`${appRoot}/data/data.db`);

	isFavourited = !!db.prepare(`SELECT * FROM favouriteQuizzes WHERE creator = :creator AND id = :id AND user = :user`).get({
		creator: quizDetails.user,
		id: quizDetails.id,
		user: loggedInAs
	})

	let geoJSONs = getGeoJSONFromCategory(quizDetails.categoryId, quizDetails.categoryUser, quizDetails.displayValues);
	if(geoJSONs.length === 0){
		return {
				props: {
						error: true,
						errorMessage: "quiz has no questions"
				}
		};
	}
	geoJSONs = geoJSONs.map(x => {
		x.shape = JSON.parse(x.shape);
		const hash = crypto.createHash('sha256');
		hash.update(x.user+"/"+x.id);
		x.key = hash.digest('hex');
		x.shape.properties["__key"] = x.key;
		return x;
	});
	const coordsOnly = geoJSONs.map(x => {
		const poly = getGeoJSONPolygon(x.shape);
		if(poly.type == "Polygon"){
			return poly.coordinates;
		}
		if(poly.type == "MultiPolygon"){
			return poly.coordinates[0];
		}
		return [];
	});
	const jsonBbox = bbox({type: "MultiPolygon", coordinates: coordsOnly});
	return {
			props: {
					geoJSONs: geoJSONs,
					creatorId: quizDetails.user,
					quizId: quizDetails.id,
					title: quizDetails.title,
					defaultMap: quizDetails.defaultMap,
					displayValues: quizDetails.displayValues,
					bbox: jsonBbox,
					error: false,
					isLoggedIn: loggedInAs,
					isFavourited: isFavourited
			}
	};
}