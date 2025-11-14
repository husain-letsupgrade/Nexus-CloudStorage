import { usercoll } from "../db/mongo.js"
import { general, timestamp } from "./general.js"

const usersCollection = async () => await usercoll()

const createUser = async (user, firebaseUid) => {
	const meta = firebaseUid ? await general(firebaseUid) : await timestamp()
	const doc = { ...user, ...meta }
	if (firebaseUid) doc.firebaseUid = firebaseUid
	return (await usersCollection()).insertOne(doc)
}

const findUserByEmail = async email => {
	return (await usersCollection()).findOne({ email })
}

const findUserById = async id => {
	return (await usersCollection()).findOne({ _id: id })
}

export { createUser, findUserByEmail, findUserById }
