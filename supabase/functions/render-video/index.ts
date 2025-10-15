import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoPath, assContent, format = 'mp4', crf = 18, preset = 'veryfast' } = await req.json();

    if (!videoPath || !assContent) {
      return new Response(JSON.stringify({ error: 'Missing videoPath or assContent' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Downloading source video from storage:', videoPath);
    const { data: videoBlob, error: downloadError } = await supabase.storage
      .from('videos')
      .download(videoPath);
    if (downloadError || !videoBlob) {
      throw new Error(`Failed to download source video: ${downloadError?.message}`);
    }

    // Prepare temp files
    const inputExt = videoPath.split('.').pop()?.toLowerCase() || 'mp4';
    const inputPath = `/tmp/input.${inputExt}`;
    const assPath = `/tmp/subs.ass`;
    const outputPath = `/tmp/output.${format === 'webm' ? 'webm' : 'mp4'}`;

    await Deno.writeFile(inputPath, new Uint8Array(await videoBlob.arrayBuffer()));
    await Deno.writeTextFile(assPath, assContent);

    console.log('Running FFmpeg to burn captions...');
    const args = [
      '-y',
      '-i', inputPath,
      '-vf', `ass=${assPath}:shaping=harfbuzz`,
      ...(format === 'webm'
        ? ['-c:v', 'libvpx-vp9', '-b:v', '5M', '-c:a', 'libopus']
        : ['-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-c:a', 'copy']
      ),
      outputPath,
    ];

    const ffmpeg = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const { code, stdout, stderr } = await ffmpeg.output();
    if (code !== 0) {
      console.error('FFmpeg failed:', new TextDecoder().decode(stderr));
      throw new Error('FFmpeg failed while rendering video');
    }
    console.log('FFmpeg completed:', new TextDecoder().decode(stdout));

    // Upload processed video
    const outExt = format === 'webm' ? 'webm' : 'mp4';
    const exportPath = `exports/processed-${Date.now()}.${outExt}`;
    const outputData = await Deno.readFile(outputPath);

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(exportPath, outputData, { contentType: `video/${outExt}` });
    if (uploadError) {
      throw new Error(`Failed to upload processed video: ${uploadError.message}`);
    }

    const { data: pub } = supabase.storage.from('videos').getPublicUrl(exportPath);
    const url = pub.publicUrl;

    return new Response(JSON.stringify({ url, path: exportPath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('render-video error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});