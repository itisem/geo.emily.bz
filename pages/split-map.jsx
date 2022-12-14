import Head from "next/head";
import {useEffect, useState} from 'react';

const splitSize = 50000;
const noMap = {customCoordinates: []};

export default function SplitMap(){

	const [map, setMap] = useState(noMap);
	const [errorMessage, setErrorMessage] = useState("");
	const [fileName, setFileName] = useState("");

	const splitMap = splitEvent => {
		setErrorMessage("");
		setFileName("");
		setMap(noMap);
		if(splitEvent.target.files.length !== 1){
			setErrorMessage("no files selected");
		}
		const file = splitEvent.target.files[0];
		const reader = new FileReader();
		reader.readAsText(file, "UTF-8");
		reader.onload = fileEvent => {
			const contents = fileEvent.target.result;
			let parsed = {};
			try{
				parsed = JSON.parse(contents);
				if(!Array.isArray(parsed.customCoordinates)) setErrorMessage("not a valid map file");
				else{
					setMap(parsed);
					setFileName(file.name.slice(0, -5));
				}
			}
			catch{
				setErrorMessage("not a valid map file");
			}
		};
		reader.onerror = () => setErrorMessage("error while reading the file");
	};

	const downloadSplit = n => {
		const newMap = {...map};
		newMap.customCoordinates = map.customCoordinates.slice(n * splitSize, (n+1) * splitSize);
		const newMapText = JSON.stringify(newMap);
		const blob = new Blob([newMapText]);
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${fileName}.part-${n+1}.json`;
		a.click();
		window.URL.revokeObjectURL(url);
	}

	const range = n => [...Array(n).keys()];

	const display = v => v ? {} : {display: "none"};

	return (
		<>
			<Head>
				<title>map splitter for map-making.app</title>
			</Head>
			<h1>map splitter</h1> 
			<p className="centered">split large maps into smaller chunks to be importable into map-making.app</p>
			<div id="map-entry" className="centered">
				select map file: <input type="file" className="file-upload" accept=".json" onChange={splitMap}/>
			</div>
			<div id="split-links" className="centered" style={display(map.customCoordinates.length !== 0)}>
			download files: 
				{range(Math.ceil(map.customCoordinates.length / splitSize)).map(i => <button onClick={() => downloadSplit(i)}>part {i + 1}</button>)}
			</div>
			<div id="error-message" className="centered" style={display(errorMessage !== "")}>
				{errorMessage}
			</div>
		</>
	)
}