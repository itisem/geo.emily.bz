export default function SelectorButton(props){
	return (
		<li>
			<input type="radio" value={props.value} id={props.id} name={props.name} defaultChecked={props.defaultChecked}  />
			<label className="button-label" htmlFor={props.id}>{props.text}</label>
		</li>
	);
}