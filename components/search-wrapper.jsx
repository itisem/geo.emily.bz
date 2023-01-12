import {Index} from "flexsearch";
import {useState, cloneElement} from "react";

export default function SearchWrapper({items, searchBarText, sizeLimit, children}){
	let childrenArray = [];
	switch(typeof children){
		case "object":
			if(Array.isArray(children)) childrenArray = children;
			else childrenArray = [children];
			break;
		default:
			childrenArray = [];
	}
	searchBarText = searchBarText || "search"; // text for search bar
	sizeLimit = sizeLimit || 0; // min. items for search bar to be displayed
	const [searchText, setSearchText] = useState("");
	const index = new Index({tokenize: "full"});
	items.forEach(item => index.add(item.id, item.value));
	const searchResults = index.search(searchText);
	const displayedItems = searchText ? items.filter(x => searchResults.includes(x.id)) : items;
	return (
		<>
			{items.length >= sizeLimit ? 
				<>{searchBarText}: <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} /></>:
				""
			}
			{childrenArray.map(child => cloneElement(child, {items: displayedItems, hasSearch: !!searchText}))}
		</>
	)
}