import { wordBank } from './WordBank.js';
import { GAME_LIMITS, getMaxImposters } from '../config/gameConfig.js';

export class GameEngine {
  constructor(io) {
    this.io = io;
  }

  /**
   * Starts a new Match from LOBBY
   */
  startGame(room) {
    if (room.phase !== 'LOBBY') return;

    const connectedPlayers = room.getAllConnectedPlayers();
    if (connectedPlayers.length < GAME_LIMITS.MIN_PLAYERS) {
      throw new Error(
        `At least ${GAME_LIMITS.MIN_PLAYERS} connected players are required to start.`
      );
    }

    // The imposter allowance depends on how many players actually start, which
    // can be lower than the capacity the host configured.
    const allowedImposters = getMaxImposters(connectedPlayers.length);
    if (room.settings.imposterCount > allowedImposters) {
      room.settings.imposterCount = allowedImposters;
    }

    room.currentRound = 1;
    // Reset players for new match
    for (const player of room.players.values()) {
      player.resetForRematch();
    }

    this.startRound(room);
  }

  /**
   * Initializes state for an individual round
   */
  startRound(room) {
    room.phase = 'GAME_START';
    room.clueTimeline = [];
    room.lastEliminatedPlayerId = null;
    room.roundWinner = null;

    // Reset round-specific player parameters
    for (const player of room.players.values()) {
      player.resetForNewRound();
    }

    // Assign Secret Word & Category Hint
    // Pick a random category from the host's 1-3 selections, then pick a word.
    const pool = room.settings.categories && room.settings.categories.length > 0
      ? room.settings.categories
      : ['General'];
    const chosenCategory = pool[Math.floor(Math.random() * pool.length)];
    const selectedItem = wordBank.getRandomWord(chosenCategory);
    room.secretWord = selectedItem.word;
    room.categoryHint = selectedItem.hint;

    // Role Assignment
    const activeEligible = room.getActivePlayers();
    // Shuffle players
    const shuffled = [...activeEligible].sort(() => Math.random() - 0.5);
    const imposterCount = Math.min(room.settings.imposterCount, getMaxImposters(shuffled.length));

    const imposters = shuffled.slice(0, imposterCount);
    const innocents = shuffled.slice(imposterCount);

    imposters.forEach(p => (p.role = 'IMPOSTER'));
    innocents.forEach(p => (p.role = 'INNOCENT'));

    // Emit state update
    this.broadcastState(room);

    // Send private role payloads directly to each player socket
    const coImposterList = imposters.map(i => ({ id: i.id, playerName: i.playerName }));
    for (const player of room.players.values()) {
      if (player.isDisconnected) continue;

      if (player.isEliminated) {
        this.io.to(player.socketId).emit('private_role_assignment', {
          role: 'SPECTATOR',
          coImposters: [],
        });
      } else if (player.role === 'IMPOSTER') {
        this.io.to(player.socketId).emit('private_role_assignment', {
          role: 'IMPOSTER',
          hint: room.categoryHint,
          coImposters: coImposterList,
        });
      } else {
        this.io.to(player.socketId).emit('private_role_assignment', {
          role: 'INNOCENT',
          word: room.secretWord,
          coImposters: [],
        });
      }
    }

    // Auto transition to ROLE_REVEAL after 1 sec.
    // Uses the tracked phase timer so it is cancelled if the room is torn down
    // (e.g. every player disconnects) instead of firing on a deleted room.
    this.setPhaseTimer(room, 1, () => this.transitionToRoleReveal(room));
  }

  transitionToRoleReveal(room) {
    room.phase = 'ROLE_REVEAL';
    this.setPhaseTimer(room, 8, () => this.transitionToCluePhase(room));
    this.broadcastState(room);
  }

  transitionToCluePhase(room) {
    room.phase = 'CLUE_PHASE';
    // Turn queue consists strictly of non-eliminated connected players
    room.turnQueue = room.getActivePlayers().map(p => p.id).sort(() => Math.random() - 0.5);
    room.currentTurnIndex = 0;

    if (room.turnQueue.length === 0) {
      // Nobody is able to give a clue (all players eliminated or disconnected):
      // resolve the round instead of starting an empty clue phase.
      this.transitionToResultPhase(room);
      return;
    }

    this.advanceClueTurn(room);
  }

  advanceClueTurn(room) {
    if (room.currentTurnIndex >= room.turnQueue.length) {
      // All active players submitted clues
      this.transitionToVotingPhase(room);
      return;
    }

    const activePlayerId = room.turnQueue[room.currentTurnIndex];
    const activePlayer = room.players.get(activePlayerId);

    if (!activePlayer || activePlayer.isDisconnected || activePlayer.isEliminated) {
      // Skip inactive or disconnected turn
      room.currentTurnIndex++;
      this.advanceClueTurn(room);
      return;
    }

    this.setPhaseTimer(room, room.settings.clueTimer, () => {
      // Timeout forced clue
      this.handleClueSubmission(room, activePlayerId, '[NO CLUE GIVEN]');
    });

    this.broadcastState(room);
    this.io.to(room.roomCode).emit('turn_changed', {
      activePlayerId,
      turnIndex: room.currentTurnIndex,
      totalTurns: room.turnQueue.length,
      phaseExpiresAt: room.phaseExpiresAt,
    });
  }

  handleClueSubmission(room, playerId, clueText) {
    if (room.phase !== 'CLUE_PHASE') return;
    if (room.turnQueue[room.currentTurnIndex] !== playerId) return;

    this.clearTimer(room);

    const player = room.players.get(playerId);
    const sanitizedClue = clueText.trim().substring(0, 60);
    player.clueSubmitted = sanitizedClue;

    const clueEntry = {
      playerId: player.id,
      playerName: player.playerName,
      clueText: sanitizedClue,
      timestamp: Date.now(),
    };
    room.clueTimeline.push(clueEntry);

    this.io.to(room.roomCode).emit('clue_submitted', clueEntry);

    // Move to next turn queue item
    room.currentTurnIndex++;
    this.advanceClueTurn(room);
  }

  transitionToVotingPhase(room) {
    room.phase = 'VOTING_PHASE';
    
    this.setPhaseTimer(room, room.settings.votingTimer, () => {
      // Timer expired, resolve votes
      this.transitionToResultPhase(room);
    });

    this.broadcastState(room);
    this.io.to(room.roomCode).emit('voting_started', {
      eligibleVoters: room.getActivePlayers().map(p => p.id),
      phaseExpiresAt: room.phaseExpiresAt,
    });
  }

  handleVoteSubmission(room, voterId, targetPlayerId) {
    if (room.phase !== 'VOTING_PHASE') return;
    
    const voter = room.players.get(voterId);
    const target = room.players.get(targetPlayerId);

    if (!voter || voter.isEliminated || voter.isDisconnected) return;
    if (!target || target.isEliminated || voterId === targetPlayerId) return;

    voter.votedForTargetId = targetPlayerId;
    this.io.to(voter.socketId).emit('vote_cast_confirmation', { hasVoted: true });

    // Check if all active voters have cast their votes
    const activeVoters = room.getActivePlayers();
    const allVoted = activeVoters.every(p => p.votedForTargetId !== null);

    if (allVoted) {
      this.clearTimer(room);
      this.transitionToResultPhase(room);
    } else {
      this.broadcastState(room);
    }
  }

  transitionToResultPhase(room) {
    room.phase = 'RESULT_PHASE';

    // Tally Votes
    const voteCounts = new Map(); // playerId -> count
    for (const player of room.getActivePlayers()) {
      if (player.votedForTargetId) {
        voteCounts.set(player.votedForTargetId, (voteCounts.get(player.votedForTargetId) || 0) + 1);
      }
    }

    // Determine highest vote getter
    let maxVotes = 0;
    let highestVotedPlayerId = null;
    let isTie = false;

    for (const [targetId, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        highestVotedPlayerId = targetId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    // Handle Elimination
    if (highestVotedPlayerId && !isTie) {
      const eliminatedPlayer = room.players.get(highestVotedPlayerId);
      if (eliminatedPlayer) {
        eliminatedPlayer.isEliminated = true; // Spectator status locked for rest of match!
        room.lastEliminatedPlayerId = eliminatedPlayer.id;
      }
    }

    // Determine the round outcome. There is no configured round limit - a match
    // lasts until one side achieves its win condition:
    //   * every imposter voted out -> the innocents take the match
    //   * imposters reach parity   -> they can no longer be outvoted
    //   * otherwise                -> the round resolves and play continues
    const remainingActive = room.getActivePlayers();
    const activeImposters = remainingActive.filter(p => p.role === 'IMPOSTER');
    const activeInnocents = remainingActive.filter(p => p.role === 'INNOCENT');

    let matchOver = false;

    if (activeImposters.length === 0) {
      room.roundWinner = 'INNOCENTS';
      matchOver = true;
    } else if (activeImposters.length >= activeInnocents.length) {
      room.roundWinner = 'IMPOSTERS';
      matchOver = true;
    } else {
      // Nobody has clinched it yet: no round bonus, action bonuses still apply.
      room.roundWinner = null;
    }

    // Calculate & Add Server-Authoritative Deterministic Scores
    this.applyScoringFormula(room);

    this.setPhaseTimer(room, 10, () => {
      if (matchOver) {
        this.transitionToGameOver(room);
      } else {
        room.currentRound++;
        this.startRound(room);
      }
    });

    this.broadcastState(room);
    this.io.to(room.roomCode).emit('results_revealed', {
      roundWinner: room.roundWinner,
      matchOver,
      currentRound: room.currentRound,
      eliminatedPlayerId: room.lastEliminatedPlayerId,
      revealedRole: room.lastEliminatedPlayerId ? room.players.get(room.lastEliminatedPlayerId)?.role : null,
      secretWord: room.secretWord,
      scores: Array.from(room.players.values()).map(p => ({ id: p.id, score: p.score })),
    });
  }

  applyScoringFormula(room) {
    const eliminatedThisRound = room.lastEliminatedPlayerId ? room.players.get(room.lastEliminatedPlayerId) : null;

    for (const player of room.players.values()) {
      if (player.role === 'INNOCENT') {
        // Innocents Win Round -> +100
        if (room.roundWinner === 'INNOCENTS') {
          player.score += 100;
        }
        // Correct Vote for Eliminated Imposter -> +50
        if (
          eliminatedThisRound &&
          eliminatedThisRound.role === 'IMPOSTER' &&
          player.votedForTargetId === eliminatedThisRound.id
        ) {
          player.score += 50;
        }
      } else if (player.role === 'IMPOSTER') {
        // Imposters Win Round -> +150
        if (room.roundWinner === 'IMPOSTERS') {
          player.score += 150;
        }
        // Imposter Survived -> +50
        if (!player.isEliminated) {
          player.score += 50;
        }
        // Innocent Eliminated -> +50
        if (eliminatedThisRound && eliminatedThisRound.role === 'INNOCENT') {
          player.score += 50;
        }
      }
    }
  }

  transitionToGameOver(room) {
    room.phase = 'GAME_OVER';
    this.clearTimer(room);

    // Calculate match winner(s)
    let maxScore = -1;
    let winners = [];

    for (const player of room.players.values()) {
      if (player.score > maxScore) {
        maxScore = player.score;
        winners = [player.id];
      } else if (player.score === maxScore) {
        winners.push(player.id);
      }
    }

    this.broadcastState(room);
    this.io.to(room.roomCode).emit('game_over', {
      winnerPlayerIds: winners,
      finalScores: Array.from(room.players.values()).map(p => ({
        id: p.id,
        playerName: p.playerName,
        score: p.score,
      })),
    });
  }

  restartToLobby(room) {
    room.phase = 'LOBBY';
    room.currentRound = 0;
    room.clueTimeline = [];
    this.clearTimer(room);

    for (const player of room.players.values()) {
      player.resetForRematch();
    }

    this.broadcastState(room);
  }

  // Helper Utilities
  setPhaseTimer(room, seconds, callback) {
    this.clearTimer(room);
    room.phaseExpiresAt = Date.now() + seconds * 1000;
    room.timerHandle = setTimeout(callback, seconds * 1000);
  }

  clearTimer(room) {
    if (room.timerHandle) {
      clearTimeout(room.timerHandle);
      room.timerHandle = null;
    }
    room.phaseExpiresAt = null;
  }

  broadcastState(room) {
    this.io.to(room.roomCode).emit('room_state_update', room.toPublicState());
  }
}