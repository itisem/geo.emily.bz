import openDB from './open-db';

export default function getFavouriteQuizzes(user){
	const db = openDB();
	return db.prepare(`
		SELECT quizzes.id, creator, displayName, title, addedAt
		FROM favouriteQuizzes
			INNER JOIN quizzes ON (favouriteQuizzes.creator = quizzes.user AND favouriteQuizzes.id = quizzes.id)
			INNER JOIN users ON (favouriteQuizzes.creator = users.id)
		WHERE favouriteQuizzes.user = ?
		ORDER BY addedAt DESC
	`).all(user).map(x => ({
		user: {
			id: x.creator,
			displayName: x.displayName
		},
		id: x.id,
		title: x.title
	}));
}