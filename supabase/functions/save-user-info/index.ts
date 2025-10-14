import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = 'YOUR_BASE_ID'; // Replace with your Airtable Base ID
const AIRTABLE_TABLE_NAME = 'Users'; // Replace with your Airtable Table Name

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone } = await req.json();

    if (!email || !phone) {
      throw new Error('Email and phone are required');
    }

    // Save to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Email: email,
            Phone: phone,
            CreatedAt: new Date().toISOString(),
          },
        }),
      }
    );

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.text();
      console.error('Airtable error:', errorData);
      throw new Error('Failed to save to Airtable');
    }

    const data = await airtableResponse.json();

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
