import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pjbxzhtyttyrvijsecce.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EfQ1iq-2Hf5pNeuDQtblLg_CTK1c_lJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
