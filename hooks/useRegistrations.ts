import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as DB from '../db/database';
import { getTournamentById } from '../data/tournaments';

type Filter = 'active' | 'past' | 'all';

interface Options {
  filter?: Filter;
}

export function useRegistrations({ filter = 'all' }: Options = {}) {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState<DB.Registration[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const load = useCallback(() => {
    if (!currentUser) return;
    DB.getRegistrationsByUserId(currentUser.id).then(data => {
      const today = new Date(new Date().toDateString());
      let result = data;
      if (filter === 'active') {
        result = data.filter(r => {
          const t = getTournamentById(r.tournamentId);
          if (!t) return true;
          return new Date(t.date) >= today;
        });
      } else if (filter === 'past') {
        result = data.filter(r => {
          const t = getTournamentById(r.tournamentId);
          if (!t) return false;
          return new Date(t.date) < today;
        });
        result = [...result].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      }
      setRegistrations(result);
      setLoadingData(false);
    });
  }, [currentUser, filter]);

  useEffect(() => { load(); }, [load]);

  return { registrations, loadingData, reload: load };
}
