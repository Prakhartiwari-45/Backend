import mongoose,{Schema} from "mongoose";
// import { JsonWebTokenError } from "jsonwebtoken";
import bcrypt from 'bcrypt';
import { configDotenv } from "dotenv";
import pkg from "jsonwebtoken";

const { JsonWebTokenError } = pkg;
//jwt is a bearer token means like a key whoever send this to me i will send data to them

const userSchema =new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,//cloudinary url
        required:true,
    },
    coverImage:{
        type:String,//cloudinary url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is Required']
    },
    refreshToken:{
        type:String
    }
},{
    timestamps:true
})

userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign({
        _id: this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}




export const User=mongoose.model("User",userSchema)










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