import { NextRequest, NextResponse } from "next/server";
import { getUploadAuthParams } from "@imagekit/next/server";

export async function GET(request: NextRequest) {
    try {
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
        const publicKey = process.env.NEXT_PUBLIC_PUBLIC_KEY || "";

        if (!privateKey || !publicKey) {
            return NextResponse.json(
                { error: "ImageKit keys not configured" },
                { status: 500 }
            );
        }

        const authParams = getUploadAuthParams({
            privateKey,
            publicKey,
        });

        return NextResponse.json({
            ...authParams,
            publicKey,
        });
    } catch (error) {
        console.error("Error generating upload auth params:", error);
        return NextResponse.json(
            { error: "Failed to generate auth params" },
            { status: 500 }
        );
    }
}
