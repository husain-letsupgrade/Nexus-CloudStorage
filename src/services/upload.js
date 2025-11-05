import "dotenv/config"
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	CopyObjectCommand,
} from "@aws-sdk/client-s3"
import { Readable } from "stream"

const REGION = process.env.AWS_REGION || "ap-south-1"
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "lu-project-nexus"

const s3Client = new S3Client({
	region: REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_KEY,
	},
})

// Upload file to S3
const upload = async (path, fileName, file) => {
	try {
		// Create unique filename with timestamp
		const timestamp = Date.now()
		const basename = `${timestamp}_${fileName}`

		// Convert bytes to most appropriate unit
		const formatFileSize = bytes => {
			if (bytes < 1024) return bytes + " B"
			else if (bytes < 1024 * 1024)
				return (bytes / 1024).toFixed(2) + " KB"
			else if (bytes < 1024 * 1024 * 1024)
				return (bytes / (1024 * 1024)).toFixed(2) + " MB"
			else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
		}

		console.log(`Starting upload for file: ${fileName}`)
		console.log(`Generated basename: ${basename}`)
		console.log(`File size: ${formatFileSize(file.length)}`)

		const params = {
			Bucket: BUCKET_NAME,
			Key: `${path}${basename}`,
			Body: file,
			ContentType: file.mimetype,
		}
		console.log("Upload params:", { ...params, Body: "[Buffer]" })

		const result = await s3Client.send(new PutObjectCommand(params))
		console.log("S3 upload successful:", { fileName, path, basename })

		const s3Url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${path}${basename}`
		console.log("Generated S3 URL:", s3Url)

		return {
			success: true,
			basename, // Return timestamped name for storage in MongoDB
			location: s3Url, // This will be renamed to imgUrl in the controller
			key: `${path}${basename}`,
			...result,
		}
	} catch (err) {
		console.error("Error uploading to S3:", err)
		throw err
	}
}

// Delete file from S3
const deleteFile = async key => {
	try {
		const params = {
			Bucket: BUCKET_NAME,
			Key: key,
		}
		const result = await s3Client.send(new DeleteObjectCommand(params))
		return {
			success: true,
			...result,
		}
	} catch (err) {
		console.error("Error deleting from S3:", err)
		throw err
	}
}

// Get file from S3
const getFile = async key => {
	try {
		const params = {
			Bucket: BUCKET_NAME,
			Key: key,
		}
		const result = await s3Client.send(new GetObjectCommand(params))
		return result
	} catch (err) {
		console.error("Error getting file from S3:", err)
		throw err
	}
}

// Check if file exists in S3
const fileExists = async key => {
	try {
		const params = {
			Bucket: BUCKET_NAME,
			Key: key,
		}
		await s3Client.send(new HeadObjectCommand(params))
		return true
	} catch (err) {
		if (err.name === "NotFound") {
			return false
		}
		throw err
	}
}

// Rename/Move file in S3 by copying to new location and deleting old
const renameFile = async (oldKey, newKey) => {
	try {
		// Copy to new location
		const copyParams = {
			Bucket: BUCKET_NAME,
			CopySource: `${BUCKET_NAME}/${oldKey}`,
			Key: newKey,
		}
		await s3Client.send(new CopyObjectCommand(copyParams))

		// Delete from old location
		await deleteFile(oldKey)

		const s3Url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${newKey}`
		console.log("File renamed successfully:", { oldKey, newKey, s3Url })

		return {
			success: true,
			location: s3Url, // Keep for backward compatibility
			imgUrl: s3Url, // Add new field
			key: newKey,
		}
	} catch (err) {
		console.error("Error renaming in S3:", err)
		throw err
	}
}

export { upload, deleteFile, getFile, fileExists, renameFile }
