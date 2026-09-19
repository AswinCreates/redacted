/**
 * Player-facing wording for internal game phases.
 *
 * The engine keeps its technical state names (CLUE_PHASE, VOTING_PHASE, ...);
 * everything a player reads comes from here so no state-machine jargon is ever
 * shown in the UI.
 */
export const PHASE_LABELS = {
  LOBBY: 'Waiting Room',
  GAME_START: 'Dealing Roles',
  ROLE_REVEAL: 'Your Secret',
  CLUE_PHASE: 'Give Your Clue',
  VOTING_PHASE: 'Who Do You Suspect?',
  RESULT_PHASE: 'The Reveal',
  GAME_OVER: 'Final Results',
};

export const PHASE_HINTS = {
  LOBBY: 'Waiting for the host to start.',
  GAME_START: 'Shuffling the secret word…',
  ROLE_REVEAL: 'Memorise it, then keep it to yourself.',
  CLUE_PHASE: 'One clue each, in turn. No straight giveaways.',
  VOTING_PHASE: 'Tap the player you think is bluffing.',
  RESULT_PHASE: 'The votes are in.',
  GAME_OVER: 'Match complete.',
};

/** Friendly names for timer labels. */
export const TIMER_LABELS = {
  CLUE_PHASE: 'Time to clue',
  VOTING_PHASE: 'Time to vote',
  ROLE_REVEAL: 'Time to memorise',
  RESULT_PHASE: 'Next round in',
};

export function getPhaseLabel(phase) {
  return PHASE_LABELS[phase] ?? 'In Progress';
}

export function getPhaseHint(phase) {
  return PHASE_HINTS[phase] ?? '';
}

export function getTimerLabel(phase) {
  return TIMER_LABELS[phase] ?? 'Time left';
}

export function getRoleLabel(role) {
  if (role === 'IMPOSTER') return 'Imposter';
  if (role === 'INNOCENT') return 'Innocent';
  if (role === 'SPECTATOR') return 'Spectator';
  return 'Unrevealed';
}
