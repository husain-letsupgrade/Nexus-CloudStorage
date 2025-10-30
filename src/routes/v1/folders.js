import { Router } from "express"
import { authenticate } from "../../middlewares/auth.js"
import {
	create,
	listByOrg,
	root,
	getFolderContents,
	updateFolder,
	deleteFolder,
} from "../../controllers/v1/folders.js"

const router = Router()

router.post("/org/:orgId", authenticate, create)
router.get("/org/:orgId", authenticate, listByOrg)
router.get("/root", authenticate, root)
router.get("/:folderId/contents", authenticate, getFolderContents)
router.patch("/:folderId", authenticate, updateFolder)
router.delete("/:folderId", authenticate, deleteFolder)

export default router
