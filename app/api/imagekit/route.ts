import { getUploadAuthParams } from "@imagekit/next/server"

export async function GET() {

   try {
     const authenticationParameter = getUploadAuthParams({
         privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string, 
         publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
       
     })
 
     return Response.json({ authenticationParameter, publicKey: process.env.IMAGEKIT_PUBLIC_KEY })
   } catch (error) {
    return Response.json({ error: "Failed to get upload auth parameters" }, { status: 500 });
   }
}