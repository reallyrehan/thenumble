# Numble - Client-Only Version

A completely client-side implementation of Numble, a Wordle-like game for math equations. This version runs entirely in the browser with no server required.

## Features

- ✅ **Daily Puzzles**: New equation every day based on the date
- ✅ **6 Guesses**: Try to solve the equation in 6 attempts or less
- ✅ **Color Feedback**: 
  - 🟩 Green = Correct character in correct position
  - 🟨 Yellow = Character exists but in wrong position
  - ⬛️ Dark = Character doesn't exist in the equation
- ✅ **Personal Statistics**: Track your games, wins, and guess distribution
- ✅ **Dark Mode**: Toggle between light and dark themes
- ✅ **Custom Seeds**: Create custom puzzles using URL parameters
- ✅ **Local Persistence**: All data stored in browser localStorage

## How to Use

### Option 1: Open Directly
Simply open `index.html` in a web browser. No server required!

### Option 2: Local Server (Recommended)
For better compatibility, run a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server
```

Then open `http://localhost:8000` in your browser.

## File Structure

```
client_app/
├── index.html          # Main game page
├── privacy.html        # Privacy policy
├── css/
│   ├── light.css      # Light theme styles
│   └── dark.css        # Dark theme styles
├── js/
│   ├── gameLogic.js    # Core game logic (equation generation, validation)
│   ├── storage.js      # localStorage management
│   └── app.js          # UI and game flow
├── README.md           # This file
└── LIMITATIONS.md      # List of client-only limitations
```

## Game Logic

### Equation Generation
- Uses a seeded random number generator based on the date (YYYYMMDD)
- Generates 7-character equations (numbers and operators: +, -, *, /)
- Ensures equations evaluate to integers
- Prevents division by zero and invalid operations

### Validation
- Equations must be exactly 7 characters
- Must evaluate to the target value
- Follows DMAS (Division, Multiplication, Addition, Subtraction) order

### Scoring
- Personal statistics stored in localStorage
- Tracks games played, wins, and guess distribution
- Calculates average win time

## Custom Seeds

You can create custom puzzles by adding a `seed` parameter to the URL:

```
index.html?seed=abc123
```

This will generate a puzzle based on the seed value instead of the daily date.

## Data Storage

All data is stored in browser localStorage with the following keys:
- `numble_total_guesses`: Current game guess count
- `numble_guess_history`: History of all guesses
- `numble_won_status`: Win/loss status
- `numble_scores`: Personal statistics
- `numble_dark_mode`: Dark mode preference
- And more...

To reset all data, clear your browser's localStorage.

## Limitations

See [LIMITATIONS.md](LIMITATIONS.md) for a complete list of features that are not possible in a client-only implementation, including:
- Global statistics across all users
- Cross-device synchronization
- Server-side security features
- Server-side analytics

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript features
- localStorage API
- CSS Grid/Flexbox

Tested in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development

### Converting from Python

The Python backend logic has been converted to JavaScript:
- `new_equation_generator()` → `newEquationGenerator()`
- `evaluator()` → `evaluator()`
- `checker()` → `checker()`
- Flask sessions → localStorage
- Redis stats → localStorage (personal stats only)

### Key Differences

1. **Seeded Random**: Uses a simple LCG (Linear Congruential Generator) instead of Python's `random.seed()`
2. **Evaluation**: Uses `Function()` constructor for safe evaluation (similar to Python's `eval()`)
3. **Storage**: localStorage replaces Flask sessions and Redis
4. **No Server**: All logic runs client-side

## License

Same license as the original Numble project.

## Credits

Created by Rehan Ahmed
Original project: https://github.com/reallyrehan/thenumble
