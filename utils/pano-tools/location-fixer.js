import coordinateDistance from "/utils/maps/coordinate-distance";

export default class LocationFixer{
	constructor(apiKey = "", mode = "add"){
		if(!apiKey){
			throw new Error("please supply an api key");
		}
		this.apiKey = apiKey;
		this.baseUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?key=${this.apiKey}`;
		this.newLocations = [];
		this.mode = mode;
	}

	getCoordinatesFromURL(_url){
		const url = new URL(_url);
		const path = url.pathname;
		let coordinates = "";
		const baseRegex = "(-?[0-9]{1,2}.[0-9]+,-?[0-9]{1,3}.[0-9]+)";
		if(path === "/maps"){
		// the "https://www.google.com/maps?q&layer=c&cbll=32.38139602797509,-64.67713930153232" kind of url that geo gives
			const params = new URLSearchParams(url.search);
			coordinates = params.get("cbll");
			const regex = new RegExp("^" + baseRegex + "$");
			const match = coordinates.match(regex);
			let coordinatesSplit = coordinates.split(",");
			if(match){
				return {
					"lat": coordinatesSplit[0],
					"lng": coordinatesSplit[1]
				};
			}
			else{
				throw new Error("invalid coordinates in the url");
			}
		}
		else{
		// the final https://www.google.com/maps/@32.381396,-64.6771393,3a,75y,90t/data=!3m6!1e1!3m4!1sAF1QipPy_PNmUXIQqwy1qBy-sMGylePMnXgnezahiwcB!2e10!7i7680!8i3840 url that we are redirected to
			const regex = new RegExp("@" + baseRegex + ",");
			try{
				coordinates = url.href.match(regex)[1];
			}
			catch{
				throw new Error("invalid url: this link might not be an unshortened google maps url");
			}
			let coordinatesSplit = coordinates.split(",");
			return {
				"lat": coordinatesSplit[0],
				"lng": coordinatesSplit[1]
			};
		}
	}

	getTileFromCoordinates(coordinates, zoomLevel = 17){
		if(Math.abs(coordinates.lat) > 90){
			throw new Error("invalid latitude");
		}
		if(Math.abs(coordinates.lng) > 180){
			throw new Error("invalid longitude");
		}
		let latRadian = coordinates.lat * Math.PI / 180;
		let latSin = Math.sin(latRadian);
		if(Math.abs(latSin) > .9999){
			throw new Error("can't use coordinates near the poles");
		}
		let latTransformed = Math.log((1 + latSin) / (1 - latSin));
		let x = .5 + coordinates.lng / 360;
		let y = .5 - latTransformed / (4 * Math.PI);
		let scale = 2 ** zoomLevel;
		return {
			"x": Math.floor(x * scale),
			"y": Math.floor(y * scale)
		};
	}

	getPanosFromTile(tile){
		let url = `https://www.google.com/maps/photometa/ac/v1?pb=!1m1!1smaps_sv.tactile!6m3!1i${tile.x}!2i${tile.y}!3i17!8b1`;
		return fetch(url).then(
			response => {
				return response.text();
			}
		).then(
			response => {
				response = response.split(/\r?\n/)[1];
				response = JSON.parse(response);
				if(!response[1]){
					return [];
				}
				if(!response[1][1]){
					return [];
				}
				response = response[1][1];
				let panoIDs = [];
				for(let i = 0; i < response.length; i++){
					panoIDs.push({
						"id": response[i][0][0][1],
						"lat": response[i][0][2][0][2],
						"lng": response[i][0][2][0][3]}
					);
				}
				return panoIDs;
			}
		)
	}

	tagToAlnum(tags){
		return tags.map(x => x.replace(/[^a-z]/gi, "").toLowerCase());
	}

	async checkPano(location){
		if(!location.panoId || location.panoId.length !== 22){
			return false;
		}
		const url = `${this.baseUrl}&pano=${location.panoId}`;
		return fetch(url).then(r => r.json()).then(r => r.status === "OK");
	}

	async addFixedCoordinates(location){
		try{
			if(this.tagToAlnum(location.extra.tags).includes("keeppano")){
				this.newLocations.push(location);
				return;
			}
		}
		catch(e){
			// nothing to do here - it just means that locations.extras.tags is not an array and that is fine
		}
		switch(this.mode){
			case "add":
				if(location.panoId){
					this.newLocations.push(location);
					return;
				}
				break;
			case "remove":
				delete location.panoId;
				this.newLocations.push(location);
				return;
			case "fix":
				const status = await this.checkPano(location);
				if(status){
					this.newLocations.push(location);
					return;
				}
		}
		if(location.heading === undefined){
			location.heading = 0;
		}
		if(location.pitch === undefined){
			location.pitch = 0;
		}
		const url = `${this.baseUrl}&location=${location.lat},${location.lng}&source=outdoor`;
		return fetch(url).then(
			response => {
				if(!response.ok){
					throw new Error("the google maps api returned an error");
				}
				else{
					return response.json();
				}
			},
		).then(
			response => {
				let isError = false;
				if(response.status !== "OK"){
					isError = true;
				}
				else{
					if(response.pano_id.length !== 22){ // all official coverage has a 22 length pano id, unofficial is always longer
						isError = true;
					}
				}
				if(!isError){
					const newLocation = {
						"heading": location.heading,
						"pitch": location.pitch,
						"zoom": 0,
						"panoId": response.pano_id,
						"lat": response.location.lat,
						"lng": response.location.lng,
						"extra": location.extra
					};
					this.newLocations.push(newLocation);
					return this.export(newLocation);
				}
				else{
					let tile = this.getTileFromCoordinates(location);
					return this.getPanosFromTile(tile).then(
						response => {
							if(response.length > 0){
								let newLocation, distance;
								let minDistance = Math.min();
								for(let i = 0; i < response.length; i++){
									distance = coordinateDistance(location, response[i]);
									if(distance < minDistance){
										newLocation = response[i];
										minDistance = distance;
									}
								}
								location.panoId = newLocation.id;
								location.lat = newLocation.lat;
								location.lng = newLocation.lng;
								this.newLocations.push(location);
								return this.export(location);
							}
							else{
								throw new Error("no replacement found");
							}
						}
					);
				}
			}
		)
	}

	export(exported = undefined){
		let output = "";
		if(exported === undefined){
			output = {
				"customCoordinates": this.newLocations
			};
		}
		else{
			output = {
				"customCoordinates": [exported]
			};
		}
		return(JSON.stringify(output));
	}
}