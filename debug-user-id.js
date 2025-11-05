const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugUserId() {
  console.log('Debugging Supabase Auth user ID format...');
  
  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables not set');
    return;
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoConfirmEmail: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: undefined // No storage for server-side
      }
    }
  );
  
  // Test with a known user (you'll need to create one first)
  const testEmail = 'test@example.com';
  const testPassword = 'testpassword123';
  
  try {
    // Try to sign in or create user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.error('Sign up error:', signUpError);
      
      // Try to sign in instead
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        return;
      }
      
      console.log('User ID from sign in:', signInData.user.id);
      console.log('User ID type:', typeof signInData.user.id);
      console.log('Is valid UUID?', isValidUUID(signInData.user.id));
    } else {
      console.log('User ID from sign up:', signUpData.user.id);
      console.log('User ID type:', typeof signUpData.user.id);
      console.log('Is valid UUID?', isValidUUID(signUpData.user.id));
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

debugUserId();