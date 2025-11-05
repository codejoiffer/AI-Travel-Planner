import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

let memoryStore = [];

function getSupabase() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return null;
}

function getAuthenticatedSupabase(jwtToken) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && jwtToken) {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      }
    });
  }
  return null;
}

export default async function handler(req, res) {
  const supabase = getSupabase();
  
  // Extract JWT token from authorization header
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  let userId = null;
  
  // Try to extract user ID from JWT token
  if (authToken) {
    try {
      // Decode the JWT token to get user ID from sub claim
      const decoded = jwt.decode(authToken);
      userId = decoded?.sub;
    } catch (error) {
      console.error('JWT decode error:', error);
    }
  }
  
  if (req.method === 'GET') {
    if (supabase && userId) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return res.status(200).json(data);
    }
    // Fallback to memory store (filter by user if available)
    const userTrips = userId ? memoryStore.filter(trip => trip.user_id === userId) : memoryStore;
    return res.status(200).json(userTrips);
  }
  
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Try with authenticated client first (to respect RLS policies)
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const authSupabase = getAuthenticatedSupabase(authToken);
    
    if (authSupabase) {
      const { error } = await authSupabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (!error) {
        return res.status(200).json({ success: true });
      }
      console.error('Authenticated Supabase delete error:', error);
      // Fall back to service client if authenticated delete fails
    }
    
    // Fallback to service client if authenticated client fails or is not available
    if (supabase) {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Supabase delete error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
      }
      
      return res.status(200).json({ success: true });
    }
    
    // Fallback to memory store only if Supabase is not configured
    memoryStore = memoryStore.filter(trip => trip.id !== id);
    return res.status(200).json({ success: true });
  }
  
  if (req.method === 'POST') {
    const { plan, name = '未命名行程' } = req.body || {};
    if (!plan) return res.status(400).json({ error: 'plan required' });
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Try with authenticated client first (to respect RLS policies)
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const authSupabase = getAuthenticatedSupabase(authToken);
    
    if (authSupabase) {
      const { data, error } = await authSupabase
        .from('trips')
        .insert([{ name, plan, user_id: userId }])
        .select();
      
      if (error) {
        console.error('Authenticated Supabase insert error:', error);
        // Fall back to service client if authenticated insert fails
      } else if (data && data.length) {
        return res.status(201).json(data[0]);
      }
    }
    
    // Fallback to service client if authenticated client fails or is not available
    if (supabase) {
      const { data, error } = await supabase
        .from('trips')
        .insert([{ name, plan, user_id: userId }])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
      }
      
      if (data && data.length) return res.status(201).json(data[0]);
      return res.status(500).json({ error: 'Insert failed - no data returned' });
    }
    
    // Fallback to memory store only if Supabase is not configured
    const id = String(Date.now());
    const trip = { id, name, plan, user_id: userId };
    memoryStore.push(trip);
    return res.status(201).json(trip);
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}
