import { NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const sessionCookie = req.cookies.get("vidyamotion_session");

  // Protect dashboard route
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  // Redirect authenticated users away from sign-in/sign-up to dashboard
  if (
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up")
  ) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
