const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  // Test connection by querying the trips table
  supabase
    .from('trips')
    .select('*')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('Supabase connection error:', error);
      } else {
        console.log('Supabase connection successful!');
        console.log('Trips count:', data.length);
      }
    })
    .catch(err => {
      console.error('Supabase test failed:', err);
    });
} else {
  console.error('Supabase environment variables not set!');
}