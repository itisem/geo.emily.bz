import SelectorButton from "./selector-button";
import styles from "./selector-button-group.module.css";

const keyAndId = (x, props) => x.id ? x.id : props.name + "-" + x.value.replace(" ", "-");

export default function SelectorButtonGroup(props){
	const actionButtons = props.buttons.map(x => 
		<SelectorButton 
		key={keyAndId(x, props)}
		id={keyAndId(x, props)}
		value={x.value}
		buttonType={props.buttonType || "radio"}
		name={props.name}
		text={x.text}
		defaultChecked={x.defaultChecked}
		/>
	);
	return (
		<ul className={styles["button-group"]}>
			{actionButtons}
		</ul>
	);
}ß