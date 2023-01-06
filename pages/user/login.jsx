import Head from "next/head";
import Button from "/components/button";
import {useState} from "react";
import validateUsername from "/utils/db/validate-username";
import validatePassword from "/utils/db/validate-password";

export default function LoginPage(){
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [success, setSuccess] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const colours = {
		1: "var(--success)",
		0: "var(--error)"
	};

	const login = () => sendReq("/api/user/login");
	const register = () => sendReq("/api/user/register");

	const sendReq = (url) => {
		fetch(url, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({username, password})
		}).then(response => response.json()).then(
			data => {
				if(data.error){
					setErrorMessage(`error: ${data.error}`);
				}
				else{
					window.location.replace("/user/me");
				}
			}
		)
	}

	return (
		<>
			<Head>
				<title>sign in / create account</title>
			</Head>
			<h1>log in / create account</h1>
			<p style={{textAlign: "center"}}>
				currently, accounts are only used for uploading custom map quizzes.<br/>
				if you don't want to do that, feel free to ignore this for now -- although i plan to add more features for them later.
			</p>
			<p style={{color: "var(--error)"}}>
				{errorMessage}
			</p>
			<section style={{
				display: "grid",
				margin: "0 auto",
				width: 300,
				gridTemplateColumns: "150px 150px",
				gridGap: 10
			}}>
				<label htmlFor="username">username: </label>
				<input
					type="text"
					name="username"
					value={username}
					onChange={e => setUsername(e.target.value)}
				/>
				<label htmlFor="password">password: </label>
				<input
					type="password"
					name="password"
					value={password}
					onChange={e => setPassword(e.target.value)}
				/>
				<Button onClick={login}>sign in</Button>
				<Button onClick={register}>create account</Button>
			</section>
			<p style={{
				textAlign: "center",
				fontWeight: "bold",
				color: colours[+validateUsername(username)]
			}}>
				all usernames must be 3-20 characters long and only contain letters, numbers and dashes
			</p>
			<p style={{
				textAlign: "center",
				fontWeight: "bold",
				color: colours[+validatePassword(password)]
			}}>
				passwords must be at least 12 characters long and contain both letters and numbers
			</p>
		</>
	)
}