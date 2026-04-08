/**
 * components/BracketParticipantCard.tsx
 *
 * Reusable card for displaying a bracket participant.
 * Shows: country flag, athlete name, and organization acronym.
 */

import React from 'react';
import { KumiteTheme as T } from '../constants/theme';
import { countryFlag } from '../constants/countries';

interface Props {
  name: string;
  org?: string;
  country?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

/** Extracts an acronym from an organization name, e.g. "Dojo Ryu Kai" → "DRK" */
function orgAcronym(org: string): string {
  const words = org.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return org.slice(0, 4).toUpperCase();
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 5);
}

export function BracketParticipantCard({ name, org, country, style, 'data-testid': testId }: Props) {
  const flag = country ? countryFlag(country) : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 0,
        ...style,
      }}
      data-testid={testId ?? 'bracket-participant-card'}
    >
      {flag && (
        <span
          style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}
          data-testid="participant-flag"
          aria-label={country}
        >
          {flag}
        </span>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: T.font.size.base,
            fontWeight: T.font.weight.semibold,
            color: T.colors.dark,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          data-testid="participant-name"
        >
          {name}
        </div>
        {org && (
          <div
            style={{
              fontSize: T.font.size.xs,
              color: T.colors.muted,
              fontWeight: T.font.weight.semibold,
              letterSpacing: '0.04em',
            }}
            data-testid="participant-org"
          >
            {orgAcronym(org)}
          </div>
        )}
      </div>
    </div>
  );
}
