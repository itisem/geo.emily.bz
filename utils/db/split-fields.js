const splitIfNotNull = (text, char) => text === null ? [] : text.split(char);

export default function splitFields(row, fields, splitChar = '\x1d'){
	if(typeof fields == "string"){
		row[fields] = splitIfNotNull(row[fields], splitChar);
		return row;
	}
	else if(Array.isArray(fields)){
		for(let field of fields){
			row[field] = splitIfNotNull(row[field], splitChar);
		}
		return row;
	}
	return null;
}