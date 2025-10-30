import { MongoClient } from "mongodb"
import "dotenv/config"

let _db

const mongoConnect = async () => {
	return new Promise((resolve, reject) => {
		MongoClient.connect(process.env.COMMUNITY_URI, {
			useUnifiedTopology: true,
		})
			.then(client => {
				_db = client.db()
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
		throw new Error("Database not initialized. Call mongoConnect first.")
	return _db
}

export { mongoConnect, getDb }
