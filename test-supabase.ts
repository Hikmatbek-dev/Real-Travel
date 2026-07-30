import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'artifacts/real-travel/.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('settings').select('*')
  console.log("Settings:", data, error)
}

test()
