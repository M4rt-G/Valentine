# Valentine's Basta Game 💕

A romantic, real-time multiplayer Basta game built for long-distance couples! Perfect for Valentine's Day.

## Features

✨ **Romantic Proposal Page** - Beautiful page with escaping "No" button and hearts animation
💑 **Multiplayer Lobby** - See who's online in real-time
🎮 **Basta Game** - Classic Mexican game with customizable categories
⏱️ **Real-time Countdown** - When one player calls "Basta!", others get 3 seconds
✅ **Peer Validation** - Players validate each other's answers
📊 **Score Tracking** - Points system (100 per valid answer)
🎨 **Beautiful UI** - Elegant, playful, and romantic design

## How to Play Basta

1. Both players join the game and enter their names
2. A random letter (A-Z) is chosen
3. Fill in answers for each category that START with that letter
4. First person to finish clicks "Basta!" - giving others 3 seconds
5. All answers are revealed
6. Players validate each other's answers (Accept/Reject)
7. 100 points awarded for each valid answer
8. Next round begins!

## Setup Instructions

### Local Development

1. **Install Dependencies**
   ```bash
   cd valentine-basta
   npm install
   ```

2. **Add Your Couple Photo**
   - Replace `couple-photo.jpg` with your own photo
   - Make sure it's named `couple-photo.jpg` in the root directory

3. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:3000`
   - Open on both your devices to play together!

### Deployment

#### Option 1: Railway (Recommended - Easy)

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Railway will auto-detect Node.js and deploy
5. Get your deployment URL and share with your girlfriend!

#### Option 2: Render

1. Create account at [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Click "Create Web Service"

#### Option 3: Heroku

1. Create account at [heroku.com](https://heroku.com)
2. Install Heroku CLI
3. Commands:
   ```bash
   heroku create your-valentine-game
   git push heroku main
   heroku open
   ```

### Frontend Only (GitHub Pages)

For the proposal page only (without multiplayer):

1. Create GitHub repository
2. Push only the static files:
   - `index.html`
   - `styles.css`
   - `proposal.js`
   - `couple-photo.jpg`
3. Settings → Pages → Deploy from main branch
4. Access at `https://yourusername.github.io/repo-name`

**Note:** Full game requires backend deployment for multiplayer.

## File Structure

```
valentine-basta/
├── index.html              # Proposal page
├── styles.css              # Proposal styles
├── proposal.js             # Proposal logic
├── name-entry.html         # Name input page
├── name-entry-styles.css   # Name entry styles
├── name-entry.js           # Name entry logic
├── lobby.html              # Multiplayer lobby
├── lobby-styles.css        # Lobby styles
├── lobby.js                # Lobby logic
├── game.html               # Basta game page
├── game-styles.css         # Game styles
├── game.js                 # Game logic
├── server.js               # Node.js backend
├── package.json            # Dependencies
├── couple-photo.jpg        # Your photo together
└── README.md               # This file
```

## Customization

### Change Categories
Edit default categories in `server.js`:
```javascript
categories: [
    'Name',
    'Color',
    'Food',
    'Restaurant',
    'Country',
    'Famous Person',
    'Movie'
]
```

### Change Colors/Theme
Edit CSS files to customize colors:
- Primary: `#764ba2` (purple)
- Accent: `#f5576c` (pink)
- Gradient: `#667eea` to `#764ba2`

### Change Points System
Edit `game.js` to modify point values (currently 100 per valid answer).

## Updating Backend URL

When deploying, update the Socket.IO connection URL in:
- `name-entry.js` (line 3)
- `lobby.js` (line 2)
- `game.js` (line 2)

Change from:
```javascript
const socket = io('http://localhost:3000');
```

To your deployed URL:
```javascript
const socket = io('https://your-app.railway.app');
```

## Troubleshooting

**Players can't connect:**
- Make sure backend is running
- Check Socket.IO URL is correct
- Verify firewall/network settings

**Game doesn't start:**
- Need at least 2 players in lobby
- Check browser console for errors

**Answers not syncing:**
- Refresh both browsers
- Check network connection
- Verify WebSocket connection in Network tab

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js, Express
- **Real-time:** Socket.IO
- **Hosting:** Railway/Render/Heroku

## License

Made with 💕 for Valentine's Day

---

**Pro Tips:**
- Test locally first before deploying
- Use video call while playing for best experience
- Add more categories for variety
- Take screenshots of funny answers!

Enjoy playing together! 💕🎮
