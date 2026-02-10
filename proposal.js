// Escaping "No" button functionality
const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const container = document.querySelector('.buttons-container');

let noBtnPosition = { x: 0, y: 0 };

// Function to move the No button to a random position
function moveNoButton() {
    const containerRect = container.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    
    // Calculate available space
    const maxX = containerRect.width - btnRect.width;
    const maxY = containerRect.height - btnRect.height;
    
    // Generate random position
    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY;
    
    // Apply position
    noBtn.style.position = 'absolute';
    noBtn.style.left = `${randomX}px`;
    noBtn.style.top = `${randomY}px`;
}

// Move No button on hover
noBtn.addEventListener('mouseenter', moveNoButton);

// Move No button on touch (mobile)
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveNoButton();
});

// Prevent No button from being clicked
noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    moveNoButton();
});

// Yes button - Navigate to name entry page
yesBtn.addEventListener('click', () => {
    // Add celebration animation
    yesBtn.style.transform = 'scale(1.2)';
    yesBtn.innerHTML = 'A Huevo!!';
    
    // Create hearts explosion
    createHeartsExplosion();
    
    // Navigate to name entry after short delay
    setTimeout(() => {
        window.location.href = 'name-entry.html';
    }, 1500);
});

// Create hearts explosion effect
function createHeartsExplosion() {
    const hearts = ['♥'];
    
    for (let i = 0; i < 12; i++) {
        const heart = document.createElement('div');
        heart.style.position = 'fixed';
        heart.style.left = '50%';
        heart.style.top = '50%';
        heart.style.fontSize = '1.5rem';
        heart.style.zIndex = '1000';
        heart.style.color = '#dc143c';
        heart.textContent = hearts[0];
        heart.style.pointerEvents = 'none';
        
        document.body.appendChild(heart);
        
        // Random animation
        const angle = (Math.PI * 2 * i) / 12;
        const velocity = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        heart.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => heart.remove();
    }
}

// Add more floating hearts in background
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

// Add floating hearts periodically (less frequently)
setInterval(addFloatingHeart, 5000);
