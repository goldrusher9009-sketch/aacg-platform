import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey

export const supabase = createClient(supabaseUrl, supabaseKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const DB_TABLES = {
  USERS: 'users',
  COMPANIES: 'companies',
  MECHANICS_LIENS: 'mechanics_liens',
  PHOTO_ANALYSIS: 'photo_analysis',
  PROJECTS: 'projects',
  TRANSACTIONS: 'transactions',
}

export default supabase
