import isAdmin from "/utils/db/is-admin";
import ErrorPage from "/components/error-page";
import Button from "/components/button";
import getWordReports from "/utils/writing-game/get-reports";
import Head from "next/head";
import {useState} from "react";

function ReportContainer({report, callback}){
	const fixWord = report => {
		let newLocalName = window.prompt("enter new local word:", report.localName);
		let newEnglishName = window.prompt("enter new english word:", report.englishName);
		fetch("/api/writing-systems/word", {
			method: "PATCH",
			body: JSON.stringify({...report, newLocalName, newEnglishName}),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(x => x.json()).then(r => {
			if(r.error) callback([]);
			else callback(r.reports);
		});
	};
	const deleteWord = report => {
		fetch("/api/writing-systems/word",{
			method: "DELETE",
			body: JSON.stringify(report),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(x => x.json()).then(r => {
			if(r.error) callback([]);
			else callback(r.reports);
		});
	};
	const ignoreReport = report => {
		fetch("/api/writing-systems/ignore-report?" + new URLSearchParams(report)).then(x => x.json()).then(r => {
			if(r.error) callback([]);
			else callback(r.reports);
		});
	}
	return (
		<tr>
			<td>{report.language}</td>
			<td>{report.localName}</td>
			<td>{report.englishName}</td>
			<td><Button onClick={() => fixWord(report)}>fix word</Button></td>
			<td><Button onClick={() => deleteWord(report)}>delete word</Button></td>
			<td><Button onClick={() => ignoreReport(report)}>ignore report</Button></td>
		</tr>
	);
}

export default function WordEditPage(props){
	let [reports, setReports] = useState(props.reports);
	if(props.error) return <ErrorPage errorMessage={props.errorMessage} />;
	return (
		<>
			<Head>
				<title>word editor</title>
			</Head>
			<h1>edit words</h1>
			<h2>reports</h2>
			<table style={{borderSpacing: 15}}> 
				<tbody>
				<tr><th>language</th><th>local word</th><th>english word</th></tr>
					{reports.map(x => <ReportContainer report={x} key={JSON.stringify(x)} callback={setReports} />)}
				</tbody>
			</table>
		</>
	);
}

export function getServerSideProps(context){
	if(!isAdmin(context.req.cookies.sessionId)){
		return {
			props: {
				error: true,
				errorMessage: "you need to be an admin to view this page"
			}
		}
	}
	return {
		props: {
			error: false,
			reports: getWordReports()
		}
	}
}