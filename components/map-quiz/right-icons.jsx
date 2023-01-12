import Button from "/components/button";
import styles from "./right-icons.module.css";
import {useState} from 'react';
export default function RightIcons({visibility, quiz, isLoggedIn, onClick}){
	if(!visibility) return <></>
	const [favourited, setFavourited] = useState(quiz.isFavourited);
	const title = favourited ? "remove favourite" : "add favourite";
	return (
		<div className={styles.icons}>
			<Button
				dark={true}
				onClick={
					() => {
						if(favourited){
							setFavourited(false);
							fetch(`/api/favourite/${quiz.creator}/${quiz.id}`, {method: "DELETE"});
						}
						else{
							setFavourited(true);
							fetch(`/api/favourite/${quiz.creator}/${quiz.id}`, {method: "PUT"});
						}
					}
				}
				title = {title}
			>
				{favourited ? "★": "☆"}
				<span className={styles["optional-text"]}>{title}</span>
			</Button>
			<Button
				dark={true}
				onClick={onClick}
				title = "settings"
			>
				⚙️
				<span className={styles["optional-text"]}>settings</span>
			</Button>
		</div>
	);
}