/**
 * constants/tournamentStatus.ts
 * Shared tournament status labels and colors.
 * Used across TournamentDashboardScreen, AdminTournamentsScreen, and TournamentSearch.
 */

export type TournamentStatus =
  // New lifecycle statuses
  | 'created'
  | 'registration_open'
  | 'registration_closed'
  | 'weigh_in_open'
  | 'weigh_in_closed'
  | 'tournament_start'
  | 'tournament_finish'
  | 'cancelled'
  // Legacy (kept for backward compatibility with existing data)
  | 'upcoming'
  | 'active'
  | 'closed';

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  created:              'Creado',
  registration_open:    'Inscripciones Abiertas',
  registration_closed:  'Inscripciones Cerradas',
  weigh_in_open:        'Pesaje Abierto',
  weigh_in_closed:      'Pesaje Cerrado',
  tournament_start:     'En Curso',
  tournament_finish:    'Finalizado',
  cancelled:            'Cancelado',
  // Legacy
  upcoming:             'Próximo',
  active:               'Activo',
  closed:               'Cerrado',
};

export const STATUS_COLORS: Record<TournamentStatus, { bg: string; text: string }> = {
  created:              { bg: '#e3f2fd', text: '#1565c0' },
  registration_open:    { bg: '#e8f5e9', text: '#2e7d32' },
  registration_closed:  { bg: '#fff3e0', text: '#e65100' },
  weigh_in_open:        { bg: '#f3e5f5', text: '#6a1b9a' },
  weigh_in_closed:      { bg: '#fce4ec', text: '#880e4f' },
  tournament_start:     { bg: '#e0f7fa', text: '#006064' },
  tournament_finish:    { bg: '#eceff1', text: '#37474f' },
  cancelled:            { bg: '#ffebee', text: '#b71c1c' },
  // Legacy
  upcoming:             { bg: '#e3f2fd', text: '#1565c0' },
  active:               { bg: '#e8f5e9', text: '#2e7d32' },
  closed:               { bg: '#eceff1', text: '#37474f' },
};

/** The ordered list of new lifecycle statuses for the dashboard management UI */
export const LIFECYCLE_STATUSES: TournamentStatus[] = [
  'created',
  'registration_open',
  'registration_closed',
  'weigh_in_open',
  'weigh_in_closed',
  'tournament_start',
  'tournament_finish',
  'cancelled',
];
