import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Keyframe {
  timestamp: number;
  duration: number;
  image_url: string;
  transcription: string;
  shot_number: number;
}

interface Caption {
  word: string;
  start: number;
  end: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, keyframes, captions, videoDuration } = await req.json();
    
    if (!theme || !captions || !Array.isArray(captions)) {
      throw new Error('Missing required parameters');
    }

    console.log(`Generating ${theme} themed captions for ${captions.length} words`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Build prompt for AI
    const systemPrompt = `You are an expert subtitle designer specializing in Advanced SubStation Alpha (.ass) format. Your task is to create visually stunning, thematically appropriate captions that enhance the viewing experience.

Key Requirements:
1. Generate complete .ass file content with proper headers and styling
2. Position captions to avoid overlapping faces and other captions
3. Emphasize key words with bold, color changes, or size variations
4. Use typography and effects that match the theme
5. Ensure captions are arranged in neat, readable lines
6. Apply theme-appropriate colors, fonts, and animations

Available positioning strategies:
- Use \\pos(x,y) for precise placement
- Use \\an alignment tags (1-9 numpad notation)
- Consider video dimensions: 1920x1080
- Avoid center region (faces typically appear at y: 300-700)
- Preferred safe zones: top (y: 50-200), bottom (y: 880-1000), sides (x: 50-200, 1720-1870)

Theme guidelines:
- Robotic: Monospace fonts, cyan/blue colors, glitch effects, precise positioning
- Nature: Organic fonts, green/earth tones, flowing animations, scattered placement
- Cinematic: Serif fonts, dramatic colors, fade effects, bottom-center with artistic touches
- Minimal: Simple sans-serif, white/black, clean positioning, no effects
- Neon: Bold fonts, vibrant colors, glow effects, dynamic positioning`;

    const userPrompt = `Create Advanced SubStation Alpha (.ass) captions for a ${videoDuration.toFixed(2)} second video with the "${theme}" theme.

Transcription with timings:
${captions.map((c: Caption, i: number) => 
  `${i + 1}. "${c.word}" (${c.start.toFixed(2)}s - ${c.end.toFixed(2)}s)`
).join('\n')}

${keyframes && keyframes.length > 0 ? `
Scene information (keyframes):
${keyframes.map((kf: Keyframe) => 
  `Shot ${kf.shot_number} at ${kf.timestamp.toFixed(2)}s: "${kf.transcription}"`
).join('\n')}
` : ''}

Generate a complete .ass file that:
1. Uses the V4+ Styles format
2. Creates multiple style definitions for different emphasis levels
3. Positions each caption to avoid overlaps and faces
4. Emphasizes important words appropriately
5. Applies theme-specific visual effects
6. Ensures all captions are readable and aesthetically balanced

Return ONLY the complete .ass file content, starting with [Script Info] and including all sections.`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assContent = data.choices?.[0]?.message?.content;

    if (!assContent) {
      throw new Error('No caption content generated');
    }

    console.log(`Generated themed .ass captions (${assContent.length} characters)`);

    return new Response(
      JSON.stringify({ 
        success: true,
        assContent,
        theme
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-themed-captions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: error instanceof Error && error.message.includes('Rate limit') ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
