import { filescoll } from "../db/mongo.js"
import { ObjectId } from "mongodb"
import { general, timestamp } from "./general.js"

const filesCollection = async () => await filescoll()

// Files store organizationId as ObjectId, and parentId as folderId string (not ObjectId)
const createFileMeta = async (payload, uid) => {
	const doc = { ...payload }
	if (doc.organizationId)
		doc.organizationId =
			typeof doc.organizationId === "string"
				? new ObjectId(doc.organizationId)
				: doc.organizationId
	// parentId should be a folderId string (if provided) and left as-is
	const meta = uid ? await general(uid) : await timestamp()
	const finalDoc = { ...doc, ...meta }
	return (await filesCollection()).insertOne(finalDoc)
}

const findFiles = async query => (await filesCollection()).find(query).toArray()

const findFileById = async id => {
	const _id = typeof id === "string" ? new ObjectId(id) : id
	return (await filesCollection()).findOne({ _id })
}

export { createFileMeta, findFiles, findFileById }
