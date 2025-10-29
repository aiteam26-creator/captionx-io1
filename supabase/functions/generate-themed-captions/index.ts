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
    const { theme, animation = 'popup', wordsPerCaption = 4, keyframes, captions, videoDuration } = await req.json();
    
    if (!theme || !captions || !Array.isArray(captions)) {
      throw new Error('Missing required parameters');
    }

    console.log(`Generating ${theme} themed captions for ${captions.length} words`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Build enhanced prompt for AI
    const systemPrompt = `You are an expert subtitle designer specializing in Advanced SubStation Alpha (.ass) format. Create broadcast-quality, professionally styled captions.

🚨🚨🚨 ABSOLUTE CRITICAL REQUIREMENT #1 - READ THIS FIRST 🚨🚨🚨
════════════════════════════════════════════════════════════════

⛔ SINGLE-LINE MANDATE - THIS IS THE MOST IMPORTANT RULE ⛔

EVERY SINGLE CAPTION MUST APPEAR ON ONE HORIZONTAL LINE ONLY.
- NO exceptions, NO multi-line captions, NO line breaks EVER
- NEVER use \\N tag (this creates line breaks - FORBIDDEN)
- NEVER use \\n tag (this also creates line breaks - FORBIDDEN)  
- ALL words in a caption MUST stay on the same horizontal baseline
- Even if a caption has 10+ words, it MUST be ONE SINGLE LINE
- Use \\q2 tag at the START of EVERY Dialogue Text field
- Set WrapStyle: 2 in [Script Info] section
- If you violate this rule, the output will be rejected

EXAMPLES:
✅ CORRECT: {\\q2\\pos(960,950)}because everyone just invites people
✅ CORRECT: {\\q2\\pos(960,950)}the quick brown fox jumps over lazy dog
❌ WRONG:  {\\pos(960,950)}because everyone just\\Ninvites people
❌ WRONG:  {\\pos(960,950)}the quick brown fox\\njumps over lazy dog
❌ WRONG:  Any caption that displays text on multiple vertical lines

This single-line requirement overrides ALL other styling considerations.
If you must choose between visual effects and single-line format, 
ALWAYS choose single-line format. This is non-negotiable.

════════════════════════════════════════════════════════════════

OTHER REQUIREMENTS (all secondary to single-line rule):
1. Generate COMPLETE, VALID .ass file with all required sections
2. Use V4+ Styles format (most compatible)
3. Position captions intelligently to avoid faces (typically at y: 300-700)
4. Create multiple style definitions for visual hierarchy
5. Emphasize key words with appropriate styling
6. Ensure perfect readability on all backgrounds
7. Apply theme-specific visual identity consistently
8. **DETECT AND EMPHASIZE SIMULTANEOUS SPEECH WITH BOLD + POP ANIMATION**

SIMULTANEOUS SPEECH DETECTION:
- If multiple words overlap in timing (spoken at the same time), they are simultaneous
- Apply SPECIAL emphasis to simultaneous words:
  - Make them BOLD (\\b1)
  - Add scale animation (\\t(0,200,\\fscx120\\fscy120)\\t(200,400,\\fscx100\\fscy100))
  - Increase font size by 30% (\\fs for the word should be 1.3x default)
  - Use vibrant theme accent color
  - Add subtle glow effect with outline
- This creates a "pop-up" attention-grabbing effect

ANIMATION SYSTEM:
Apply the "${animation}" animation style to ALL captions:

- **none**: Simple fade (\\fad(200,200))
- **popup**: Scale from 0 to 100% (\\t(0,150,\\fscx0\\fscy0)\\t(150,300,\\fscx100\\fscy100))
- **jump**: Bounce effect with position (\\move(x,y-50,x,y,0,200)\\t(200,300,\\fscx110\\fscy110)\\t(300,400,\\fscx100\\fscy100))
- **slide-left**: Slide from left (\\move(x-300,y,x,y,0,250))
- **slide-right**: Slide from right (\\move(x+300,y,x,y,0,250))
- **slide-up**: Slide from bottom (\\move(x,y+100,x,y,0,250))
- **slide-down**: Slide from top (\\move(x,y-100,x,y,0,250))
- **fade**: Slow fade in (\\fad(400,400))
- **zoom**: Zoom from large (\\t(0,250,\\fscx150\\fscy150)\\t(250,400,\\fscx100\\fscy100))
- **rotate**: Rotate and fade (\\fad(300,300)\\t(0,300,\\frz360))
- **wave**: Character wave effect (use \\k timing with alternating \\t transforms)

CRITICAL: Apply the selected animation consistently to every caption using appropriate ASS override tags.

TIMING REQUIREMENTS:
- Natural, smooth timing - NOT rigid or mechanical
- Typical duration: 4-5 seconds depending on word count and speaking pace
- Adjust based on word length and natural speech rhythm
- Allow comfortable reading time for longer captions
- Don't rush short captions or drag out long ones

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
WrapStyle: 2

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

    const userPrompt = `Create a complete, professional .ass caption file for a ${videoDuration.toFixed(2)}-second video with the "${theme.toUpperCase()}" theme and "${animation.toUpperCase()}" animation style.

⚠️ REMINDER: EVERY CAPTION = ONE HORIZONTAL LINE ONLY ⚠️
NO \\N tags, NO \\n tags, NO line breaks. Use \\q2 in every Dialogue line.

VIDEO DETAILS:
- Duration: ${videoDuration.toFixed(2)} seconds
- Resolution: 1920x1080
- Theme: ${theme}
- Animation: ${animation}
- Words per caption: ${wordsPerCaption}
- Total words: ${captions.length}

🚨 CRITICAL GROUPING INSTRUCTION 🚨
Group every ${wordsPerCaption} consecutive words into ONE SINGLE CAPTION LINE.
- Each caption displays ${wordsPerCaption} words in ONE HORIZONTAL LINE
- Example: If words are ["it", "exclusively", "to", "themselves", "because"], and wordsPerCaption=3:
  Caption 1: "it exclusively to" (ALL 3 WORDS ON ONE SINGLE LINE - NO BREAKS)
  Caption 2: "themselves because" (ALL 2 WORDS ON ONE SINGLE LINE - NO BREAKS)
- NEVER split these grouped words across multiple lines
- The entire group stays on ONE SINGLE HORIZONTAL LINE with \\q2 tag

WORD-BY-WORD TRANSCRIPTION:
${captions.map((c: Caption, i: number) => {
  const duration = (c.end - c.start).toFixed(2);
  const isLongWord = c.word.length > 8;
  const hasExclamation = c.word.includes('!') || c.word.includes('?');
  
  // Check if this word overlaps with others (simultaneous speech)
  const overlappingWords = captions.filter((other: Caption, j: number) => 
    i !== j && 
    ((c.start >= other.start && c.start < other.end) || 
     (c.end > other.start && c.end <= other.end) ||
     (c.start <= other.start && c.end >= other.end))
  );
  
  const isSimultaneous = overlappingWords.length > 0;
  const simultaneousTag = isSimultaneous ? ' [SIMULTANEOUS - BOLD + POP!]' : '';
  const emphasis = isLongWord || hasExclamation ? ' [EMPHASIZE]' : '';
  
  return `${String(i + 1).padStart(3, '0')}. "${c.word}" | ${c.start.toFixed(2)}s → ${c.end.toFixed(2)}s (${duration}s)${simultaneousTag}${emphasis}`;
}).join('\n')}

${keyframes && keyframes.length > 0 ? `
SCENE CONTEXT (for positioning):
${keyframes.map((kf: Keyframe) => 
  `Shot ${kf.shot_number} @ ${kf.timestamp.toFixed(2)}s: "${kf.transcription}"\n  → Avoid center, prefer ${kf.shot_number % 2 === 0 ? 'bottom' : 'top'} positioning`
).join('\n')}
` : ''}

GENERATION INSTRUCTIONS:
1. **GROUP WORDS INTO CAPTIONS**:
   - Take ${wordsPerCaption} consecutive words and combine them into ONE caption
   - This forms a single caption line with ${wordsPerCaption} words
   - Timing: Start = first word's start time, End = last word's end time in group
   - Example grouping (${wordsPerCaption} words): "${captions.slice(0, wordsPerCaption).map(c => c.word).join(' ')}"
   
2. Create 5 style definitions:
   - "Default": Standard caption style with NO word wrapping
   - "Emphasis": For important words (20% larger, theme accent color)
   - "Strong": For very important words (40% larger, bold, primary theme color)
   - "Subtle": For secondary words (10% smaller, muted color)
   - "Simultaneous": For overlapping speech (BOLD, 50% larger, vibrant color, thick outline, pop animation)

3. Position each caption (ALWAYS ONE SINGLE HORIZONTAL LINE):
   - Analyze timing overlaps
   - Alternate between safe zones (bottom: y=950, top: y=100, left: x=150, right: x=1770)
   - NEVER place at center (y=400-700)
   - Use \\pos(x,y) for precise control
   - Use \\q2 tag to prevent word wrapping
   - Ensure horizontal space for full caption width
   - Remember: ${wordsPerCaption} words per caption, ALL ON ONE LINE

4. Apply emphasis with PRIORITY SYSTEM:
   - Words marked [SIMULTANEOUS - BOLD + POP!] → HIGHEST PRIORITY, use "Simultaneous" style with:
     * \\b1 (bold)
     * \\t(0,200,\\fscx120\\fscy120)\\t(200,400,\\fscx100\\fscy100) (pop animation)
     * Font size 1.5x default
     * Vibrant accent color (theme-specific bright color)
     * Heavy outline (\\bord4)
   - Words marked [EMPHASIZE] → use "Emphasis" or "Strong" style
   - Long words (8+ chars) → slight size increase
   - Question/exclamation marks → "Strong" style
   - Regular words → "Default" style

5. Theme-specific effects + Animation:
   - Apply theme colors, fonts, and effects consistently
   - **APPLY "${animation}" ANIMATION to every caption**
   - Use appropriate ASS override tags for the selected animation
   - Ensure smooth, professional motion
   - Add appropriate transitions (fades, etc.)
   - Ensure visual coherence throughout

6. Timing precision (NATURAL & SMOOTH):
   - Aim for 4-5 second duration per caption depending on length
   - Adjust based on word count: more words = longer duration
   - Allow natural reading pace - not too fast or slow
   - Format: 0:00:MM.SS (minutes:seconds.centiseconds)
   - Smooth transitions between captions

OUTPUT REQUIREMENTS:
- Return ONLY the complete .ass file content
- Start with [Script Info] with WrapStyle: 2
- Include all sections: [V4+ Styles], [Events]
- **MANDATORY: Group ${wordsPerCaption} words per caption, display as ONE HORIZONTAL LINE**
- **CRITICAL: Every Dialogue line MUST start with \\q2 tag in the Text field**
- **⛔ ABSOLUTELY FORBIDDEN: \\N or \\n tags (these create line breaks) ⛔**
- **ALL captions MUST be single horizontal lines - NO EXCEPTIONS**
- Use proper .ass syntax
- No markdown formatting, no explanations
- Ready to save and use immediately

CORRECT FORMAT EXAMPLES (notice \\q2 at start and NO \\N tags):
✅ Dialogue: 0,0:00:01.00,0:00:05.00,Default,,0,0,0,,{\\q2\\pos(960,950)}because everyone just invites people
✅ Dialogue: 0,0:00:05.00,0:00:09.00,Default,,0,0,0,,{\\q2\\pos(960,950)\\fad(200,200)}it exclusively to themselves only always
✅ Dialogue: 0,0:00:09.00,0:00:13.00,Default,,0,0,0,,{\\q2\\pos(960,100)}the quick brown fox jumps over the lazy

FORBIDDEN FORMATS (these create multiple lines - NEVER DO THIS):
❌ Dialogue: 0,0:00:01.00,0:00:05.00,Default,,0,0,0,,{\\pos(960,950)}because everyone just\\Ninvites people
❌ Dialogue: 0,0:00:01.00,0:00:05.00,Default,,0,0,0,,because everyone\\njust invites

Generate the complete .ass file now with SINGLE-LINE captions only:`;

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
