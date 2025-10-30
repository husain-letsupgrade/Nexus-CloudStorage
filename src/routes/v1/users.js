import { Router } from "express"
import { authenticate } from "../../middlewares/auth.js"
// Listing users by org is admin-only now. Use the admin router at /admin/orgs/:orgId/users
const router = Router()

export default router
