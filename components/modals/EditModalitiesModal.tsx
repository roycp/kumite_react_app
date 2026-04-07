import React, { useState } from 'react';
import type { Registration, ModalityEntry } from '../../db/database';
import { KumiteTheme as T } from '../../constants/theme';

const s = {
  overlay:   {
    position: 'fixed' as const, inset: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal:     {
    background: T.colors.card, borderRadius: T.radius.lg, padding: 28,
    width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto' as const,
    boxShadow: T.shadow.modal,
  },
  title:     { fontSize: T.font.size['2xl'], fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 4 },
  sub:       { fontSize: T.font.size.md, color: T.colors.muted, marginBottom: 20 },
  listLabel: { fontWeight: T.font.weight.bold, fontSize: T.font.size.md, color: T.colors.textSub, marginBottom: 10 },
  hint:      { fontSize: T.font.size.sm, color: T.colors.mutedLight, marginBottom: 16 },
  listItem:  {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', background: T.colors.primaryLight,
    borderRadius: T.radius.sm, marginBottom: 8,
  },
  listName:  { flex: 1, fontSize: T.font.size.md, fontWeight: T.font.weight.semibold, color: T.colors.primary },
  removeBtn: {
    background: 'none', border: 'none', color: T.colors.error,
    cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1,
  },
  empty:     { color: T.colors.mutedLight, fontSize: T.font.size.md, marginBottom: 12, fontStyle: 'italic' },
  divider:   { border: 'none', borderTop: '1px solid #f0f0f0', margin: '16px 0' },
  actions:   { display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' as const },
  btnBack:   {
    flex: 1, padding: '11px 0', background: 'transparent',
    border: '1px solid #ccc', borderRadius: T.radius.pill,
    color: T.colors.textLight, fontSize: T.font.size.base, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSave:   {
    flex: 2, padding: '11px 0', background: T.colors.primary,
    border: 'none', borderRadius: T.radius.pill,
    color: T.colors.card, fontSize: T.font.size.base, fontWeight: T.font.weight.bold,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnWizard: {
    flex: 2, padding: '11px 0', background: T.colors.success,
    border: 'none', borderRadius: T.radius.pill,
    color: T.colors.card, fontSize: T.font.size.base, fontWeight: T.font.weight.bold,
    cursor: 'pointer', fontFamily: 'inherit',
  },
} as const;

interface Props {
  reg:                Registration;
  onSave:             (modalities: ModalityEntry[]) => void;
  onClose:            () => void;
  onEditRegistration: (staged: ModalityEntry[]) => void;
}

export default function EditModalitiesModal({ reg, onSave, onClose, onEditRegistration }: Props) {
  const [staged, setStaged] = useState<ModalityEntry[]>(reg.modalities ?? []);

  const removeModality = (idx: number) => {
    setStaged(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e: any) => e.stopPropagation()}>
        <div style={s.title}>✏️ Editar Inscripción</div>
        <div style={s.sub}>{reg.tournamentName}</div>

        <div style={s.listLabel}>Modalidades actuales:</div>
        <div style={s.hint}>Los cambios no se guardan hasta presionar "Guardar Cambios".</div>

        {staged.length === 0 ? (
          <div style={s.empty}>Sin modalidades — agrega una desde "Editar Inscripción"</div>
        ) : staged.map((m, i) => (
          <div key={i} style={s.listItem} data-testid={`edit-modal-item-${i}`}>
            <span style={s.listName}>
              {m.discipline}{m.weightDivision ? ` · ${m.weightDivision}` : ''} · {m.gender} · {m.ageGroup}
            </span>
            <button
              data-testid={`btn-staged-remove-${i}`}
              style={s.removeBtn}
              type="button"
              title="Eliminar modalidad (pendiente de guardar)"
              onClick={() => removeModality(i)}
            >✕</button>
          </div>
        ))}

        <hr style={s.divider} />

        <div style={s.actions}>
          <button data-testid="btn-edit-modal-back"   style={s.btnBack}   type="button" onClick={onClose}>
            ← Atrás
          </button>
          <button data-testid="btn-edit-modal-save"   style={s.btnSave}   type="button" onClick={() => onSave(staged)}>
            💾 Guardar Cambios
          </button>
          <button data-testid="btn-edit-registration" style={s.btnWizard} type="button" onClick={() => onEditRegistration(staged)}>
            📝 Editar Inscripción
          </button>
        </div>
      </div>
    </div>
  );
}
