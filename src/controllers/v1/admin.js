import { getDb } from "../../db/mongo.js"
import { success, error } from "../../configs/response.js"
import {
	createOrgHelper,
	searchFilesInOrgHelper,
	getOrgByIdHelper,
	updateOrgHelper,
	deleteOrgHelper,
	getUserByIdHelper,
	updateUserHelper,
	deleteUserHelper,
	addUserToOrgHelper,
	removeUserFromOrgHelper,
	searchUsersInOrgHelper,
	getUsersInOrgHelper,
} from "../../helpers/admin.js"

// ORGS


//try to use a .then 
const listOrgsAdmin = async (req, res) => {
	try {
		const db = getDb()
		const orgs = await db.collection("organizations").find({}).toArray()
		return res.status(200).json(success("All orgs", { orgs }, 200))
	} catch (err) {
		return res
			.status(500)
			.json(error("Failed", { message: err.message }, 500))
	}
}

const createOrgAdmin = async (req, res) => {
	const { name, description, logo } = req.body
	createOrgHelper(name, description, logo)
		.then(result => {
			res.status(201).json(success("Org created", result.data, 201))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error creating organization",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}


//helper pls
const listUsersAdmin = async (req, res) => {
	try {
		const db = getDb()
		const users = await db
			.collection("users")
			.find({})
			.project({ password: 0 })
			.toArray()
		res.status(200).json(success("All users", { users }, 200))
	} catch (err) {
		res.status(500).json(error("Failed", { message: err.message }, 500))
	}
}

// Admin CRUD for orgs
const getOrgByIdAdmin = async (req, res) => {
	const { orgId } = req.params

	getOrgByIdHelper(orgId)
		.then(result => {
			res.status(200).json(success("Org fetched", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error fetching organization",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const updateOrgAdmin = async (req, res) => {
	const { orgId } = req.params
	const { name, description, logo } = req.body

	updateOrgHelper(orgId, name, description, logo)
		.then(result => {
			res.status(200).json(success("Org updated", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error updating organization",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const deleteOrgAdmin = async (req, res) => {
	const { orgId } = req.params

	deleteOrgHelper(orgId)
		.then(result => {
			res.status(200).json(success("Org deleted", null, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error deleting organization",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

// Admin CRUD for users
const getUserByIdAdmin = async (req, res) => {
	const { userId } = req.params

	getUserByIdHelper(userId)
		.then(result => {
			res.status(200).json(success("User fetched", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error fetching user",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const updateUserAdmin = async (req, res) => {
	const { userId } = req.params
	const { name, role } = req.body

	updateUserHelper(userId, name, role)
		.then(result => {
			res.status(200).json(success("User updated", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error updating user",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

const deleteUserAdmin = async (req, res) => {
	const { userId } = req.params

	deleteUserHelper(userId)
		.then(result => {
			res.status(200).json(success("User disabled", null, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error disabling user",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

// Remove user from organization (admin only)
const removeUserFromOrgAdmin = async (req, res) => {
	const { orgId, userId } = req.params

	removeUserFromOrgHelper(orgId, userId)
		.then(result => {
			res.status(200).json(
				success("User removed from org", result.data, 200)
			)
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error removing user from org",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

// FILE SEARCH

const searchFilesInOrgAdmin = async (req, res) => {
	const { orgId } = req.params
	const { q } = req.query //change the variable name for the q

	searchFilesInOrgHelper(orgId, q)
		.then(result => {
			res.status(200).json(success("Files search", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error("Error searching files", { message: err?.message }, 500)
			)
		})
}

// SEARCH USERS IN ORG

const searchUsersInOrg = async (req, res) => {
	const { orgId, q } = req.query //change the variable name for the q
	//org should be params not query

	searchUsersInOrgHelper(orgId, q)
		.then(result => {
			res.status(200).json(success("Search users", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error searching users",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

// LIST USERS IN ORG

const getUsersInOrgAdmin = async (req, res) => {
	const { orgId } = req.params

	getUsersInOrgHelper(orgId)
		.then(result => {
			res.status(200).json(success("Users fetched", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error fetching users",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

// Add user to organization
const addUserToOrgAdmin = async (req, res) => {
	const { orgId } = req.params
	const { userId } = req.body

	addUserToOrgHelper(orgId, userId)
		.then(result => {
			res.status(200).json(success("User added to org", result.data, 200))
		})
		.catch(err => {
			res.status(err?.code || 500).json(
				error(
					"Error adding user to org",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
		})
}

export {
	listOrgsAdmin,
	createOrgAdmin,
	listUsersAdmin,
	getOrgByIdAdmin,
	updateOrgAdmin,
	deleteOrgAdmin,
	getUserByIdAdmin,
	updateUserAdmin,
	deleteUserAdmin,
	addUserToOrgAdmin,
	removeUserFromOrgAdmin,
	searchFilesInOrgAdmin,
	searchUsersInOrg,
	getUsersInOrgAdmin,
}
