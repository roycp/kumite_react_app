import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as DB from '../../db/database';

export default function CoachAthletesScreen() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  const [myAthletes, setMyAthletes]   = useState<DB.User[]>([]);
  const [allAthletes, setAllAthletes] = useState<DB.User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tab, setTab]                 = useState<'mine' | 'assign'>('mine');

  // Auth guard
  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== 'coach')) {
      router.replace('/screens/MainScreen');
    }
  }, [currentUser, isLoading]);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoadingData(true);
    const [mine, all] = await Promise.all([
      DB.getAthletesByCoachId(currentUser.id),
      DB.getAllAthletes(),
    ]);
    const mineIds = new Set(mine.map(a => a.id));
    setMyAthletes(mine);
    setAllAthletes(all.filter(a => !mineIds.has(a.id)));
    setLoadingData(false);
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  const assign = async (athleteId: string) => {
    if (!currentUser) return;
    await DB.assignAthleteToCoach(currentUser.id, athleteId);
    await loadData();
  };

  const remove = async (athleteId: string) => {
    if (!currentUser) return;
    await DB.removeAthleteFromCoach(currentUser.id, athleteId);
    await loadData();
  };

  const s: any = {
    page:      { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
    header:    { maxWidth: 760, margin: '0 auto 20px', paddingTop: 8 },
    title:     { fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
    sub:       { color: '#666', fontSize: 14 },
    tabs:      { maxWidth: 760, margin: '0 auto 16px', display: 'flex', borderBottom: '2px solid #e0e0e0' },
    tab:       (active: boolean) => ({ padding: '10px 22px', background: 'none', border: 'none', borderBottom: active ? '2px solid #6750a4' : '2px solid transparent', color: active ? '#6750a4' : '#666', fontWeight: active ? 700 : 400, cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', marginBottom: -2 }),
    card:      { maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' },
    item:      { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #f0f0f0' },
    avatar:    { width: 44, height: 44, borderRadius: 22, background: '#f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
    info:      { flex: 1 },
    name:      { fontSize: 15, fontWeight: 700, color: '#1a1a2e' },
    meta:      { fontSize: 13, color: '#666', marginTop: 2 },
    assignBtn: { padding: '7px 18px', background: '#6750a4', border: 'none', borderRadius: 18, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
    removeBtn: { padding: '7px 18px', background: 'transparent', border: '1px solid #b3261e', borderRadius: 18, color: '#b3261e', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
    empty:     { textAlign: 'center', padding: '48px 24px', color: '#999' },
    emptyIcon: { fontSize: 52, display: 'block', marginBottom: 14 },
    emptyTxt:  { fontSize: 16, marginBottom: 8, color: '#555' },
    emptyHint: { fontSize: 13 },
  };

  const AthleteItem = ({
    athlete,
    action,
  }: {
    athlete: DB.User;
    action: React.ReactNode;
  }) => (
    <div style={s.item}>
      <div style={s.avatar}>🥋</div>
      <div style={s.info}>
        <div style={s.name}>{athlete.fullName}</div>
        <div style={s.meta}>
          {athlete.academy} · {athlete.country}
          {athlete.beltGrade ? ` · ${athlete.beltGrade}` : ''}
          {athlete.weight ? ` · ${athlete.weight} kg` : ''}
        </div>
      </div>
      {action}
    </div>
  );

  if (isLoading || !currentUser) return null;

  return (
    <div data-testid="coach-athletes-screen" style={s.page}>
      <div style={s.header}>
        <div style={s.title}>🎓 Mis Atletas</div>
        <div style={s.sub}>Gestiona los atletas asignados a tu academia</div>
      </div>

      <div style={s.tabs}>
        <button style={s.tab(tab === 'mine')} onClick={() => setTab('mine')}>
          Mis Atletas ({myAthletes.length})
        </button>
        <button style={s.tab(tab === 'assign')} onClick={() => setTab('assign')}>
          Asignar Atletas ({allAthletes.length})
        </button>
      </div>

      <div style={s.card}>
        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>Cargando...</div>
        ) : tab === 'mine' ? (
          myAthletes.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>👥</span>
              <div style={s.emptyTxt}>No tienes atletas asignados aún</div>
              <div style={s.emptyHint}>Ve a «Asignar Atletas» para agregar atletas a tu equipo</div>
            </div>
          ) : (
            myAthletes.map(a => (
              <AthleteItem
                key={a.id}
                athlete={a}
                action={
                  <button style={s.removeBtn} onClick={() => remove(a.id)}>
                    Quitar
                  </button>
                }
              />
            ))
          )
        ) : (
          allAthletes.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>🔍</span>
              <div style={s.emptyTxt}>No hay atletas disponibles</div>
              <div style={s.emptyHint}>Los atletas aparecen aquí cuando se registran en la app</div>
            </div>
          ) : (
            allAthletes.map(a => (
              <AthleteItem
                key={a.id}
                athlete={a}
                action={
                  <button style={s.assignBtn} onClick={() => assign(a.id)}>
                    + Asignar
                  </button>
                }
              />
            ))
          )
        )}
      </div>
    </div>
  );
}
