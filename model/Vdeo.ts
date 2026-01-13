import mongoose, { Schema, model, models } from "mongoose";

export const videodiemensions = {
  width: 1080,
  height: 720,
} as const;

export interface videoInterface {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  controls?: boolean;
  transformation?: {
    height: number;
    width: number;
    quality: string;
  };
  views?: number;
  likes?: string[];
  comments?: {
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
  }[];
  userId?: string; // ID of the user who uploaded the video
  userName?: string; // Name of the uploader
  createdAt?: Date;
  updatedAt?: Date;
}

const videoSchema = new Schema<videoInterface>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String }, // Made optional in validation, schema allows it
    controls: { type: Boolean, default: true },
    transformation: {
      height: { type: Number, default: videodiemensions.height },
      width: { type: Number, default: videodiemensions.width },
      quality: { type: String, default: "100" },
    },
    views: { type: Number, default: 0 },
    likes: { type: [String], default: [] },
    comments: {
      type: [
        {
          userId: { type: String, required: true },
          userName: { type: String, required: true },
          text: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    userId: { type: String, required: false },
    userName: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export const Video = models?.Video || model<videoInterface>("Video", videoSchema);

export default Video;