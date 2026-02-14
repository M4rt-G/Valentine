const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const MAX_ROUNDS = 5; // Game ends after 5 rounds

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game state
const players = new Map(); // playerId -> player object
const gameState = {
    currentLetter: null,
    isGameActive: false,
    round: 0,
    categories: [
        'Name',
        'Color',
        'Food',
        'Restaurant',
        'Country',
        'Famous Person',
        'Movie'
    ],
    playerAnswers: new Map(),
    scores: new Map(),
    validations: new Map(), // playerId -> { targetPlayerId -> { category -> isValid } }
    roundScoresSubmitted: new Set() // Track who has submitted scores for this round
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Player joins
    socket.on('join', (data) => {
        const { name } = data;
        
        // Validate name
        if (!name || name.trim().length < 2) {
            socket.emit('error', { message: 'Invalid name' });
            return;
        }
        
        // Check if name already exists
        const nameExists = Array.from(players.values()).some(
            player => player.name.toLowerCase() === name.trim().toLowerCase()
        );
        
        if (nameExists) {
            socket.emit('error', { message: 'Name already taken' });
            return;
        }
        
        // Add player
        const player = {
            id: socket.id,
            name: name.trim(),
            socketId: socket.id,
            isOnline: true
        };
        
        players.set(socket.id, player);
        gameState.scores.set(socket.id, 0);
        
        console.log(`Player joined: ${player.name} (${socket.id})`);
        
        // Confirm join
        socket.emit('joined', { playerId: socket.id, name: player.name });
        
        // Broadcast updated players list
        broadcastPlayers();
    });

    // Player rejoins (after disconnect/refresh)
    socket.on('rejoin', (data) => {
        const { playerId, name } = data;
        
        // Update socket ID for existing player
        if (players.has(playerId)) {
            const player = players.get(playerId);
            player.socketId = socket.id;
            player.isOnline = true;
            players.delete(playerId);
            players.set(socket.id, player);
            
            console.log(`Player rejoined: ${name} (${socket.id})`);
        } else {
            // Create new player if not found
            const player = {
                id: socket.id,
                name: name,
                socketId: socket.id,
                isOnline: true
            };
            players.set(socket.id, player);
            gameState.scores.set(socket.id, 0);
        }
        
        socket.emit('joined', { playerId: socket.id, name });
        broadcastPlayers();
        
        // Send current categories
        socket.emit('categoriesUpdate', gameState.categories);
        
        // If game is active, send current game state
        if (gameState.isGameActive) {
            socket.emit('gameState', getCurrentGameState());
        }
    });

    // Get categories
    socket.on('getCategories', () => {
        socket.emit('categoriesUpdate', gameState.categories);
    });

    // Start game
    socket.on('startGame', () => {
        const onlinePlayers = Array.from(players.values()).filter(p => p.isOnline);
        
        if (onlinePlayers.length >= 2) {
            gameState.isGameActive = true;
            gameState.round = 0;
            
            console.log('Game started!');
            io.emit('gameStarted');
            
            // Start first round after delay
            setTimeout(() => {
                startNewRound();
            }, 2000);
        } else {
            socket.emit('error', { message: 'Need at least 2 online players to start' });
        }
    });

    // Player submits "Basta!"
    socket.on('basta', () => {
        if (!gameState.isGameActive) return;
        
        const player = players.get(socket.id);
        if (!player) return;
        
        console.log(`${player.name} called Basta!`);
        
        // Notify all other players of countdown
        socket.broadcast.emit('bastaCountdown', { 
            playerName: player.name,
            countdown: 10 
        });
        
        // Start 10-second countdown for others
        let countdown = 10;
        const countdownInterval = setInterval(() => {
            countdown--;
            socket.broadcast.emit('bastaCountdown', { 
                playerName: player.name,
                countdown 
            });
            
            if (countdown === 0) {
                clearInterval(countdownInterval);
                // Reveal all answers
                setTimeout(() => {
                    revealAnswers();
                }, 500);
            }
        }, 1000);
    });

    // Player submits answers
    socket.on('submitAnswers', (answers) => {
        gameState.playerAnswers.set(socket.id, {
            answers,
            timestamp: Date.now()
        });
        
        const player = players.get(socket.id);
        console.log(`Received answers from ${player ? player.name : 'Unknown'}`);
    });

    // Player validates another player's answer
    socket.on('validateAnswer', (data) => {
        const { targetPlayerId, category, isValid } = data;
        const validatorId = socket.id;
        
        // Store validation in game state
        if (!gameState.validations.has(validatorId)) {
            gameState.validations.set(validatorId, new Map());
        }
        
        const validatorValidations = gameState.validations.get(validatorId);
        if (!validatorValidations.has(targetPlayerId)) {
            validatorValidations.set(targetPlayerId, {});
        }
        
        validatorValidations.get(targetPlayerId)[category] = isValid;
        
        // Broadcast validation to ALL players in real-time
        io.emit('validationUpdate', {
            validatorId: validatorId,
            validatorName: players.get(validatorId) ? players.get(validatorId).name : 'Unknown',
            targetPlayerId,
            targetName: players.get(targetPlayerId) ? players.get(targetPlayerId).name : 'Unknown',
            category,
            isValid
        });
        
        const validator = players.get(socket.id);
        const target = players.get(targetPlayerId);
        const validatorName = validator ? validator.name : 'Unknown';
        const targetName = target ? target.name : 'Unknown';
        
        console.log(`Validation: ${validatorName} marked ${category} as ${isValid ? 'valid' : 'invalid'} for ${targetName}`);
    });

    // Round complete - calculate scores
    socket.on('roundComplete', (data) => {
        // Mark this player as having submitted scores
        gameState.roundScoresSubmitted.add(socket.id);
        
        const player = players.get(socket.id);
        const playerName = player ? player.name : 'Unknown';
        console.log(`${playerName} marked ready for next round`);
        
        // Check if all ONLINE players have submitted their score calculations
        const onlinePlayers = Array.from(players.values()).filter(p => p.isOnline);
        const onlinePlayerIds = new Set(onlinePlayers.map(p => p.id));
        
        // Count how many online players have submitted
        const onlineSubmissions = Array.from(gameState.roundScoresSubmitted)
            .filter(id => onlinePlayerIds.has(id));
        
        if (onlineSubmissions.length >= onlinePlayers.length) {
            console.log('All online players ready, calculating final scores...');
            
            // Calculate scores based on stored validations
            const roundScores = new Map();
            
            // For each player, calculate their score
            onlinePlayers.forEach(player => {
                const playerId = player.id;
                const playerAnswers = gameState.playerAnswers.get(playerId);
                
                if (!playerAnswers) {
                    roundScores.set(playerId, 0);
                    return;
                }
                
                let playerScore = 0;
                
                // Check each category answer
                gameState.categories.forEach(category => {
                    const answer = playerAnswers.answers[category];
                    
                    // Skip empty answers
                    if (!answer || !answer.trim()) {
                        return;
                    }
                    
                    // Count how many OTHER players validated this answer as valid
                    let validCount = 0;
                    let totalValidators = 0;
                    
                    onlinePlayers.forEach(validator => {
                        const validatorId = validator.id;
                        
                        // Skip self
                        if (validatorId === playerId) return;
                        
                        totalValidators++;
                        
                        // Check if this validator validated this player's answer
                        const validatorValidations = gameState.validations.get(validatorId);
                        if (validatorValidations && validatorValidations.has(playerId)) {
                            const validations = validatorValidations.get(playerId);
                            if (validations[category] === true) {
                                validCount++;
                            }
                        }
                    });
                    
                    // If all other players marked it valid, award 100 points
                    if (totalValidators > 0 && validCount === totalValidators) {
                        playerScore += 100;
                    }
                });
                
                roundScores.set(playerId, playerScore);
            });
            
            // Update total scores
            roundScores.forEach((roundScore, playerId) => {
                const currentScore = gameState.scores.get(playerId) || 0;
                gameState.scores.set(playerId, currentScore + roundScore);
            });
            
            console.log('Round scores:', Object.fromEntries(roundScores));
            console.log('Total scores:', Object.fromEntries(gameState.scores));
            
            // Broadcast updated scores
            io.emit('scoresUpdate', Object.fromEntries(gameState.scores));
            
            // Clear round submissions
            gameState.roundScoresSubmitted.clear();
            gameState.validations.clear();
            
            // Check if game is over (10 rounds completed)
            if (gameState.round >= MAX_ROUNDS) {
                console.log('Game Over! 10 rounds completed.');
                
                // Calculate winner
                let winnerId = null;
                let winnerName = '';
                let highestScore = -1;
                
                gameState.scores.forEach((score, playerId) => {
                    if (score > highestScore) {
                        highestScore = score;
                        winnerId = playerId;
                        const player = players.get(playerId);
                        winnerName = player ? player.name : 'Unknown';
                    }
                });
                
                // Send game over event with final scores and winner
                io.emit('gameOver', {
                    winner: {
                        id: winnerId,
                        name: winnerName,
                        score: highestScore
                    },
                    finalScores: Object.fromEntries(gameState.scores),
                    players: Array.from(players.values())
                        .filter(p => p.isOnline)
                        .map(p => ({ id: p.id, name: p.name }))
                });
                
                // Reset game state
                gameState.isGameActive = false;
                gameState.round = 0;
            } else {
                // Start next round after delay
                setTimeout(() => {
                    startNewRound();
                }, 2000);
            }
        } else {
            // Not all players ready yet
            console.log(`${onlineSubmissions.length}/${onlinePlayers.length} players ready`);
        }
    });

    // Get current scores
    socket.on('getScores', () => {
        socket.emit('scoresUpdate', Object.fromEntries(gameState.scores));
    });

    // Player adds custom category
    socket.on('addCategory', (category) => {
        if (category && category.trim()) {
            gameState.categories.push(category.trim());
            io.emit('categoriesUpdate', gameState.categories);
        }
    });

    // Player removes category
    socket.on('removeCategory', (index) => {
        if (index >= 0 && index < gameState.categories.length) {
            gameState.categories.splice(index, 1);
            io.emit('categoriesUpdate', gameState.categories);
        }
    });

    // Player disconnects
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`Player disconnected: ${player.name}`);
            
            // Mark as offline
            player.isOnline = false;
            
            // Broadcast updated players list
            broadcastPlayers();
            
            // Remove after 30 seconds if still offline
            setTimeout(() => {
                const currentPlayer = players.get(socket.id);
                if (currentPlayer && !currentPlayer.isOnline) {
                    players.delete(socket.id);
                    gameState.scores.delete(socket.id);
                    broadcastPlayers();
                    console.log(`Player removed after timeout: ${player.name}`);
                }
            }, 30000); // 30 second grace period
        }
    });
});

// Helper functions
function broadcastPlayers() {
    const playersList = Array.from(players.values())
        .filter(p => p.isOnline) // Only include online players
        .map(p => ({
            id: p.id,
            name: p.name,
            isOnline: p.isOnline
        }));
    io.emit('playersUpdate', playersList);
}

function startNewRound() {
    gameState.round++;
    gameState.playerAnswers.clear();
    
    // Generate random letter (exclude difficult ones)
    const letters = 'ABCDEFGHIJLMNOPQRSTUVWXYZ'.split('');
    gameState.currentLetter = letters[Math.floor(Math.random() * letters.length)];
    
    console.log(`Round ${gameState.round} started with letter: ${gameState.currentLetter}`);
    
    io.emit('newRound', {
        round: gameState.round,
        letter: gameState.currentLetter,
        categories: gameState.categories
    });
}

function revealAnswers() {
    const answers = {};
    
    gameState.playerAnswers.forEach((data, playerId) => {
        const player = players.get(playerId);
        // Only include if player exists and is online
        if (player && player.isOnline) {
            answers[playerId] = {
                playerName: player.name,
                answers: data.answers
            };
        }
    });
    
    io.emit('revealAnswers', {
        answers,
        categories: gameState.categories
    });
}

function getCurrentGameState() {
    return {
        isGameActive: gameState.isGameActive,
        round: gameState.round,
        currentLetter: gameState.currentLetter,
        categories: gameState.categories,
        scores: Object.fromEntries(gameState.scores)
    };
}

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open https://valentine-production-eafc.up.railway.app/${PORT} to start playing!`);
});
