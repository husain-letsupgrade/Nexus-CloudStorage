import { success, error, validation } from "../../configs/response.js"
import { createFileMeta, findFiles } from "../../models/file.js"
import { getDb } from "../../db/mongo.js"
import { ObjectId } from "mongodb"
import {
	upload,
	deleteFile as s3DeleteFile,
	getFile,
	renameFile,
} from "../../services/upload.js"
import { Readable } from "stream"
import sizeOf from "image-size"
import path from "path"

// Helper function to format file size
const formatFileSize = bytes => {
	if (bytes < 1024) return bytes + " B"
	else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
	else if (bytes < 1024 * 1024 * 1024)
		return (bytes / (1024 * 1024)).toFixed(2) + " MB"
	else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
}

// Helper function to analyze file metadata
const analyzeFile = file => {
	const metadata = {
		size: file.size,
		sizeFormatted: formatFileSize(file.size),
		extension: path.extname(file.originalname).toLowerCase(),
		dimensions: null,
	}

	// Check if it's an image by MIME type
	if (file.mimetype.startsWith("image/")) {
		try {
			const dimensions = sizeOf(file.buffer)
			metadata.dimensions = {
				width: dimensions.width,
				height: dimensions.height,
				type: dimensions.type,
			}
		} catch (err) {
			console.error("Error getting image dimensions:", err)
		}
	}

	console.log("File analysis:", {
		name: file.originalname,
		size: metadata.sizeFormatted,
		extension: metadata.extension,
		dimensions: metadata.dimensions,
	})

	return metadata
}

const uploadFile = async (req, res) => {
	if (!req.files || req.files.length === 0)
		return res.status(422).json(
			validation([
				{
					field: "files",
					message: "At least one file is required",
				},
			])
		)

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
		const s3Path = parentFolderId ? `${parentFolderId}/` : ""

		const uploadedFiles = []

		// Process each file
		for (const file of req.files) {
			try {
				// Upload to S3 with timestamped name
				const s3Result = await upload(
					s3Path,
					file.originalname,
					file.buffer
				)
				console.log("Processing file metadata:", file.originalname)

				// Analyze file and get metadata
				const fileAnalysis = analyzeFile(file)

				const meta = {
					name: file.originalname, // Display name (can be changed)
					basename: s3Result.basename, // Permanent S3 filename with timestamp
					path: s3Result.key, // Full S3 key including path
					imgUrl: s3Result.location, // Full S3 URL (renamed from location)
					size: fileAnalysis.size, // File size in bytes
					extension: fileAnalysis.extension, // File extension
					dimensions: fileAnalysis.dimensions, // Image dimensions if applicable
					mimetype: file.mimetype,
					description,
					tags: tags ? tags.split(",").map(t => t.trim()) : [],
					organizationId: orgObjectId,
					parentId: parentFolderId,
					creatorId: creatorIdObj,
					createdAt: new Date(),
				}

				const result = await createFileMeta(meta)
				const saved = await findFiles({ _id: result.insertedId })
				uploadedFiles.push(saved[0])
			} catch (err) {
				// If a single file fails, continue with others but log the error
				console.error(
					`Failed to upload file ${file.originalname}:`,
					err
				)
			}
		}

		if (uploadedFiles.length === 0) {
			return res
				.status(500)
				.json(error("All file uploads failed", null, 500))
		}

		res.status(201).json(
			success(
				`${uploadedFiles.length} file(s) uploaded successfully`,
				{ files: uploadedFiles },
				201
			)
		)
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

	try {
		// Only update MongoDB fields, don't change S3
		await db
			.collection("files")
			.updateOne({ _id: fileObjectId }, { $set: update })
		const updated = await db
			.collection("files")
			.findOne({ _id: fileObjectId })
		res.status(200).json(success("File updated", { file: updated }, 200))
	} catch (e) {
		res.status(500).json(
			error("Update failed", { message: e.message }, 500)
		)
	}
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

	try {
		// Delete from S3
		if (file.path) {
			await s3DeleteFile(file.path)
		}
		await db.collection("files").deleteOne({ _id: fileObjectId })
		res.status(200).json(success("File deleted", null, 200))
	} catch (e) {
		res.status(500).json(
			error("Delete failed", { message: e.message }, 500)
		)
	}
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

	try {
		// Get file from S3 using path (which contains basename)
		const s3Object = await getFile(file.path)

		// Use display name for download, but file is fetched using basename
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${file.name}"`
		)
		res.setHeader(
			"Content-Type",
			file.mimetype || "application/octet-stream"
		)

		// Convert S3 readable stream to response
		const stream = s3Object.Body
		if (stream instanceof Readable) {
			stream.pipe(res)
		} else {
			throw new Error("Invalid stream from S3")
		}
	} catch (e) {
		res.status(500).json(
			error("Download failed", { message: e.message }, 500)
		)
	}
}

export { getFileById, updateFile, deleteFile, downloadFile }
