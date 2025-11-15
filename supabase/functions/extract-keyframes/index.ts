import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate perceptual hash for image similarity detection
function calculateImageHash(imageData: Uint8ClampedArray, width: number, height: number): string {
  const blockSize = 8;
  const grayscale: number[] = [];
  
  // Convert to grayscale and downsample
  for (let y = 0; y < height; y += Math.floor(height / blockSize)) {
    for (let x = 0; x < width; x += Math.floor(width / blockSize)) {
      const i = (y * width + x) * 4;
      const gray = imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114;
      grayscale.push(gray);
    }
  }
  
  // Calculate average
  const avg = grayscale.reduce((a, b) => a + b, 0) / grayscale.length;
  
  // Generate hash
  return grayscale.map(v => v > avg ? '1' : '0').join('');
}

// Calculate Hamming distance between two hashes
function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frames, videoId, captions } = await req.json();
    
    if (!frames || !Array.isArray(frames)) {
      throw new Error('Invalid frames data');
    }

    console.log(`Processing ${frames.length} frames for shot detection`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const keyframes: any[] = [];
    let shotNumber = 0;
    let previousHash: string | null = null;
    const SCENE_CHANGE_THRESHOLD = 15; // Hamming distance threshold for scene change

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const { imageData, width, height, timestamp, jpegDataUrl } = frame;
      
      // Calculate hash for current frame
      const currentHash = calculateImageHash(
        new Uint8ClampedArray(imageData),
        width,
        height
      );

      // Detect scene change
      let isSceneChange = false;
      if (previousHash === null) {
        isSceneChange = true; // First frame is always a keyframe
      } else {
        const distance = hammingDistance(previousHash, currentHash);
        isSceneChange = distance > SCENE_CHANGE_THRESHOLD;
      }

      if (isSceneChange) {
        shotNumber++;
        
        // Extract base64 JPEG from data URL
        if (!jpegDataUrl) {
          console.error('No JPEG data URL for frame');
          continue;
        }
        
        const base64Data = jpegDataUrl.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to storage
        const fileName = `${videoId}/shot-${shotNumber}-${timestamp.toFixed(2)}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('keyframes')
          .upload(fileName, imageBytes, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('keyframes')
          .getPublicUrl(fileName);

        // Find corresponding transcription
        const transcription = captions
          ?.filter((c: any) => c.start <= timestamp && c.end >= timestamp)
          .map((c: any) => c.word)
          .join(' ') || '';

        // Calculate duration (until next keyframe or end)
        const nextKeyframeIndex = i + 1;
        const duration = nextKeyframeIndex < frames.length 
          ? frames[nextKeyframeIndex].timestamp - timestamp
          : 5; // Default 5 seconds for last keyframe

        keyframes.push({
          video_id: videoId,
          timestamp,
          duration,
          image_url: publicUrl,
          transcription,
          shot_number: shotNumber
        });

        console.log(`Detected keyframe at ${timestamp}s (shot ${shotNumber})`);
      }

      previousHash = currentHash;
    }

    // Save keyframes to database
    const { error: dbError } = await supabase
      .from('keyframes')
      .insert(keyframes);

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log(`Extracted ${keyframes.length} keyframes from ${shotNumber} shots`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        keyframes,
        totalShots: shotNumber 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-keyframes function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
