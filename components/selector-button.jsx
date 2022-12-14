import styles from "./selector-button.module.css";
export default function SelectorButton(props){
	const defaultOnChange = x => x;
	const onChange = props.onChange || defaultOnChange;
	return (
		<li className={styles.button}>
			<input type="radio" value={props.value} id={props.id} name={props.name} defaultChecked={props.defaultChecked} onChange={onChange} />
			<label className="button-label" htmlFor={props.id}>{props.text}</label>
		</li>
	);
}