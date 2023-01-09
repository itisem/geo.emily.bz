import getUserQuizzes from "/utils/db/get-user-quizzes";
import getCategoryQuizzes from "/utils/db/get-category-quizzes";
import Head from "next/head";
import QuizContainer from "/components/quiz-container";

export default function MapQuizByCategory(props){
	const title = props.categoryType == "user" ? `quizzes by ${props.category}` : `${props.category} quizzes`;
	const info = props.categoryType == "user" ? () => "" : quiz => (<>by {quiz.user.displayName}</>);
	return (
		<>
			<Head>
				<title>{title}</title>
			</Head>
			<h1>{title}</h1>
			<QuizContainer quizzes={props.quizzes} quizInfo={info} />
		</>
	);
}

export function getServerSideProps({params}){
	let categoryType, category, quizzes;
	if(params.category[0] == "@"){
		categoryType = "user";
		category = params.category.slice(1);
		try{
			quizzes = getUserQuizzes(category);
		}
		catch(e){
			quizzes = [];
		}
		quizzes = quizzes.map(x => {
			x.url = x.frontpageURL || `@${x.displayName}/${x.id}`;
			x.user = {displayName: category};
			return x;
		});
	}
	else{
		categoryType = "category";
		category = params.category;
		quizzes = getCategoryQuizzes(category);
		quizzes = quizzes.map(x => {
			x.user = {displayName: x.displayName};
			x.title = x.altTitle;
			x.url = x.alias;
			return x;
		});
	}
	return{
		props: {
			categoryType,
			category,
			quizzes
		}
	}
}