import styles from "./quiz-progress.module.css";
export default function QuizProgress({current, total}){
	return <progress className={styles.progress} value={current} max={total} />
}