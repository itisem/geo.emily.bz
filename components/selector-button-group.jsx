import SelectorButton from "./selector-button";
import styles from "./selector-button-group.module.css";

const keyAndId = (x, props) => x.id ? x.id : props.name + "-" + x.value.replace(" ", "-");

export default function SelectorButtonGroup(props){
	const defaultOnChange = x => x;
	const onChange = props.onChange || defaultOnChange;
	const actionButtons = props.buttons.map(x => 
		<SelectorButton 
		key={keyAndId(x, props)}
		id={keyAndId(x, props)}
		value={x.value}
		name={props.name}
		text={x.text}
		defaultChecked={x.defaultChecked}
		onChange={onChange}
		/>
	);
	return (
		<ul className={styles["button-group"]}>
			{actionButtons}
		</ul>
	);
}