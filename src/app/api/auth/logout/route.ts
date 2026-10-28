import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth';
import { ok } from '@/lib/api';

export async function POST() {
  await endSession();
  return ok();
}

/** Plain link logout (mobile menu): clears the session and goes back to the home page */
export async function GET(req: Request) {
  await endSession();
  return NextResponse.redirect(new URL('/', req.url));
}
