import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Get token from cookies or Authorization header
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        // Check if token exists
        if (!token) {
            throw new ApiError(401, "Unauthorized Request");
        }

        // Verify token
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        // Find user and exclude sensitive fields
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        // User not found
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Attach user to request object
        req.user = user;

        next();
    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "Invalid Access Token"
        );
    }
});