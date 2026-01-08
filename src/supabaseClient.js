import { createClient } from '@supabase/supabase-js';

// 1. Replace this with your own Project URL from Step 1
const supabaseUrl = 'https://ofkeuetiwvcwngawbckm.supabase.co';

// 2. Replace this with your own "anon" (public) Key from Step 1
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2V1ZXRpd3Zjd25nYXdiY2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjkzNTUsImV4cCI6MjA3OTA0NTM1NX0.IJzXHZngIYWaROFeT9NBp4emuExEbkGeeyBGpSWv5m8';

export const supabase = createClient(supabaseUrl, supabaseKey);
