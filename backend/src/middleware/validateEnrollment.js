import { apiError } from "../utils/apiError.js"

export const validateEnrollment = (req, res, next) => {
    try {
        const { planId, grade, parentName, parentPhone } = req.body;

        if (!planId) {
            return next(new apiError(400, "Plan ID is required"));
        }
        if (!grade || !String(grade).trim()) {
            return next(new apiError(400, "Student grade / class is required"));
        }
        if (!parentName || !String(parentName).trim()) {
            return next(new apiError(400, "Parent / guardian name is required"));
        }
        if (!parentPhone || !String(parentPhone).trim()) {
            return next(new apiError(400, "Parent / guardian phone is required"));
        }

        next();
    } catch (err) {
        next(err);
    }
}