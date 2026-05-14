// src/app/api/ai/greeting/route.ts
// Server-side API route — Gemini API key stays on server, never exposed to browser
import { NextRequest, NextResponse } from 'next/server';
import { getDailyGreeting } from '@/services/geminiService';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
    try {
          const body = await req.json();
          const { userName } = body;

          if (!userName || typeof userName !== 'string' || userName.length > 100) {
                  return NextResponse.json({ error: 'Invalid userName' }, { status: 400 });
                }

          const greeting = await getDailyGreeting(userName.replace(/[<>"']/g, '').slice(0, 50));
    return NextResponse.json({ greeting });
  } catch (err: any) {
    console.error('[api/ai/greeting] error:', err?.message);
    return NextResponse.json({ error: 'Failed to generate greeting' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
