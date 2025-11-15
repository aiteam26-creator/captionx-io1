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

    // Build enhanced prompt for AI
    const systemPrompt = `You are an expert subtitle designer specializing in Advanced SubStation Alpha (.ass) format. Create broadcast-quality, professionally styled captions.

CRITICAL REQUIREMENTS:
1. Generate COMPLETE, VALID .ass file with all required sections
2. Use V4+ Styles format (most compatible)
3. Position captions intelligently to avoid faces (typically at y: 300-700)
4. Create multiple style definitions for visual hierarchy
5. Emphasize key words with appropriate styling
6. Ensure perfect readability on all backgrounds
7. Apply theme-specific visual identity consistently

POSITIONING STRATEGY (1920x1080 video):
- Safe zones: Bottom (y: 900-1000), Top (y: 50-150), Sides (x: 50-200, 1720-1870)
- AVOID center region (y: 300-700, x: 600-1320) where faces appear
- Use \\pos(x,y) for precise placement
- Use \\an alignment: 1=bottom-left, 2=bottom-center, 3=bottom-right, 7=top-left, 8=top-center, 9=top-right
- Stagger positions when captions overlap in time

STYLING TAGS:
- \\b1 = bold, \\i1 = italic
- \\fs<size> = font size
- \\c&H<color>& = primary color (BGR hex)
- \\1c, \\2c, \\3c, \\4c = primary, secondary, outline, shadow colors
- \\bord<width> = outline width
- \\shad<depth> = shadow depth
- \\fad(in,out) = fade in/out in milliseconds
- \\t(start,end,\\<tag>) = animated transformation

THEME STYLING GUIDES:

CINEMATIC: Elegant, dramatic, film-quality
- Fonts: "Trajan Pro", "Garamond", "Baskerville"
- Colors: Gold (#FFD700), White (#FFFFFF), Deep Red (#8B0000)
- Effects: \\fad(300,300), subtle shadows, serif fonts
- Position: Bottom-center with artistic offset
- Emphasis: \\b1\\fs48 for key words, italic for emotion

ROBOTIC: Technical, futuristic, precise
- Fonts: "Courier New", "Consolas", "Roboto Mono"
- Colors: Cyan (#00FFFF), Electric Blue (#0080FF), White (#FFFFFF)
- Effects: \\bord3, sharp outlines, no fades
- Position: Grid-aligned, mathematical spacing
- Emphasis: \\c&H00FFFF& (cyan) for key words, monospace consistency

NATURE: Organic, flowing, earth-toned
- Fonts: "Palatino", "Georgia", "Century Schoolbook"
- Colors: Forest Green (#228B22), Earth Brown (#8B4513), Cream (#FFFACD)
- Effects: \\fad(400,400), soft shadows, flowing placement
- Position: Scattered naturally, avoid rigid alignment
- Emphasis: Larger size \\fs44, earth tone colors

NEON: Vibrant, bold, high-energy
- Fonts: "Impact", "Arial Black", "Bebas Neue"
- Colors: Hot Pink (#FF1493), Electric Yellow (#FFFF00), Cyan (#00FFFF)
- Effects: \\bord4\\shad0, heavy outline, glow effect
- Position: Dynamic, asymmetric placement
- Emphasis: Color shifts, \\b1\\fs52 for impact

MINIMAL: Clean, simple, elegant
- Fonts: "Helvetica", "Arial", "Futura"
- Colors: White (#FFFFFF), Black outline
- Effects: \\bord2\\shad1, minimal styling
- Position: Bottom-center, consistent
- Emphasis: \\b1 only, subtle size increase \\fs40

RETRO: Vintage, warm, nostalgic
- Fonts: "Cooper Black", "Courier", "American Typewriter"
- Colors: Warm Orange (#FF8C00), Vintage Yellow (#FFD700), Sepia
- Effects: \\bord2, warm shadows, classic positioning
- Position: Bottom-center, old-school placement
- Emphasis: \\b1\\i1, retro color palette

FILE STRUCTURE:
[Script Info]
Title: [Theme] Captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: [Create 3-5 styles: Default, Emphasis, Strong, Subtle]

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: [Each caption with proper timing and styling]

QUALITY CHECKLIST:
✓ All timings in format: H:MM:SS.CS (e.g., 0:00:01.50)
✓ No overlapping captions at same position
✓ Key words properly emphasized
✓ Theme colors applied consistently
✓ Readable on light AND dark backgrounds
✓ Professional typography spacing
✓ Smooth timing transitions`;

    const userPrompt = `Create a complete, professional .ass caption file for a ${videoDuration.toFixed(2)}-second video with the "${theme.toUpperCase()}" theme.

VIDEO DETAILS:
- Duration: ${videoDuration.toFixed(2)} seconds
- Resolution: 1920x1080
- Theme: ${theme}
- Total words: ${captions.length}

WORD-BY-WORD TRANSCRIPTION:
${captions.map((c: Caption, i: number) => {
  const duration = (c.end - c.start).toFixed(2);
  const isLongWord = c.word.length > 8;
  const hasExclamation = c.word.includes('!') || c.word.includes('?');
  const emphasis = isLongWord || hasExclamation ? ' [EMPHASIZE]' : '';
  return `${String(i + 1).padStart(3, '0')}. "${c.word}" | ${c.start.toFixed(2)}s → ${c.end.toFixed(2)}s (${duration}s)${emphasis}`;
}).join('\n')}

${keyframes && keyframes.length > 0 ? `
SCENE CONTEXT (for positioning):
${keyframes.map((kf: Keyframe) => 
  `Shot ${kf.shot_number} @ ${kf.timestamp.toFixed(2)}s: "${kf.transcription}"\n  → Avoid center, prefer ${kf.shot_number % 2 === 0 ? 'bottom' : 'top'} positioning`
).join('\n')}
` : ''}

GENERATION INSTRUCTIONS:
1. Create 4 style definitions:
   - "Default": Standard caption style
   - "Emphasis": For important words (20% larger, theme accent color)
   - "Strong": For very important words (40% larger, bold, primary theme color)
   - "Subtle": For secondary words (10% smaller, muted color)

2. Position each caption:
   - Analyze timing overlaps
   - Alternate between safe zones (bottom: y=950, top: y=100, left: x=150, right: x=1770)
   - NEVER place at center (y=400-700)
   - Use \\pos(x,y) for precise control

3. Apply emphasis:
   - Words marked [EMPHASIZE] → use "Emphasis" or "Strong" style
   - Long words (8+ chars) → slight size increase
   - Question/exclamation marks → "Strong" style
   - Regular words → "Default" style

4. Theme-specific effects:
   - Apply theme colors, fonts, and effects consistently
   - Add appropriate transitions (fades, etc.)
   - Ensure visual coherence throughout

5. Timing precision:
   - Use exact start/end times from transcription
   - Format: 0:00:MM.SS (minutes:seconds.centiseconds)
   - No gaps or overlaps in dialogue

OUTPUT REQUIREMENTS:
- Return ONLY the complete .ass file content
- Start with [Script Info]
- Include all sections: [V4+ Styles], [Events]
- Every word must have a Dialogue line
- Use proper .ass syntax
- No markdown formatting, no explanations
- Ready to save and use immediately

Generate the complete .ass file now:`;

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
