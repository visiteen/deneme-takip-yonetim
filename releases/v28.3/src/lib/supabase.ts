import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vtrcufrhmgmnqbbqiowh.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_g4FJ3WKPJLOFc068Tyzuew_OFylBDvX'

if (!supabaseUrl || !supabaseKey) throw new Error('Supabase yapılandırması eksik')
export const supabase = createClient(supabaseUrl, supabaseKey)
