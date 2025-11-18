import { filescoll } from "../db/mongo.js"
import { ObjectId } from "mongodb"
import { general, timestamp } from "../models/general.js"
import { getDb } from "../db/mongo.js"
import { success, error, validation } from "../configs/response.js"
import {
	upload,
	deleteFile as s3DeleteFile,
	getFile,
	renameFile,
} from "../services/upload.js"
import { Readable } from "stream"
import sizeOf from "image-size"
import path from "path"

const filesCollection = async () => await filescoll()

// Helper function to create file metadata
const createFileMetaHelper = async (payload, uid) => {
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

// Helper function to find files
const findFilesHelper = async query => {
	return (await filesCollection()).find(query).toArray()
}

// Helper function to find file by ID
const findFileByIdHelper = async id => {
	const _id = typeof id === "string" ? new ObjectId(id) : id
	return (await filesCollection()).findOne({ _id })
}

// Helper function to format file size
const formatFileSizeHelper = bytes => {
	if (bytes < 1024) return bytes + " B"
	else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
	else if (bytes < 1024 * 1024 * 1024)
		return (bytes / (1024 * 1024)).toFixed(2) + " MB"
	else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
}

// Helper function to analyze file metadata
const analyzeFileHelper = file => {
	const metadata = {
		size: file.size,
		sizeFormatted: formatFileSizeHelper(file.size),
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

// Helper function to upload file
const uploadFileHelper = async (
	files,
	description,
	tags,
	organizationId,
	folderId,
	user
) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!files || files.length === 0) {
				return reject({
					code: 422,
					success: false,
					error: true,
					message: "At least one file is required",
				})
			}

			if (!organizationId) {
				return reject({
					code: 422,
					success: false,
					error: true,
					message: "Organization ID is required",
				})
			}

			const db = getDb()
			let orgObjectId

			try {
				orgObjectId = new ObjectId(organizationId)
			} catch (e) {
				return reject({
					code: 422,
					success: false,
					error: true,
					message: "Invalid organizationId",
				})
			}

			const org = await db
				.collection("organizations")
				.findOne({ _id: orgObjectId })
			if (!org) {
				return reject({
					code: 404,
					success: false,
					error: true,
					message: "Organization not found",
				})
			}

			// permission: user must belong to org or be admin
			const isAdmin = user && user.role === "admin"
			const userIdObj = user ? new ObjectId(user.id) : null
			if (!isAdmin) {
				const member = await db
					.collection("organizations")
					.findOne({ _id: orgObjectId, members: userIdObj })
				if (!member) {
					return reject({
						code: 403,
						success: false,
						error: true,
						message:
							"Forbidden - you are not a member of this organization",
					})
				}
			}

			let parentFolderId = null
			if (folderId) {
				const folder = await db
					.collection("folders")
					.findOne({ folderId })
				if (!folder) {
					return reject({
						code: 422,
						success: false,
						error: true,
						message: "Folder not found",
					})
				}
				if (String(folder.organizationId) !== String(orgObjectId)) {
					return reject({
						code: 422,
						success: false,
						error: true,
						message:
							"Folder does not belong to the provided organization",
					})
				}
				parentFolderId = folder.folderId
			}

			const creatorIdObj = user ? new ObjectId(user.id) : null
			const s3Path = parentFolderId ? `${parentFolderId}/` : ""
			const uploadedFiles = []

			// Process each file
			for (const file of files) {
				try {
					// Upload to S3 with timestamped name
					const s3Result = await upload(
						s3Path,
						file.originalname,
						file.buffer
					)
					console.log("Processing file metadata:", file.originalname)

					// Analyze file and get metadata
					const fileAnalysis = analyzeFileHelper(file)

					const meta = {
						name: file.originalname,
						basename: s3Result.basename,
						path: s3Result.key,
						imgUrl: s3Result.location,
						size: fileAnalysis.size,
						extension: fileAnalysis.extension,
						dimensions: fileAnalysis.dimensions,
						mimetype: file.mimetype,
						description,
						tags: tags ? tags.split(",").map(t => t.trim()) : [],
						organizationId: orgObjectId,
						parentId: parentFolderId,
						creatorId: creatorIdObj,
						createdAt: new Date(),
					}

					const result = await createFileMetaHelper(meta)
					const saved = await findFilesHelper({
						_id: result.insertedId,
					})
					uploadedFiles.push(saved[0])
				} catch (err) {
					console.error(
						`Failed to upload file ${file.originalname}:`,
						err
					)
				}
			}

			if (uploadedFiles.length === 0) {
				return reject({
					code: 500,
					success: false,
					error: true,
					message: "All file uploads failed",
				})
			}

			let response = {
				success: true,
				error: false,
				data: {
					message: `${uploadedFiles.length} file(s) uploaded successfully`,
					files: uploadedFiles,
				},
			}
			resolve(response)
		} catch (err) {
			let response = {
				success: false,
				error: true,
				message: err?.message || "Internal Server Error",
			}
			reject(response)
		}
	})
}

// Helper function to search files
const searchFileHelper = async (q, user) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!user) {
				return reject({
					code: 401,
					success: false,
					error: true,
					message: "Unauthorized",
				})
			}

			// Admins should use the admin search endpoint
			if (user.role === "admin") {
				return reject({
					code: 400,
					success: false,
					error: true,
					message:
						"Admins must use /admin/orgs/:orgId/files/search for file search",
				})
			}

			const query = {}
			if (q) {
				query.$or = [
					{ name: { $regex: q, $options: "i" } },
					{ description: { $regex: q, $options: "i" } },
					{ tags: { $in: [new RegExp(q, "i")] } },
				]
			}

			const db = getDb()
			const userDoc = await db
				.collection("users")
				.findOne({ _id: new ObjectId(user.id) })
			const orgIds = (userDoc && userDoc.organizations) || []
			query.organizationId = { $in: orgIds }

			const results = await findFilesHelper(query)

			let response = {
				success: true,
				error: false,
				data: { results },
			}
			resolve(response)
		} catch (err) {
			let response = {
				success: false,
				error: true,
				message: err?.message || "Internal Server Error",
			}
			reject(response)
		}
	})
}

// Helper function to get file by ID
const getFileByIdHelper = async fileId => {
	return new Promise(async (resolve, reject) => {
		try {
			let fileObjectId
			try {
				fileObjectId = new ObjectId(fileId)
			} catch (e) {
				return reject({
					code: 422,
					success: false,
					error: true,
					message: "Invalid fileId",
				})
			}

			const db = getDb()
			const file = await db
				.collection("files")
				.findOne({ _id: fileObjectId })
			if (!file) {
				return reject({
					code: 404,
					success: false,
					error: true,
					message: "File not found",
				})
			}

			let response = {
				success: true,
				error: false,
				data: { file },
			}
			resolve(response)
		} catch (err) {
			let response = {
				success: false,
				error: true,
				message: err?.message || "Internal Server Error",
			}
			reject(response)
		}
	})
}

// Helper function to update file
const updateFileHelper = async (fileId, name, description, tags, user) => {
	return new Promise(async (resolve, reject) => {
		try {
			let fileObjectId
			try {
				fileObjectId = new ObjectId(fileId)
			} catch (e) {
				return reject({
					code: 422,
					success: false,
					error: true,
					message: "Invalid fileId",
				})
			}

			const db = getDb()
			const file = await db
				.collection("files")
				.findOne({ _id: fileObjectId })
			if (!file) {
				return reject({
					code: 404,
					success: false,
					error: true,
					message: "File not found",
				})
			}

			// permission: user must be member or admin
			const isAdmin = user && user.role === "admin"
			const userIdObj = user ? new ObjectId(user.id) : null
			if (!isAdmin) {
				const member = await db
					.collection("organizations")
					.findOne({ _id: file.organizationId, members: userIdObj })
				if (!member) {
					return reject({
						code: 403,
						success: false,
						error: true,
						message: "Forbidden",
					})
				}
			}

			const update = {}
			if (name) update.name = name
			if (description) update.description = description
			if (tags) update.tags = tags.split(",").map(t => t.trim())

			if (Object.keys(update).length === 0) {
				return reject({
					code: 400,
					success: false,
					error: true,
					message: "Nothing to update",
				})
			}

			await db
				.collection("files")
				.updateOne({ _id: fileObjectId }, { $set: update })
			const updated = await db
				.collection("files")
				.findOne({ _id: fileObjectId })

			let response = {
				success: true,
				error: false,
				data: { file: updated },
			}
			resolve(response)
		} catch (err) {
			let response = {
				success: false,
				error: true,
				message: err?.message || "Internal Server Error",
			}
			reject(response)
		}
	})
}

// Helper function to delete file
const deleteFileHelper = async (fileId, user) => {
	return new Promise(async (resolve, reject) => {
		try {
			let fileObjectId
			try {
				fileObjectId = new ObjectId(fileId)
			} catch (e) {
				return reject({
					code: 422,
					success: false,
					error: true,
					message: "Invalid fileId",
				})
			}

			const db = getDb()
			const file = await db
				.collection("files")
				.findOne({ _id: fileObjectId })
			if (!file) {
				return reject({
					code: 404,
					success: false,
					error: true,
					message: "File not found",
				})
			}

			const isAdmin = user && user.role === "admin"
			const userIdObj = user ? new ObjectId(user.id) : null
			if (!isAdmin) {
				const member = await db
					.collection("organizations")
					.findOne({ _id: file.organizationId, members: userIdObj })
				if (!member) {
					return reject({
						code: 403,
						success: false,
						error: true,
						message: "Forbidden",
					})
				}
			}

			// Delete from S3
			if (file.path) {
				await s3DeleteFile(file.path)
			}
			await db.collection("files").deleteOne({ _id: fileObjectId })

			let response = {
				success: true,
				error: false,
				message: "File deleted",
			}
			resolve(response)
		} catch (err) {
			let response = {
				success: false,
				error: true,
				message: err?.message || "Internal Server Error",
			}
			reject(response)
		}
	})
}

// Helper function to download file
const downloadFileHelper = async (fileId, user) => {
	return new Promise(async (resolve, reject) => {
		try {
			let fileObjectId
			try {
				fileObjectId = new ObjectId(fileId)
			} catch (e) {
				return reject({
					code: 422,
					success: false,
					error: true,
					message: "Invalid fileId",
				})
			}

			const db = getDb()
			const file = await db
				.collection("files")
				.findOne({ _id: fileObjectId })
			if (!file) {
				return reject({
					code: 404,
					success: false,
					error: true,
					message: "File not found",
				})
			}

			const isAdmin = user && user.role === "admin"
			const userIdObj = user ? new ObjectId(user.id) : null
			if (!isAdmin) {
				const member = await db
					.collection("organizations")
					.findOne({ _id: file.organizationId, members: userIdObj })
				if (!member) {
					return reject({
						code: 403,
						success: false,
						error: true,
						message: "Forbidden",
					})
				}
			}

			if (!file.path) {
				return reject({
					code: 404,
					success: false,
					error: true,
					message: "File path missing",
				})
			}

			// Get file from S3 using path
			const s3Object = await getFile(file.path)

			let response = {
				success: true,
				error: false,
				data: {
					file,
					stream: s3Object.Body,
				},
			}
			resolve(response)
		} catch (err) {
			let response = {
				success: false,
				error: true,
				message: err?.message || "Internal Server Error",
			}
			reject(response)
		}
	})
}

export {
	createFileMetaHelper,
	findFilesHelper,
	findFileByIdHelper,
	formatFileSizeHelper,
	analyzeFileHelper,
	uploadFileHelper,
	searchFileHelper,
	getFileByIdHelper,
	updateFileHelper,
	deleteFileHelper,
	downloadFileHelper,
}
