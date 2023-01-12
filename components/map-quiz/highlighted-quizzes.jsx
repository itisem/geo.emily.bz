import styles from "./highlighted-quizzes.module.css";
import CountryContainer from "./country-container";

function getQuizzesByCategory(quizzes){
	let quizzesByCategory = {};
	for(let quiz of quizzes){
		if(!quizzesByCategory[quiz.category]) quizzesByCategory[quiz.category] = [];
		quizzesByCategory[quiz.category].push(quiz);
	}
	return Object.keys(quizzesByCategory).map(category => ({category: category, quizzes: quizzesByCategory[category]}));
}

export default function HighlightedQuizzes({items, hasSearch, categoryInfo}){
	const quizzesByCategory = getQuizzesByCategory(items);
	return (
		<>
			<h2>highlighted quizzes</h2>
			<section className={styles["highlighted-quizzes"]}>
				{quizzesByCategory.map(info => (
					<CountryContainer
						quizzes={info.quizzes}
						categoryInfo={{...categoryInfo[info.category], id: info.category}}
						key={info.category}
						frontPageOnly={!hasSearch}
					/>
				))}
			</section>
		</>
	)
}