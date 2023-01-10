import styles from "./layout.module.css";
import {useState, useEffect} from "react";
import cookie from "cookie";

export default function Layout({children}) {
	let [loggedIn, setLoggedIn] = useState(false);
	useEffect(() => {
		let parsedCookies = cookie.parse(document.cookie);
		setLoggedIn(!!parsedCookies.sessionId);
	})
	return (
		<div className="container">
			<header className={styles.header}>
				<a href="/">📍geo.emily.bz</a>
				<input id="hamburgercheckbox" className={styles.hamburgercheckbox} type="checkbox" />
				<label className={styles.hamburger} htmlFor="hamburgercheckbox"><span className={styles.hamburgerline}></span></label>
				<menu className={styles.menu}>
					<li> <a href="/map-quiz">map quiz</a> </li>
					<li> <a href="/writing-systems">writing systems</a> </li>
					<li> <a href="/coverage-dates">coverage dates</a> </li>
					<li> <a href="/pano-tools">pano tools</a> </li>
					<li> <a href="/split-map">map splitter</a> </li>
					{loggedIn ? 
						<li> <a href="/user/me">account</a> </li> :
						<li> <a href="/user/login">log in</a> </li>
					}
				</menu>
			</header>
			<main className={styles.main}>{children}</main>
			<footer className={styles.footer}>
				<a href="https://discord.gg/td7bN9HKhX">feature suggestions discord</a>
			</footer>
		</div>
	)
}
