import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) {
  const user = process.env.RADAR_USER,
    password = process.env.RADAR_PASSWORD;
  if (!user && !password) return NextResponse.next();
  if (!user || !password)
    return new NextResponse("Access configuration incomplete", { status: 503 });
  const header = request.headers.get("authorization") ?? "";
  let supplied = "";
  try {
    if (header.startsWith("Basic ")) supplied = atob(header.slice(6));
  } catch {}
  const expected = `${user}:${password}`;
  let difference = supplied.length ^ expected.length;
  for (let i = 0; i < expected.length; i++)
    difference |= expected.charCodeAt(i) ^ (supplied.charCodeAt(i) || 0);
  if (difference !== 0)
    return new NextResponse("请使用工作台账号登录", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="EvoMeme Radar", charset="UTF-8"',
        "Cache-Control": "no-store",
      },
    });
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
