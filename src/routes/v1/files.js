import { Router } from "express"
import multer from "multer"
import path from "path"
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
const uploadDir = path.resolve(process.cwd(), "upload")
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir)
	},
	filename: function (req, file, cb) {
		cb(null, `${Date.now()}-${file.originalname}`)
	},
})

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }) // 20 MB

router.post(
	"/org/:orgId/upload",
	authenticate,
	upload.single("file"),
	uploadFile
)
router.get("/search", authenticate, search)
router.get("/:fileId", authenticate, getFileById)
router.patch("/:fileId", authenticate, updateFile)
router.delete("/:fileId", authenticate, deleteFile)
router.get("/:fileId/download", authenticate, downloadFile)

export default router
