import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import { requireAdmin } from "../middlewares/admin.js"
import {
	searchFilesInOrgAdmin,
	listOrgsAdmin,
	listUsersAdmin,
	searchUsersInOrg,
	createOrgAdmin,
	addUserToOrgAdmin,
	getOrgByIdAdmin,
	updateOrgAdmin,
	deleteOrgAdmin,
	getUserByIdAdmin,
	updateUserAdmin,
	deleteUserAdmin,
	getUsersInOrgAdmin,
	removeUserFromOrgAdmin,
} from "../controllers/v1/admin.js"

const router = Router()

router.use(authenticate, requireAdmin)

router.get("/orgs", listOrgsAdmin)
router.post("/orgs", createOrgAdmin)
router.get("/orgs/:orgId", getOrgByIdAdmin)
router.patch("/orgs/:orgId", updateOrgAdmin)
router.delete("/orgs/:orgId", deleteOrgAdmin)
router.get("/users", listUsersAdmin)
router.get("/users/search", searchUsersInOrg)
router.post("/orgs/:orgId/users", addUserToOrgAdmin)
router.get("/orgs/:orgId/users", getUsersInOrgAdmin)
router.get("/users/:userId", getUserByIdAdmin)
router.patch("/users/:userId", updateUserAdmin)
router.delete("/orgs/:orgId/users/:userId", removeUserFromOrgAdmin)
router.delete("/users/:userId", deleteUserAdmin)
router.get("/orgs/:orgId/files/search", searchFilesInOrgAdmin)

export default router
