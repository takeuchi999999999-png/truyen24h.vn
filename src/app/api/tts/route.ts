import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const maxDuration = 60; // Increase Vercel timeout to 60 seconds

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // Configure Node-Edge-TTS
    const tts = new EdgeTTS({
      voice: 'vi-VN-HoaiMyNeural',
      pitch: '+0Hz',
      rate: '+0%',
      volume: '+0%'
    });

    // Chunk text by 600 characters max, respecting word boundaries
    const chunks = [];
    let currentChunk = '';
    const words = text.split(' ');
    
    for (const word of words) {
        if ((currentChunk + ' ' + word).length > 600) {
            chunks.push(currentChunk);
            currentChunk = word;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + word;
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    const buffers = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        if (!chunkText.trim()) continue;
        
        const tempFilePath = path.join(os.tmpdir(), `tts-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.mp3`);
        
        try {
            await tts.ttsPromise(chunkText, tempFilePath);
            const audioBuffer = fs.readFileSync(tempFilePath);
            buffers.push(audioBuffer);
            fs.unlinkSync(tempFilePath);
        } catch (err) {
            console.error(`Error generating chunk ${i}:`, err);
            // Optionally ignore one chunk failure and proceed
        }
    }

    if (buffers.length === 0) {
        throw new Error('Failed to generate any audio chunks');
    }

    const finalBuffer = Buffer.concat(buffers);

    return new NextResponse(finalBuffer, {
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
