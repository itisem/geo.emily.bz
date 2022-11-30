import fs from "fs";
import * as crypto from "crypto";

import {useState, useEffect} from 'react';
import SelectorButtonGroup from "/components/selector-button-group";
import SelectorButton from "/components/selector-button-group";

import getViewStateFromBounds from "/utils/maps/get-viewstate-from-bounds";
import bboxCalc from "@turf/bbox";

import DeckGL from '@deck.gl/react';
import {IconLayer} from "deck.gl";
import {MapView} from '@deck.gl/core';
import MapTiles from "/components/deck.gl/map-tiles";

import convert from "color-convert";

const months = [...Array(12).keys()].map(x => (x < 9 ? `0` + (x+1) : (x+1)));

const unselectedColour = [127, 127, 127];

const colourToCSS = c => `rgb(${c.join(",")})`;

function calculateLayerColour(tag, years, colourBy){
	let [y, m] = tag.split("-");
	y = +y;
	m = +m;
	const yearIndex = years.indexOf(y);
	const yearDiv = Math.max(1, years.length - 1);
	if(colourBy[0] == 1 && colourBy[1] == 0){
		return convert.hsl.rgb(
			Math.round(yearIndex / (yearDiv + 1) * 270),
			50,
			30 + Math.round(50 * (101 * yearIndex % yearDiv) / yearDiv)
		);
	}
	return convert.hsl.rgb(
		+colourBy[1] ? m * 30 : 0,
		50,
		+colourBy[0] ? 30 + Math.round(50 * yearIndex / yearDiv) : 50
	);
}

function createIconLayers(props, settings = {}){
	const iconMapping = {
		marker: {x: 0, y: 0, width: 64, height: 64, mask: true}
	};
	const iconAtlas = 'https://i.imgur.com/0XJnCEb.png';
	let layers = {};
	for(let loc of props.coords){
		for(let tag of loc.tags){
			if(!tag.startsWith("ym:")) continue; // year and month tags are useless
			const tagOnly = tag.slice(3);
			if(settings.selectedLayers[tagOnly]){
				if(!layers[tagOnly]){
					layers[tagOnly] = {
						colour: calculateLayerColour(tagOnly, props.years, settings.colourBy),
						coordinates: []
					};
				}
				layers[tagOnly].coordinates.push([loc.lng, loc.lat]);
			}
			else if(settings.includeUnselected){
				if(!layers["0"]){
					layers["0"] = {
						colour: unselectedColour,
						coordinates: []
					};
				}
				layers["0"].coordinates.push([loc.lng, loc.lat]);
			}
		}
	}
	let iconLayers = [];
	const orderedLayers = Object.keys(layers).sort().reduce(
		(obj, key) => {obj[key] = layers[key]; return obj;}, 
	{});
	for(let layer in orderedLayers){
		iconLayers.push(new IconLayer({
			id: layer,
			data: orderedLayers[layer].coordinates,
			iconAtlas: iconAtlas,
			iconMapping: iconMapping,
	    	getIcon: () => 'marker',
	    	sizeScale: 3,
			getSize: () => 3,
			getPosition: d => d,
			getColor: d => orderedLayers[layer].colour,
			pickable: true,
		}));
	}
	return iconLayers;
}

function getAllDates(years){
	const allDates = years.map(y => months.map(m => `${y}-${m}`)).flat();
	const selectedStatus = {};
	for(let date of allDates){
		selectedStatus[date] = true;
	}
	return selectedStatus;
}

export default function CoverageDateViewer(props){
	if(props.error){
		return (
			<div className="container">
				<h1>Error: {props.message}</h1>
				<div className="centered"><a href="/coverage-dates">Return to coverage dates</a></div>
			</div>
		);
	}
	const [viewState, setViewState] = useState(getViewStateFromBounds(props.message.bbox, 1920, 1080)); // avoid hydration errors
	const [hovering, setHovering] = useState(false);
	const [colourBy, setColourBy] = useState([1,0]);
	const [hideUnselected, setHideUnselected] = useState(true);
	const [selectedDates, setSelectedDates] = useState(getAllDates(props.message.years));

	const changeDateColours = () => setDateColours(document.getElementById("date-colours").checked);
	const changeHideUnselected = () => setHideUnselected(document.getElementById("hide-unselected").checked);

	const changeMonthStatus = m => {
		const validDates = props.message.years.map(y => `${y}-${m}`);
		changeSelectionStatus(validDates);
	}

	const changeYearStatus = y => {
		const validDates = months.map(m => `${y}-${m}`);
		changeSelectionStatus(validDates);
	}

	const changeYearMonthStatus = (y, m) => {
		const validDates = [`${y}-${m}`];
		changeSelectionStatus(validDates);
	}

	const changeSelectionStatus = validDates => {
		let currentlySelected = {...selectedDates};
		if(validDates.map(x => currentlySelected[x]).every(x => x)){
			for(let date of validDates) currentlySelected[date] = false;
		}
		else{
			for(let date of validDates) currentlySelected[date] = true;
		}
		setSelectedDates(currentlySelected);
	}

	const selectAll = v => {
		let currentlySelected = {...selectedDates};
		for(let key in currentlySelected){
			currentlySelected[key] = v;
		}
		setSelectedDates(currentlySelected);
	}

	const invertSelection = () => {
		let currentlySelected = {...selectedDates};
		for(let key in currentlySelected){
			currentlySelected[key] = !currentlySelected[key];
		}
		setSelectedDates(currentlySelected);
	}

	const getSelected = name => document.querySelector(`input[name="${name}"]:checked`).value;

	useEffect(() => {
		setViewState(getViewStateFromBounds(props.message.bbox, window.innerWidth, window.innerHeight));
		const mapSelectors = document.querySelectorAll('input[name="colour-by"]');
		for(let mapSelector of mapSelectors){
			mapSelector.onchange = () => {
				setColourBy(getSelected("colour-by").split(","));
			}
		}
	}, []);

	const mapMarkers = createIconLayers(props.message, {
		includeUnselected: !hideUnselected,
		colourBy: colourBy,
		selectedLayers: selectedDates,
	});

	const colourByButtons = [
		{
			text: "year",
			value: "1,0",
			defaultChecked: true
		},
		{
			text: "month",
			value: "0,1"
		},
		,
		{
			text: "year+month",
			value: "1,1"
		},
		{
			text: "nothing",
			value: "0,0",
		}
	];

	return (
		<>
			<DeckGL
				controller={true}
				initialViewState={viewState}
				views={new MapView({repeat:true})}
				layers={[MapTiles("gm"), ...mapMarkers]}
				repeat={true}
				getCursor={({isDragging}) => isDragging ? "grabbing" : "default"}
				onClick={(e) => {if(e.object)window.open(`http://maps.google.com/maps?q=&layer=c&cbll=${e.object[1]},${e.object[0]}`, "_blank")}}
				onHover={(e) => setHovering(!!e.object)}
				getCursor={({isDragging}) => isDragging ? "grabbing" : (hovering ? "pointer" : "default")}
			/>
			<div id="settings" style = {{
				zIndex: 999,
				position: "fixed",
				top: 10,
				left: "50%",
				transform: "translateX(-50%)",
				background: "var(--light1)",
				paddingTop: 5
			}}>

				colour markers by: <SelectorButtonGroup buttons={colourByButtons} name="colour-by" /><br/>
				<input type="checkbox" id="hide-unselected" defaultChecked={true} onClick={changeHideUnselected}/>
				<label htmlFor="hide-unselected">hide unselected markers</label><br/>
				<details>
					<summary>filter by dates (click to expand):</summary>
					<table style={{margin: "0 auto"}}>
						<tbody>
							<tr>
								<th></th>
								{months.map(m => 
									<th
										onClick={() => changeMonthStatus(m)}
										style={{cursor: "pointer"}}
									>
									{m}
									</th>
								)}
							</tr>
							{props.message.years.map(y => 
								<tr>
									<th
										onClick={() => changeYearStatus(y)}
										style={{cursor: "pointer"}}
									>
									{y}
									</th>
									{months.map(m => {
										const ym = `${y}-${m}`;
										const isSelected = selectedDates[`${y}-${m}`];
										const isAvailable = props.message.dates.includes(ym);
										return (<td 
											style={{
												cursor: isAvailable ? "pointer" : "default",
												background: isSelected & isAvailable ? colourToCSS(calculateLayerColour(ym, props.message.years, colourBy)) : colourToCSS(unselectedColour)
											}}
											onClick={() => changeYearMonthStatus(y, m)}
										>
										{m}
										</td>);
									})}
								</tr>
							)}
						</tbody>
					</table>
					<div style={{margin: "0 auto", padding: 0, textAlign: "center"}}>
						<button onClick={() => selectAll(true)}>select all</button>
						<button onClick={() => selectAll(false)}>deselect all</button>
						<button onClick={invertSelection}>invert selection</button>
					</div>
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
				<a href="/coverage-dates">&lt; other countries</a>
			</div>
		</>
	);
}

export function getServerSideProps({params}){
	try{
		const data = JSON.parse(fs.readFileSync(process.cwd() + "/public/coverage-dates/" + params.country + ".json"));
		let datesS = new Set();
		let yearsS = new Set();
		let monthsS = new Set();
		let pointGeo = [];
		for(let point of data.customCoordinates){
			pointGeo.push({type: "Feature", geometry: {type: "Point", coordinates: [point.lng, point.lat], properties: []}});
			for(let tag of point.extra.tags){
				if(tag.startsWith("ym:")) datesS.add(tag.slice(3));
				if(tag.startsWith("y:")) yearsS.add(+tag.slice(2));
				if(tag.startsWith("m:")) monthsS.add(+tag.slice(2));
			}
		}
		const coords = data.customCoordinates.map(x => ({lat: x.lat, lng: x.lng, id: crypto.randomUUID({disableEntropyCache: true}), tags: x.extra.tags}));
		const tagInfo = data.extra.tags;
		let featureCollection = {type: "FeatureCollection", features: pointGeo};
		const years = Array.from(yearsS).sort();
		const dates = Array.from(datesS).sort();
		const startYear = Math.min(...years);
		const endYear = Math.max(...years);
		const bbox = bboxCalc(featureCollection);
		return {
			props: {
				error: false,
				message: {
					years,
					dates,
					tagInfo,
					coords,
					bbox
				}
			}
		}
	}
	catch(e){
		return {
			props:{
				error: true,
				message: "Country not found"
			}
		};
	}
}