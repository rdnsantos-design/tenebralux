import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { planets } = await req.json();

    if (!planets || !Array.isArray(planets)) {
      return new Response(
        JSON.stringify({ error: "Invalid planets data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform planets to database format
    const planetsToInsert = planets.map((p: any) => ({
      nome: p.nome,
      x: p.x,
      y: p.y,
      z: p.z,
      distancia: p.distancia,
      regiao: p.regiao,
      faccao: p.faccao,
      zona: p.zona,
      tier: p.tier,
      d: p.D,
      r: p.R,
      def: p.Def,
      slots_prod: p.slotsProd,
      slots_com: p.slotsCom,
      slots_soc: p.slotsSoc,
      pcp_total: p.pcpTotal,
      pcp_gasto: p.pcpGasto,
      tags_positivas: p.tagsPositivas || '',
      tags_negativas: p.tagsNegativas || '',
      tipo: p.tipo,
      funcao: p.funcao,
      populacao: p.populacao,
      descricao: p.descricao || ''
    }));

    // Insert in batches of 50
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < planetsToInsert.length; i += batchSize) {
      const batch = planetsToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('galaxy_planets')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i}:`, error);
        return new Response(
          JSON.stringify({ error: error.message, insertedCount }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      insertedCount += batch.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        insertedCount,
        message: `${insertedCount} planetas importados com sucesso!` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
