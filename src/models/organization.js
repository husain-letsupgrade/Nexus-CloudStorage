import { getDb } from "../db/db.js"

const orgCollection = () => getDb().collection("organizations")

const createOrg = async org => orgCollection().insertOne(org)

const listOrgs = async () => orgCollection().find({}).toArray()

const findOrgById = async id => orgCollection().findOne({ _id: id })

export { createOrg, listOrgs, findOrgById }
