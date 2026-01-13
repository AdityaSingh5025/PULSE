import bcrypt from "bcryptjs";
import mongoose, { Schema, model, models } from "mongoose";

export interface userInterface {
    email: string,
    password: string,
    name?: string,
    username?: string,
    image?: string,
    followers?: string[], // Array of user IDs who follow this user
    following?: string[], // Array of user IDs this user follows
    blockedUsers?: string[], // Array of blocked user IDs
    _id?: mongoose.Types.ObjectId
    createdAt?: Date,
    updatedAt?: Date
}

const userSchema = new Schema<userInterface>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String },
        username: { type: String, unique: true, sparse: true },
        image: { type: String },
        followers: { type: [String], default: [] },
        following: { type: [String], default: [] },
        blockedUsers: { type: [String], default: [] }
    },
    {
        timestamps: true
    }
);

userSchema.pre('save', async function () {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
})

const User = models?.User || model<userInterface>("User", userSchema);

export default User;