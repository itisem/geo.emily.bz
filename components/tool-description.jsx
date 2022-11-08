import styles from './tool-description.module.css';

export default function ToolDescription(props){
	return (
		<div className={styles["tool-description"]}>
			<h2><a href={props.url}>{props.title}</a></h2>
			<p>{props.description}</p>
		</div>
	);
}