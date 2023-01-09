import styles from "./favourite-quizzes.module.css";
import QuizContainer from "./quiz-container";
import {useState} from "react";

export default function FavouriteQuizzes({quizzes, includeButton}){
	let [favs, setFavs] = useState(quizzes);

	const unfavourite = (id, creator) => {
		fetch(`/api/favourite/${creator}/${id}`, {method: "DELETE"}).then(x => x.json()).then(x => setFavs(x));
	}

	if(favs.length === 0) return (<></>);
	return (
		<>
			<h2>your favourite quizzes</h2>
			<QuizContainer quizzes={favs} quizInfo = {quiz => (
				<>
					by {quiz.user.displayName}<br />
					<a onClick={() => unfavourite(quiz.id, quiz.user.id)} className={styles.unfavourite}>remove</a>
				</>
			)} />
		</>
	);
}