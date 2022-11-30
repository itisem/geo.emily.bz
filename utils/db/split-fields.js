const splitIfNotNull = (text, char) => text === null ? [] : text.split(char);

export default function splitFields(row, fields, splitChar = '\x1d'){
	let newRow = {...row};
	if(typeof fields == "string"){
		newRow[fields] = splitIfNotNull(newRow[fields], splitChar);
		return newRow;
	}
	else if(Array.isArray(fields)){
		for(let field of fields){
			newRow[field] = splitIfNotNull(newRow[field], splitChar);
		}
		return newRow;
	}
	return null;
}