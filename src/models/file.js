import { getDb } from "../db/db.js"
import { ObjectId } from "mongodb"

const filesCollection = () => getDb().collection("files")

// Files store organizationId as ObjectId, and parentId as folderId string (not ObjectId)
const createFileMeta = async meta => {
	if (meta.organizationId)
		meta.organizationId =
			typeof meta.organizationId === "string"
				? new ObjectId(meta.organizationId)
				: meta.organizationId
	// parentId should be a folderId string (if provided) and left as-is
	return filesCollection().insertOne(meta)
}

const findFiles = async query => filesCollection().find(query).toArray()

const findFileById = async id => {
	const _id = typeof id === "string" ? new ObjectId(id) : id
	return filesCollection().findOne({ _id })
}

export { createFileMeta, findFiles, findFileById }
