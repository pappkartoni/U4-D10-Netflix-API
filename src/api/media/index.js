import Express from "express";
import fs from "fs"
import fetch from "node-fetch"
import {fileURLToPath} from "url"
import {dirname, extname, join} from "path"
import {v4 as uuidv4} from "uuid"
import { v2 as cloudinary } from "cloudinary"
import createHttpError from "http-errors"
import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { checkMediumSchema, triggerBadRequest } from "../validate.js"
import { getMedia, setMedia, setPoster, getPDFMedium } from "../../lib/tools.js"
import { pipeline } from "stream";

const mediaRouter = Express.Router()

const cloudinaryUploader = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "notflix/posters",
        },
    }),
}).single("poster")

mediaRouter.post("/", checkMediumSchema, async (req, res, next) => { //ok
    try {
        const media = await getMedia()
        const newMedium = {...req.body, id: uuidv4(), createdAt: new Date(), updatedAt: new Date()}
        const unavailable = media.some(m => m.imdbID === req.body.imdbID)
        if (!unavailable) {
            media.push(newMedium)
            await setMedia(media)

            res.status(201).send({id: newMedium.id})
        } else {
            next(createHttpError(400, `IMDB ID ${req.body.imdbID} is already in use.`))
        }
    } catch (error) {
        next(error)
    }
})

mediaRouter.get("/", async (req, res, next) => { //ok
    try {
        const media = await getMedia()

        if (req.query && req.query.title) {
            const found = media.filter(m => m.title.toLowerCase().includes(req.query.title.toLowerCase()))
            if (!found.length) {
                const response = await fetch(`http://www.omdbapi.com/?apikey=ffbd3a91&s=${encodeURIComponent(req.query.title)}`)
                if (response.ok) {
                    const newMedia = await response.json()
                    for (const m of newMedia.Search) {
                        // I hate uppercase property names so they had to go
                        const newMedium = {title: m.Title, year: m.Year, imdbID: m.imdbID, type: m.Type, poster: m.Poster, id: uuidv4(), createdAt: new Date(), updatedAt: new Date()}
                        media.push(newMedium)
                        found.push(newMedium)
                        await setMedia(media)
                    }
                }
            }
            res.send(found)
        } else {
            res.send(media)
        }
    } catch (error) {
        next(error)
    }
})

mediaRouter.get("/:id", async (req, res, next) => { //ok
    try {
        const media = await getMedia()
        const found = media.find(m => m.id === req.params.id)
        if (found) {
            res.send(found)
        } else {
            next(createHttpError(404, `No Medium found with ID ${req.params.id}`))
        }
    } catch (error) {
        next(error)
    }
})

mediaRouter.put("/:id", checkMediumSchema, async (req, res, next) => { //ok (make sure to also check for duplicate imdbID, but it is more specific here because the ID may exist if the medium in question is the one we edit)
    try {
        const media = await getMedia()
        const i = media.findIndex(m => m.id === req.params.id)
        if (i !== -1) {
            const updated = {...media[i], ...req.body, updatedAt: new Date()}
            media[i] = updated
            await setMedia(media)

            res.send(updated)
        } else {
            next(createHttpError(404, `No Medium found with ID ${req.params.id}`))
        }
    } catch (error) {
        next(error)
    }
})

mediaRouter.delete("/:id", async (req, res, next) => { //ok
    try {
        const media = await getMedia()
        const remaining = media.filter(m => m.id !== req.params.id)
        if (media.length !== remaining.length) {
            await setMedia(remaining)

            res.status(204).send()
        } else {
            next(createHttpError(404, `No Medium found with ID ${req.params.id}`))
        }
    } catch (error) {
        next(error)
    }
})

mediaRouter.post("/:id/upload", cloudinaryUploader, async (req, res, next) => { //ok
    try {
        const media = await getMedia()
        const i = media.findIndex(m => m.id === req.params.id)
        if (i !== -1) {
            const updated = {...media[i], ...req.body, poster: req.file.path, updatedAt: new Date()}
            media[i] = updated
            await setMedia(media)

            res.send(updated)
        } else {
            next(createHttpError(404, `No Medium found with ID ${req.params.id}`))
        }
    } catch (error) {
        next(error)
    }
})

mediaRouter.get("/:id/pdf", async (req, res, next) => { //ok
    try {
        const media = await getMedia()
        const found = media.find(m => m.id === req.params.id)
        if (found) {
            res.setHeader("Content-Disposition", `attachment; filename=${found.title}.pdf`)
            const source = await getPDFMedium(found)

            pipeline(source, res, err => {if (err) console.log(err)})
        } else {
            next(createHttpError(404, `No Medium found with ID ${req.params.id}`))
        }
    } catch (error) {
        next(error)
    }
})

export default mediaRouter