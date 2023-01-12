import styles from "./country-container.module.css";
export default function CountryContainer({quizzes, categoryInfo, frontPageOnly}){
	console.log("aaa");
	const linkMore = !quizzes.every(x => x.isFrontPage) && frontPageOnly;
	return (
		<section className={styles["country-container"]}>
			<h2 className={styles["country-container-head"]}>{categoryInfo.emoji} {categoryInfo.name}</h2>
			<ul>
				{quizzes.map(quiz => {
					if(quiz.isFrontPage || !frontPageOnly){
						return (<li key={quiz.alias}><a href={"/map-quiz/" + quiz.alias}>{quiz.altTitle}</a></li>)
					}
				})}
			</ul>
			{linkMore ? <p className="centered"><a href={`/map-quiz/${categoryInfo.id}`}>more quizzes</a></p> : ""}
		</section>
	)
}