import Database from 'better-sqlite3';

export default function openDB(){
	return new Database(process.cwd() + "/data/data.db");
}