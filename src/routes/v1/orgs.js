import { Router } from "express"
import { list } from "../../controllers/v1/orgs.js"
import { authenticate } from "../../middlewares/auth.js"

const router = Router()

// Public (auth) endpoint to get orgs. Creation and adding users are admin-only under /admin
router.get("/", authenticate, list)

export default router
