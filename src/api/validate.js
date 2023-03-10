import { checkSchema, validationResult } from "express-validator"
import createHttpError from "http-errors"

const mediumSchema = {
    title: {
        in: ["body"],
        isString: {
          errorMessage: "The title is mandatory and must be a String",
        },
    },
    year: {
        in: ["body"],
        isString: {
        errorMessage: "The year is mandatory and must be a String",
        },
    },
    imdbID: {
        in: ["body"],
        isString: {
            errorMessage: "The imdbID is mandatory and must be a String",
        },
    },
    type: {
        in: ["body"],
        isIn: ["movie", "show"],
        isString: {
            errorMessage: "The type is mandatory and must be either 'movie' or 'show'",
        },
    },
    poster: {
        in: ["body"],
        optional: true,
        isURL: {
            errorMessage: "The poster should be a valid URL if you want to provide it here. You can also upload it later ;)",
        }
    }
}

export const checkMediumSchema = checkSchema(mediumSchema)

export const triggerBadRequest = (req, res, next) => {
    const errors = validationResult(req)

    if (errors.isEmpty()) {
        next()
    } else {
        next(createHttpError(400, "Errors during validation", { errorsList: errors.array() }))
    }
}