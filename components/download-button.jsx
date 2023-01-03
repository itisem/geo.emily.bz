import Button from "./button";

function download(name, contents){
	const blob = new Blob([contents]);
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	window.URL.revokeObjectURL(url);
}

export default function DownloadButton(props){
	let {contents, name, otherProps} = props;
	return (
		<Button {...otherProps} onClick={() => download(name, contents)}>{props.children}</Button>
	)
}