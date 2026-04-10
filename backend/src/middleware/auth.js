import jwt from "jsonwebtoken"
import User from "../models/User.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"

export const requireAuth = asyncHandler(async(req,res,next)=>{
    
         let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }


        if(!token){
            throw new apiError(401,"Not authorized")
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch(err) {
            if (err.name === 'TokenExpiredError') throw new apiError(401, "Token expired");
            throw new apiError(401, "Invalid token");
        }

        const user = await User.findById(decoded.id).select("-password")
        if(!user){
            throw new apiError(404,"User not found")
        }
        req.user=user;
        next()

     
})

export const requireStudent= asyncHandler(async(req,res,next)=>{
    if(req.user.role!=="student"){
        throw new apiError(403,"Student access only")
    }
    next();
})

export const requireTeacher= asyncHandler(async(req,res,next)=>{
    if(req.user.role!=="teacher"){
        throw new apiError(403,"Teacher access only")
    }
    next();
})

export const requireAdmin = asyncHandler(async(req,res,next)=>{
    if(req.user.role!=="admin"){
        throw new apiError(403, "Admin access only");
    }
    next();
})