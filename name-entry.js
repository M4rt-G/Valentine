// Connect to Socket.IO server
// Change this URL to your deployed backend URL when ready
const socket = io('https://valentine-production-eafc.up.railway.app/');

const playerNameInput = document.getElementById('playerName');
const joinBtn = document.getElementById('joinBtn');
const errorMessage = document.getElementById('errorMessage');

// Focus on input when page loads
playerNameInput.focus();

// Enable join button only when name is entered
playerNameInput.addEventListener('input', () => {
    const name = playerNameInput.value.trim();
    joinBtn.disabled = name.length === 0;
    errorMessage.textContent = '';
});

// Allow Enter key to join
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && playerNameInput.value.trim()) {
        joinGame();
    }
});

// Join button click
joinBtn.addEventListener('click', joinGame);

function joinGame() {
    const name = playerNameInput.value.trim();
    
    if (!name) {
        errorMessage.textContent = 'Please enter your name 💕';
        return;
    }
    
    if (name.length < 2) {
        errorMessage.textContent = 'Name must be at least 2 characters';
        return;
    }
    
    // Disable input and button
    joinBtn.disabled = true;
    playerNameInput.disabled = true;
    joinBtn.textContent = 'Joining...';
    
    // Send player name to server
    socket.emit('join', { name });
}

// Listen for successful join
socket.on('joined', (data) => {
    // Store player info in localStorage
    localStorage.setItem('playerId', data.playerId);
    localStorage.setItem('playerName', data.name);
    
    // Navigate to lobby
    window.location.href = 'lobby.html';
});

// Listen for errors
socket.on('error', (data) => {
    errorMessage.textContent = data.message;
    joinBtn.disabled = false;
    playerNameInput.disabled = false;
    joinBtn.textContent = 'Join Game 💖';
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

// CSS animation for floating hearts
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
