export default function Layout({ children }) {
	return (
		<div className="container">
			<menu className="centered">
				<li>📍<a href="/">home</a></li>
				<li><a href="/map-quiz">map quiz</a></li>
				<li><a href="/pano-tools">pano tools</a></li>
				<li><a href="/writing-systems">writing system learning</a></li>
			</menu>
			<main>{children}</main>
			<footer className="centered"><a href="https://discord.gg/td7bN9HKhX">feature suggestions discord</a></footer>
		</div>
	)
}