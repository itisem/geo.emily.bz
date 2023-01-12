import styles from "./top-bar.module.css";
import Button from "../button";
export default function TopBar({question, controls, visibility}){
	if(!visibility) return <></>;
	return (
		<div className={question.imageQuestion ? styles["image-question"] : styles["text-question"]}>
			<div dangerouslySetInnerHTML={{__html: question.html}}></div>
			<div>
				<Button onClick={controls.prev}>prev ←</Button>
				<Button onClick={controls.next}>next →</Button>
				<Button onClick={controls.restart}>restart</Button>
			</div>
		</div>
	)
}