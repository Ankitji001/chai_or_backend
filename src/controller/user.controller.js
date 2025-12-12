import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
