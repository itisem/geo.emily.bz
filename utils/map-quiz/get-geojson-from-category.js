import openDB from "../db/open-db";
import splitFields from '../db/split-fields';

function propertyFields(row){
	let splitRow = splitFields(row, ['propertyNames', 'propertyTypes', 'propertyValues']);
	let properties = {};
	for(let i = 0; i < splitRow.propertyNames.length; i++){
		properties[splitRow.propertyNames[i]] = {
			"type": splitRow.propertyTypes[i],
			"value": splitRow.propertyValues[i]
		}
	}
	return {
		id: row.id,
		user: row.user,
		shape: row.shape,
		properties: properties
	}
}

export default function getGeoJSONFromCategory(category, user, properties = null){
	const db = openDB();
	if(properties){
		const query = db.prepare(`
			SELECT id,
				geoJSONs.user,
				shape,
				GROUP_CONCAT(propertyName,CHAR(0x1D)) as propertyNames,
				GROUP_CONCAT(propertyType,CHAR(0x1D)) as propertyTypes,
				GROUP_CONCAT(value,CHAR(0x1D)) AS propertyValues
			FROM geoJSONs LEFT JOIN geoJSONProperties USING(id) LEFT JOIN geoJSONCategories ON(geoJSONs.id = geoJSONCategories.geoJSONId)
			WHERE categoryId IN (${category.map(() => '?').join(',')}) AND geoJSONCategories.categoryUser = ? AND propertyName IN (${properties.map(() => '?').join(',')})
			GROUP BY id
		`);
		return query.all([...category, user, ...properties]).map(x => propertyFields(x));
	}
	else{
		const query = db.prepare(`
			SELECT id,
				user,
				shape,
			FROM geoJSONs LEFT JOIN geoJSONCategories ON(geoJSONs.id = geoJSONCategories.geoJSONId AND geoJSONs.user = geoJSONCategories.geoJSONUser)
			WHERE categoryId IN (${category.map(() => '?').join(',')})
		`);
		return query.all(category);
	}
}