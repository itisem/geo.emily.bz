import Head from "next/head";
import SelectorButtonGroup from "/components/selector-button-group";
import {useEffect, useState, useCallback} from 'react';
import LocationFixer from '/browser-modules/location-fixer';

export default function PanoTools(){
	let [errorMessage, setErrorMessage] = useState("");
	let [progress, setProgress] = useState({current: 0, max: 1});
	let [outputJson, setOutputJson] = useState("{}");
	let [fileName, setFileName] = useState("map");
	let [display, setDisplay] = useState("none");
	let [action, setAction] = useState("add");
	let [errorCoords, setErrorCoords] = useState([]);

	const pushErrorCoords = useCallback( value => setErrorCoords(errorCoords.concat(value)));

	const displayError = useCallback((coords, message) => {
		setErrorMessage(errorMessage + `failed to convert <b>${coords}</b> -- ${message}<br/>`);
	});

	const addCoordinateChunk = useCallback(async (chunk, l) => {
		let promises = [];
		for(let i = 0; i < chunk.length; i++){
			promises.push(l.addFixedCoordinates(chunk[i]));
		}
		await Promise.allSettled(promises).then(
			results => {
				for(let j = 0; j < results.length; j++){
					if(results[j].status == "rejected"){
						displayError(chunk[j].lat + "," + chunk[j].lng, results[j].reason.message);
						pushErrorCoords(chunk[j]);

					}
				}
			}
		);
	});

	const convertCoords = useCallback(async (l, segments, segmentSize, coords) => {
		for(let i = 0; i < segments; i++){
			await addCoordinateChunk(coords.slice(i * segmentSize, (i + 1) * segmentSize), l);
			let locCount = Math.min((i+1) * segmentSize, coords.length);
			setProgress({current: locCount, max: coords.length});
		}
		setDisplay("block");
		setOutputJson(l.export());
	});

	const fixPano = e => {
		if(e.target.value === e.target.defaultValue) return; // upload button was cleared
		setDisplay("none");
		setErrorMessage("");
		setProgress({current: 0, max: 1});
		setOutputJson("{}");
		const file = e.target.files[0];
		if(!file) return;
		setFileName(file.name.slice(0, -5));
		let reader = new FileReader();
		reader.readAsText(file, "UTF-8");
		reader.onload = event => {
			const contents = event.target.result;
			let l = new LocationFixer(process.env.NEXT_PUBLIC_GOOGLE_API_KEY, action);
			let coords = [];
			let isParsed = false;
			try{
				let parsedJSON = JSON.parse(contents);
				coords = parsedJSON.customCoordinates;
				isParsed = true;
			}
			catch{
				isParsed = false;
			}
			if(!isParsed){
				const lines = contents.split(/\r?\n/);
				for(let i = 0; i < lines.length; i++){
					try{
						coords.push(l.getCoordinatesFromURL(lines[i]));
					}
					catch(e){
						displayError(lines[i], e.message);
					}
				}
			}
			const segmentSize = 500;
			const segments = Math.ceil(coords.length / segmentSize);
			setErrorCoords([]);
			setProgress({current: 0, max: coords.length});
			convertCoords(l, segments, segmentSize, coords);
			e.target.value = e.target.defaultValue;
		}
	}

	const actionButtons = [
		{
			text: "add pano ids",
			value: "add",
			defaultChecked: true
		},
		{
			value: "replace",
			text: "update pano ids"
		},
		{
			value: "fix",
			text: "fix broken pano ids"
		},
		{
			value: "remove",
			text: "remove pano ids"
		},
	];

	return (
		<>
			<Head>
				<title>geoguessr pano id tools</title>
				<meta charSet="utf-8" />
				<link rel="stylesheet" href="/styles/pano-tools.css"/>
				
			</Head>
			<h1>geoguessr pano id tools</h1>
			<div id="pano-action-buttons" className="centered">action: 
				<SelectorButtonGroup buttons={actionButtons} name="pano-action" onChange={e => setAction(e.target.value)} />
			</div>
			<div id="pano-entry" className="centered">
				select map file: <input type="file" className="file-upload" accept=".json" onChange={fixPano}/>
			</div>
			<div id="progress-bar" className="centered">
				<progress value={progress.current} max={progress.max}/> {progress.current} / {progress.max}
			</div>
			<div id="summary" className="centered">
				<details>
					<summary>errors ({errorCoords.length}):</summary>
					<p dangerouslySetInnerHTML={{__html: errorMessage}}></p>
				</details>
			</div>
			<div id="download" className="centered">
				<div id="download-group" style={{"display": display}}>
					<a className="button" id="download-new-json" href={'data:text/plain;charset=utf-8,' + encodeURIComponent(outputJson)} download={fileName + ".pano.json"}>download new locations</a>
					<a className="button" id="download-error-json" href={'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify({"customCoordinates":errorCoords}))} download={fileName + ".error.json"}>download locations with errors</a>
				</div>
			</div>
			<div id="pano-faq" className="bottom">
				<h2>faq</h2>
				<ul>
					<li>if you want to keep editing your map, i highly recommend using <a href="https://map-making.app/">map-making.app</a> instead of the official mapmaker.</li>
					<li>in order to import/export locations into geoguessr using this tool, you need to install the <a href="https://openuserjs.org/scripts/slashP/Copypaste_Geoguessr_map_data">&quot;copy/paste geoguessr map data&quot;</a> script and use the old mapmaker. for a more detailed documentation, check <a href="https://map-making.app/manual/export.html">the manual of map-making.app</a>.</li>
					<li>locations are processed in batches of 500, so you may have to wait a few seconds before the progress bar moves.</li>
					<li>if you wish to make sure that certain locations are not changed, give them the &quot;keep pano&quot; tag in map-making.app</li>
				</ul>
				<h2>changelog</h2>
				<details>
					<summary>v3.1 (2022-11-07)</summary>
					<ul>
						<li>fix broken pano id's option is now live</li>
						<li>"keep pano" tag is more lenient when it comes to spelling</li>
					</ul>
				</details>
				<details>
					<summary>v3.0 (2022-10-18)</summary>
					major overhaul:
					<ul>
						<li>improved ui and cleaned up the code a bit</li>
						<li>added options to remove pano id&apos;s, as well as force new pano id&apos;s</li>
						<li>files are now saved with the correct name</li>
					</ul>
				</details>
				<details>
					<summary>v2.3 (2022-03-15)</summary>
					added options to directly upload or download files instead of using textboxes.
				</details>
				<details>
					<summary>v2.2 (2022-03-03)</summary>
					made processing faster for large maps and added a simple numerical indicator to show processing status
				</details>
				<details>
					<summary>v2.1 (2022-02-08)</summary>
					improved handling of hidden coverage - it now selects the closest location instead of the default one
				</details>
				<details>
					<summary>v2.0 (2022-02-06)</summary>
					added several new features:
					<ul>
						<li>&quot;hidden&quot; coverage is now recoverable in countries such as vietnam or nigeria</li>
						<li>locations that are already panoid&apos;d won&apos;t be updated anymore</li>
						<li>large maps are now processed much more optimally, and don&apos;t hang up the browser</li>
						<li>locations that couldn&apos;t be replaced are also outputted in json format</li>
					</ul>
				</details>
				<details>
					<summary>v1.0 (2021-11-29)</summary>
					initial version -- a simple tool to replace ari&apos;d coverage. every location gets a new pano id for its latest official coverage.
				</details>
			</div>
		</>
	);
}