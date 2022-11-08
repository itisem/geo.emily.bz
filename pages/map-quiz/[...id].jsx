import getQuiz from "/utils/db/get-quiz";
import getGeoJSONFromCategory from "/utils/db/get-geojson-from-category";
import getGeoJSONPolygon from "/utils/maps/get-geojson-polygon";
import getViewStateFromBounds from "/utils/maps/get-viewstate-from-bounds";
import bbox from "@turf/bbox";
import * as crypto from "crypto";

import DeckGL from '@deck.gl/react';
import MapTiles from "/components/map-tiles";
import {GeoJsonLayer} from '@deck.gl/layers';
import {PostProcessEffect, MapView} from '@deck.gl/core';
import {triangleBlur} from '@luma.gl/shadertools';

import {useState, useEffect} from 'react';
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
	unselected: [31, 97, 141],
	correct: [34, 153, 84],
	force: [255, 255, 0]
};

export default function MapQuizPage(props) {
	if(props.error){
		return (
			<div class="container">
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
	const [clickedWrong, setClickedWrong] = useState(false);
	const [questionCount, setQuestionCount] = useState(0); // forcing a rerender
	const forceRerender = () => setQuestionCount(questionCount+1);

	const checkAnswer = (key) => {
		if(quiz.questions.length === 0) return;
		if(key == "correct" || key == "wrong") return;
		const isCorrect = quiz.checkAnswer(key, !clickedWrong);
		if(!isCorrect){
			setClickedWrong(true);
		}
		if(isCorrect || !forceClick){
			setClickedWrong(false);
			quiz.nextQuestion();
		}
		forceRerender();
		if(quiz.questions.length == 0){
			setMapVisible(false);
		}
	}

	const getGeoJSONLayers = () => {
		let layers = {
			"current": [],
			"wrong": [],
			"unselected": [],
			"correct": []
		};
		if(!quiz.correctness){
			props.geoJSONs.map(x => layers.current.push(x));
			return layers;
		}
		for(let geo of props.geoJSONs){
			if(geo.key == quiz.currentQuestionId){
				layers.current.push(geo);
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
		return layers;
	}

	const createGeoJSON = (id, jsons, colour) => {return new GeoJsonLayer({
		id: id,
		data: jsons.map(geoJSON => geoJSON.shape),
		getFillColor: [...colour, 100],
		stroked: true,
		getLineColor: [...colour, 255],
		getLineWidth: 2,
		lineWidthUnits: "pixels",
		pickable: true,
		onClick: () => checkAnswer(id)
	})};

	const layers = getGeoJSONLayers();

	const geoJSONLayers = [
		createGeoJSON("wrong", layers.wrong, correctnessStyles.wrong),
		createGeoJSON("correct", layers.correct, correctnessStyles.correct),
		createGeoJSON("unselected", layers.unselected, correctnessStyles.unselected),
		createGeoJSON(layers.current[0] ? layers.current[0].key : "tmp", layers.current, clickedWrong ? correctnessStyles.force : correctnessStyles.unselected),
	]

	const getSelected = name => document.querySelector(`input[name="${name}"]:checked`).value;
	const changeForceClick = () => setForceClick(document.getElementById("force-click").checked);

	useEffect(() => {
		quiz.randomiseQuestions(); // moved here to avoid hydration errors
		setViewState(getViewStateFromBounds(props.bbox, window.innerWidth, window.innerHeight));
		setTimeout(forceRerender, 0); // i have no idea why this gets rid of the race condition but it does lol
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
			<div
				id="question"
				style={{
					position: "fixed",
					top: "10px",
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: "98",
					paddingTop: "10px",
					background: quiz.isImageQuestion ? "none" : "var(--light1)",
					fontFamily: "Manrope",
					visibility: mapVisible ? "visible" : "hidden",
					fontSize: "1.5em",
					padding:0,
					margin: 0,
					maxWidth: "33vw"
				}}
				dangerouslySetInnerHTML={{__html: quiz.currentQuestionHTML}}
			>
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
						<label htmlFor="force-click">Force click on correct answer?</label>
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
					layers={[MapTiles(mapType), ...geoJSONLayers]}
					effects={mapVisible? [] : [new PostProcessEffect(triangleBlur,{radius: 5})]}
					repeat={true}
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
				quizDetails = getQuiz("import", params.id[0]+"/"+params.id[1]);
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
			x.key = hash.digest('hex'); return x;
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
						title: quizDetails.title,
						defaultMap: quizDetails.defaultMap,
						displayValues: quizDetails.displayValues,
						bbox: jsonBbox,
						error: false,
						uuid: crypto.randomUUID()
				}
		};
}

MapQuizPage.getLayout = page => page;