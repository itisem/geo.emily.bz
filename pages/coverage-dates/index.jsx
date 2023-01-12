import Head from "next/head";
import fs from "fs";
import {useState} from "react";
import SearchWrapper from "/components/search-wrapper";
import CountryList from "/components/coverage-dates/country-list";

export default function coverageDates({countries}){
	return (
		<>
			<Head><title>coverage date maps</title></Head>
			<main style={{maxWidth: 1200, margin: "0 auto"}}>
				<h1>coverage date maps</h1>
				<p>
					i maintain coverage date maps of every country and dependency available on google maps using my own map-generator fork.
					you can view the maps here, or download them and import them into <a href="https://map-making.app">map-making.app</a>.
				</p>
				<p><i>last update: 30 november 2022</i></p>
				<SearchWrapper items={countries} searchBarText="find country">
					<CountryList />
				</SearchWrapper>
				<h2>faq & updates</h2>
				<ul style={{listStyleType: "none"}}>
					<li><details>
						<summary>why are some locations in the wrong country?</summary>
						this is due to how the original <a href="https://map-generator.vercel.app/">map-generator</a> works:
						it first generates a list of coordinates inside country polygons, and then searches for street view within a set radius (for these maps, usually 5000 metres).
						this means that, in practice, most country files can have locations up to 5 kilometres outside their borders.
						this will be fixed for the next set of maps -- this first iteration is just a proof of concept.
					</details></li>
					<li><details>
						<summary>what&apos;s up with the 2007-01 entries that are clearly wrong?</summary>
						google maps apparently uses 2007-01 as the date when they are missing data. nothing i can do about that sadly
					</details></li> 
					<li><details>
						<summary>how often are these maps generated?</summary>
						the current release is the first time, but i aim to do them after every major coverage update.
					</details></li>
					<li><details>
						<summary>i have a suggestion to improve your maps</summary>
						join my discord! i am always looking for ways to make my tools more useful ^^
					</details></li>
				</ul>
			</main>
		</>
	);
}

export function getServerSideProps(){
	let countries = fs.readdirSync(process.cwd() + "/public/coverage-dates");
	countries = countries.map(x => {return {id: x.slice(0, -5), value: x.slice(0, -5).replaceAll("-", " ")}});
	return {
		props: {
			countries: countries
		}
	};
}