/**
 * Storage Management - Replaces Flask sessions and Redis with localStorage
 */

const STORAGE_KEYS = {
    TOTAL_GUESSES: 'numble_total_guesses',
    GUESS_HISTORY: 'numble_guess_history',
    WON_STATUS: 'numble_won_status',
    START_TIME: 'numble_start_time',
    TIME_PLAYED: 'numble_time_played',
    LAST_PLAYED: 'numble_last_played',
    TODAY_SEED: 'numble_today_seed',
    DARK_MODE: 'numble_dark_mode',
    SCORES: 'numble_scores',
    AVG_TIME_PLAYED: 'numble_avg_time_played',
    GENERATE: 'numble_generate',
    GENERATE_KEY: 'numble_generate_key',
    CURRENT_INPUT: 'numble_current_input',  // Current row input
    CURRENT_COUNT: 'numble_current_count'    // Number of characters in current input
};

/**
 * Initialize session for a given seed
 * Only resets if it's a new day/seed, otherwise preserves current progress
 */
function initializeSession(seed, isCustomSeed = false) {
    const lastPlayed = localStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
    const storedSeed = localStorage.getItem(STORAGE_KEYS.TODAY_SEED);
    
    // Check if this is a new day/seed (different from what's stored)
    const isNewDay = storedSeed !== seed;
    
    // If it's a new day, reset all game state
    if (isNewDay) {
        localStorage.setItem(STORAGE_KEYS.TOTAL_GUESSES, '0');
        localStorage.setItem(STORAGE_KEYS.GUESS_HISTORY, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.WON_STATUS, '0');
        localStorage.setItem(STORAGE_KEYS.START_TIME, String(Math.floor(Date.now() / 1000)));
        localStorage.setItem(STORAGE_KEYS.TIME_PLAYED, '-1');
        localStorage.setItem(STORAGE_KEYS.CURRENT_INPUT, '');
        localStorage.setItem(STORAGE_KEYS.CURRENT_COUNT, '0');
    } else {
        // Same day - preserve start time if it exists, otherwise set it
        const existingStartTime = localStorage.getItem(STORAGE_KEYS.START_TIME);
        if (!existingStartTime || existingStartTime === '0') {
            localStorage.setItem(STORAGE_KEYS.START_TIME, String(Math.floor(Date.now() / 1000)));
        }
    }

    // Always update the current seed
    localStorage.setItem(STORAGE_KEYS.TODAY_SEED, seed);
    localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, seed);
    localStorage.setItem(STORAGE_KEYS.GENERATE, isCustomSeed ? 'true' : 'false');

    if (localStorage.getItem(STORAGE_KEYS.DARK_MODE) === null) {
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, 'false');
    }
}

/**
 * Get current session data
 */
function getSession() {
    return {
        totalGuesses: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_GUESSES) || '0', 10),
        guessHistory: JSON.parse(localStorage.getItem(STORAGE_KEYS.GUESS_HISTORY) || '[]'),
        wonStatus: parseInt(localStorage.getItem(STORAGE_KEYS.WON_STATUS) || '0', 10),
        startTime: parseInt(localStorage.getItem(STORAGE_KEYS.START_TIME) || '0', 10),
        timePlayed: parseInt(localStorage.getItem(STORAGE_KEYS.TIME_PLAYED) || '-1', 10),
        todaySeed: localStorage.getItem(STORAGE_KEYS.TODAY_SEED) || '',
        darkMode: localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true',
        avgTimePlayed: parseFloat(localStorage.getItem(STORAGE_KEYS.AVG_TIME_PLAYED) || '-1'),
        generate: localStorage.getItem(STORAGE_KEYS.GENERATE) === 'true',
        generateKey: localStorage.getItem(STORAGE_KEYS.GENERATE_KEY) || '',
        currentInput: localStorage.getItem(STORAGE_KEYS.CURRENT_INPUT) || '',
        currentCount: parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_COUNT) || '0', 10)
    };
}

/**
 * Update session data
 */
function updateSession(updates) {
    if (updates.totalGuesses !== undefined) {
        localStorage.setItem(STORAGE_KEYS.TOTAL_GUESSES, String(updates.totalGuesses));
    }
    if (updates.guessHistory !== undefined) {
        localStorage.setItem(STORAGE_KEYS.GUESS_HISTORY, JSON.stringify(updates.guessHistory));
    }
    if (updates.wonStatus !== undefined) {
        localStorage.setItem(STORAGE_KEYS.WON_STATUS, String(updates.wonStatus));
    }
    if (updates.timePlayed !== undefined) {
        localStorage.setItem(STORAGE_KEYS.TIME_PLAYED, String(updates.timePlayed));
    }
    if (updates.avgTimePlayed !== undefined) {
        localStorage.setItem(STORAGE_KEYS.AVG_TIME_PLAYED, String(updates.avgTimePlayed));
    }
    if (updates.lastPlayed !== undefined) {
        localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, String(updates.lastPlayed));
    }
    if (updates.currentInput !== undefined) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_INPUT, updates.currentInput);
    }
    if (updates.currentCount !== undefined) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_COUNT, String(updates.currentCount));
    }
}

/**
 * Get user scores (personal stats)
 */
function getScores() {
    const scoresJson = localStorage.getItem(STORAGE_KEYS.SCORES);
    const scores = scoresJson ? JSON.parse(scoresJson) : {};
    
    const distribution = [0, 0, 0, 0, 0, 0, 0];
    let played = 0;
    let won = 0;

    for (const seed in scores) {
        const score = scores[seed];
        played++;
        if (score === -1) {
            distribution[6]++;
        } else {
            distribution[score - 1]++;
            won++;
        }
    }

    return {
        distribution,
        played,
        won
    };
}

/**
 * Add a score for the current seed
 */
function addScore(seed, score) {
    const scoresJson = localStorage.getItem(STORAGE_KEYS.SCORES);
    const scores = scoresJson ? JSON.parse(scoresJson) : {};
    scores[seed] = score;
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const current = localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(!current));
    return !current;
}

/**
 * Get dark mode status
 */
function getDarkMode() {
    return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeSession,
        getSession,
        updateSession,
        getScores,
        addScore,
        toggleDarkMode,
        getDarkMode,
        STORAGE_KEYS
    };
}
