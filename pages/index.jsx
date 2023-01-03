import Head from "next/head";
import ToolDescription from '/components/tool-description';

export default function Home() {
	return (
		<div className="container">
			<Head>
				<title>emily&apos;s geoguessr tools</title>
				<meta charSet="utf-8" />
			</Head>
			<h1>📍 emily&apos;s geoguessr tools</h1>
			<main
				style={{
					display: "grid",
					gap: "10px",
					gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
					gridAutoRows: "1fr",
					paddingBottom: "1em"
				}}
			>
				<ToolDescription
					url="map-quiz"
					title="map quiz"
					description="a quiz tool to learn various meta (i.e. subdivision names, phone codes)"
					icon="🌎"
				/>
				<ToolDescription
					url="writing-systems"
					title="writing system learning"
					description="a quiz to help you learn how to read arabic, bengali, korean, russian and thai using transcribed place names"
					icon="🔡"
				/>
				<ToolDescription
					url="coverage-dates"
					title="coverage date maps"
					description="coverage date maps for the entire world"
					icon="📅"
				/>
				<ToolDescription
					url="pano-tools"
					title="pano tools"
					description="a simple tool to help with pano id'ing geoguessr maps in order to only include official coverage"
					icon="🗺️"
				/>
				<ToolDescription
					url="split-map"
					title="map splitter"
					description="is your ai generated map too big to import into map-making.app? split it into multiple parts"
					icon="✂️"
				/>
			</main>
			<footer className="centered"><a href="https://discord.gg/td7bN9HKhX">feature suggestions discord</a></footer>
		</div>
	);
}

Home.getLayout = page => page;