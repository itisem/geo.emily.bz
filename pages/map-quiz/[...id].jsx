import getQuiz from "/utils/db/get-quiz";
import getOfficialQuiz from "/utils/db/get-official-quiz";
import getGeoJSONFromCategory from "/utils/db/get-geojson-from-category";
import getGeoJSONPolygon from "/utils/maps/get-geojson-polygon";
import getViewStateFromBounds from "/utils/maps/get-viewstate-from-bounds";
import bbox from "@turf/bbox";
import * as crypto from "crypto";

import DeckGL from '@deck.gl/react';
import MapTiles from "/components/deck.gl/map-tiles";
import {GeoJsonLayer} from '@deck.gl/layers';
import {PostProcessEffect, MapView} from '@deck.gl/core';
import {triangleBlur} from '@luma.gl/shadertools';

import {useState, useEffect, useCallback} from 'react';
import Head from "next/head";

import SelectorButtonGroup from "/components/selector-button-group";
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
	wrong: [169, 50, 38],
	correct: [34, 153, 84],
	unselected: [31, 97, 141],
	force: [255, 255, 0],
	roundWrong: [255, 165, 0],
	hovering: [255, 255, 255]
};

export default function MapQuizPage(props) {
	if(props.error){
		return (
			<div className="container">
				<h1>Error: {props.errorMessage}</h1>
				<div className="centered"><a href="/map-quiz">Return to quizzes</a></div>
			</div>
		);
	}
	const totalQuestions = props.geoJSONs.length;

	const [viewState, setViewState] = useState(getViewStateFromBounds(props.bbox, 1920, 1080)); //avoids hydration errors since window.innerWidth only works in the browser
	const [quiz, setQuiz] = useState(new MapQuiz(props));

	const [mapType, setMapType] = useState(props.defaultMap);
	const [mapVisible, setMapVisible] = useState(true);
	const [forceClick, setForceClick] = useState(true);
	const [displayBorders, setDisplayBorders] = useState(true);
	const [maxTries, setMaxTries] = useState(1);
	const [hovering, setHovering] = useState("");
	const [roundWrong, setRoundWrong] = useState([]);
	const [currentQuestion, setCurrentQuestion] = useState(quiz.currentQuestionHTML);

	const getSelected = name => document.querySelector(`input[name="${name}"]:checked`).value;
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
			setMapVisible(false);
		}
	}, [forceClick, currentQuestion, roundWrong]);

	useEffect(() => refreshQuestions(), [roundWrong, currentQuestion, displayBorders, forceClick]);

	const skipQuestion = () => {
		if(!roundWrong) setCurrentQuestion(quiz.skipQuestion());
		else setCurrentQuestion(quiz.nextQuestion());
		refreshQuestions();
		setRoundWrong([]);
	}

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

	const refreshQuestions = () => setQuestionLayers(getGeoJSONLayers());


	const hoveringLayer = displayBorders ? createGeoJSON("hovering", props.geoJSONs.filter(x => x.key === hovering), correctnessStyles.hovering, false) : [];

	useEffect(() => {
		quiz.randomiseQuestions(); // moved here to avoid hydration errors
		setCurrentQuestion(quiz.currentQuestionHTML);
		setViewState(getViewStateFromBounds(props.bbox, window.innerWidth, window.innerHeight));
		const mapSelectors = document.querySelectorAll('input[name="select-map"]');
		for(let mapSelector of mapSelectors){
			mapSelector.onchange = () => {
				setMapType(getSelected("select-map"));
			}
		}
	}, []);

	return (
		<>
			<Head><title>{props.title} map quiz</title></Head>
			<progress 
				max={totalQuestions}
				value={totalQuestions - quiz.questionOrder.length}
				style={{
					zIndex: "98",
					position: "fixed",
					bottom: "10px",
					left: "50%",
					transform: "translateX(-50%)",
					width: "min(25%, 150px)",
					accentColor: "var(--dark1)"
				}}
			/>
			<div
				id="top-bar"
				style={{
					position: "fixed",
					top: "10px",
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: "98",
					padding: 0,
					margin: 0,
					paddingTop: "5px",
					paddingBottom: "5px",
					background: quiz.isImageQuestion ? "none" : "var(--light1)",
					fontFamily: "Manrope",
					visibility: mapVisible ? "visible" : "hidden",
					fontSize: "1.5em",
					maxWidth: "33vw"
				}}
			>
				<div id="question" dangerouslySetInnerHTML={{__html: currentQuestion}}></div>
				<div id="skip-button" style={{textAlign: "center"}}>
					<button id="skip" onClick={skipQuestion}>Skip</button>
				</div>
			</div>

			<div
				id="settings"
				style={{
					position: "fixed",
					top: "10px",
					right: "10px",
					textAlign: "right",
					zIndex: "99",
					background: "var(--light1)",
					visibility: mapVisible ? "visible" : "hidden",
					padding: 0,
					margin: 0,
					paddingTop: "5px",
					fontFamily: "Manrope",
				}}
			>
				<details> 
					<summary>⚙️Settings</summary>
					Select map: 
						<b>Google Maps</b>: <SelectorButtonGroup buttons={gmButtons} name="select-map" />
						<b>OSM</b>: <SelectorButtonGroup buttons={osmButtons} name="select-map" /><br/>
						<input type="checkbox" id="force-click" name="force-click" onChange={changeForceClick} checked={forceClick} />
						<label htmlFor="force-click">Force click on correct answer</label>
						<input type="checkbox" id="display-borders" name="display-borders" onChange={changeDisplayBorders} checked={displayBorders} />
						<label htmlFor="display-borders">Show borders</label><br />
						<label htmlFor="max-tries">Maximum tries: </label>
						<input type="number" id="max-tries" name="max-tries" value={maxTries} size="3" min="0" onChange={changeTries} /><br />
				</details>
			</div>

			<div
				id="back"
				style={{
					position: "fixed",
					top: "10px",
					left: "10px",
					zIndex: "97",
					background: "var(--light1)",
					fontFamily: "Manrope",
					maxWidth: "33vw"
				}}
			>
				<a href="/map-quiz">&lt; Back to quizzes</a>
			</div>

			<div
				id="game-over"
				style={{
					visibility: mapVisible ? "hidden" : "visible",
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					background: "var(--light1)",
					fontFamily: "Manrope",
					zIndex: "999",
					padding: "2em",
					fontSize: "1.5em",
					textAlign: "center"
				}}
			>
				<div style={{fontSize: "2em"}}>
					Game over!
				</div>
				You got {quiz.totalCorrect} out of {totalQuestions} questions correct. <br/>
				<button
					id="restart-button"
					onClick = {() => {
						if(!mapVisible){
							setMapVisible(true);
							quiz.randomiseQuestions();
						}
						setRoundWrong([]);
						refreshQuestions();
						setCurrentQuestion(quiz.currentQuestionHTML);
					}}
					style = {{
						fontSize: "1em"
					}}
				>
					Restart
				</button><br/>
				<a href="/map-quiz">&lt; Back to quizzes</a>
			</div>

			<div id="map">
				<DeckGL
					controller={mapVisible}
					initialViewState={viewState}
					views={new MapView({repeat:true})}
					layers={[MapTiles(mapType), ...questionLayers, hoveringLayer]}
					effects={mapVisible? [] : [new PostProcessEffect(triangleBlur,{radius: 5})]}
					repeat={true}
					onHover={({object}) => {
						if(!object){if(hovering) setHovering("");}
						else{if(object.properties.__key !== hovering)setHovering(object.properties.__key);}
					}}
					getCursor={({isDragging}) => isDragging ? "grabbing" : (hovering ? "pointer" : "default")}
				/>
			</div>
		</>
	);
}

export async function getStaticPaths(){
		return {
				paths: [],
				fallback: 'blocking'
		};
}

export function getStaticProps({params}){
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
								errorMessage: "Quiz not found"
						}
				};
		}

		let geoJSONs = getGeoJSONFromCategory(quizDetails.categoryId, quizDetails.categoryUser, quizDetails.displayValues);
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
		console.log(quizDetails.title);
		return {
				props: {
						geoJSONs: geoJSONs,
						title: quizDetails.title,
						defaultMap: quizDetails.defaultMap,
						displayValues: quizDetails.displayValues,
						bbox: jsonBbox,
						error: false
				}
		};
}

MapQuizPage.getLayout = page => page;