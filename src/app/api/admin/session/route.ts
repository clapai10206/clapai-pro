import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  hasAdminSession,
  verifyAdminPassword,
} from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    return NextResponse.json({ authenticated: hasAdminSession(request) });
  } catch {
    return NextResponse.json({ authenticated: false, configured: false }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة.' }, { status: 401 });
    }

    const session = createAdminSession();
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'تعذر تسجيل الدخول.' },
      { status: 503 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
