import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware() {
    return NextResponse.next(); 
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
          return true; 
        }
        if (pathname === "/" || pathname.startsWith("/api/video")) {
          return true;
        }
        return !!token;
      }
    }
  }
)

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
