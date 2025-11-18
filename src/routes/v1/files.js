import { Router } from "express"
import multer from "multer"
import { authenticate } from "../../middlewares/auth.js"
import {
	uploadFile,
	search,
	getFileById,
	updateFile,
	deleteFile,
	downloadFile,
} from "../../controllers/v1/files.js"

const router = Router()

// Multer setup for memory storage (used for S3 uploads)
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const MAX_FILE_COUNT = 10

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_FILE_SIZE },
})

//-------- FILE ROUTES-----------

// Upload multiple files to an organization
router.post(
	"/org/:orgId/upload",
	authenticate,
	upload.array("files", MAX_FILE_COUNT),
	uploadFile
)

// Search files (user-scoped)
router.get("/search", authenticate, search)

// Get, update, delete individual file
router.get("/:fileId", authenticate, getFileById)
router.patch("/:fileId", authenticate, updateFile)
router.delete("/:fileId", authenticate, deleteFile)

// Download a file
router.get("/:fileId/download", authenticate, downloadFile)

export default router
