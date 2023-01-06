import {useState} from 'react';
import Button from "/components/button";


export default function FavouriteButton({isLoggedIn, isFavourited, quizId, creatorId}){
	if(!isLoggedIn) return (<></>);

	const [favourited, setFavourited] = useState(isFavourited);
	return (
		<Button
			dark={true}
			onClick={
				() => {
					if(isFavourited){
						setFavourited(false);
						fetch(`/api/favourite/${creatorId}/${quizId}`, {method: "DELETE"});
					}
					else{
						setFavourited(true);
						fetch(`/api/favourite/${creatorId}/${quizId}`, {method: "PUT"});
					}
				}
			}
		>
			{favourited ? "★": "☆"}
		</Button>
	)
}