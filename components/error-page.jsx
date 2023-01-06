import Head from "next/head";

export default function ErrorPage(props){
	return (
		<>
			<Head><title>error</title></Head>
			<h1>error: {props.errorMessage}</h1>
			{<p className="centered"><a href="javascript:history.back()">back to last page</a></p>}
		</>
	)
}