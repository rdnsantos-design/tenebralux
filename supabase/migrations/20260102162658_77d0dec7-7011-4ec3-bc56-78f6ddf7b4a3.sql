-- Add draw piles to support deterministic draw / refill across rounds
ALTER TABLE public.match_state
  ADD COLUMN IF NOT EXISTS player1_draw_pile jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS player2_draw_pile jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Optional indexes for debugging/ops (lightweight)
-- (No indexes needed for JSONB arrays; keeping minimal)