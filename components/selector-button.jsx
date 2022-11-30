import styles from "./selector-button.module.css";
export default function SelectorButton(props){
	const buttonType = props.buttonType || "radio";
	return (
		<li className={styles.button}>
			<input type={buttonType} value={props.value} id={props.id} name={props.name} defaultChecked={props.defaultChecked}  />
			<label className="button-label" htmlFor={props.id}>{props.text}</label>
		</li>
	);
}