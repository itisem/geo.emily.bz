import QuizContainerBase from "./quiz-container-base";
import SearchWrapper from "../search-wrapper";

export default function QuizContainer({quizzes, quizInfo}){
	quizzes.forEach(quiz => {quiz.id = quiz.url; quiz.value = quiz.title;});
	return (
		<SearchWrapper
			searchBarText="find quiz"
			sizeLimit={10}
			items={quizzes}
		>
			<QuizContainerBase info={quizInfo} />
		</SearchWrapper>
	)
}