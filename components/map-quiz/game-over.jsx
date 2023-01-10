import Button from "../button";
import styles from "./game-over.module.css";
export default function GameOver({stats, onClick, visibility}){
	if(!visibility){
		return <></>;
	}
	return (
		<div className={styles.gameover}>
			<p className={styles.gameovertext}>
				game over!
			</p>
			<p className={styles.gamestats}>you got {stats.correct} out of {stats.total} questions right in {stats.time}.</p>
			<Button onClick={onClick} style={{fontSize: "1em"}}>restart</Button><br/>
			<a href="/map-quiz">&lt; back to quizzes</a>
		</div>
	)
}