import Express from "express"
import cors from "cors"
import createHttpError from "http-errors"
import { join } from "path"
import mediaRouter from "./api/media/index.js"
import {badRequestHandler, unauthorizedHandler, notfoundHandler, genericErrorHandler} from "./errorHandlers.js"

const publicPath = join(process.cwd(), "./public")

const server = Express()
const port = process.env.PORT || 3333
const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL]

server.use(Express.static(publicPath))
server.use(cors({
    origin: (currentOrigin, corsNext) => {
        if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
            corsNext(null, true)
        } else {
            corsNext(createHttpError(400, `Origin ${currentOrigin} is not whitelisted.`))
        }
    }
}))

server.use(Express.json())

server.use("/media", mediaRouter)

server.use(badRequestHandler)
server.use(unauthorizedHandler)
server.use(notfoundHandler)
server.use(genericErrorHandler)

server.listen(port, () => {
    console.log(`Server started on Port ${port}.`)
})
