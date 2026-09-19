/**
 * MoveForward local multiplayer smoke test.
 *
 * Drives 3 real Socket.IO clients against the running backend and walks the
 * full game flow: create -> join -> lobby -> settings -> start -> role reveal
 * -> clues -> voting -> results -> game over -> rematch.
 *
 * Usage (backend must already be running, default port 3001):
 *   cd client
 *   node scripts/multiplayer-smoke-test.mjs
 *
 * Asserts that: every socket event the React client relies on is received,
 * private data (secret word / role / hint / votes) is never broadcast, and
 * the server stays authoritative for phase, elimination and score.
 */
import { io } from 'socket.io-client';

const URL = process.env.SMOKE_URL || 'http://127.0.0.1:3001';
const TIMEOUT_MS = 20000;

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeClient(name) {
  const socket = io(URL, { transports: ['websocket'], forceNew: true });
  const state = {
    name,
    socket,
    playerId: null,
    isHost: false,
    sessionToken: null,
    role: null,
    roleHistory: [],
    publicState: null,
    publicStates: [],
    errors: [],
    resultsRevealed: null,
    gameOver: null,
    receivedEvents: new Set(),
  };

  socket.on('connect_error', (err) => state.errors.push(`connect_error: ${err.message}`));
  socket.on('error_event', (payload) => state.errors.push(`error_event: ${payload.code} ${payload.message}`));

  for (const evt of [
    'room_joined',
    'room_state_update',
    'private_role_assignment',
    'turn_changed',
    'clue_submitted',
    'voting_started',
    'vote_cast_confirmation',
    'results_revealed',
    'game_over',
  ]) {
    socket.on(evt, () => state.receivedEvents.add(evt));
  }

  socket.on('room_joined', (p) => {
    state.playerId = p.playerId;
    state.isHost = p.isHost;
    state.sessionToken = p.sessionToken;
  });
  socket.on('room_state_update', (p) => {
    state.publicState = p;
    state.publicStates.push(p);
  });
  socket.on('private_role_assignment', (p) => {
    state.role = p;
    state.roleHistory.push(p);
  });
  socket.on('results_revealed', (p) => {
    state.resultsRevealed = p;
  });
  socket.on('game_over', (p) => {
    state.gameOver = p;
  });

  return state;
}

async function waitFor(label, predicate, timeout = TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return true;
    await sleep(100);
  }
  console.log(`  TIMEOUT waiting for: ${label}`);
  return false;
}

// ---------------------------------------------------------------------------
async function main() {
  const host = makeClient('Host');
  const p2 = makeClient('Player2');
  const p3 = makeClient('Player3');
  const clients = [host, p2, p3];

  console.log('\n=== 1. CREATE ROOM ===');
  await waitFor('host socket connected', () => host.socket.connected);
  host.socket.emit('create_room', { playerName: 'Host' });
  await waitFor('host room_joined', () => host.playerId !== null);
  const roomCode = host.publicState?.roomCode;
  check('host received room_joined with a room code', !!roomCode, roomCode);
  check('host is flagged as host', host.isHost === true);
  check('host sees LOBBY phase', host.publicState?.phase === 'LOBBY');

  console.log('\n=== 2. JOIN ROOM ===');
  await waitFor('p2 connected', () => p2.socket.connected);
  await waitFor('p3 connected', () => p3.socket.connected);
  p2.socket.emit('join_room', { roomCode, playerName: 'Player2' });
  p3.socket.emit('join_room', { roomCode, playerName: 'Player3' });
  await waitFor('p2 joined', () => p2.playerId !== null);
  await waitFor('p3 joined', () => p3.playerId !== null);
  check('player2 joined the room', p2.playerId !== null);
  check('player3 joined the room', p3.playerId !== null);

  console.log('\n=== 3. LOBBY SYNC ===');
  const lobbySynced = await waitFor('all 3 clients see 3 players', () =>
    clients.every((c) => c.publicState?.players?.length === 3)
  );
  check('all 3 clients see the same 3-player lobby', lobbySynced);
  check(
    'lobby player list is identical across clients',
    new Set(clients.map((c) => JSON.stringify(c.publicState.players.map((p) => p.id).sort()))).size === 1
  );
  check('lobby never leaks secretWord', clients.every((c) => c.publicState.secretWord === undefined));
  check('lobby never leaks player roles', clients.every((c) => c.publicState.players.every((p) => p.role === undefined)));

  console.log('\n=== 4. HOST UPDATES SETTINGS ===');
  host.socket.emit('update_settings', {
    settings: { categories: ['Food'], imposterCount: 1, maxPlayers: 8, clueTimer: 15, votingTimer: 15 },
  });
  const settingsSynced = await waitFor('settings broadcast to everyone', () =>
    clients.every((c) => c.publicState.settings.categories.includes('Food') && c.publicState.settings.clueTimer === 15)
  );
  check('all clients received the new settings', settingsSynced);
  check(
    'settings no longer expose a round limit',
    clients.every((c) => c.publicState.settings.totalRounds === undefined)
  );
  check(
    'server broadcasts capacity limits so the client hardcodes none',
    clients.every((c) => c.publicState.limits?.maxCapacity === 20 && c.publicState.limits?.minCapacity === 3)
  );

  console.log('\n=== 5. START GAME + PRIVATE ROLE REVEAL ===');
  host.socket.emit('start_game');
  const rolesAssigned = await waitFor('all clients got a private role', () => clients.every((c) => c.role !== null));
  check('all 3 clients received private_role_assignment', rolesAssigned);

  const imposters = clients.filter((c) => c.role?.role === 'IMPOSTER');
  const innocents = clients.filter((c) => c.role?.role === 'INNOCENT');
  check('exactly 1 imposter assigned (imposterCount=1)', imposters.length === 1, `got ${imposters.length}`);
  check('2 innocents assigned', innocents.length === 2, `got ${innocents.length}`);
  check('innocents received the secret word', innocents.every((c) => typeof c.role.word === 'string' && c.role.word.length > 0));
  check('imposter did NOT receive the secret word', imposters.every((c) => c.role.word === undefined));
  check('imposter received a category hint', imposters.every((c) => typeof c.role.hint === 'string' && c.role.hint.length > 0));
  check('secret word never appears in any broadcast state', clients.every((c) => c.publicStates.every((s) => s.secretWord === undefined)));
  check(
    'no broadcast ever contains a vote target',
    clients.every((c) => c.publicStates.every((s) => s.players.every((p) => p.votedForTargetId === undefined)))
  );

  const secretWord = innocents[0].role.word;
  const imposter = imposters[0];

  console.log('\n=== 6. CLUE PHASE ===');
  const cluePhaseReached = await waitFor('phase reaches CLUE_PHASE', () => host.publicState?.phase === 'CLUE_PHASE', 30000);
  check('clue phase started', cluePhaseReached);
  check(
    'role reveal timer was broadcast',
    clients.every((c) => c.publicStates.some((s) => s.phase === 'ROLE_REVEAL' && s.phaseExpiresAt > 0))
  );

  // Drive the turn queue: whoever is the active turn submits a clue.
  let clueCount = 0;
  const clueDeadline = Date.now() + 60000;
  while (host.publicState?.phase === 'CLUE_PHASE' && Date.now() < clueDeadline) {
    const activeId = host.publicState.activeTurnPlayerId;
    const activeClient = clients.find((c) => c.playerId === activeId);
    if (activeClient) {
      activeClient.socket.emit('submit_clue', { clueText: `smoke-clue-${++clueCount}` });
      await sleep(300);
    } else {
      await sleep(120);
      if (!host.publicState.activeTurnPlayerId && host.publicState.phase === 'CLUE_PHASE') break;
    }
  }
  check('all 3 clues were submitted in turn order', clueCount >= 3, `submitted ${clueCount}`);
  check('clue timeline broadcast to everyone', clients.every((c) => c.publicState.clueTimeline.length >= 3));
  check(
    'clue timeline identical on all clients',
    new Set(clients.map((c) => JSON.stringify(c.publicState.clueTimeline))).size === 1
  );

  console.log('\n=== 7. VOTING PHASE ===');
  const votingReached = await waitFor('phase reaches VOTING_PHASE', () => host.publicState?.phase === 'VOTING_PHASE');
  check('voting phase started', votingReached);
  check('voting timer is broadcast', clients.every((c) => c.publicState.phaseExpiresAt > 0));

  // Everyone votes for the imposter -> guaranteed majority, no tie.
  for (const c of clients) c.socket.emit('submit_vote', { targetPlayerId: imposter.playerId });
  // NOTE: the server resolves the round the instant the last vote lands, so
  // there is no "3/3 votes cast" intermediate broadcast to observe. Progress is
  // broadcast while votes are still outstanding (1/3, 2/3).
  const voteProgress = await waitFor('partial vote progress broadcast', () =>
    clients.every((c) =>
      c.publicStates.some((s) => s.phase === 'VOTING_PHASE' && s.players.some((p) => p.hasVoted))
    )
  );
  check('partial vote progress is broadcast to every client', voteProgress);
  check(
    'hasVoted flag present for the voting UI',
    clients.every((c) => c.publicState.players.every((p) => typeof p.hasVoted === 'boolean'))
  );
  check(
    'individual vote targets are never broadcast',
    clients.every((c) => c.publicStates.every((s) => s.players.every((p) => p.votedForTargetId === undefined)))
  );

  console.log('\n=== 8. RESULTS ===');
  const resultReached = await waitFor('results revealed to all clients', () => clients.every((c) => c.resultsRevealed !== null));
  check('results_revealed received by all clients', resultReached);
  check('eliminated player is the imposter', host.resultsRevealed?.eliminatedPlayerId === imposter.playerId);
  check('eliminated role revealed as IMPOSTER', host.resultsRevealed?.revealedRole === 'IMPOSTER');
  check('innocents won the round', host.resultsRevealed?.roundWinner === 'INNOCENTS');
  check('secret word revealed only at result time', host.resultsRevealed?.secretWord === secretWord);
  const scores = host.resultsRevealed?.scores || [];
  const innocentScore = scores.find((s) => s.id === innocents[0].playerId)?.score;
  check('innocent scored 100 (round win) + 50 (correct vote) = 150', innocentScore === 150, `got ${innocentScore}`);
  check('scores visible in public state', clients.every((c) => c.publicState.players.some((p) => p.score > 0)));
  check(
    'elimination reflected in public state',
    clients.every((c) => c.publicState.players.find((p) => p.id === imposter.playerId)?.isEliminated === true)
  );

  console.log('\n=== 9. GAME OVER (every imposter voted out) ===');
  const gameOverReached = await waitFor('game over reached', () => clients.every((c) => c.gameOver !== null), 30000);
  check('game_over event received by all clients', gameOverReached);
  check('final scores present in game_over payload', host.gameOver?.finalScores?.length === 3);
  check('winners are the innocents', (host.gameOver?.winnerPlayerIds || []).every((id) => innocents.some((c) => c.playerId === id)));
  check('match ended because the imposters were cleared out', host.resultsRevealed?.matchOver === true);
  check('phase is GAME_OVER', host.publicState?.phase === 'GAME_OVER');

  console.log('\n=== 10. REMATCH ===');
  host.socket.emit('restart_game');
  const backInLobby = await waitFor('everyone back in LOBBY', () =>
    clients.every((c) => c.publicState.phase === 'LOBBY' && c.publicState.players.every((p) => p.score === 0))
  );
  check('rematch returns everyone to a reset lobby', backInLobby);

  console.log('\n=== 11. AUTHORIZATION / SERVER AUTHORITY ===');
  p2.socket.emit('start_game'); // non-host
  await sleep(600);
  check('non-host cannot start the game', p2.errors.some((e) => e.includes('UNAUTHORIZED')));
  p2.socket.emit('update_settings', { settings: { maxPlayers: 5 } });
  await sleep(400);
  check('non-host cannot change settings', p2.errors.some((e) => e.includes('UNAUTHORIZED')));
  check('no unexpected errors on host', host.errors.length === 0, host.errors.join(' | '));

  console.log('\n=== CLIENT EVENT COVERAGE (events the React app listens for) ===');
  check('room_joined received', clients.every((c) => c.receivedEvents.has('room_joined')));
  check('room_state_update received', clients.every((c) => c.receivedEvents.has('room_state_update')));
  check('private_role_assignment received', clients.every((c) => c.receivedEvents.has('private_role_assignment')));
  check('results_revealed received', clients.every((c) => c.receivedEvents.has('results_revealed')));
  check('game_over received', clients.every((c) => c.receivedEvents.has('game_over')));

  console.log('\n=== 12. ROUNDS CONTINUE NATURALLY (no round setting) ===');
  const assignmentsBefore = clients.map((c) => c.roleHistory.length);
  host.socket.emit('start_game');
  const freshRoles = await waitFor('new match issued fresh role assignments', () =>
    clients.every((c, i) => c.roleHistory.length > assignmentsBefore[i])
  );
  check('starting a second match re-issues private roles', freshRoles);

  const round1Phase = await waitFor('round 1 clue phase of the new match', () => host.publicState?.phase === 'CLUE_PHASE', 30000);
  check('second match reached its clue phase', round1Phase);

  // Play round 1 to a deliberate tie so nobody is eliminated and the match
  // must continue on its own - proving rounds are not driven by a setting.
  const driveDeadline = Date.now() + 60000;
  while (host.publicState?.phase === 'CLUE_PHASE' && Date.now() < driveDeadline) {
    const activeClient = clients.find((c) => c.playerId === host.publicState.activeTurnPlayerId);
    if (activeClient) {
      activeClient.socket.emit('submit_clue', { clueText: 'second-match-clue' });
      await sleep(300);
    } else {
      await sleep(120);
    }
  }
  await waitFor('voting in the second match', () => host.publicState?.phase === 'VOTING_PHASE');

  const lastRoleOf = (c) => c.roleHistory[c.roleHistory.length - 1];
  const rolesAfterRoundOne = clients.map((c) => c.roleHistory.length);
  for (const c of clients) c.resultsRevealed = null;

  // Rotate the votes so each target receives exactly one vote -> a tie.
  clients.forEach((c, index) => {
    const target = clients[(index + 1) % clients.length];
    c.socket.emit('submit_vote', { targetPlayerId: target.playerId });
  });

  const tieResolved = await waitFor('tied round resolved', () => clients.every((c) => c.resultsRevealed !== null));
  check('tied round resolved on every client', tieResolved);
  check('TIE: nobody was eliminated', host.resultsRevealed?.eliminatedPlayerId === null);
  check('TIE: the round has no winner yet', host.resultsRevealed?.roundWinner === null);
  check('TIE: the match is not over', host.resultsRevealed?.matchOver === false);

  const roundTwo = await waitFor(
    'round 2 starts automatically',
    () => host.publicState?.currentRound === 2 && ['GAME_START', 'ROLE_REVEAL', 'CLUE_PHASE'].includes(host.publicState.phase),
    30000
  );
  check('NEXT ROUND: round 2 starts automatically with no round setting', roundTwo);
  check('NEXT ROUND: clue timeline was reset for the new round', host.publicState?.clueTimeline?.length === 0);
  const roundTwoRoles = await waitFor('round 2 roles reassigned', () =>
    clients.every((c, i) => c.roleHistory.length > rolesAfterRoundOne[i])
  );
  check('NEXT ROUND: every active player got a fresh private role', roundTwoRoles);
  check(
    'NEXT ROUND: exactly one imposter assigned for round 2',
    clients.filter((c) => lastRoleOf(c).role === 'IMPOSTER').length === 1
  );
  check('NEXT ROUND: nobody was eliminated, so all three still play', clients.every((c) => lastRoleOf(c).role !== 'SPECTATOR'));

  for (const c of clients) c.socket.disconnect();
  await sleep(400);

  console.log('\n=== 13. CRASH REGRESSION: ALL PLAYERS QUIT MID-MATCH ===');
  const s1 = makeClient('S1');
  const s2 = makeClient('S2');
  const s3 = makeClient('S3');
  const massClients = [s1, s2, s3];
  await waitFor('mass clients connected', () => massClients.every((c) => c.socket.connected));
  s1.socket.emit('create_room', { playerName: 'S1' });
  await waitFor('mass room created', () => s1.playerId !== null);
  const massCode = s1.publicState.roomCode;
  s2.socket.emit('join_room', { roomCode: massCode, playerName: 'S2' });
  s3.socket.emit('join_room', { roomCode: massCode, playerName: 'S3' });
  await waitFor('mass room filled', () => s1.publicState?.players?.length === 3);
  s1.socket.emit('update_settings', {
    settings: { maxPlayers: 8, clueTimer: 15, votingTimer: 15 },
  });
  await waitFor('mass settings applied', () => s1.publicState.settings.clueTimer === 15);
  s1.socket.emit('start_game');
  await waitFor('mass match clue phase', () => s1.publicState?.phase === 'CLUE_PHASE', 30000);

  const massDeadline = Date.now() + 60000;
  while (s1.publicState?.phase === 'CLUE_PHASE' && Date.now() < massDeadline) {
    const activeClient = massClients.find((c) => c.playerId === s1.publicState.activeTurnPlayerId);
    if (activeClient) {
      activeClient.socket.emit('submit_clue', { clueText: 'mass-clue' });
      await sleep(300);
    } else {
      await sleep(120);
    }
  }
  await waitFor('mass voting phase', () => s1.publicState?.phase === 'VOTING_PHASE');
  for (const c of massClients) {
    const target = massClients.find((t) => t.playerId !== c.playerId);
    c.socket.emit('submit_vote', { targetPlayerId: target.playerId });
  }
  const massResolved = await waitFor('mass round resolved', () => s1.publicState?.phase === 'RESULT_PHASE');
  check('mass-disconnect scenario reached the result phase', massResolved);

  // Every player quits mid-match (this is what used to kill the whole server).
  for (const c of massClients) c.socket.disconnect();
  // Let the result timer, next-round start, and role-reveal timers elapse.
  await sleep(22000);

  const probe = makeClient('Probe');
  const probeConnected = await waitFor('server still accepts connections', () => probe.socket.connected, 10000);
  check('REGRESSION: server survives every player quitting mid-match', probeConnected);
  probe.socket.emit('create_room', { playerName: 'Probe' });
  const probeRoom = await waitFor('server can still create rooms', () => probe.playerId !== null, 10000);
  check('REGRESSION: server can still create and serve new rooms', probeRoom);
  probe.socket.disconnect();

  console.log('\n=== 14. CONFIGURABLE PLAYER CAPACITY + IMPOSTER RULES ===');
  const cap1 = makeClient('Cap1');
  const cap2 = makeClient('Cap2');
  const cap3 = makeClient('Cap3');
  const cap4 = makeClient('Cap4');
  const capClients = [cap1, cap2, cap3, cap4];

  await waitFor('capacity clients connected', () => capClients.every((c) => c.socket.connected));
  cap1.socket.emit('create_room', { playerName: 'Cap1' });
  await waitFor('capacity room created', () => cap1.playerId !== null);
  const capCode = cap1.publicState.roomCode;

  check('capacity is a room setting, not a fixed number', typeof cap1.publicState.settings.maxPlayers === 'number');
  check(
    'limits are supplied by the server (3-20)',
    cap1.publicState.limits?.minCapacity === 3 && cap1.publicState.limits?.maxCapacity === 20
  );

  // Shrink the room to the smallest legal size.
  cap1.socket.emit('update_settings', { settings: { maxPlayers: 3 } });
  const shrunk = await waitFor('capacity set to 3', () => cap1.publicState.settings.maxPlayers === 3);
  check('host can lower the player capacity to 3', shrunk);
  check(
    'imposter options shrink with the capacity (3 players -> 1)',
    JSON.stringify(cap1.publicState.limits.imposterOptions) === '[1]'
  );

  // Out-of-range values must be refused by the server.
  cap1.socket.emit('update_settings', { settings: { maxPlayers: 21 } });
  await sleep(400);
  check(
    'capacity above the server maximum is rejected',
    cap1.errors.some((e) => e.includes('INVALID_SETTINGS'))
  );
  cap1.socket.emit('update_settings', { settings: { maxPlayers: 2 } });
  await sleep(400);
  check(
    'capacity below the server minimum is rejected',
    cap1.errors.some((e) => e.includes('INVALID_SETTINGS'))
  );

  // Fill the room, then prove the capacity is actually enforced.
  cap2.socket.emit('join_room', { roomCode: capCode, playerName: 'Cap2' });
  cap3.socket.emit('join_room', { roomCode: capCode, playerName: 'Cap3' });
  const filled = await waitFor('room filled to capacity', () => cap1.publicState?.players?.length === 3);
  check('three players fit inside a 3-player room', filled);

  cap4.socket.emit('join_room', { roomCode: capCode, playerName: 'Cap4' });
  const refused = await waitFor('fourth player refused', () => cap4.errors.some((e) => e.includes('JOIN_FAILED')), 5000);
  check('a fourth player is refused when the capacity is 3', refused);
  check('refused player never entered the room', cap4.playerId === null);

  // Raising the capacity must let them in.
  cap1.socket.emit('update_settings', { settings: { maxPlayers: 5 } });
  await waitFor('capacity raised to 5', () => cap1.publicState.settings.maxPlayers === 5);
  cap4.socket.emit('join_room', { roomCode: capCode, playerName: 'Cap4' });
  const admitted = await waitFor('Cap4 admitted after raise', () => cap4.playerId !== null, 8000);
  check('raising the capacity lets the queued player join', admitted);
  check(
    'imposter options grow with the capacity (5 players -> 1-2)',
    JSON.stringify(cap1.publicState.limits.imposterOptions) === '[1,2]'
  );

  // Imposter counts must respect the capacity tiers.
  const settingsErrorsBefore = cap1.errors.filter((e) => e.includes('INVALID_SETTINGS')).length;
  cap1.socket.emit('update_settings', { settings: { imposterCount: 3 } });
  await sleep(400);
  const settingsErrorsAfter = cap1.errors.filter((e) => e.includes('INVALID_SETTINGS')).length;
  check('too many imposters for a 5-player room is rejected', settingsErrorsAfter > settingsErrorsBefore);

  cap1.socket.emit('update_settings', { settings: { maxPlayers: 9 } });
  await waitFor('capacity raised to 9', () => cap1.publicState.settings.maxPlayers === 9);
  check(
    'imposter options reach 3 at a 9-player capacity',
    JSON.stringify(cap1.publicState.limits.imposterOptions) === '[1,2,3]'
  );

  cap1.socket.emit('update_settings', { settings: { imposterCount: 3 } });
  const threeImposters = await waitFor('3 imposters accepted', () => cap1.publicState.settings.imposterCount === 3);
  check('3 imposters are allowed for a 9-player room', threeImposters);

  // Shrinking again must auto-clamp rather than silently break the game.
  cap1.socket.emit('update_settings', { settings: { maxPlayers: 5 } });
  const clamped = await waitFor(
    'imposter count auto-clamped on shrink',
    () => cap1.publicState.settings.maxPlayers === 5 && cap1.publicState.settings.imposterCount <= 2
  );
  check('shrinking the capacity auto-clamps the imposter count', clamped);
  check(
    'imposters can never be half the players (5 players -> max 2)',
    cap1.publicState.settings.imposterCount <= 2
  );

  for (const c of capClients) c.socket.disconnect();
  await sleep(400);

  console.log('\n=== 15. HOST KICKS A PLAYER ===');
  const kHost = makeClient('KickHost');
  const kVictim = makeClient('KickVictim');
  const kThird = makeClient('KickThird');
  const kickClients = [kHost, kVictim, kThird];

  let victimKickedNotified = false;
  kVictim.socket.on('player_kicked', (p) => {
    victimKickedNotified = !!p?.message;
  });

  await waitFor('kick clients connected', () => kickClients.every((c) => c.socket.connected));
  kHost.socket.emit('create_room', { playerName: 'KickHost' });
  await waitFor('kick room created', () => kHost.playerId !== null);
  const kickCode = kHost.publicState.roomCode;

  kVictim.socket.emit('join_room', { roomCode: kickCode, playerName: 'KickVictim' });
  await waitFor('victim joined', () => kVictim.playerId !== null);
  check('victim joined the room before being kicked', kVictim.playerId !== null);

  kThird.socket.emit('join_room', { roomCode: kickCode, playerName: 'KickThird' });
  await waitFor('third player joined', () => kThird.playerId !== null);
  check('kick scenario lobby is full (3 players)', kHost.publicState?.players?.length === 3);

  // A non-host must not be able to kick anyone.
  kThird.socket.emit('kick_player', { targetPlayerId: kVictim.playerId });
  await sleep(500);
  check('non-host cannot kick players', kThird.errors.some((e) => e.includes('UNAUTHORIZED')));
  check(
    'victim is still in the lobby after a non-host kick attempt',
    kHost.publicState?.players?.some((p) => p.playerName === 'KickVictim')
  );

  // Host kicks the victim -> removed from the lobby + notified + disconnected.
  const victimToken = kVictim.sessionToken;
  kHost.socket.emit('kick_player', { targetPlayerId: kVictim.playerId });
  const victimGone = await waitFor(
    'victim removed from the lobby',
    () => kHost.publicState?.players?.length === 2 && !kHost.publicState.players.some((p) => p.playerName === 'KickVictim')
  );
  check('host kick removes the victim from every lobby', victimGone);
  check('victim was notified via player_kicked', victimKickedNotified);
  const victimDisconnected = await waitFor('victim socket force-closed', () => !kVictim.socket.connected, 8000);
  check('kicked player socket is disconnected by the server', victimDisconnected);

  // The stale session token must never reclaim the freed seat.
  const kRejoin = makeClient('RejoinAttempt');
  await waitFor('rejoin client connected', () => kRejoin.socket.connected);
  kRejoin.socket.emit('join_room', { roomCode: kickCode, playerName: 'KickVictim', sessionToken: victimToken });
  const rejoinBlocked = await waitFor(
    'stale session rejoin rejected',
    () => kRejoin.errors.some((e) => e.includes('JOIN_FAILED')),
    5000
  );
  check('kicked player cannot reclaim the seat with a stale session', rejoinBlocked);
  check('rejected rejoin never entered the room', kRejoin.playerId === null);

  // A brand-new player may take the freed slot.
  kRejoin.socket.emit('join_room', { roomCode: kickCode, playerName: 'NewChallenger' });
  const slotRefilled = await waitFor(
    'new player takes the freed slot',
    () => kRejoin.playerId !== null && kHost.publicState?.players?.some((p) => p.playerName === 'NewChallenger'),
    8000
  );
  check('freed slot can be filled by a new player', slotRefilled);

  // Host cannot kick themselves, and the kick of an unknown player is refused.
  const hostErrorsBefore = kHost.errors.length;
  kHost.socket.emit('kick_player', { targetPlayerId: kHost.playerId });
  await sleep(400);
  check('host cannot kick themselves', kHost.errors.length > hostErrorsBefore);
  kHost.socket.emit('kick_player', { targetPlayerId: 'not-a-real-id' });
  await sleep(400);
  check('kicking a player who is not in the room is refused', kHost.errors.length > hostErrorsBefore + 1);

  for (const c of kickClients) c.socket.disconnect();
  kRejoin.socket.disconnect();
  await sleep(400);

  console.log(`\n================ ${passed} passed, ${failed} failed ================\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('SMOKE TEST CRASHED:', err);
  process.exit(1);
});