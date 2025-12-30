import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to remove diacritics/accents and special characters from strings
function sanitizeFileName(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/ç/g, "c")              // Replace cedilla
    .replace(/Ç/g, "C")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .replace(/[^a-zA-Z0-9-]/g, "");  // Remove any remaining special chars
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Invalid token:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated request from user: ${user.id}`);

    const { terrainName, terrainTag } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Create prompt based on terrain type
    const tagDescriptions: Record<string, string> = {
      'Elevação': 'elevated terrain with height variation, rocky outcrops',
      'Profundidade': 'water terrain, rivers, streams, or deep water bodies',
      'Obstrução': 'difficult terrain with environmental hazards',
      'Fortificação': 'medieval fortification, defensive structure',
      'Cobertura': 'dense vegetation providing cover',
      'Obstáculo': 'rocky or ruined terrain with obstacles',
      'Desnível': 'terrain with sudden elevation changes, ravines',
    };

    const terrainDescriptions: Record<string, string> = {
      'Planície': 'flat open grassland, green plains with short grass',
      'Colina': 'gentle rolling hill with grass and scattered rocks',
      'Morro': 'steep hill with exposed rock faces and sparse vegetation',
      'Montanha': 'towering mountain peak with snow and cliffs',
      'Córrego': 'small shallow stream with clear water flowing through grass',
      'Rio': 'wide flowing river with deep blue water',
      'Deserto': 'hot sandy desert with dunes and scorching sun',
      'Dunas': 'large sand dunes in a vast desert landscape',
      'Neve': 'snow-covered landscape with white powder snow',
      'Gelo': 'frozen ice field with dangerous slippery surfaces',
      'Brejo': 'wet marshland with reeds and shallow water',
      'Pântano': 'dark swamp with murky water and dead trees',
      'Paliçada': 'wooden palisade wall with pointed stakes',
      'Forte': 'stone fort with towers and battlements',
      'Castelo': 'grand medieval castle with high walls and towers',
      'Fortaleza': 'massive impenetrable fortress with thick walls',
      'Matagal': 'dense thicket with bushes and thorny plants',
      'Bosque': 'light woodland with scattered trees',
      'Floresta': 'dense dark forest with tall ancient trees',
      'Poça': 'small shallow pond with calm water',
      'Lago': 'large calm lake with deep blue water',
      'Rochas': 'rocky terrain with large boulders',
      'Ruínas': 'ancient stone ruins overgrown with vines',
      'Depressão': 'low depression in the ground, sunken area',
      'Ravina': 'deep ravine with steep cliff walls',
      'Fosso': 'defensive moat or deep trench around fortification',
    };

    const description = terrainDescriptions[terrainName] || `${terrainName} terrain`;
    const tagDesc = terrainTag ? tagDescriptions[terrainTag] || '' : '';

    const prompt = `A fantasy battle map hex tile terrain view from top-down perspective, ${description}, ${tagDesc}, game tile art style, vibrant colors, clean edges suitable for hexagonal tile, no text or labels, illustration style`;

    console.log(`Generating image for terrain: ${terrainName}`);
    console.log(`Prompt: ${prompt}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Gateway response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    // Upload image to Supabase Storage (reuse the client created for auth)

    // Convert base64 to blob
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Sanitize filename by removing diacritics and special characters
    const sanitizedName = sanitizeFileName(terrainName.toLowerCase().replace(/\s+/g, '-'));
    const fileName = `terrain-${sanitizedName}-${Date.now()}.png`;
    const filePath = `terrains/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("card-backgrounds")
      .upload(filePath, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("card-backgrounds")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrlData.publicUrl 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating terrain image:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
