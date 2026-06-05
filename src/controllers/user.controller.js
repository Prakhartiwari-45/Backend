import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("TOKEN ERROR:", error);
    throw new ApiError(
      500,
      "Something Went Wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation -not empty
  //check if user already exists :username,email
  //check for images,check for avatar
  // upload them to cloudinary,avatar
  // create user object - create entry in db
  // remove password and refresh token fiels from response
  // check for user creation
  // return res
  console.log("REGISTER ROUTE HIT");

  const { username, fullname, email, password } = req.body;
  // console.log("Email : ",email);

  if (
    [fullname, username, email, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are compulsory");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already Existed");
  }

  // console.log("BODY =", req.body);
  // console.log("FILES =", req.files);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0].path;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is Required");
  }
  //     console.log("REGISTER ROUTE HIT");
  // console.log("BODY =", req.body);
  // console.log("FILES =", req.files);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is Required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body => data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie

  const { username, password, email } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  console.log("Entered Password:", password);
  console.log("User Found:", user);
  console.log("Stored Password:", user.password);
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is not correct");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In SuccssFully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "UserLogged Out"));
});

const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken =req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request" )
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const  user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid Refresh Token" )
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Referesh Token is Expired or used")
    }
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,newRefreshToken},
        "Access Token Refresshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid Refresh  Token")
  }

})

const changeCurrentPassword =asyncHandler(async (req,res)=>{
  const {oldPassword,newPassword}=req.body

  const user =await User.findById(req.user?._id)
  const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"Incorrect Old Password")
  }

  user.password=newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "Password Changed Successfullly"
    )
  )

})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(
    200,req.user,"Current User Fetched SuccessFully"
  )
})

const updateAccountDetails=asyncHandler(async (req,res)=>{
  const {fullname,email}=req.body

  if(!fullname || !email){
    throw new ApiError(400,"All fields are required")
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname:fullname,
        email:email
      }
    },
    {new:true}
  ).select("-password  ")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated Successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is Missing");
  }

  // Get current user
  const currentUser = await User.findById(req.user?._id);

  // Delete old avatar if exists
  if (currentUser?.avatar) {
    const publicId = currentUser.avatar
      .split("/")
      .pop()
      .split(".")[0];

    await cloudinary.uploader.destroy(publicId);
  }

  // Upload new avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  // Update database
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "Avatar Updated Successfully"
    )
  );
});

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath= req.file?.path

  if (!updateUserCoverImage) {
    throw new ApiError(400,"Cover Image File is Missing")
  }

  const coverImage= await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user =await User.findByIdAndUpdate(
    req.user?._id, 
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,
      user,
      "Cover Image Updated SuccessFully"
    )
  )
})

const getUserProfile =asyncHandler(async (req,res)=>{
  const {username} =req.params
  if(!username?.trim){
    throw new ApiError(400,"Username Is missing")
  }
  const channel =await User.aggregate(
    [
      {
        $match:{
          username:username?.toLowerCase()
        }
      },
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"channel",
          as:"subscribers"

        }
      },
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"subscriber",
          as:"subscribedTo"
        }
      },
      {
        $addFields:{
          subscribersCount:{
            $size:"$subscribers"
          },
          channelsSubscribedToCount:{
            $size:"$subscribedTo"
          },
          
            isSubscribed:{
              $cond:{
                if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                then:true,
                else:false
              }
            }
          
        }
      },
      {
        $project:{
          fullname: 1,
          username:1,
          subscribersCount:1,
          channelsSubscribedToCount:1,
          isSubscribed:1,
          avatar:1,
          coverImage:1,
          email:1
        }
      }
    ]
  )
  
if(!channel?.length){
  throw new ApiError(404,"Channel Does Not Exist")
}

return res
.status(200)
.json(
  new ApiResponse(200,channel[0],"User channel Fetched Successfully")
)

})

// console.log(channel)

const getUserWatchHistory = asyncHandler(async(req,res)=>{
  // req.user._id //we get a string only then with the help of mongoose we cconvert it into Mongodb id ObjectId('')

  const user = await User.aggregate(
    [
      {
        $match:{
          _id:new mongoose.Types.ObjectId(req.user._id)
        },
        $lookup:{
          from:"videos",
          localField:"watchHistory",
          foreignField:"_id",
          as:"watchHistory",
          pipeline:[
            {
              $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                  {
                    $project:{
                      fullname:1,
                      username:1,
                      avatar:1
                    }
                  }
                ]
              }
            },
            {
              $addFields:{
                owner:{
                  $first:"$owner"
                }
              }
            }
          ]
        },
        
      }
    ]
  )

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch History fetched Successfully"
    )
  )
})


export { registerUser, loginUser, logOutUser ,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserProfile,getUserWatchHistory};
