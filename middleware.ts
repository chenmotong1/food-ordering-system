import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { unsealData } from "iron-session";

interface SessionData {
  userId: string;
  username: string;
  role: string;
}

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

async function getSessionFromCookie(
  request: NextRequest
): Promise<SessionData | null> {
  const cookie = request.cookies.get("food-ordering-session");
  if (!cookie?.value) return null;

  try {
    const session = await unsealData<SessionData>(cookie.value, {
      password: SESSION_SECRET,
    });
    if (session.userId) return session;
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromCookie(request);

  // Routes requiring login
  const authRequiredPaths = ["/cart/checkout", "/orders", "/user"];

  const needsAuth = authRequiredPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (needsAuth && !session?.userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require staff+ role
  if (pathname.startsWith("/admin")) {
    if (!session?.userId) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const allowedRoles = ["employee", "manager", "admin"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
