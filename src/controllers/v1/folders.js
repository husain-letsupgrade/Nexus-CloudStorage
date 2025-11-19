import { success, error, validation } from "../../configs/response.js"
import { ObjectId } from "mongodb"
import { getDb } from "../../db/mongo.js"
import {
	createFolderHelper,
	listFoldersByOrgHelper,
	findFolderByIdHelper,
	deleteFolderHelper,
	updateFolderHelper,
	getRootContentsHelper,
	getFolderContentsHelper,
} from "../../helpers/folders.js"
import { v4 as uuidv4 } from "uuid"

const create = async (req, res) => {
	const { name, parentId } = req.body
	const { orgId } = req.params
	const user = req.user
//STARAT : not needed
	if (!name || !orgId)
		return res
			.status(422)
			.json(validation([{ field: "name/orgId", message: "Required" }]))
// END : not needed
	try {

		//dont call the db if not needed
		const db = getDb()
		const folderId = uuidv4()
		const folder = {
			folderId,
			name,
			organizationId: new ObjectId(orgId),
			parentId: parentId || null,
			creatorId: user ? new ObjectId(user.id) : null,
			createdAt: new Date(),
		}
		const result = await createFolderHelper(folder)
		res.status(201).json(
			success("Folder created", { id: result.insertedId }, 201)
		)
	} catch (e) {
		res.status(500).json(
			error("Error creating folder", { message: e.message }, 500)
		)
	}
}

// List folders by org
const listByOrg = async (req, res) => {
	const { orgId } = req.params
	try {

		// why initialise folders 
		const folders = await listFoldersByOrgHelper(new ObjectId(orgId))
		res.status(200).json(success("Folders listed", { folders }, 200))
	} catch (e) {
		res.status(500).json(
			error("Error listing folders", { message: e.message }, 500)
		)
	}
}

// Get root folder contents
const root = async (req, res) => {
	const { orgId } = req.query

	//STARAT : not needed
	if (!orgId)
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Required" }]))
// END : not needed
	try {
		const db = getDb()
		const orgIdObj = new ObjectId(orgId)
		const contents = await getRootContentsHelper(orgIdObj, db)
		res.status(200).json(success("Root contents", contents, 200))
	} catch (e) {
		res.status(500).json(
			error("Error fetching root contents", { message: e.message }, 500)
		)
	}
}

// Get folder contents
const getFolderContents = async (req, res) => {
	const { folderId } = req.params
	try {
		const db = getDb() // why initialise db here
		const contents = await getFolderContentsHelper(folderId, db)
		res.status(200).json(success("Folder contents", contents, 200))
	} catch (e) {
		res.status(500).json(
			error("Error fetching folder contents", { message: e.message }, 500)
		)
	}
}

// Update folder
const updateFolder = async (req, res) => {
	const { folderId } = req.params
	const { name, parentId } = req.body
	try {
		// why initialise db here
		const db = getDb()
		const updated = await updateFolderHelper(
			folderId,
			{ name, parentId: parentId || null },
			db
		)
		res.status(200).json(
			success("Folder updated", { folder: updated }, 200)
		)
	} catch (e) {
		res.status(500).json(
			error("Error updating folder", { message: e.message }, 500)
		)
	}
}

// Delete folder
const deleteFolder = async (req, res) => {
	const { folderId } = req.params
	try {
		// why initialise db here
		const db = getDb()
		await deleteFolderHelper(folderId, db)
		res.status(200).json(success("Folder deleted", null, 200))
	} catch (e) {
		//better error handling variable name
		res.status(500).json(
			error("Error deleting folder", { message: e.message }, 500)
		)
	}
}

export {
	create,
	listByOrg,
	root,
	getFolderContents,
	updateFolder,
	deleteFolder,
}
