import Database from 'better-sqlite3';

export default function relativePathDB(relativePath){
	return new Database(process.cwd() + relativePath)
}