import fs from "fs-extra"
import {fileURLToPath} from "url"
import { dirname, join } from "path"
import PdfPrinter from "pdfmake"
import imageToBase64 from "image-to-base64"

const { readJSON, writeJSON, writeFile, createReadStream } = fs

 
const publicFolderPath = join(process.cwd(), "./public/img")
const folderPath = join(dirname(fileURLToPath(import.meta.url)), "../data")

const mediaImagePath = join(publicFolderPath, "./media")
const mediaPath = join(folderPath, "media.json")

export const getMedia = () => readJSON(mediaPath)
export const setMedia = media => writeJSON(mediaPath, media)
export const setPoster = (fileName, fileContent) => writeFile(join(mediaImagePath, fileName), fileContent)

export const getPDFMedium = async m => {
    const fonts = {
        Helvetica: {
            normal: "Helvetica",
            bold: "Helvetica-Bold",
            italics: "Helvetica-Oblique",
            bolditalics: "Helvetica-BoldOblique",
        }
    }
    const printer = new PdfPrinter(fonts)
    const base64Data = await imageToBase64(m.poster)
    const docDef = {
        content: [
            {image: `data:image/jpeg;base64,${base64Data}`, style: "poster"},
            {text: m.title, style: "header"},
            {text: `This is a ${m.type} from ${m.year}. There is nothing else to say.`}
        ],
        styles: {
            poster: {
                alignment: "center",
                width: 256
            },
            header: {
                fontSize: 22,
                bold: true,
                margin: [0,10],
            }
        },
        defaultStyle: {
            font: "Helvetica"
        }
    }

    const pdfReadable = printer.createPdfKitDocument(docDef)
    pdfReadable.end()

    return pdfReadable
}