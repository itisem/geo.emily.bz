import styles from "./quiz-container-base.module.css";

export default function QuizContainerBase({items, info}){
	if(!info) info = () => "";
	return (
		<div className={styles["quiz-container"]}>
			{items.map(quiz => 
				<div className={styles["quiz-box"]} key={JSON.stringify(quiz)}>
					<b><a href={`/map-quiz/${quiz.url}`} title={quiz.title}>{quiz.title}</a></b> <br/>
					{info(quiz)}
				</div>
			)}
		</div>
	);
}