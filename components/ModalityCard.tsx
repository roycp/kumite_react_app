import React from 'react';
import type { ModalityEntry } from '../db/database';
import { KumiteTheme as T } from '../constants/theme';

const s = {
  card:  {
    background: T.colors.primaryLight,
    border: '1px solid #d6c8f5',
    borderRadius: T.radius.md,
    padding: '10px 14px',
    minWidth: 150,
  },
  name:  {
    fontSize: T.font.size.md,
    fontWeight: T.font.weight.bold,
    color: T.colors.primary,
    marginBottom: 6,
  },
  row:   {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: T.font.size.sm,
    color: T.colors.textSub,
    marginBottom: 3,
  },
  label: {
    fontWeight: T.font.weight.semibold,
    color: T.colors.mutedLight,
    minWidth: 52,
  },
} as const;

interface Props {
  modality:  ModalityEntry;
  testId?:   string;
  className?: string;
}

export default function ModalityCard({ modality, testId, className }: Props) {
  return (
    <div style={s.card} data-testid={testId} className={className}>
      <div style={s.name}>{modality.discipline}</div>
      {modality.weightDivision && (
        <div style={s.row}>
          <span style={s.label}>Peso</span>
          <span>{modality.weightDivision}</span>
        </div>
      )}
      <div style={s.row}>
        <span style={s.label}>Género</span>
        <span>{modality.gender}</span>
      </div>
      <div style={s.row}>
        <span style={s.label}>Cat.</span>
        <span>{modality.ageGroup}</span>
      </div>
    </div>
  );
}
