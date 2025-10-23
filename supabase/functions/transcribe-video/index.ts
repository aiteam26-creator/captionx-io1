import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function generateASSFile(segments: any[]): string {
  let ass = `[Script Info]
Title: Auto-Generated Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,68,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,2,10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  segments.forEach((segment) => {
    const words = segment.text.trim().split(/\s+/);
    const duration = segment.end - segment.start;
    const timePerWord = duration / words.length;
    
    words.forEach((word: string, idx: number) => {
      const start = segment.start + (idx * timePerWord);
      const end = start + timePerWord;
      ass += `Dialogue: 0,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${word}\n`;
    });
  });

  return ass;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoBase64, mimeType } = await req.json();
    
    if (!videoBase64) {
      throw new Error('No video data provided');
    }

    console.log('Processing video for transcription...');

    // Process video in chunks
    const binaryVideo = processBase64Chunks(videoBase64);
    
    // Prepare form data for Whisper (accepts video files directly)
    const formData = new FormData();
    const fileExtension = mimeType?.includes('mp4') ? 'mp4' : 'webm';
    const blob = new Blob([binaryVideo], { type: mimeType || 'video/webm' });
    formData.append('file', blob, `video.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    // Note: timestamp_granularities is not needed, word timestamps are in verbose_json

    console.log('Sending video to OpenAI Whisper...');

    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error status:', response.status);
      console.error('OpenAI API error details:', errorText);
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Transcription completed with word-level timestamps');

    // Parse word-level captions with accurate timestamps
    const captions: Array<{
      word: string;
      start: number;
      end: number;
      isKeyword: boolean;
      fontSize: number;
      fontFamily: string;
      color: string;
    }> = [];
    
    if (result.words) {
      result.words.forEach((wordData: any) => {
        captions.push({
          word: wordData.word.trim(),
          start: wordData.start,
          end: wordData.end,
          isKeyword: false,
          fontSize: 32,
          fontFamily: 'Inter',
          color: '#ffffff'
        });
      });
    }

    // Generate ASS caption file from word-level captions
    const assSegments = captions.map(cap => ({
      text: cap.word,
      start: cap.start,
      end: cap.end
    }));
    const assContent = generateASSFile(assSegments);

    return new Response(
      JSON.stringify({ 
        captions,
        assContent,
        text: result.text 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-video function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
