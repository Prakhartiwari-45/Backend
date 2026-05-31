import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Schema for storing video details
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // Cloudinary video URL
      required: true,
    },

    thumbnail: {
      type: String, // Thumbnail image URL
      required: true,
    },

    owner: {
      type: Schema.Types.ObjectId, // User who uploaded the video
      ref: "User",
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    duration: {
      type: Number, // Video duration in seconds
    },

    views: {
      type: Number,
      default: 0, // Initial views count
    },

    isPublished: {
      type: Boolean,
      default: true, // Video is public by default
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Adds aggregate pagination functionality
videoSchema.plugin(mongooseAggregatePaginate);

// Create and export Video model
export const Video = mongoose.model("Video", videoSchema);