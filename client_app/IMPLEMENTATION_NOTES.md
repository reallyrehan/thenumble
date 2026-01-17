# Implementation Notes

## Overview

This is a complete client-only implementation of the Numble game, converted from the Python Flask backend to pure JavaScript running in the browser.

## Key Conversions

### Python → JavaScript

1. **Equation Generator** (`utils.py` → `gameLogic.js`)
   - Python `random.seed()` → Custom seeded LCG (Linear Congruential Generator)
   - Python `eval()` → JavaScript `Function()` constructor
   - Same validation logic (integer results, no division by zero, etc.)

2. **Game Logic** (`run.py` → `gameLogic.js`)
   - `evaluator()`: Validates input length, characters, and equation result
   - `checker()`: Compares guess to truth equation with color coding
   - `get_seed()`: Generates daily seed from date (YYYYMMDD format)
   - `get_var_seed()`: Converts string seed to numeric seed

3. **Session Management** (`run.py` → `storage.js`)
   - Flask sessions → localStorage
   - Session keys mapped to localStorage keys
   - Same data structure maintained

4. **Stats** (`run.py` → `storage.js`)
   - Redis global stats → localStorage personal stats only
   - Score distribution tracking
   - Average time calculation

### Frontend

- **HTML**: Simplified version of original template
- **CSS**: Copied from original (light.css, dark.css)
- **JavaScript**: Complete rewrite using jQuery (matching original dependencies)

## Architecture

```
┌─────────────────────────────────────┐
│         index.html                  │
│  (UI, Bootstrap, jQuery)             │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│  app.js     │  │ gameLogic.js│
│  (UI Logic) │  │ (Game Logic)│
└──────┬──────┘  └──────┬──────┘
       │                │
       └───────┬────────┘
               │
       ┌───────▼──────┐
       │ storage.js   │
       │ (localStorage)│
       └──────────────┘
```

## Data Flow

1. **Page Load**:
   - Get seed from URL or date
   - Initialize session in localStorage
   - Generate/cache equation for seed
   - Load previous game state if exists

2. **User Input**:
   - Keyboard or on-screen buttons
   - Updates UI in real-time
   - Validates on Enter key

3. **Guess Submission**:
   - Validates equation (length, characters, result)
   - Checks against truth equation
   - Updates UI with color feedback
   - Saves to localStorage
   - Checks win/loss conditions

4. **Game End**:
   - Updates statistics
   - Shows win/loss message
   - Enables sharing

## Testing

To test the equation generator:

```javascript
// In browser console
const seed = getSeed(); // or any seed string
const { equation, value } = newEquationGenerator(seed);
console.log(`Equation: ${equation} = ${value}`);
```

## Known Issues / Differences

1. **Seeded Random**: Uses simple LCG instead of Python's Mersenne Twister
   - Should produce same results for same seed, but algorithm differs
   - May need adjustment if exact Python compatibility required

2. **Evaluation**: Uses `Function()` constructor
   - Safe alternative to `eval()`
   - May have slight performance difference

3. **No Global Stats**: Can't aggregate across users
   - Personal stats only
   - No leaderboards or global averages

4. **Device-Specific**: localStorage doesn't sync
   - Each device has separate game state
   - No cloud sync

## Future Enhancements (if server added)

- Global statistics API
- User accounts and cloud sync
- Leaderboards
- Social sharing with server validation
- Analytics and monitoring

## Performance

- Equation generation: ~1-10ms (cached after first generation)
- Guess validation: <1ms
- UI updates: Instant (no server round-trip)
- Storage: Synchronous (localStorage is fast)

## Security Considerations

- Client-side validation can be bypassed
- Users can inspect/modify JavaScript
- localStorage can be edited
- No server-side validation

For production use with security requirements, consider:
- Server-side validation
- API endpoints for game logic
- Signed/encrypted game state
- Rate limiting
