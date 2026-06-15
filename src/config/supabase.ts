import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmudxhrhfucjldrgspcu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdWR4aHJoZnVjamxkcmdzcGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTQxNzgsImV4cCI6MjA5NzA3MDE3OH0.IZzLVpQBVyIHc5vq70pT5IhYZxuijN8jl-mh2pf1fLQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
