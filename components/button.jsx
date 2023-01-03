import styles from "./button.module.css";
export default function Button(props){
	let {dark, ...otherProps} = props;
	return (
		<button className={props.dark ? styles.dark : styles.normal} {...otherProps}>{props.children}</button>
	);
}