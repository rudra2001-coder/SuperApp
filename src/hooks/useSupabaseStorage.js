import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useLocalStorage } from './useLocalStorage';

export function useSupabaseStorage(table, localStorageKey, initialValue) {
  const { supabase, session, configured, loading: ctxLoading } = useSupabase();
  const [localValue, setLocalValue] = useLocalStorage(localStorageKey, initialValue);
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = session?.user?.id;

  useEffect(() => {
    if (ctxLoading) return;
    if (!configured || !userId) {
      setData(localValue);
      setLoading(false);
      return;
    }
    fetchData();
  }, [configured, userId, ctxLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rows, error: err } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      if (rows && rows.length > 0) {
        const merged = mergeRows(rows);
        setData(merged);
        setLocalValue(merged);
      } else {
        setData(localValue);
      }
    } catch (err) {
      setError(err.message);
      setData(localValue);
    }
    setLoading(false);
  };

  const upsert = useCallback(async (newData) => {
    setData(newData);
    setLocalValue(newData);

    if (!configured || !userId) return;

    try {
      const record = {
        user_id: userId,
        data: newData,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        await supabase.from(table).update(record).eq('id', existing.id);
      } else {
        record.created_at = new Date().toISOString();
        await supabase.from(table).insert(record);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [configured, userId, table]);

  const removeItem = useCallback(async () => {
    setData(initialValue);
    setLocalValue(initialValue);
    if (!configured || !userId) return;
    try {
      await supabase.from(table).delete().eq('user_id', userId);
    } catch (err) {
      setError(err.message);
    }
  }, [configured, userId, table, initialValue]);

  return [data, upsert, { loading, error, removeItem }];
}

function mergeRows(rows) {
  if (rows.length === 0) return null;
  const latest = rows.reduce((a, b) =>
    new Date(a.created_at) > new Date(b.created_at) ? a : b
  );
  return latest.data;
}
