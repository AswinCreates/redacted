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
  DISCUSSION_PHASE: 'Discussion Time',
  CLUE_REVEAL: 'All Clues Are In',
  VOTING_PHASE: 'Who Do You Suspect?',
  RESULT_PHASE: 'The Reveal',
  GAME_OVER: 'Final Results',
};

export const PHASE_HINTS = {
  LOBBY: 'Waiting for the host to start.',
  GAME_START: 'Shuffling the secret word…',
  ROLE_REVEAL: 'Memorise it, then keep it to yourself.',
  CLUE_PHASE: 'One clue each, in turn. No straight giveaways.',
  DISCUSSION_PHASE: 'Discuss your clues out loud with the group.',
  CLUE_REVEAL: 'Read the final clues before voting begins.',
  VOTING_PHASE: 'Tap the player you think is bluffing.',
  RESULT_PHASE: 'The votes are in.',
  GAME_OVER: 'Match complete.',
};

/** Friendly names for timer labels. */
export const TIMER_LABELS = {
  CLUE_PHASE: 'Time to clue',
  DISCUSSION_PHASE: 'Time to discuss',
  CLUE_REVEAL: 'Voting begins in',
  VOTING_PHASE: 'Time to vote',
  ROLE_REVEAL: 'Time to memorise',
  RESULT_PHASE: 'Next round in',
};

/**
 * Wording that only applies to one mode, keyed by mode and then by phase.
 *
 * Both modes share the CLUE_REVEAL phase (it is the same server-side 5-second
 * pause before voting), but Offline must never talk about clues because in
 * Offline no clues are ever typed or stored.
 */
const MODE_OVERRIDES = {
  OFFLINE: {
    labels: { CLUE_REVEAL: 'Discussion Over' },
    hints: { CLUE_REVEAL: 'Wrap up the conversation — voting starts automatically.' },
  },
};

function getOverride(section, phase, gameMode) {
  if (!gameMode) return undefined;
  return MODE_OVERRIDES[String(gameMode).toUpperCase()]?.[section]?.[phase];
}

export function getPhaseLabel(phase, gameMode) {
  return getOverride('labels', phase, gameMode) ?? PHASE_LABELS[phase] ?? 'In Progress';
}

export function getPhaseHint(phase, gameMode) {
  return getOverride('hints', phase, gameMode) ?? PHASE_HINTS[phase] ?? '';
}

export function getTimerLabel(phase, gameMode) {
  return getOverride('timerLabels', phase, gameMode) ?? TIMER_LABELS[phase] ?? 'Time left';
}

export function getRoleLabel(role) {
  if (role === 'IMPOSTER') return 'Imposter';
  if (role === 'INNOCENT') return 'Innocent';
  if (role === 'SPECTATOR') return 'Spectator';
  return 'Unrevealed';
}
