import { success, error, validation } from "../../configs/response.js"
import {
	createFolder,
	listFoldersByOrg,
	findFolderById,
} from "../../models/folder.js"
import { getDb } from "../../db/db.js"
import { ObjectId } from "mongodb"
import { uuid } from "uuidv4"

const create = async (req, res) => {
	const { name, parentId } = req.body
	const { orgId: organizationId } = req.params
	const user = req.user
	if (!name || !organizationId)
		return res
			.status(422)
			.json(
				validation([
					{ field: "name/organizationId", message: "Required" },
				])
			)

	// permission: user must belong to org or be admin
	const db = getDb()
	const orgIdObj = new ObjectId(organizationId)
	const org = await db.collection("organizations").findOne({ _id: orgIdObj })
	if (!org)
		return res.status(404).json(error("Organization not found", null, 404))

	const isAdmin = user && user.role === "admin"
	const userIdObj = user ? new ObjectId(user.id) : null
	if (!isAdmin) {
		const member = await db
			.collection("organizations")
			.findOne({ _id: orgIdObj, members: userIdObj })
		if (!member)
			return res
				.status(403)
				.json(
					error(
						"Forbidden - you are not a member of this organization",
						null,
						403
					)
				)
	}

	if (parentId) {
		// parentId here is expected to be a folderId string
		const parent = await findFolderById(parentId)
		if (!parent)
			return res.status(422).json(
				validation([
					{
						field: "parentId",
						message: "Parent folder not found",
					},
				])
			)
	}

	const folderId = uuid()
	const creatorIdObj = user ? new ObjectId(user.id) : null
	const folder = {
		folderId,
		name,
		organizationId: orgIdObj,
		parentId: parentId || null,
		creatorId: creatorIdObj,
		createdAt: new Date(),
	}
	const result = await createFolder(folder)
	res.status(201).json(
		success("Folder created", { id: result.insertedId }, 201)
	)
}

const listByOrg = async (req, res) => {
	const { orgId } = req.params
	const db = getDb()
	let orgObjectId
	try {
		orgObjectId = new ObjectId(orgId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Invalid orgId" }]))
	}
	const folders = await listFoldersByOrg(orgObjectId)
	res.status(200).json(success("Folders listed", { folders }, 200))
}

const root = async (req, res) => {
	const { orgId } = req.query
	const user = req.user
	if (!orgId)
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Required" }]))

	const db = getDb()
	let orgObjectId
	try {
		orgObjectId = new ObjectId(orgId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Invalid orgId" }]))
	}

	const org = await db
		.collection("organizations")
		.findOne({ _id: orgObjectId })
	if (!org)
		return res.status(404).json(error("Organization not found", null, 404))

	// permission: user must belong to org or be admin
	const isAdmin = user && user.role === "admin"
	const userIdObj = user ? new ObjectId(user.id) : null
	if (!isAdmin) {
		const member = await db
			.collection("organizations")
			.findOne({ _id: orgObjectId, members: userIdObj })
		if (!member)
			return res
				.status(403)
				.json(
					error(
						"Forbidden - you are not a member of this organization",
						null,
						403
					)
				)
	}

	// root folders have parentId == null
	const subfolders = await db
		.collection("folders")
		.find({ organizationId: orgObjectId, parentId: null })
		.sort({ createdAt: 1 })
		.toArray()

	// root files have parentId == null
	const files = await db
		.collection("files")
		.find({ organizationId: orgObjectId, parentId: null })
		.sort({ createdAt: 1 })
		.toArray()

	res.status(200).json(
		success("Root contents", { folder: null, subfolders, files }, 200)
	)
}

const getFolderContents = async (req, res) => {
	const { folderId } = req.params
	const db = getDb()
	// folderId is a string identifier
	const folder = await db.collection("folders").findOne({ folderId })
	if (!folder)
		return res.status(404).json(error("Folder not found", null, 404))

	// permission: user must be member of the org or admin
	const user = req.user
	const isAdmin = user && user.role === "admin"
	const userIdObj = user ? new ObjectId(user.id) : null
	if (!isAdmin) {
		const member = await db
			.collection("organizations")
			.findOne({ _id: folder.organizationId, members: userIdObj })
		if (!member) return res.status(403).json(error("Forbidden", null, 403))
	}

	// parentId in subfolders is stored as folderId string
	const subfolders = await db
		.collection("folders")
		.find({ parentId: folder.folderId })
		.sort({ createdAt: 1 })
		.toArray()
	const files = await db
		.collection("files")
		.find({ parentId: folder.folderId })
		.sort({ createdAt: 1 })
		.toArray()
	res.status(200).json(
		success("Folder contents", { folder, subfolders, files }, 200)
	)
}

const updateFolder = async (req, res) => {
	const { folderId } = req.params
	const { name, parentId } = req.body
	const db = getDb()
	const folder = await db.collection("folders").findOne({ folderId })
	if (!folder)
		return res.status(404).json(error("Folder not found", null, 404))

	// permission: only org members or admin
	const user = req.user
	const isAdmin = user && user.role === "admin"
	const userIdObj = user ? new ObjectId(user.id) : null
	if (!isAdmin) {
		const member = await db
			.collection("organizations")
			.findOne({ _id: folder.organizationId, members: userIdObj })
		if (!member) return res.status(403).json(error("Forbidden", null, 403))
	}

	const update = {}
	if (name) update.name = name
	if (parentId !== undefined) update.parentId = parentId || null
	if (Object.keys(update).length === 0)
		return res
			.status(400)
			.json(validation([{ field: "body", message: "Nothing to update" }]))
	await db.collection("folders").updateOne({ folderId }, { $set: update })
	const updated = await db.collection("folders").findOne({ folderId })
	res.status(200).json(success("Folder updated", { folder: updated }, 200))
}

const deleteFolder = async (req, res) => {
	const { folderId } = req.params
	const db = getDb()
	// folderId is a string identifier
	const folder = await db.collection("folders").findOne({ folderId })
	if (!folder)
		return res.status(404).json(error("Folder not found", null, 404))

	// permission check
	const user = req.user
	const isAdmin = user && user.role === "admin"
	const userIdObj = user ? new ObjectId(user.id) : null
	if (!isAdmin) {
		const member = await db
			.collection("organizations")
			.findOne({ _id: folder.organizationId, members: userIdObj })
		if (!member) return res.status(403).json(error("Forbidden", null, 403))
	}

	// delete subfolders and files under this folder (recursive)
	// recursively delete by folderId string
	const subfolders = await db
		.collection("folders")
		.find({ parentId: folder.folderId })
		.toArray()
	for (const sf of subfolders) {
		// call deleteFolder recursively with sf.folderId
		await deleteFolder(
			{ params: { folderId: sf.folderId }, user },
			{ status: () => ({ json: () => {} }) }
		)
	}

	// delete files physically and from db; files store parentId as folderId string
	const files = await db
		.collection("files")
		.find({ parentId: folder.folderId })
		.toArray()
	for (const f of files) {
		// unlink file from disk if present
		try {
			import("fs").then(fs => fs.unlinkSync(f.path))
		} catch (e) {}
		await db.collection("files").deleteOne({ _id: f._id })
	}

	await db.collection("folders").deleteOne({ folderId: folder.folderId })
	res.status(200).json(success("Folder deleted", null, 200))
}

export {
	create,
	listByOrg,
	root,
	deleteFolder,
	getFolderContents,
	updateFolder,
}
