import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export async function submitScore(result) {
  if (!supabase) return { data: null, error: null, disabled: true };
  const { data, error } = await supabase.from('benchmark_scores').insert({
    mode: result.mode,
    difficulty: result.difficulty,
    score: result.score,
    average_fps: result.averageFps,
    stability: result.stability ?? null,
    duration: result.duration,
    device: result.device,
  }).select().single();
  return { data, error, disabled: false };
}

export async function fetchLeaderboard(mode) {
  if (!supabase) return { data: [], error: null, disabled: true };
  const query = supabase.from('benchmark_scores').select('*').order('score', { ascending: false }).limit(10);
  const { data, error } = await (mode ? query.eq('mode', mode) : query);
  return { data: data || [], error, disabled: false };
}
