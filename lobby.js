// Connect to Socket.IO server
const socket = io('http://localhost:3000');

const playersList = document.getElementById('playersList');
const startGameBtn = document.getElementById('startGameBtn');
const waitingText = document.getElementById('waitingText');
const categoriesList = document.getElementById('categoriesList');
const newCategoryInput = document.getElementById('newCategory');
const addCategoryBtn = document.getElementById('addCategoryBtn');

// Get player info from localStorage
const playerId = localStorage.getItem('playerId');
const playerName = localStorage.getItem('playerName');

// Rejoin with stored credentials
if (playerId && playerName) {
    socket.emit('rejoin', { playerId, name: playerName });
} else {
    // If no credentials, redirect back to name entry
    window.location.href = 'name-entry.html';
}

// Request initial categories
socket.emit('getCategories');

// Update players list
socket.on('playersUpdate', (players) => {
    updatePlayersList(players);
    
    // Enable start button if at least 2 players
    if (players.length >= 2) {
        startGameBtn.disabled = false;
        waitingText.textContent = `${players.length} players ready! 🎉`;
    } else {
        startGameBtn.disabled = true;
        waitingText.textContent = 'Waiting for more players to join...';
    }
});

function updatePlayersList(players) {
    if (players.length === 0) {
        playersList.innerHTML = '<div class="empty-state">No players yet...</div>';
        return;
    }
    
    playersList.innerHTML = players.map((player, index) => {
        const emoji = ['💕', '💖', '💗', '💓', '💝', '❤️'][index % 6];
        const isCurrentPlayer = player.id === playerId;
        const statusColor = player.isOnline ? '#28a745' : '#dc3545';
        const statusText = player.isOnline ? 'Online' : 'Offline';
        
        return `
            <div class="player-card">
                <div class="player-info">
                    <div class="player-avatar">${emoji}</div>
                    <div class="player-name">
                        ${player.name}
                        ${isCurrentPlayer ? '(You)' : ''}
                    </div>
                </div>
                <div class="player-status">
                    <span class="status-dot" style="background: ${statusColor}"></span>
                    <span>${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Categories management
socket.on('categoriesUpdate', (categories) => {
    displayCategories(categories);
});

function displayCategories(categories) {
    categoriesList.innerHTML = categories.map((cat, index) => `
        <div class="category-chip">
            <span class="category-chip-text">${cat}</span>
            <button class="category-remove-btn" onclick="removeCategory(${index})">×</button>
        </div>
    `).join('');
}

// Add category
addCategoryBtn.addEventListener('click', () => {
    const category = newCategoryInput.value.trim();
    if (category && category.length >= 2) {
        socket.emit('addCategory', category);
        newCategoryInput.value = '';
    }
});

newCategoryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addCategoryBtn.click();
    }
});

// Remove category (global function for onclick)
window.removeCategory = function(index) {
    socket.emit('removeCategory', index);
};

// Start game button
startGameBtn.addEventListener('click', () => {
    socket.emit('startGame');
});

// Listen for game start
socket.on('gameStarted', () => {
    window.location.href = 'game.html';
});

// Handle disconnection
socket.on('disconnect', () => {
    waitingText.textContent = 'Connection lost... Reconnecting...';
    waitingText.style.color = '#f5576c';
});

socket.on('connect', () => {
    if (playerId && playerName) {
        socket.emit('rejoin', { playerId, name: playerName });
    }
});

// Add floating hearts effect
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
