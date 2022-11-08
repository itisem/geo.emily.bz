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
			<ToolDescription url="map-quiz" title="map quiz" description="a quiz tool to learn various meta (i.e. subdivision names, phone codes)"/>
			<ToolDescription url="pano-tools" title="pano tools" description="a simple tool to help with pano id'ing geoguessr maps in order to only include official coverage. features include adding, updating and removing pano id's"/>
			<ToolDescription url="writing-systems" title="writing system learning" description="a quiz to help you learn how to read arabic, bengali, korean, russian and thai using transcribed place names"/>
		</div>
	);
}

Home.getLayout = page => page;