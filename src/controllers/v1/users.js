import { success, error, validation } from "../../configs/response.js"
import { getDb } from "../../db/mongo.js"
import { ObjectId } from "mongodb"

///rewrite using a helper function
const getUsersByOrg = async (req, res) => {
	const { orgId } = req.params
	const db = getDb() // why initialise db here
	let orgObjectId
	try {
		orgObjectId = new ObjectId(orgId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Invalid orgId" }]))
	}
	const users = await db
		.collection("users")
		.find({ organizations: orgObjectId })
		.project({ password: 0 })
		.toArray()
	res.status(200).json(success("Users fetched", { users }, 200))
}

export { getUsersByOrg }
