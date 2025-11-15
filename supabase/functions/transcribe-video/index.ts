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
    const requestBody = await req.json();
    const { videoBase64, mimeType } = requestBody;
    
    // Input validation
    if (!videoBase64 || typeof videoBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request format', code: 'INVALID_INPUT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate MIME type
    const validMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!mimeType || !validMimeTypes.includes(mimeType)) {
      return new Response(
        JSON.stringify({ error: 'Unsupported video format', code: 'INVALID_MIME_TYPE' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 format (basic check)
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(videoBase64.substring(0, 100))) {
      return new Response(
        JSON.stringify({ error: 'Invalid video data', code: 'INVALID_FORMAT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!videoBase64) {
      throw new Error('No video data provided');
    }

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Processing video for transcription...');
    console.log('Video size (base64):', Math.round(videoBase64.length / 1024 / 1024), 'MB');

    // Check file size limit (25MB for Whisper API)
    const estimatedSize = (videoBase64.length * 3) / 4; // Convert base64 to bytes
    const maxSize = 25 * 1024 * 1024; // 25MB
    
    if (estimatedSize > maxSize) {
      throw new Error(`File too large. Maximum size is 25MB, got ${Math.round(estimatedSize / 1024 / 1024)}MB`);
    }

    // Process video in chunks
    const binaryVideo = processBase64Chunks(videoBase64);
    
    // Prepare form data for Whisper (accepts video files directly)
    const formData = new FormData();
    const fileExtension = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('quicktime') ? 'mov' : 'webm';
    const blob = new Blob([binaryVideo], { type: mimeType || 'video/webm' });
    formData.append('file', blob, `video.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word'); // CRITICAL: Request word-level timestamps

    console.log('Sending video to OpenAI Whisper...');
    console.log('File extension:', fileExtension);
    console.log('API Key exists:', !!openAIKey);
    console.log('API Key length:', openAIKey.length);

    // Send to OpenAI Whisper with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    let result: any;
    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        // Log detailed error server-side only
        console.error('OpenAI API error:', {
          status: response.status,
          details: errorText,
          timestamp: new Date().toISOString()
        });
        throw new Error('External service error');
      }

      result = await response.json();
      console.log('Transcription result:', JSON.stringify(result).substring(0, 500));
      console.log('Has words array:', !!result.words);
      console.log('Words count:', result.words?.length || 0);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Transcription timed out after 2 minutes. Try a shorter video.');
      }
      throw fetchError;
    }

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
    
    if (result.words && Array.isArray(result.words)) {
      console.log('Processing', result.words.length, 'words for captions');
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
    } else {
      console.warn('No word-level timestamps returned from Whisper API');
      console.warn('Result structure:', Object.keys(result));
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
    // Detailed logging server-side only
    console.error('Transcription failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Generic error message to client
    return new Response(
      JSON.stringify({ 
        error: 'Transcription failed. Please try again or contact support.',
        code: 'TRANSCRIPTION_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
