import openDB from "../db/open-db";

export default function getGeoJSONFromCategory(category, user, property, propertyUser){
	const db = openDB();
	if(property && propertyUser){
		const query = db.prepare(`
			SELECT id,
				geoJSONs.user,
				shape,
				propertyName,
				propertyType,
				value
			FROM geoJSONs LEFT JOIN geoJSONProperties USING(id) LEFT JOIN geoJSONCategories ON(geoJSONs.id = geoJSONCategories.geoJSONId)
			WHERE categoryId=:category AND geoJSONCategories.categoryUser=:user AND propertyName=:property AND propertyUser=:propertyUser
		`);
		return query.all({category, user, property, propertyUser});
	}
	else{
		const query = db.prepare(`
			SELECT id,
				user,
				shape
			FROM geoJSONs LEFT JOIN geoJSONCategories ON(geoJSONs.id = geoJSONCategories.geoJSONId AND geoJSONs.user = geoJSONCategories.geoJSONUser)
			WHERE categoryId=:category AND geoJSONCategories.categoryUser=:user
		`);
		return query.all({category, user});
	}
}