import { NextRequest, NextResponse } from "next/server";
import User from "@/model/User";
import { connectToDatabase } from "@/utils/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json(); 
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );    
    }
    await connectToDatabase();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }   
    const newUser = new User({ email, password });
    await newUser.save();
    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

  }catch (error) {
    console.log("Error in registering user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
