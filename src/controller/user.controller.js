import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {uploadONCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.mdels.js"
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser= asyncHandler(async(req , res)=>{
    // get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    // check fo rimages, check for avatar
    // upload them to cloudinary , avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response


   const { fullName, email,  username,password} = req.body;
   console.log("email:", email);

    if (
        [fullName, email, username, password].some((field)=>
        field?.trim()==="")
    ) {
        throw new ApiError(400 , "All fields are required")
    }   
  const existedUser=  User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError (409 , "User with given username or email already exists")
    }

    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path;


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar= await uploadONCloudinary(avatarLocalPath)
    const coverImage= await uploadONCloudinary(coverImageLocalPath)
                           
    if(!avatar){
         throw new ApiError (409 , "Avatar not exist")
    }                       
    const user= await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

     const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
     )
     if(!createdUser){
        throw new ApiError(500, "Something went wrong while registration the user" )
     }

     return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered succesfully")
     )
    
})

export {registerUser};
