// middleware.ts
export const config = {
  // This ensures it runs on all routes, but skips static assets like images/css
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/"],
};

export default function middleware(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const authValue = authHeader.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");

    if (
      user === process.env.BASIC_AUTH_USER &&
      pwd === process.env.BASIC_AUTH_PASSWORD
    ) {
      return new Response(null, { status: 200 }); // Continue to the site
    }
  }

  // Trigger the browser's native login popup
  return new Response("Authentication Required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}
