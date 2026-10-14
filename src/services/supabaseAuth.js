import { supabase } from './supabaseClient';
import { createLabAuth } from './labAuthCore';
export const labAuth = createLabAuth(supabase);
