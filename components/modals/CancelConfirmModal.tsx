import React from 'react';
import type { Registration } from '../../db/database';
import { useKumiteTheme } from '../../context/ThemeContext';

interface Props {
  reg:       Registration;
  onConfirm: () => void;
  onClose:   () => void;
}

export default function CancelConfirmModal({ reg, onConfirm, onClose }: Props) {
  const T = useKumiteTheme();
  const s = {
    overlay:    {
      position: 'fixed' as const, inset: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    },
    modal:      {
      background: T.colors.card, borderRadius: T.radius.lg, padding: 28,
      width: '100%', maxWidth: 420, boxShadow: T.shadow.modal,
    },
    title:      { fontSize: T.font.size['2xl'], fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 8 },
    sub:        { fontSize: T.font.size.base, color: T.colors.textSub, marginBottom: 24, lineHeight: 1.5 },
    actions:    { display: 'flex', gap: 12 },
    btnConfirm: {
      flex: 1, padding: 12, background: T.colors.error,
      border: 'none', borderRadius: T.radius.pill,
      color: T.colors.card, fontSize: T.font.size.base, fontWeight: T.font.weight.bold,
      cursor: 'pointer', fontFamily: 'inherit',
    },
    btnCancel:  {
      flex: 1, padding: 12, background: 'transparent',
      border: '1px solid #ccc', borderRadius: T.radius.pill,
      color: T.colors.textLight, fontSize: T.font.size.base,
      cursor: 'pointer', fontFamily: 'inherit',
    },
  } as const;


  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e: any) => e.stopPropagation()}>
        <div style={s.title}>⚠️ Cancelar inscripción</div>
        <div style={s.sub}>
          ¿Seguro que deseas cancelar tu participación en <strong>{reg.tournamentName}</strong>?
          El torneo volverá a estar disponible para inscribirse.
        </div>
        <div style={s.actions}>
          <button style={s.btnCancel} type="button" onClick={onClose}>No, volver</button>
          <button
            data-testid="btn-confirm-cancel"
            style={s.btnConfirm}
            type="button"
            onClick={onConfirm}
          >
            Sí, cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
