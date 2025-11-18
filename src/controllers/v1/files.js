import { success, error } from "../../configs/response.js"
import { Readable } from "stream"
import {
	uploadFileHelper,
	searchFileHelper,
	getFileByIdHelper,
	updateFileHelper,
	deleteFileHelper,
	downloadFileHelper,
} from "../../helpers/files.js"

// FILE CONTROLLERS

const uploadFile = async (req, res) => {
	const { description, tags, folderId } = req.body
	const { orgId: organizationId } = req.params
	const user = req.user

	uploadFileHelper(
		req.files,
		description,
		tags,
		organizationId,
		folderId,
		user
	)
		.then(result => {
			res.status(201).json(
				success(result.data.message, { files: result.data.files }, 201)
			)
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error uploading files",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const search = async (req, res) => {
	const { q } = req.query
	const user = req.user

	searchFileHelper(q, user)
		.then(result => {
			res.status(200).json(success("Search results", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error searching files",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const getFileById = async (req, res) => {
	const { fileId } = req.params

	getFileByIdHelper(fileId)
		.then(result => {
			res.status(200).json(success("File fetched", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error fetching file",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const updateFile = async (req, res) => {
	const { fileId } = req.params
	const { name, description, tags } = req.body
	const user = req.user

	updateFileHelper(fileId, name, description, tags, user)
		.then(result => {
			res.status(200).json(success("File updated", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error updating file",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const deleteFile = async (req, res) => {
	const { fileId } = req.params
	const user = req.user

	deleteFileHelper(fileId, user)
		.then(result => {
			res.status(200).json(success("File deleted", null, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error deleting file",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const downloadFile = async (req, res) => {
	const { fileId } = req.params
	const user = req.user

	downloadFileHelper(fileId, user)
		.then(result => {
			const { file, stream } = result.data

			res.setHeader(
				"Content-Disposition",
				`attachment; filename="${file.name}"`
			)
			res.setHeader(
				"Content-Type",
				file.mimetype || "application/octet-stream"
			)

			if (stream instanceof Readable) {
				stream.pipe(res)
			} else {
				res.status(500).json(error("Invalid stream from S3", null, 500))
			}
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error downloading file",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

export { uploadFile, search, getFileById, updateFile, deleteFile, downloadFile }
