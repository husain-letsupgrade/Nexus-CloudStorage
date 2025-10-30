import { Router } from "express"
import { register, login, check } from "../../controllers/v1/auth.js"

const authRouter = Router()

authRouter.get("/", check)
authRouter.post("/register", register)
authRouter.post("/login", login)

export default authRouter
