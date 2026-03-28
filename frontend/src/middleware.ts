import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — yoxlama lazım deyil
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // /dashboard/* — token olmalıdır
  if (pathname.startsWith("/dashboard")) {
    // Token ya Authorization header-dən, ya da Zustand persist cookie-sindən oxunur.
    // Next.js middleware-də localStorage yoxdur — cookie istifadə edirik.
    // Zustand persist default olaraq localStorage saxlayır (cookie deyil),
    // ona görə yalnız cookie-based token varsa check edirik;
    // yoxdursa redirect — client-side hydration da eyni şeyi edir.
    const tokenCookie = request.cookies.get("access_token")?.value;

    if (!tokenCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
