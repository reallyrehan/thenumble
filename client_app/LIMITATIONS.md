# Client-Only App Limitations

This document lists functionality that is **not possible** in a client-only (no server) implementation of Numble.

## 1. Global Statistics

**What's Missing:**
- Real-time global statistics showing how many people played today
- Overall win/loss rates across all users
- Average guesses and time across all players
- Best time leaderboard

**Why:**
- Requires a centralized server/database (like Redis) to aggregate data from all users
- Client-only apps can only access data stored locally in the browser

**Workaround:**
- Personal statistics are still available and stored in localStorage
- Each user can only see their own stats

## 2. Server-Side Session Management

**What's Missing:**
- Server-managed sessions that persist across devices
- Session security features (CSRF tokens, secure cookies)
- Server-side session validation

**Why:**
- Sessions require server-side storage and management
- Client-only apps use localStorage which is device-specific

**Workaround:**
- localStorage is used for persistence, but it's device-specific
- Data doesn't sync across devices

## 3. Server-Side Analytics

**What's Missing:**
- Server-side analytics tracking
- Google Analytics server-side events
- Server-side error logging and monitoring

**Why:**
- Analytics require sending data to external services
- Client-only apps can only use client-side analytics (if implemented)

**Workaround:**
- Can still use client-side analytics (Google Analytics, etc.) if desired
- No server-side error tracking

## 4. Server-Side Validation

**What's Missing:**
- Server-side input validation and sanitization
- Protection against client-side manipulation
- Server-side rate limiting

**Why:**
- All validation happens in the browser
- Users can inspect and modify client-side code

**Workaround:**
- Client-side validation is still implemented
- Users could potentially cheat by modifying localStorage or JavaScript

## 5. Cross-Device Synchronization

**What's Missing:**
- Game progress syncing across devices
- Statistics accessible from any device
- Cloud-based save data

**Why:**
- Requires a server/database to store and sync data
- localStorage is device-specific

**Workaround:**
- Each device maintains its own separate game state
- No way to sync between devices

## 6. Server-Side Equation Generation

**What's Missing:**
- Server-side equation generation with server-side seed management
- Protection against reverse engineering the equation

**Why:**
- All logic runs in the browser
- Users can inspect the JavaScript code

**Workaround:**
- Equation generation still works, but is client-side
- The seed-based generation ensures daily puzzles are consistent

## 7. Server-Side Caching

**What's Missing:**
- Server-side caching of equations
- Shared cache across users
- Server-side performance optimization

**Why:**
- No server to implement caching
- Each browser maintains its own cache

**Workaround:**
- Client-side caching is implemented in JavaScript
- Each user's browser caches equations independently

## 8. Server-Side Security Features

**What's Missing:**
- CSRF protection
- XSS protection at server level
- Server-side input sanitization
- API rate limiting

**Why:**
- No server to implement security measures
- All security must be handled client-side

**Workaround:**
- Client-side validation and sanitization
- Browser security features still apply

## 9. Server-Side Custom Seeds (mynumble)

**What's Missing:**
- Server-side validation of custom seed URLs
- Server-side generation of shareable custom puzzle links

**Why:**
- Custom seeds are generated client-side
- No server to validate or manage custom puzzles

**Workaround:**
- Custom seeds still work via URL parameters
- Each user generates their own custom puzzles

## 10. Server-Side Ad Management

**What's Missing:**
- Server-side ad placement and management
- Server-side ad analytics
- Server-side ad revenue tracking

**Why:**
- No server to manage ads
- All ads would need to be client-side (if implemented)

**Workaround:**
- Can still use client-side ad services (Google AdSense, etc.)
- No server-side ad management

## Summary

The client-only version maintains **all core game functionality**:
- ✅ Daily puzzle generation
- ✅ Game mechanics (guessing, validation, feedback)
- ✅ Personal statistics
- ✅ Dark mode
- ✅ Custom seeds (mynumble)
- ✅ Local persistence

What's **not available**:
- ❌ Global statistics across all users
- ❌ Cross-device synchronization
- ❌ Server-side security features
- ❌ Server-side analytics
- ❌ Server-managed sessions

The app is fully functional as a single-player game with local statistics, but lacks the social/global features that require a server backend.
