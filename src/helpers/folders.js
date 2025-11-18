import { folderscoll } from "../db/mongo.js"
import { ObjectId } from "mongodb"
import { deleteFile as s3DeleteFile, renameFile } from "../services/upload.js"

const foldersCollection = async () => await folderscoll()

// Create folder
const createFolderHelper = async folder => {
	const db = await foldersCollection()
	return db.insertOne(folder)
}

// List folders by organization
const listFoldersByOrgHelper = async orgObjectId => {
	const db = await foldersCollection()
	return db.find({ organizationId: orgObjectId }).toArray()
}

// Find folder by folderId string
const findFolderByIdHelper = async folderId => {
	const db = await foldersCollection()
	return db.findOne({ folderId })
}

// Get root contents of an org (folders and files)
const getRootContentsHelper = async (orgIdObj, db) => {
	const subfolders = await db
		.collection("folders")
		.find({ organizationId: orgIdObj, parentId: null })
		.sort({ createdAt: 1 })
		.toArray()

	const files = await db
		.collection("files")
		.find({ organizationId: orgIdObj, parentId: null })
		.sort({ createdAt: 1 })
		.toArray()

	return { folder: null, subfolders, files }
}

// Get contents of a folder
const getFolderContentsHelper = async (folderId, db) => {
	const folder = await db.collection("folders").findOne({ folderId })
	if (!folder) throw new Error("Folder not found")

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

	return { folder, subfolders, files }
}

// Recursive delete folder
const deleteFolderHelper = async (folderId, db) => {
	const folder = await db.collection("folders").findOne({ folderId })
	if (!folder) throw new Error("Folder not found")

	// delete subfolders recursively
	const subfolders = await db
		.collection("folders")
		.find({ parentId: folder.folderId })
		.toArray()
	for (const sf of subfolders) {
		await deleteFolderHelper(sf.folderId, db)
	}

	// delete files in this folder
	const files = await db
		.collection("files")
		.find({ parentId: folder.folderId })
		.toArray()
	for (const f of files) {
		if (f.path) await s3DeleteFile(f.path)
		await db.collection("files").deleteOne({ _id: f._id })
	}

	// delete folder itself
	await db.collection("folders").deleteOne({ folderId: folder.folderId })
	return true
}

// Update folder helper (handle name changes and S3 path renames)
const updateFolderHelper = async (folderId, updateData, db) => {
	const folder = await db.collection("folders").findOne({ folderId })
	if (!folder) throw new Error("Folder not found")

	if (updateData.name && updateData.name !== folder.name) {
		const files = await db
			.collection("files")
			.find({
				$or: [
					{ parentId: folder.folderId },
					{ path: new RegExp(`^${folder.folderId}/`) },
				],
			})
			.toArray()

		for (const file of files) {
			if (!file.path) continue
			const pathParts = file.path.split("/")
			const newPath = pathParts
				.map(p => (p === folder.name ? updateData.name : p))
				.join("/")
			if (newPath !== file.path) {
				const s3Result = await renameFile(file.path, newPath)
				await db.collection("files").updateOne(
					{ _id: file._id },
					{
						$set: {
							path: s3Result.key,
							location: s3Result.location,
						},
					}
				)
			}
		}
	}

	await db.collection("folders").updateOne({ folderId }, { $set: updateData })
	return await db.collection("folders").findOne({ folderId })
}

export {
	createFolderHelper,
	listFoldersByOrgHelper,
	findFolderByIdHelper,
	deleteFolderHelper,
	updateFolderHelper,
	getRootContentsHelper,
	getFolderContentsHelper,
}
