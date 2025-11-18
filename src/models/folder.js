import { folderscoll } from "../db/mongo.js"
import { general, timestamp } from "./general.js"
import {
	createFolderHelper,
	listFoldersByOrgHelper,
	findFolderByIdHelper,
} from "../helpers/folders.js"

const foldersCollection = async () => await folderscoll()

// Folder model changes: folderId is a string (unique identifier), parentId references parent.folderId (string)
const createFolder = async (folder, uid) => {
	return createFolderHelper(folder, uid)
}

const listFoldersByOrg = async orgObjectId => {
	return listFoldersByOrgHelper(orgObjectId)
}

const findFolderById = async folderId => {
	return findFolderByIdHelper(folderId)
}

export { createFolder, listFoldersByOrg, findFolderById }
