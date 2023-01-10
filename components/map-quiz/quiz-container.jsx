import styles from "./quiz-container.module.css";
import {useState} from "react";
import {Index} from "flexsearch";

export default function QuizContainer({quizzes, quizInfo}){
	const [searchText, setSearchText] = useState("");
	const index = new Index({tokenize: "full"});
	quizzes.forEach(quiz => index.add(quiz.url, quiz.title));
	const searchResults = index.search(searchText);
	const displayedQuizzes = searchText ? quizzes.filter(x => searchResults.includes(x.url)) : quizzes;

	if(!quizInfo) quizInfo = () => "";
	return (
		<section className={styles.quizzes}>
			{quizzes.length > 10 ?
				<>filter quizzes: <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} /></> :
				""
			} 
			<div className={styles.quizcontainer}>
				{displayedQuizzes.map(quiz => 
					<div className={styles.quizbox} key={JSON.stringify(quiz)}>
						<b><a href={`/map-quiz/${quiz.url}`} title={quiz.title}>{quiz.title}</a></b> <br/>
						{quizInfo(quiz)}
					</div>
				)}
			</div>
		</section>
	);
}