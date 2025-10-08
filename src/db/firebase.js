import "dotenv/config"
import { initializeApp, cert } from "firebase-admin/app"
import { initializeApp as initApp } from "firebase/app"
import { getAuth } from "firebase-admin/auth"
import {
	getAuth as getAuth2,
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
} from "firebase/auth"

let creds = JSON.parse(process.env.FIREBASE_CREDENTIALS)
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

export { auth, clientAuth, signInWithEmailAndPassword, sendPasswordResetEmail }
