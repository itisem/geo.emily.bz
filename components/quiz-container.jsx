import styles from "./quiz-container.module.css";
import {useState} from "react";

export default function QuizContainer({quizzes, quizInfo}){
	if(!quizInfo) quizInfo = () => "";
	return (
		<section className={styles.quizzes}>
			<div className={styles.quizcontainer}>
				{quizzes.map(quiz => 
					<div className={styles.quizbox}>
						<b><a href={`/map-quiz/${quiz.url}`}>{quiz.title}</a></b> <br/>
						{quizInfo(quiz)}
					</div>
				)}
			</div>
		</section>
	);
}