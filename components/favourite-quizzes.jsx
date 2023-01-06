import styles from "./favourite-quizzes.module.css";
import {useState} from "react";

export default function FavouriteQuizzes({quizzes}){
	let [favs, setFavs] = useState(quizzes);

	const unfavourite = (id, creator) => {
		fetch(`/api/favourite/${creator}/${id}`, {method: "DELETE"}).then(x => x.json()).then(x => setFavs(x));
	}

	if(favs.length === 0) return (<></>);
	return (
		<section className={styles.favourites}>
			<h2>your favourite quizzes</h2>
			<div className={styles.favouritescontainer}>
				{favs.map(quiz => 
					<div className={styles.favouritebox}>
						<b><a href={`map-quiz/@${quiz.user.displayName}/${quiz.id}`}>{quiz.title}</a></b> <br/>
						by {quiz.user.displayName} <br />
						<a onClick={() => unfavourite(quiz.id, quiz.user.id)} className={styles.unfavourite}>remove</a>
					</div>
				)}
			</div>
		</section>
	);
}