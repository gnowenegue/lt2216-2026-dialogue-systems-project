// middleware.ts (in your project root)

export const config = {
  // Protect everything EXCEPT the assets folder and favicon
  // This prevents the auth popup from triggering for every single .js/.css file
  matcher: ["/((?!assets|favicon.ico|.*\\..*).*)", "/"],
};

export default function middleware(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    try {
      const authValue = authHeader.split(" ")[1];
      const decoded = atob(authValue);
      const [user, pwd] = decoded.split(":");

      if (
        user === process.env.BASIC_AUTH_USER &&
        pwd === process.env.BASIC_AUTH_PASSWORD
      ) {
        // IMPORTANT: Returning nothing tells Vercel to "pass through"
        // to your Vite static files (index.html, etc.)
        return;
      }
    } catch (e) {
      // If base64 decoding fails, just fall through to 401
    }
  }

  return new Response("Authentication Required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}
