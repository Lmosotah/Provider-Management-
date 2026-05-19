import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://bsxrbyjkkqahmlwgfeji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzeHJieWpra3FhaG1sd2dmZWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTA0MzgsImV4cCI6MjA5NDc2NjQzOH0.u7V2ZFKeFo9d6UWQsPzNUZppumtUGor_oJYNLw_0zRs'
)
