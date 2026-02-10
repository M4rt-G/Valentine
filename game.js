// Connect to Socket.IO server
const socket = io('http://localhost:3000');

// DOM elements
const roundNumber = document.getElementById('roundNumber');
const currentLetter = document.getElementById('currentLetter');
const scoresList = document.getElementById('scoresList');
const answersForm = document.getElementById('answersForm');
const bastaBtn = document.getElementById('bastaBtn');
const countdownBar = document.getElementById('countdownBar');
const countdownTimer = document.getElementById('countdownTimer');
const countdownProgress = document.getElementById('countdownProgress');
const bastaPlayerName = document.getElementById('bastaPlayerName');
const validationArea = document.getElementById('validationArea');
const validationContent = document.getElementById('validationContent');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const gameArea = document.querySelector('.game-area');
const winnerScreen = document.getElementById('winnerScreen');
const winnerName = document.getElementById('winnerName');
const finalScores = document.getElementById('finalScores');
const playAgainBtn = document.getElementById('playAgainBtn');

// Game state
let currentRound = 0;
let currentCategories = [];
let players = [];
let myAnswers = {};
let allAnswers = {};
let validations = {};

// Get player info
const playerId = localStorage.getItem('playerId');
const playerName = localStorage.getItem('playerName');

if (!playerId || !playerName) {
    window.location.href = 'name-entry.html';
}

// Rejoin game
socket.emit('rejoin', { playerId, name: playerName });

// Listen for new round
socket.on('newRound', (data) => {
    currentRound = data.round;
    currentCategories = data.categories;
    
    roundNumber.textContent = currentRound;
    currentLetter.textContent = data.letter;
    
    // Reset answers
    myAnswers = {};
    allAnswers = {};
    validations = {};
    
    // Show game area, hide validation
    gameArea.style.display = 'block';
    validationArea.classList.add('hidden');
    
    // Hide countdown bar if showing
    countdownBar.classList.add('hidden');
    
    // Enable basta button and reset next round button
    bastaBtn.disabled = false;
    nextRoundBtn.disabled = false;
    nextRoundBtn.textContent = 'Next Round 🎮';
    
    // Generate answer inputs
    generateAnswerInputs();
    
    // Update scores if available
    if (data.scores) {
        socket.emit('getScores');
    }
    
    console.log(`Round ${currentRound} - Letter: ${data.letter}`);
});

// Generate answer input fields
function generateAnswerInputs() {
    answersForm.innerHTML = currentCategories.map((category, index) => `
        <div class="answer-input-group">
            <label for="answer-${index}">${category}</label>
            <input 
                type="text" 
                id="answer-${index}" 
                data-category="${category}"
                placeholder="Type your answer..."
                autocomplete="off"
            >
        </div>
    `).join('');
    
    // Focus first input
    document.getElementById('answer-0')?.focus();
}

// Basta button click
bastaBtn.addEventListener('click', () => {
    // Collect all answers
    const inputs = answersForm.querySelectorAll('input');
    inputs.forEach(input => {
        const category = input.dataset.category;
        myAnswers[category] = input.value.trim();
    });
    
    // Submit answers
    socket.emit('submitAnswers', myAnswers);
    
    // Trigger Basta
    socket.emit('basta');
    
    // Disable all inputs
    inputs.forEach(input => input.disabled = true);
    bastaBtn.disabled = true;
    
    console.log('Basta called!', myAnswers);
});

// Listen for Basta countdown from other players
socket.on('bastaCountdown', (data) => {
    bastaPlayerName.textContent = data.playerName;
    countdownTimer.textContent = data.countdown;
    countdownBar.classList.remove('hidden');
    
    // Restart progress bar animation
    countdownProgress.style.animation = 'none';
    setTimeout(() => {
        countdownProgress.style.animation = 'countdownProgress 10s linear';
    }, 10);
    
    if (data.countdown === 0) {
        // Auto-submit current answers
        const inputs = answersForm.querySelectorAll('input');
        inputs.forEach(input => {
            const category = input.dataset.category;
            myAnswers[category] = input.value.trim();
        });
        
        socket.emit('submitAnswers', myAnswers);
        
        // Hide countdown bar
        setTimeout(() => {
            countdownBar.classList.add('hidden');
        }, 500);
    }
});

// Listen for answer reveal
socket.on('revealAnswers', (data) => {
    allAnswers = data.answers;
    
    console.log('All answers:', allAnswers);
    
    // Hide game area
    gameArea.style.display = 'none';
    
    // Show validation area
    displayValidation();
});

// Display validation UI
function displayValidation() {
    validationArea.classList.remove('hidden');
    
    let html = '';
    const allPlayerIds = Object.keys(allAnswers);
    
    // Show other players' answers first (for validation)
    allPlayerIds.forEach(playerId => {
        if (playerId === socket.id) return; // Skip own answers
        
        const playerData = allAnswers[playerId];
        
        html += `
            <div class="validation-player">
                <h3>${playerData.playerName}'s Answers</h3>
        `;
        
        currentCategories.forEach(category => {
            const answer = playerData.answers[category] || '';
            const isEmpty = !answer || answer.trim() === '';
            
            html += `
                <div class="validation-row">
                    <div class="validation-category">${category}</div>
                    <div class="validation-answer ${isEmpty ? 'empty' : ''}">
                        ${isEmpty ? '(No answer)' : answer}
                    </div>
                    <div class="validation-buttons">
                        <button class="btn-validate valid" 
                                onclick="validateAnswer('${playerId}', '${category}', true)"
                                ${isEmpty ? 'disabled' : ''}>
                            ✓ Valid
                        </button>
                        <button class="btn-validate invalid" 
                                onclick="validateAnswer('${playerId}', '${category}', false)"
                                ${isEmpty ? 'disabled' : ''}>
                            ✗ Invalid
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    // Show your own answers for reference
    const myPlayerData = allAnswers[socket.id];
    if (myPlayerData) {
        html += `
            <div class="validation-player reference">
                <h3>Your Answers (Reference)</h3>
        `;
        
        currentCategories.forEach(category => {
            const answer = myPlayerData.answers[category] || '';
            const isEmpty = !answer || answer.trim() === '';
            
            html += `
                <div class="validation-row">
                    <div class="validation-category">${category}</div>
                    <div class="validation-answer ${isEmpty ? 'empty' : ''}">
                        ${isEmpty ? '(No answer)' : answer}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    validationContent.innerHTML = html;
}

// Validate answer
function validateAnswer(targetPlayerId, category, isValid) {
    const clickedButton = event.target;
    const row = clickedButton.closest('.validation-row');
    const buttons = row.querySelectorAll('.btn-validate');
    const validButton = buttons[0];
    const invalidButton = buttons[1];
    
    // Visual feedback - highlight selected, dim the other
    if (isValid) {
        validButton.style.opacity = '1';
        validButton.style.transform = 'scale(1.05)';
        validButton.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.5)';
        
        invalidButton.style.opacity = '0.4';
        invalidButton.style.transform = 'scale(1)';
        invalidButton.style.boxShadow = 'none';
    } else {
        invalidButton.style.opacity = '1';
        invalidButton.style.transform = 'scale(1.05)';
        invalidButton.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.5)';
        
        validButton.style.opacity = '0.4';
        validButton.style.transform = 'scale(1)';
        validButton.style.boxShadow = 'none';
    }
    
    // Store validation locally
    if (!validations[targetPlayerId]) {
        validations[targetPlayerId] = {};
    }
    validations[targetPlayerId][category] = isValid;
    
    // Send validation to server
    socket.emit('validateAnswer', {
        targetPlayerId,
        category,
        isValid
    });
    
    console.log(`Validated ${targetPlayerId} - ${category}: ${isValid ? 'Valid' : 'Invalid'}`);
}

// Listen for live validation updates from other players
socket.on('validationUpdate', (data) => {
    const { validatorId, validatorName, targetPlayerId, targetName, category, isValid } = data;
    
    console.log(`${validatorName} marked ${category} as ${isValid ? 'valid' : 'invalid'} for ${targetName}`);
    
    // If someone validated MY answers, show it
    if (targetPlayerId === socket.id) {
        // Find the row in "Your Answers" section and update it
        const referenceSection = document.querySelector('.validation-player.reference');
        if (referenceSection) {
            const rows = referenceSection.querySelectorAll('.validation-row');
            rows.forEach(row => {
                const categoryDiv = row.querySelector('.validation-category');
                if (categoryDiv && categoryDiv.textContent === category) {
                    const answerDiv = row.querySelector('.validation-answer');
                    
                    // Add validation indicator
                    let indicator = answerDiv.querySelector('.validation-indicator');
                    if (!indicator) {
                        indicator = document.createElement('span');
                        indicator.className = 'validation-indicator';
                        indicator.style.marginLeft = '10px';
                        indicator.style.fontSize = '0.9rem';
                        indicator.style.fontWeight = '600';
                        answerDiv.appendChild(indicator);
                    }
                    
                    if (isValid) {
                        indicator.textContent = `✓ ${validatorName}`;
                        indicator.style.color = '#28a745';
                    } else {
                        indicator.textContent = `✗ ${validatorName}`;
                        indicator.style.color = '#dc3545';
                    }
                }
            });
        }
    }
});

// Next round button - just tell server we're ready
nextRoundBtn.addEventListener('click', () => {
    // Notify server this player is ready for next round
    socket.emit('roundComplete');
    
    // Disable button and show waiting message
    nextRoundBtn.disabled = true;
    nextRoundBtn.textContent = 'Waiting for other players...';
});

// Listen for next round
socket.on('nextRound', () => {
    // Round will be handled by 'newRound' event
    validationArea.classList.add('hidden');
    gameArea.style.display = 'block';
});

// Listen for game over (after 10 rounds)
socket.on('gameOver', (data) => {
    console.log('Game Over!', data);
    
    // Hide game areas
    gameArea.style.display = 'none';
    validationArea.classList.add('hidden');
    
    // Show winner screen
    winnerScreen.classList.remove('hidden');
    
    // Display winner
    if (data.winner.id === socket.id) {
        winnerName.textContent = `🎉 You Win! 🎉`;
    } else {
        winnerName.textContent = `${data.winner.name} Wins!`;
    }
    
    // Display final scores
    const sortedPlayers = data.players
        .map(p => ({
            ...p,
            score: data.finalScores[p.id] || 0
        }))
        .sort((a, b) => b.score - a.score);
    
    finalScores.innerHTML = sortedPlayers.map(player => {
        const isWinner = player.id === data.winner.id;
        const isCurrentPlayer = player.id === socket.id;
        
        return `
            <div class="final-score-item ${isWinner ? 'winner-player' : ''}">
                <div class="final-score-name">
                    ${isWinner ? '👑 ' : ''}${player.name}${isCurrentPlayer ? ' (You)' : ''}
                </div>
                <div class="final-score-points">${player.score}</div>
            </div>
        `;
    }).join('');
});

// Play again button
playAgainBtn.addEventListener('click', () => {
    // Reload page or go back to lobby
    window.location.href = 'lobby.html';
});

// Update players list
socket.on('playersUpdate', (playersList) => {
    players = playersList;
    updateScores();
});

// Update scores when received from server
socket.on('scoresUpdate', (scores) => {
    // Update score display
    scoresList.innerHTML = players.map(player => {
        const score = scores[player.id] || 0;
        return `
            <div class="score-card">
                <div class="score-name">${player.name}</div>
                <div class="score-points">${score}</div>
            </div>
        `;
    }).join('');
});

// Update scores display
function updateScores() {
    scoresList.innerHTML = players.map(player => `
        <div class="score-card">
            <div class="score-name">${player.name}</div>
            <div class="score-points">0</div>
        </div>
    `).join('');
}

// Add floating hearts
function addFloatingHeart() {
    const heartsContainer = document.querySelector('.hearts-background');
    
    const heart = document.createElement('div');
    heart.textContent = '♥';
    heart.style.position = 'absolute';
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${0.8 + Math.random() * 1}rem`;
    heart.style.opacity = '0.15';
    heart.style.color = '#dc143c';
    heart.style.animation = `float ${15 + Math.random() * 10}s linear`;
    
    heartsContainer.appendChild(heart);
    
    setTimeout(() => heart.remove(), 25000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 0.15;
        }
        90% {
            opacity: 0.15;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

setInterval(addFloatingHeart, 5000);
