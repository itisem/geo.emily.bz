import FavouriteButton from "/components/map-quiz/favourite-button";
import Button from "/components/button";
import styles from "./right-icons.module.css";
export default function RightIcons({visibility, quiz, isLoggedIn, onClick}){
	if(!visibility) return <></>
	return (
		<div className={styles.icons}>
			<FavouriteButton isLoggedIn={isLoggedIn} isFavourited={quiz.isFavourited} quizId={quiz.id} creatorId={quiz.creator} />
			<Button
				dark={true}
				onClick={onClick}
				title = "settings"
			>
				⚙️
			</Button>
		</div>
	);
}