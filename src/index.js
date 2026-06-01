// require("dotenv").config({path:"./env"});
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
});


console.log("MONGODB_URI =", process.env.MONGODB_URI);
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Errr :",error);
        throw error
    })

    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("Mongo db connection Failed !!!",err);
    
})







/*
import express from "express";

const app = express();

;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.error("Error in connecting to database");
            throw error;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error("Error ",error);
        throw error;
    }
})() //iife

*/
