import { getDb } from "../db/db.js"

const usersCollection = () => getDb().collection("users")

const createUser = async user => {
	return usersCollection().insertOne(user)
}

const findUserByEmail = async email => {
	return usersCollection().findOne({ email })
}

const findUserById = async id => {
	return usersCollection().findOne({ _id: id })
}

export { createUser, findUserByEmail, findUserById }
