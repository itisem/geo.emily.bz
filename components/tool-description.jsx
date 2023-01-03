import styles from './tool-description.module.css';

export default function ToolDescription(props){
	return (
		<a href={props.url}>
			<div className={styles["tool-description"]}>
				<h2>{props.icon}<br/>{props.title}</h2>
				<p>{props.description}</p>
			</div>
		</a>
	);
}