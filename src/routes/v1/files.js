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

// Use memory storage for S3 upload
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
})

router.post(
	"/org/:orgId/upload",
	authenticate,
	upload.array("files", 10), // Allow up to 10 files at once
	uploadFile
)
router.get("/search", authenticate, search)
router.get("/:fileId", authenticate, getFileById)
router.patch("/:fileId", authenticate, updateFile)
router.delete("/:fileId", authenticate, deleteFile)
router.get("/:fileId/download", authenticate, downloadFile)

export default router
