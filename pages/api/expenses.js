import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

let expenseStore = [];

function getSupabase() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    } catch (error) {
      console.error('Supabase客户端创建失败:', error.message);
      return null;
    }
  }
  return null;
}

function getAuthenticatedSupabase(jwtToken) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && jwtToken) {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: `Bearer ${jwtToken}` }
      }
    });
  }
  return null;
}

export default async function handler(req, res) {
  const supabase = getSupabase();
  if (!supabase) {
    console.log('费用API使用内存存储模式');
  }

  const authToken = req.headers.authorization?.replace('Bearer ', '');
  let userId = null;
  if (authToken) {
    try {
      const decoded = jwt.decode(authToken);
      userId = decoded?.sub;
    } catch (error) {
      console.error('JWT decode error:', error);
    }
  }

  if (req.method === 'GET') {
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { trip_id } = req.query;
    if (supabase) {
      let query = supabase.from('expenses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (trip_id) query = query.eq('trip_id', trip_id);
      const { data, error } = await query;
      if (error) {
        console.error('Supabase expenses query error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
      }
      return res.status(200).json(data || []);
    }
    const filtered = expenseStore.filter(e => e.user_id === userId && (!trip_id || e.trip_id === trip_id));
    return res.status(200).json(filtered);
  }

  if (req.method === 'POST') {
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { trip_id, amount, category = 'other', description = '', day = null, time = '' } = req.body || {};
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const record = { trip_id: trip_id || null, amount, category, description, day, time, user_id: userId };

    // Try authenticated client first (respect RLS)
    const authSupabase = getAuthenticatedSupabase(authToken);
    if (authSupabase) {
      const { data, error } = await authSupabase.from('expenses').insert([record]).select();
      if (!error && data && data.length) {
        return res.status(201).json(data[0]);
      }
      if (error) console.error('Authenticated Supabase insert expense error:', error);
    }

    if (supabase) {
      const { data, error } = await supabase.from('expenses').insert([record]).select();
      if (error) {
        console.error('Supabase insert expense error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
      }
      if (data && data.length) return res.status(201).json(data[0]);
      return res.status(500).json({ error: 'Insert failed - no data returned' });
    }

    const id = String(Date.now());
    const exp = { id, ...record, created_at: new Date().toISOString() };
    expenseStore.push(exp);
    return res.status(201).json(exp);
  }

  if (req.method === 'DELETE') {
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const authSupabase = getAuthenticatedSupabase(authToken);
    if (authSupabase) {
      const { error } = await authSupabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
      if (!error) return res.status(200).json({ success: true });
      if (error) console.error('Authenticated Supabase delete expense error:', error);
    }

    if (supabase) {
      const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
      if (error) {
        console.error('Supabase delete expense error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
      }
      return res.status(200).json({ success: true });
    }

    expenseStore = expenseStore.filter(e => e.id !== id || e.user_id !== userId);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

