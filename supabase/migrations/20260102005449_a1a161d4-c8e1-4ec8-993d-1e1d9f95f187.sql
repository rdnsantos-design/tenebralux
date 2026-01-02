-- Corrigir função calc_option_totals
CREATE OR REPLACE FUNCTION public.calc_option_totals(p_bid1 jsonb, p_bid2 jsonb, p_options jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB := '[]'::jsonb;
  v_option JSONB;
  v_id TEXT;
  v_total INTEGER;
BEGIN
  FOR v_option IN SELECT * FROM jsonb_array_elements(p_options)
  LOOP
    v_id := v_option->>'id';
    v_total := COALESCE((p_bid1->>v_id)::integer, 0) + COALESCE((p_bid2->>v_id)::integer, 0);
    v_result := v_result || jsonb_build_object(
      'id', v_id,
      'name', v_option->>'name',
      'order', (v_option->>'order')::integer,
      'total', v_total
    );
  END LOOP;
  
  RETURN v_result;
END;
$function$;