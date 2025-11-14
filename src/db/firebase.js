import "dotenv/config"
import fs from "fs"
import { initializeApp, cert } from "firebase-admin/app"
import { initializeApp as initApp } from "firebase/app"
import { getAuth } from "firebase-admin/auth"
import {
	getAuth as getAuth2,
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
} from "firebase/auth"

// FIREBASE_CREDENTIALS can be either a JSON string (stringified service account)
// or a path to a JSON file on disk. See .env.example for recommended usage.
let creds = null
const raw = process.env.FIREBASE_CREDENTIALS
if (!raw) {
	console.error(
		"FATAL: FIREBASE_CREDENTIALS is not set. Please add your service account JSON (stringified) or a path to the JSON file to the FIREBASE_CREDENTIALS env var."
	)
	process.exit(1)
}

try {
	if (raw.trim().startsWith("{")) {
		creds = JSON.parse(raw)
	} else if (fs.existsSync(raw)) {
		const contents = fs.readFileSync(raw, "utf8")
		creds = JSON.parse(contents)
	} else {
		throw new Error(
			"FIREBASE_CREDENTIALS is neither valid JSON nor a path to a file"
		)
	}
} catch (err) {
	console.error("FATAL: Unable to parse FIREBASE_CREDENTIALS:", err.message)
	console.error(
		"Make sure the value is a valid JSON string (keys/strings quoted) or a filesystem path to the service account JSON. See .env.example for format."
	)
	process.exit(1)
}

creds.private_key = creds.private_key
	? creds.private_key.replace(/\\n/gm, "\n")
	: undefined
let app = initializeApp({
	credential: cert(creds),
})

var firebaseConfigclient = {
	apiKey: process.env.FIREBASE_API_KEY,
	authDomain: process.env.FIREBASE_AUTH_DOMAIN,
	databaseURL: process.env.FIREBASE_DATABASE_URL,
	projectId: process.env.FIREBASE_PROJECT_ID,
	storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
}

const auth = getAuth(app)
const app2 = initApp(firebaseConfigclient)
const clientAuth = getAuth2(app2)

// Helper to create a Firebase Authentication user (wrapper around admin.auth())
const createFirebaseUser = async ({
	email,
	password,
	displayName,
	phoneNumber,
}) => {
	return auth.createUser({
		email,
		password,
		displayName,
	})
}

export {
	auth,
	clientAuth,
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
	createFirebaseUser,
}
