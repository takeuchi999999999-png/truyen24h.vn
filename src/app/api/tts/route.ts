import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // Prepare child process for Edge TTS
    // Python's edge-tts pipe stdout
    
    const stream = new ReadableStream({
      start(controller) {
        const p = spawn('python', ['-m', 'edge_tts', '--text', text, '--voice', 'vi-VN-HoaiMyNeural', '--write-media', '-']);
        
        p.stdout.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        
        p.stderr.on('data', (err) => {
          console.error('Edge-TTS Error:', err.toString());
        });
        
        p.on('close', (code) => {
          if (code !== 0) {
             console.error(`child process exited with code ${code}`);
          }
          controller.close();
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
