import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface TasteSeed {
  id: string;
  name: string;
  type: string;
}

export function useTasteSeeds() {
  const { user } = useAuthStore();
  const [seeds, setSeeds] = useState<TasteSeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('taste_seeds')
      .select('id, name, type')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setSeeds(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return { seeds, loading };
}
