import {asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend 
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar (store the cloudinary url)
    // create user object - create entry in db 
    // remove password and refresh token from response
    // check for user creation 
    // return res 

    // get user details
    const{fullName, username, email, password} = req.body
    // console.log("email: ", email);

    // validation - not empty
    if (
        [fullName, username, email, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // if (!req.files?.avatar) {
    //     throw new ApiError(400, "Avatar file is missing in the request");
    // }    

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    // upload them to cloudinary, avatar (store the cloudinary url)
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar image is required")
    }

    // console.log("Avatar URL: ", avatar.url);

    // create user object - create entry in db 
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select( 
        "-password -refreshToken"  // remove password and refresh token from response
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")  // check for user creation
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")  // return res
    )

})

export {
    registerUser,
}