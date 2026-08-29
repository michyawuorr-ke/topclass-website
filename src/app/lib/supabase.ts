import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ikhkpdfgjqqbvkyvfgrw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlraGtwZGZnanFxYnZreXZmZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjE1NzMsImV4cCI6MjA5NDg5NzU3M30.RWBlgX-xH9aYTNBjwrRNeeogpoIvkSRXh08gIDSjb4U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

