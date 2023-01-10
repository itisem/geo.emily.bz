import styles from "./quiz-container.module.css";
import {useState, useEffect} from "react";
import lunr from "lunr";

const createSearch = (quizzes) => lunr(function(){
	this.field("title");
	this.ref("id");
	quizzes.forEach(quiz => this.add(quiz));
});

export default function QuizContainer({quizzes, quizInfo}){
	const [searchText, setSearchText] = useState("");
	const [displayedQuizzes, setDisplayedQuizzes] = useState(quizzes);
	const [quizSearch, setQuizSearch] = useState(lunr(() => {}));

	useEffect(() => {
		setQuizSearch(createSearch(quizzes));
	}, []);

	useEffect(() => {
		if(!searchText){
			setDisplayedQuizzes(quizzes);
			return;
		}
		const displayedQuizIds = quizSearch.search("*" + searchText + "*").map(x => x.ref);
		setDisplayedQuizzes(quizzes.filter(quiz => displayedQuizIds.includes(quiz.id)));
	}, [searchText]);


	if(!quizInfo) quizInfo = () => "";
	return (
		<section className={styles.quizzes}>
			{quizzes.length > 10 ?
				<>filter quiz: <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} /></> :
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