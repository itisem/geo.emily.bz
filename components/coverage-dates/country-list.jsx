import styles from "./country-list.module.css";
import {flag} from "country-emoji";
const emojiFixes = {
	aland: "🇦🇽",
	"cocos islands": "🇨🇨",
	curacao: "🇨🇼",
	eswatini: "🇸🇿",
	laos: "🇱🇦",
	"st pierre and miquelon": "🇵🇲",
	"south georgia and south sandwich islands": "🇬🇸",
	uk: "🇬🇧",
	"us virgin islands": "🇻🇮"
}
const emoji = country => emojiFixes[country] || flag(country);

export default function CountryList({items}){
	const countryRows = items.map(x => 
		<div>
			<b>{emoji(x.value)} {x.value}</b>: <a href={`coverage-dates/${x.id}`}>view</a> or <a href={`coverage-dates/${x.id}.json`}>download</a>
		</div>
	);
	return (
		<>
			<h2>available countries</h2>
			<section className={styles["country-list"]}>
				{countryRows}
			</section>
		</>
	)
}