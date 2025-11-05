import { getDb } from "../db/mongo.js"

const foldersCollection = () => getDb().collection("folders")

// Folder model changes: folderId is a string (unique identifier), parentId references parent.folderId (string)
const createFolder = async folder => {
	// folder.organizationId is expected to be an ObjectId (stored as ObjectId)
	return foldersCollection().insertOne(folder)
}

const listFoldersByOrg = async orgObjectId => {
	return foldersCollection().find({ organizationId: orgObjectId }).toArray()
}

const findFolderById = async folderId => {
	return foldersCollection().findOne({ folderId })
}

export { createFolder, listFoldersByOrg, findFolderById }
