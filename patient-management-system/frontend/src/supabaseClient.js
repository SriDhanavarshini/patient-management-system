import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bvjrlfmhwuagnzmsudlf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2anJsZm1od3VhZ256bXN1ZGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzE0ODksImV4cCI6MjA5MzYwNzQ4OX0.7hi9Y2Z8LSh9n8FVVFExn6LV-1nG_MkbalOJ50UaMCY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
