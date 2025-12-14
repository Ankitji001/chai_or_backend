import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens= async( userId)=>{
  try {
   const user = await User.findById(userId);
    const accessToken  =user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();

    user.refreshToken= refreshToken
   await user.save({validateBeforeSave: false})

   return {accessToken, refreshToken}


  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    // check fo rimages, check for avatar
    // upload them to cloudinary , avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response
    // src/controller/user.controller.js
    const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some(field => String(field || "").trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
  });

  if (existedUser) { 
    throw new ApiError(409, "User with given username or email already exists");
  }

//   console.log(req.files)

  const avatarLocalPath = Array.isArray(req.files?.avatar) && req.files.avatar[0] ? req.files.avatar[0].path : null;
//   const coverImageLocalPath = Array.isArray(req.files?.coverImage) && req.files.coverImage[0] ? req.files.coverImage[0].path : null;

 let coverImageLocalPath;
 if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
    coverImageLocalPath= req.files.coverImage[0].path
 }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadONCloudinary(avatarLocalPath);

  if (!avatar || !avatar.url) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  // Upload cover image only if provided
  let coverImageUpload = null;
  if (coverImageLocalPath) {
    coverImageUpload = await uploadONCloudinary(coverImageLocalPath);
  }

  const created = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImageUpload?.url || "",
    email: email.toLowerCase(),
    password,
    username: username.toLowerCase()
  });

  const createdUser = await User.findById(created._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});


const loginUser=asyncHandler(async (req, res)=>{
  // req body ->data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cokkie

  const {email, username, password}= req.body
  if(!(username || email)){
    throw new ApiError(400, "username or email is required")
  }
  const user=await User.findOne({
    $or: [{username},{email}]
  })
  if(!user){
    throw new ApiError( 400, "User does not exist")
  } 
  const isPasswordValid =await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401, "User does not exist")
  }

  const {accessToken, refreshToken}= await generateAccessAndRefreshTokens(user._id)

  const loggedInUser= await User.findById(user._id).select ("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200).cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User logged In Succesfully"
    )
  )
})

const logoutUser= asyncHandler(async(req, res)=>{
 await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
    
  )

 const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken= asyncHandler( async (req, res)=>{
  const incomingRefreshToken= req.cookies.refreshToken || req.body. refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
  }

 try {
  const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   )
 
   const user= await User.findById(decodedToken?._id)
   if(!user){
     throw new ApiError(401, "Invalid refresh Token")
   }
 
   if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401, "Refresh token is expired or used")
   }
 
     const opitons= {
       httpOnly: true,
       secure: true
     }
   const {accessToken, newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
     new ApiResponse(
       200,
       { accessToken , refreshToken : newRefreshToken },
       "Access token refreshed"
     )
    )
 } catch (error) {
   throw new ApiError(401, error?.message || "Invalid refresh token")
 }
})

export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
 };

