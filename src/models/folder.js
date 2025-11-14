import { folderscoll } from "../db/mongo.js"
import { general, timestamp } from "./general.js"

const foldersCollection = async () => await folderscoll()

// Folder model changes: folderId is a string (unique identifier), parentId references parent.folderId (string)
const createFolder = async (folder, uid) => {
	// folder.organizationId is expected to be an ObjectId (stored as ObjectId)
	const meta = uid ? await general(uid) : await timestamp()
	const finalDoc = { ...folder, ...meta }
	return (await foldersCollection()).insertOne(finalDoc)
}

const listFoldersByOrg = async orgObjectId => {
	return (await foldersCollection())
		.find({ organizationId: orgObjectId })
		.toArray()
}

const findFolderById = async folderId => {
	return (await foldersCollection()).findOne({ folderId })
}

export { createFolder, listFoldersByOrg, findFolderById }
