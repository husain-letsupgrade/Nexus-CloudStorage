import { MongoClient } from "mongodb"
import "dotenv/config"

let _db
let user_coll, files_coll, folders_coll, orgs_coll, todo_coll, learn_coll

const mongoConnect = async () => {
	return new Promise((resolve, reject) => {
		MongoClient.connect(process.env.COMMUNITY_URI, {
			useUnifiedTopology: true,
		})
			.then(client => {
				_db = client.db()
				// initialize commonly used collections so callers can import collection getters
				user_coll = _db.collection("users")
				files_coll = _db.collection("files")
				folders_coll = _db.collection("folders")
				orgs_coll = _db.collection("organizations")

				console.log("Database plugged in and healthy to serve.!")
				resolve()
			})
			.catch(err => {
				console.log("Error connecting to database", err)
				reject(err)
			})
	})
}

const getDb = () => {
	if (!_db)
		throw new Error("Database not initialized. Call mongoConnect first")
	return _db
}

const usercoll = async () => {
	getDb()
	if (user_coll) return user_coll
	throw new Error("Users collection not found")
}

const filescoll = async () => {
	getDb()
	if (files_coll) return files_coll
	throw new Error("Files collection not found")
}

const folderscoll = async () => {
	getDb()
	if (folders_coll) return folders_coll
	throw new Error("Folders collection not found")
}

const orgcoll = async () => {
	getDb()
	if (orgs_coll) return orgs_coll
	throw new Error("Organizations collection not found")
}

export { mongoConnect, getDb, usercoll, filescoll, folderscoll, orgcoll }
