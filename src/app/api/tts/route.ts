import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import os from 'os';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // Prepare temp file for edge-tts
    const tempFilePath = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`);
    
    // Configure Node-Edge-TTS
    const tts = new EdgeTTS({
      voice: 'vi-VN-HoaiMyNeural',
      pitch: '+0Hz',
      rate: '+0%',
      volume: '+0%'
    });

    await tts.ttsPromise(text, tempFilePath);

    // Read the created file
    const audioBuffer = fs.readFileSync(tempFilePath);
    
    // Clean up
    fs.unlinkSync(tempFilePath);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
