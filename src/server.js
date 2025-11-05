import "dotenv/config"
import cors from "cors"
import express from "express"
import authRouter from "./routes/v1/auth.js"
import orgsRouter from "./routes/v1/orgs.js"
import usersRouter from "./routes/v1/users.js"
import filesRouter from "./routes/v1/files.js"
import foldersRouter from "./routes/v1/folders.js"
import { mongoConnect } from "./db/mongo.js"
import { rabbitConnect } from "./queue/send.js"
import { worker } from "./queue/worker.js"
import morgan from "morgan"
import { clientConnect } from "./cache/redis.js"
import cluster from "cluster"
import { cpus } from "os"
console.log(cpus().length)
const app = express()
//Request logger
app.use(morgan("tiny"))
// Third-Party Middleware
app.use(cors())
// Built-In Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
if (cluster.isPrimary) {
	console.log(`Number of CPUs is ${cpus().length}`)
	console.log(`Master ${process.pid} is running`)
	// Fork workers.
	for (let i = 0; i < cpus().length; i++) {
		cluster.fork()
	}
	// cluster.on("exit", (worker, code, signal) => {
	//  console.log(`worker ${worker.process.pid} died`)
	//  console.log("Let's fork another worker!")
	//  cluster.fork()
	// })
} else {
	// * Routes * //
	app.use("/", authRouter)
	app.use("/orgs", orgsRouter)
	app.use("/users", usersRouter)
	app.use("/files", filesRouter)
	app.use("/folders", foldersRouter)
	app.use("/admin", (await import("./routes/admin.js")).default)
	// * Check * //
	app.get("/", (req, res) => {
		res.send("Hello World! " + process.pid)
	})
	// * MQ Connection * //
	// rabbitConnect()
	// worker()
	// * Redis * //
	// if (process.env.NODE_ENV !== "development") {
	//     clientConnect()
	// }
	// * Database connection * //
	mongoConnect()
	// * Start * //
	app.listen(parseInt(process.env.PORT), () =>
		console.log(`Server ready to roll on an anonymous port!`)
	)
}
