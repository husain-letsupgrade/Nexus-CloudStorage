import { success, error, validation } from "../../configs/response.js"
import { createFileMeta, findFiles } from "../../models/file.js"
import { getDb } from "../../db/db.js"
import { ObjectId } from "mongodb"
import fs from "fs"
import path from "path"

const uploadFile = async (req, res) => {
	if (!req.file)
		return res
			.status(422)
			.json(validation([{ field: "file", message: "File required" }]))
	const { originalname, mimetype, path: filePath } = req.file
	const { description, tags, folderId } = req.body
	const { orgId: organizationId } = req.params
	const user = req.user
	if (!organizationId)
		return res
			.status(422)
			.json(
				validation([{ field: "organizationId", message: "Required" }])
			)
	const db = getDb()

	let orgObjectId
	try {
		orgObjectId = new ObjectId(organizationId)
	} catch (e) {
		return res
			.status(422)
			.json(
				validation([
					{ field: "organizationId", message: "Invalid orgId" },
				])
			)
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

	let parentFolderId = null
	if (folderId) {
		// folderId here is expected to be the folder.folderId string
		const folder = await db.collection("folders").findOne({ folderId })
		if (!folder)
			return res
				.status(422)
				.json(
					validation([
						{ field: "folderId", message: "Folder not found" },
					])
				)
		if (String(folder.organizationId) !== String(orgObjectId)) {
			return res.status(422).json(
				validation([
					{
						field: "folderId",
						message:
							"Folder does not belong to the provided organization",
					},
				])
			)
		}
		parentFolderId = folder.folderId
	}

	try {
		const creatorIdObj = user ? new ObjectId(user.id) : null
		const meta = {
			name: originalname,
			path: filePath,
			mimetype,
			description,
			tags: tags ? tags.split(",").map(t => t.trim()) : [],
			organizationId: orgObjectId,
			parentId: parentFolderId,
			creatorId: creatorIdObj,
			createdAt: new Date(),
		}
		const result = await createFileMeta(meta)
		const saved = await findFiles({ _id: result.insertedId })
		res.status(201).json(success("File uploaded", { file: saved[0] }, 201))
	} catch (e) {
		res.status(500).json(
			error("Upload failed", { message: e.message }, 500)
		)
	}
}

const search = async (req, res) => {
	const { q } = req.query
	const query = {}
	const user = req.user
	if (!user) return res.status(401).json(error("Unauthorized", null, 401))

	// Admins should use the admin search endpoint
	if (user.role === "admin") {
		return res
			.status(400)
			.json(
				error(
					"Admins must use /admin/orgs/:orgId/files/search for file search",
					null,
					400
				)
			)
	}

	if (q) {
		// simple search across name, description, tags
		query.$or = [
			{ name: { $regex: q, $options: "i" } },
			{ description: { $regex: q, $options: "i" } },
			{ tags: { $in: [new RegExp(q, "i")] } },
		]
	}
	// restrict to orgs the user belongs to
	const db = getDb()
	const userDoc = await db
		.collection("users")
		.findOne({ _id: new ObjectId(user.id) })
	const orgIds = (userDoc && userDoc.organizations) || []
	query.organizationId = { $in: orgIds }

	const results = await findFiles(query)
	res.status(200).json(success("Search results", { results }, 200))
}

export { uploadFile, search }

const getFileById = async (req, res) => {
	const { fileId } = req.params
	let fileObjectId
	try {
		fileObjectId = new ObjectId(fileId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "fileId", message: "Invalid fileId" }]))
	}
	const db = getDb()
	const file = await db.collection("files").findOne({ _id: fileObjectId })
	if (!file) return res.status(404).json(error("File not found", null, 404))
	res.status(200).json(success("File fetched", { file }, 200))
}

const updateFile = async (req, res) => {
	const { fileId } = req.params
	const { name, description, tags } = req.body
	let fileObjectId
	try {
		fileObjectId = new ObjectId(fileId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "fileId", message: "Invalid fileId" }]))
	}
	const db = getDb()
	const file = await db.collection("files").findOne({ _id: fileObjectId })
	if (!file) return res.status(404).json(error("File not found", null, 404))

	// permission: user must be member or admin
	const user = req.user
	const isAdmin = user && user.role === "admin"
	const userIdObj = user ? new ObjectId(user.id) : null
	if (!isAdmin) {
		const member = await db
			.collection("organizations")
			.findOne({ _id: file.organizationId, members: userIdObj })
		if (!member) return res.status(403).json(error("Forbidden", null, 403))
	}

	const update = {}
	if (name) update.name = name
	if (description) update.description = description
	if (tags) update.tags = tags.split(",").map(t => t.trim())
	if (Object.keys(update).length === 0)
		return res
			.status(400)
			.json(validation([{ field: "body", message: "Nothing to update" }]))
	await db
		.collection("files")
		.updateOne({ _id: fileObjectId }, { $set: update })
	const updated = await db.collection("files").findOne({ _id: fileObjectId })
	res.status(200).json(success("File updated", { file: updated }, 200))
}

const deleteFile = async (req, res) => {
	const { fileId } = req.params
	let fileObjectId
	try {
		fileObjectId = new ObjectId(fileId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "fileId", message: "Invalid fileId" }]))
	}
	const db = getDb()
	const file = await db.collection("files").findOne({ _id: fileObjectId })
	if (!file) return res.status(404).json(error("File not found", null, 404))

	const user = req.user
	const isAdmin = user && user.role === "admin"
	const userIdObj = user ? new ObjectId(user.id) : null
	if (!isAdmin) {
		const member = await db
			.collection("organizations")
			.findOne({ _id: file.organizationId, members: userIdObj })
		if (!member) return res.status(403).json(error("Forbidden", null, 403))
	}

	// delete physical file
	try {
		if (file.path) fs.unlinkSync(path.resolve(file.path))
	} catch (e) {}
	await db.collection("files").deleteOne({ _id: fileObjectId })
	res.status(200).json(success("File deleted", null, 200))
}

const downloadFile = async (req, res) => {
	const { fileId } = req.params
	let fileObjectId
	try {
		fileObjectId = new ObjectId(fileId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "fileId", message: "Invalid fileId" }]))
	}
	const db = getDb()
	const file = await db.collection("files").findOne({ _id: fileObjectId })
	if (!file) return res.status(404).json(error("File not found", null, 404))

	const user = req.user
	const isAdmin = user && user.role === "admin"
	const userIdObj = user ? new ObjectId(user.id) : null
	if (!isAdmin) {
		const member = await db
			.collection("organizations")
			.findOne({ _id: file.organizationId, members: userIdObj })
		if (!member) return res.status(403).json(error("Forbidden", null, 403))
	}

	if (!file.path)
		return res.status(404).json(error("File path missing", null, 404))
	const fullPath = path.resolve(file.path)
	res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`)
	res.setHeader("Content-Type", file.mimetype || "application/octet-stream")
	const stream = fs.createReadStream(fullPath)
	stream.pipe(res)
}

export { getFileById, updateFile, deleteFile, downloadFile }
