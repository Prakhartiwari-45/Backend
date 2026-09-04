import mongoose, { Schema } from "mongoose";
// import { JsonWebTokenError } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { configDotenv } from "dotenv";
import jwt from "jsonwebtoken";
//jwt is a bearer token means like a key whoever send this to me i will send data to them

// Define the User Schema - structure of user documents in MongoDB
const userSchema = new Schema(
  {
    // USERNAME: Unique identifier for each user
    username: {
      type: String,
      required: true, // Must be provided
      unique: true, // No two users can have same username
      lowercase: true, // Auto-convert to lowercase
      trim: true, // Remove extra whitespace
      index: true, // Create index for faster queries
    },
    // EMAIL: User's email address
    email: {
      type: String,
      required: true, // Email must be provided
      unique: true, // Each email can only be used once
      lowercase: true, // Store in lowercase
      trim: true, // Remove extra whitespace
    },
    // FULLNAME: User's complete name
    fullname: {
      type: String,
      required: true, // Must be provided
      trim: true, // Remove extra whitespace
      index: true, // Index for faster search
    },
    // AVATAR: User's profile picture URL from Cloudinary
    avatar: {
      type: String, // URL string from Cloudinary
      required: true, // Profile picture is mandatory
    },
    // COVERIMAGE: User's banner/cover image URL (optional)
    coverImage: {
      type: String, // URL string from Cloudinary
    },
    // WATCHHISTORY: Array of video IDs user has watched
    watchHistory: [
      {
        type: Schema.Types.ObjectId, // Reference to Video document
        ref: "video", // Populate from "video" collection
      },
    ],
    // PASSWORD: User's password (will be hashed before storage)
    password: {
      type: String,
      required: [true, "Password is Required"], // Custom error message
    },
    // REFRESHTOKEN: Stored when user logs in (optional, for re-authentication)
    refreshToken: {
      type: String,
    },
  },
  {
    // TIMESTAMPS: Auto-add createdAt and updatedAt fields
    timestamps: true,
  }
);

// MIDDLEWARE: Hash password before saving to database
// Runs automatically whenever a user document is saved
userSchema.pre("save", async function () {
  // Only hash if password field is modified (new user or password change)
  if (!this.isModified("password")) return next;

  // Hash password with bcrypt using salt rounds of 10
  // This makes password irreversible and secure
  this.password = await bcrypt.hash(this.password, 10);
});

// CUSTOM METHOD: Compare entered password with stored hashed password
// Used during login to verify user credentials
userSchema.methods.isPasswordCorrect = async function (password) {
  // bcrypt.compare returns true if passwords match, false otherwise
  return await bcrypt.compare(password, this.password);
};

// CUSTOM METHOD: Generate JWT Access Token for user
// Access token has short expiry and is sent with every API request
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      // Payload: data encoded in the token
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET, // Secret key to sign token
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // Token validity duration
    }
  );
};

// CUSTOM METHOD: Generate JWT Refresh Token for user
// Refresh token has longer expiry and is used to generate new access tokens
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      // Payload: only include user ID (minimal data)
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET, // Secret key to sign token
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Longer validity duration
    }
  );
};

// Export User model for use in other files
// Mongoose converts schema into a model with built-in CRUD methods
export const User = mongoose.model("User", userSchema);

// Explanation

// // Import mongoose and Schema
// // mongoose => Used to connect and interact with MongoDB
// // Schema => Used to define the structure of documents
// import mongoose, { Schema } from "mongoose";

// // Import JWT library
// // Used to generate Access Token and Refresh Token
// import jwt from "jsonwebtoken";

// // Import bcrypt
// // Used for hashing passwords before storing them in database
// import bcrypt from "bcrypt";

// /*
// |--------------------------------------------------------------------------
// | USER SCHEMA
// |--------------------------------------------------------------------------
// | Defines the structure of User documents inside MongoDB.
// |
// | Example User Document:
// |
// | {
// |   "_id": "665e123abc",
// |   "username": "prakhar",
// |   "email": "prakhar@gmail.com",
// |   "fullname": "Prakhar Tiwari",
// |   "avatar": "https://cloudinary.com/avatar.jpg",
// |   "password": "$2b$10$hashedpassword",
// |   "watchHistory": []
// | }
// |
// */

// const userSchema = new Schema(
//   {
//     /*
//     |--------------------------------------------------------------------------
//     | USERNAME
//     |--------------------------------------------------------------------------
//     */
//     username: {
//       type: String, // Data type must be String

//       required: true, // Username is mandatory

//       unique: true, // Prevent duplicate usernames

//       lowercase: true, // Convert entered username to lowercase

//       trim: true, // Remove extra spaces from beginning and end

//       index: true, // Create database index for faster searching
//     },

//     /*
//     |--------------------------------------------------------------------------
//     | EMAIL
//     |--------------------------------------------------------------------------
//     */
//     email: {
//       type: String,

//       required: true, // Email is required

//       unique: true, // Two users cannot use same email

//       lowercase: true, // Convert email to lowercase

//       trim: true, // Remove unnecessary spaces
//     },

//     /*
//     |--------------------------------------------------------------------------
//     | FULL NAME
//     |--------------------------------------------------------------------------
//     */
//     fullname: {
//       type: String,

//       required: true,

//       trim: true,

//       index: true, // Faster search by fullname
//     },

//     /*
//     |--------------------------------------------------------------------------
//     | AVATAR
//     |--------------------------------------------------------------------------
//     | User profile image URL stored on Cloudinary
//     */
//     avatar: {
//       type: String,

//       required: true,
//     },

//     /*
//     |--------------------------------------------------------------------------
//     | COVER IMAGE
//     |--------------------------------------------------------------------------
//     | Optional banner image
//     */
//     coverImage: {
//       type: String,
//     },

//     /*
//     |--------------------------------------------------------------------------
//     | WATCH HISTORY
//     |--------------------------------------------------------------------------
//     | Stores IDs of watched videos
//     |
//     | Example:
//     | watchHistory:[
//     |   ObjectId("123"),
//     |   ObjectId("456")
//     | ]
//     |
//     | ref:"Video" creates relationship with Video collection
//     */
//     watchHistory: [
//       {
//         type: Schema.Types.ObjectId,

//         ref: "Video",
//       },
//     ],

//     /*
//     |--------------------------------------------------------------------------
//     | PASSWORD
//     |--------------------------------------------------------------------------
//     | Password will be hashed before saving
//     */
//     password: {
//       type: String,

//       required: [true, "Password is Required"],
//     },

//     /*
//     |--------------------------------------------------------------------------
//     | REFRESH TOKEN
//     |--------------------------------------------------------------------------
//     | Stored when user logs in
//     */
//     refreshToken: {
//       type: String,
//     },
//   },

//   /*
//   |--------------------------------------------------------------------------
//   | SCHEMA OPTIONS
//   |--------------------------------------------------------------------------
//   */
//   {
//     timestamps: true, // Automatically adds createdAt and updatedAt
//   }
// );

// /*
// |--------------------------------------------------------------------------
// | PRE SAVE MIDDLEWARE
// |--------------------------------------------------------------------------
// |
// | Runs automatically BEFORE saving user document.
// |
// | Example:
// |
// | const user = new User({...});
// | await user.save();
// |
// | Before save:
// |    password = "123456"
// |
// | After middleware:
// |    password = "$2b$10$kjsdfh..."
// |
// */

// userSchema.pre("save", async function (next) {

//   // Check if password field has changed
//   // If password was not modified,
//   // skip hashing and continue save process
//   if (!this.isModified("password")) {
//     return next();
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | HASH PASSWORD
//   |--------------------------------------------------------------------------
//   |
//   | bcrypt.hash(password, saltRounds)
//   |
//   | saltRounds = 10
//   |
//   | Example:
//   |
//   | Before:
//   |   123456
//   |
//   | After:
//   |   $2b$10$5jT4f.....
//   |
//   */

//   this.password = await bcrypt.hash(this.password, 10);

//   // Continue save operation
//   next();
// });

// /*
// |--------------------------------------------------------------------------
// | CUSTOM METHOD : CHECK PASSWORD
// |--------------------------------------------------------------------------
// |
// | Used during Login
// |
// | Example:
// |
// | const isValid =
// | await user.isPasswordCorrect("123456");
// |
// | Returns:
// | true  => Password matches
// | false => Wrong password
// |
// */

// userSchema.methods.isPasswordCorrect = async function (password) {

//   return await bcrypt.compare(
//     password,      // User entered password
//     this.password  // Hashed password stored in DB
//   );
// };

// /*
// |--------------------------------------------------------------------------
// | CUSTOM METHOD : GENERATE ACCESS TOKEN
// |--------------------------------------------------------------------------
// |
// | Access Token:
// | - Short expiry
// | - Sent with every API request
// | - Contains user information
// |
// */

// userSchema.methods.generateAccessToken = function () {

//   return jwt.sign(

//     /*
//     |--------------------------------------------------------------------------
//     | PAYLOAD
//     |--------------------------------------------------------------------------
//     | Data stored inside token
//     */
//     {
//       _id: this._id,
//       email: this.email,
//       username: this.username,
//       fullname: this.fullname,
//     },

//     /*
//     |--------------------------------------------------------------------------
//     | SECRET KEY
//     |--------------------------------------------------------------------------
//     | Used to sign token
//     */
//     process.env.ACCESS_TOKEN_SECRET,

//     /*
//     |--------------------------------------------------------------------------
//     | OPTIONS
//     |--------------------------------------------------------------------------
//     */
//     {
//       expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
//     }
//   );
// };

// /*
// |--------------------------------------------------------------------------
// | CUSTOM METHOD : GENERATE REFRESH TOKEN
// |--------------------------------------------------------------------------
// |
// | Refresh Token:
// | - Long expiry
// | - Used to generate new Access Token
// | - Usually stored in DB
// |
// */

// userSchema.methods.generateRefreshToken = function () {

//   return jwt.sign(

//     /*
//     |--------------------------------------------------------------------------
//     | PAYLOAD
//     |--------------------------------------------------------------------------
//     | Only user ID is enough
//     */
//     {
//       _id: this._id,
//     },

//     /*
//     |--------------------------------------------------------------------------
//     | SECRET KEY
//     |--------------------------------------------------------------------------
//     */
//     process.env.REFRESH_TOKEN_SECRET,

//     /*
//     |--------------------------------------------------------------------------
//     | EXPIRY
//     |--------------------------------------------------------------------------
//     */
//     {
//       expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
//     }
//   );
// };

// /*
// |--------------------------------------------------------------------------
// | CREATE MODEL
// |--------------------------------------------------------------------------
// |
// | Converts schema into model
// |
// | User Model gives access to:
// |
// | User.find()
// | User.findOne()
// | User.findById()
// | User.create()
// | User.deleteOne()
// |
// */

// export const User = mongoose.model("User", userSchema);
