import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pure DOM manipulation pattern — avoids Expo web hydration issues with Playwright
export default function SyncUpScreen() {
  const { t } = useTranslation();
  const [role, setRole] = useState<'athlete' | 'coach' | null>(null);
  const [athleteCount, setAthleteCount] = useState(1);
  const [saved, setSaved] = useState(false);

  const s: any = {
    page:      { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif' },
    card:      { maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    title:     { fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#1a1a2e' },
    question:  { fontSize: 18, color: '#444', marginBottom: 24 },
    roleGrid:  { display: 'flex', gap: 16, marginBottom: 24 },
    roleCard:  (active: boolean) => ({
      flex: 1, padding: 24, border: `2px solid ${active ? '#6750a4' : '#e0e0e0'}`,
      borderRadius: 12, cursor: 'pointer', textAlign: 'center',
      background: active ? '#f3eeff' : '#fafafa', transition: 'all 0.2s',
    }),
    roleIcon:  { fontSize: 40, display: 'block', marginBottom: 8 },
    roleLabel: (active: boolean) => ({ fontSize: 16, fontWeight: 700, color: active ? '#6750a4' : '#333' }),
    section:   { color: '#6750a4', fontWeight: 700, fontSize: 12, letterSpacing: 1.2, marginTop: 20, marginBottom: 4 },
    divider:   { border: 'none', borderTop: '1px solid #e0e0e0', marginBottom: 16 },
    field:     { marginBottom: 12 },
    label:     { display: 'block', fontSize: 12, color: '#555', marginBottom: 4 },
    input:     { width: '100%', height: 44, border: '1px solid #ccc', borderRadius: 4, padding: '0 12px', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit' },
    select:    { width: '100%', height: 44, border: '1px solid #ccc', borderRadius: 4, paddingLeft: 12, fontSize: 15, boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' },
    addBtn:    { padding: '8px 16px', border: '1px dashed #6750a4', borderRadius: 8, background: 'transparent', color: '#6750a4', cursor: 'pointer', fontSize: 14, marginTop: 8, fontFamily: 'inherit' },
    saveBtn:   { width: '100%', padding: 14, background: '#6750a4', border: 'none', borderRadius: 24, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 24, fontFamily: 'inherit' },
    success:   { background: '#eaddff', borderRadius: 8, padding: 12, marginBottom: 16, textAlign: 'center', color: '#21005d', display: 'none' },
    athleteBox:{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' },
  };

  const athleteFields = (prefix: string) => (
    <>
      <div style={s.field}><label style={s.label}>{t('syncup.fullName')}</label><input id={`${prefix}-fullName`} style={s.input} placeholder={t('syncup.fullName')} /></div>
      <div style={s.field}><label style={s.label}>{t('syncup.email')}</label><input id={`${prefix}-email`} type="email" style={s.input} placeholder={t('syncup.email')} /></div>
      <div style={s.field}><label style={s.label}>{t('syncup.country')}</label><input id={`${prefix}-country`} style={s.input} placeholder={t('syncup.country')} /></div>
      <div style={s.field}><label style={s.label}>{t('syncup.age')}</label><input id={`${prefix}-age`} type="number" style={s.input} placeholder={t('syncup.age')} /></div>
      <div style={s.field}><label style={s.label}>{t('syncup.gender')}</label>
        <select id={`${prefix}-gender`} style={s.select}>
          <option value="">-- {t('syncup.gender')} --</option>
          <option value="Masculino">{t('syncup.genderMale')}</option>
          <option value="Femenino">{t('syncup.genderFemale')}</option>
          <option value="Otro">{t('syncup.genderOther')}</option>
        </select>
      </div>
      <div style={s.field}><label style={s.label}>{t('syncup.academy')}</label><input id={`${prefix}-academy`} style={s.input} placeholder={t('syncup.academy')} /></div>
      <div style={s.field}><label style={s.label}>{t('syncup.weight')}</label><input id={`${prefix}-weight`} type="number" style={s.input} placeholder={t('syncup.weight')} /></div>
      <div style={s.field}><label style={s.label}>{t('syncup.beltGrade')}</label>
        <select id={`${prefix}-beltGrade`} style={s.select}>
          <option value="">-- {t('syncup.beltGrade')} --</option>
          <option value="Blanco">{t('syncup.white')}</option>
          <option value="Azul">{t('syncup.blue')}</option>
          <option value="Morado">{t('syncup.purple')}</option>
          <option value="Café">{t('syncup.brown')}</option>
          <option value="Negro">{t('syncup.black')}</option>
        </select>
      </div>
    </>
  );

  const handleSave = () => {
    const get = (id: string) => ((document.getElementById(id) as HTMLInputElement)?.value || '').trim();

    if (role === 'athlete') {
      const profile = {
        role: 'athlete',
        fullName: get('syncup-fullName'), email: get('syncup-email'),
        country: get('syncup-country'), age: get('syncup-age'),
        gender: get('syncup-gender'), academy: get('syncup-academy'),
        weight: get('syncup-weight'), beltGrade: get('syncup-beltGrade'),
      };
      AsyncStorage.setItem('kumite_profile', JSON.stringify(profile));
    } else if (role === 'coach') {
      const athletes = Array.from({ length: athleteCount }, (_, i) => ({
        fullName: get(`athlete-${i}-fullName`), email: get(`athlete-${i}-email`),
        country: get(`athlete-${i}-country`), age: get(`athlete-${i}-age`),
        gender: get(`athlete-${i}-gender`), academy: get(`athlete-${i}-academy`),
        weight: get(`athlete-${i}-weight`), beltGrade: get(`athlete-${i}-beltGrade`),
      }));
      const profile = {
        role: 'coach',
        fullName: get('coach-fullName'), email: get('coach-email'), academy: get('coach-academy'),
        athletes,
      };
      AsyncStorage.setItem('kumite_profile', JSON.stringify(profile));
    }

    // Show success via DOM
    const banner = document.getElementById('syncup-success');
    if (banner) banner.style.display = 'block';
    setSaved(true);
  };

  return (
    <div data-testid="syncup-screen" style={s.page}>
      <div style={s.card}>
        <div style={s.title}>{t('syncup.title')}</div>

        <div style={s.question}>{t('syncup.question')}</div>

        <div style={s.roleGrid}>
          <div data-testid="btn-athlete" style={s.roleCard(role === 'athlete')} onClick={() => { setRole('athlete'); setSaved(false); }}>
            <span style={s.roleIcon}>🥋</span>
            <span style={s.roleLabel(role === 'athlete')}>{t('syncup.athlete')}</span>
          </div>
          <div data-testid="btn-coach" style={s.roleCard(role === 'coach')} onClick={() => { setRole('coach'); setSaved(false); }}>
            <span style={s.roleIcon}>🎓</span>
            <span style={s.roleLabel(role === 'coach')}>{t('syncup.coach')}</span>
          </div>
        </div>

        <div id="syncup-success" data-testid="syncup-success" style={s.success}>
          ✓ {t('syncup.saved')}
        </div>

        {role === 'athlete' && (
          <>
            <div style={s.section}>{t('syncup.athlete').toUpperCase()}</div>
            <hr style={s.divider} />
            {athleteFields('syncup')}
          </>
        )}

        {role === 'coach' && (
          <>
            <div style={s.section}>{t('syncup.coachInfo').toUpperCase()}</div>
            <hr style={s.divider} />
            <div style={s.field}><label style={s.label}>{t('syncup.fullName')}</label><input id="coach-fullName" style={s.input} placeholder={t('syncup.fullName')} /></div>
            <div style={s.field}><label style={s.label}>{t('syncup.email')}</label><input id="coach-email" type="email" style={s.input} placeholder={t('syncup.email')} /></div>
            <div style={s.field}><label style={s.label}>{t('syncup.academy')}</label><input id="coach-academy" style={s.input} placeholder={t('syncup.academy')} /></div>

            <div style={s.section}>{t('syncup.athletesSection').toUpperCase()}</div>
            <hr style={s.divider} />

            {Array.from({ length: athleteCount }, (_, i) => (
              <div key={i} style={s.athleteBox} data-testid={`athlete-form-${i}`}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: '#6750a4' }}>
                  {t('syncup.athleteNumber', { num: i + 1 })}
                </div>
                {athleteFields(`athlete-${i}`)}
              </div>
            ))}

            <button data-testid="btn-add-athlete" style={s.addBtn} type="button"
              onClick={() => setAthleteCount(c => c + 1)}>
              + {t('syncup.addAthlete')}
            </button>
          </>
        )}

        {role && (
          <button data-testid="btn-save-profile" style={s.saveBtn} type="button" onClick={handleSave}>
            {t('syncup.save')}
          </button>
        )}
      </div>
    </div>
  );
}
