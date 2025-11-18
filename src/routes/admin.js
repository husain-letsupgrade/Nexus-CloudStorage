import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import { requireAdmin } from "../middlewares/admin.js"
import {
	listOrgsAdmin,
	createOrgAdmin,
	getOrgByIdAdmin,
	updateOrgAdmin,
	deleteOrgAdmin,
	listUsersAdmin,
	getUserByIdAdmin,
	updateUserAdmin,
	deleteUserAdmin,
	searchUsersInOrg,
	getUsersInOrgAdmin,
	addUserToOrgAdmin,
	removeUserFromOrgAdmin,
	searchFilesInOrgAdmin,
} from "../controllers/v1/admin.js"

const router = Router()

// All routes require authentication and admin privileges
router.use(authenticate, requireAdmin)

// Organization routes
router.get("/orgs", listOrgsAdmin)
router.post("/orgs", createOrgAdmin)
router.get("/orgs/:orgId", getOrgByIdAdmin)
router.patch("/orgs/:orgId", updateOrgAdmin)
router.delete("/orgs/:orgId", deleteOrgAdmin)

// User routes
router.get("/users", listUsersAdmin)
router.get("/users/search", searchUsersInOrg)
router.get("/users/:userId", getUserByIdAdmin)
router.patch("/users/:userId", updateUserAdmin)
router.delete("/users/:userId", deleteUserAdmin)

// Organization-User routes
router.post("/orgs/:orgId/users", addUserToOrgAdmin)
router.get("/orgs/:orgId/users", getUsersInOrgAdmin)
router.delete("/orgs/:orgId/users/:userId", removeUserFromOrgAdmin)

// File routes
router.get("/orgs/:orgId/files/search", searchFilesInOrgAdmin)

export default router
