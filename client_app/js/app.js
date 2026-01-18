/**
 * Main Application Logic
 * Handles UI interactions and game flow
 */

// Game state
let curCount = 0;
let gameEndStatus = 0;
let enterEnabled = true;
let mobileReady = false;
let truthEquation = '';
let truthAnswer = 0;
let currentSeed = '';

// Initialize on page load
$(document).ready(function() {
    // Check if mobile
    if ($(window).width() < 1000) {
        mobileReady = true;
        $('.box').css('width', '2rem');
        $('.box').css('height', '2rem');
        $('.box').css('font-size', '1rem');
        $('.box2').css('width', '3rem');
        $('.box2').css('height', '3rem');
        $('.box2').css('font-size', '1rem');
        $('#b_enter').css('width', '15rem');
        $('#b_enter').css('height', '2rem');
        $('#a_0').css('display', 'none');
        $('#a_mobile').css('display', 'block');
        $('.box').css('font-weight', '900');
        $('#keyboard').css('margin-top', '0');
    }

    // Initialize game
    initializeGame();

    // Set up event listeners
    setupEventListeners();

    // Load stats
    updateYourStats();
});

/**
 * Initialize the game
 */
function initializeGame() {
    // Get seed from URL or use daily seed
    const urlParams = new URLSearchParams(window.location.search);
    const customSeed = urlParams.get('seed');
    
    if (customSeed) {
        currentSeed = String(getVarSeed(customSeed));
        initializeSession(currentSeed, true);
        // Sanitize customSeed to prevent XSS (limit to alphanumeric and common chars)
        const sanitizedSeed = customSeed.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
        document.getElementById('notif').innerHTML = `#mynumble: ${sanitizedSeed}`;
    } else {
        currentSeed = getSeed();
        initializeSession(currentSeed, false);
        const dayCount = getDayCount();
        document.getElementById('notif').innerHTML = `# ${dayCount}`;
    }

    // Get truth equation and answer
    truthEquation = getTruthValue(currentSeed);
    truthAnswer = getTruthAns(currentSeed);
    
    // Make truthEquation and truthAnswer available globally for checker function
    window.truthEquation = truthEquation;
    window.truthAnswer = truthAnswer;

    // Update answer displays
    $('[id^="answer-value"]').text(truthAnswer);
    $('#a_mobile').text(`= ${truthAnswer}`);

    // Hide all answer displays first (a_0 is visible by default in HTML)
    for (let i = 0; i < 6; i++) {
        $(`#a_${i}`).css('display', 'none');
    }

    // Load session state
    const session = getSession();
    gameEndStatus = session.wonStatus;
    
    // Restore current input if game is not finished and seed matches
    if (gameEndStatus === 0 && session.currentCount > 0 && session.todaySeed === currentSeed) {
        curCount = session.currentCount;
        // Restore the input in the current row
        const currentRow = session.totalGuesses;
        for (let i = 0; i < session.currentInput.length && i < 7; i++) {
            const boxIndex = (currentRow * 9) + i;
            $('.box').eq(boxIndex).text(session.currentInput[i]);
        }
    } else {
        curCount = 0;
        // Clear current input if seed doesn't match
        if (session.todaySeed !== currentSeed) {
            updateSession({ currentInput: '', currentCount: 0 });
        }
    }

    // Update UI with history
    if (session.guessHistory.length > 0) {
        updateHistory(session.totalGuesses, session.guessHistory);
    }

    // Hide all answer displays first
    for (let i = 0; i < 6; i++) {
        $(`#a_${i}`).css('display', 'none');
    }

    // Show appropriate answer display
    if (!mobileReady) {
        if (gameEndStatus === 1 || gameEndStatus === -1) {
            // Game finished - show answer on the last row that was used
            if (session.totalGuesses > 0) {
                $(`#a_${session.totalGuesses - 1}`).css('display', 'block');
            } else {
                $(`#a_0`).css('display', 'block');
            }
        } else {
            // Game in progress - show answer on current row
            $(`#a_${session.totalGuesses}`).css('display', 'block');
        }
    }

    // Handle game end states
    if (gameEndStatus === 1) {
        winFunction();
    } else if (gameEndStatus === -1) {
        loseFunction();
    }

    // Apply dark mode
    applyDarkMode();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Info button
    $('#info').click(function() {
        $('#infoModal').modal('show');
    });

    // Stats button
    $('#statsButton').click(function() {
        updateYourStats();
        $('#statsModal').modal('show');
    });

    // Dark mode toggle
    $('#darkModeToggle').click(function() {
        const isDark = toggleDarkMode();
        applyDarkMode(isDark);
    });

    // Keyboard buttons
    const keyMap = {
        'b_0': '0', 'b_1': '1', 'b_2': '2', 'b_3': '3', 'b_4': '4',
        'b_5': '5', 'b_6': '6', 'b_7': '7', 'b_8': '8', 'b_9': '9',
        'b_plus': '+', 'b_minus': '-', 'b_divide': '/', 'b_multiply': '*'
    };

    for (const [id, key] of Object.entries(keyMap)) {
        $(`#${id}`).click(function() {
            handleKeyPress({ key: key });
        });
    }

    $('#b_back').click(function() {
        handleKeyPress({ key: 'Backspace' });
    });

    $('#b_enter').click(function() {
        if (gameEndStatus === 0) {
            handleKeyPress({ key: 'Enter' });
        } else {
            copyText();
            alert("Copied to Clipboard!");
        }
    });

    // Physical keyboard
    document.onkeydown = handleKeyPress;
}

/**
 * Handle key press events
 */
function handleKeyPress(e) {
    e = e || window.event;

    if (gameEndStatus === 1 || gameEndStatus === -1) {
        return;
    }

    const session = getSession();
    const keyCodes = CHAR_LIST;

    if (keyCodes.includes(e.key)) {
        if (curCount < 7) {
            startTimer();
            const boxIndex = (session.totalGuesses * 9) + curCount;
            $('.box').eq(boxIndex).text(e.key);
            curCount++;
            // Save current input state
            saveCurrentInput();
        }
    } else if (e.key === 'Backspace') {
        if (curCount > 0) {
            curCount--;
            const boxIndex = (session.totalGuesses * 9) + curCount;
            $('.box').eq(boxIndex).html('&nbsp;');
            // Save current input state
            saveCurrentInput();
        }
    } else if (e.key === 'Enter' && curCount < 7) {
        shakeShake();
    } else if (e.key === 'Enter' && enterEnabled) {
        enterEnabled = false;
        submitGuess();
    }
}

/**
 * Submit a guess
 */
function submitGuess() {
    const session = getSession();
    let guess = '';

    for (let i = 0; i < curCount; i++) {
        const boxIndex = (session.totalGuesses * 9) + i;
        guess += $('.box').eq(boxIndex).text().trim();
    }

    // Check the guess
    const result = checker(guess.split(''), truthEquation);

    if (result.status === -1) {
        // Invalid guess
        shakeShake();
        enterEnabled = true;
        return;
    }

    // Update time played
    const timePlayed = Math.floor(Date.now() / 1000) - session.startTime;
    const newTotalGuesses = session.totalGuesses + 1;

    // Update guess history
    const sortedResults = result.results.sort((a, b) => a.index - b.index);
    const newHistory = [...session.guessHistory, sortedResults];

    // Update session
    updateSession({
        totalGuesses: newTotalGuesses,
        guessHistory: newHistory,
        timePlayed: timePlayed
    });

    // Google Analytics event - game guess
    if (typeof gtag !== 'undefined') {
        gtag('event', 'game_guess', {
            'total_guesses': newTotalGuesses,
            'time_played': timePlayed
        });
    }

    // Update UI with results
    updateGuessRow(session.totalGuesses, sortedResults);

    if (result.status === 1) {
        // Won!
        gameEndStatus = 1;
        updateSession({ 
            wonStatus: 1, 
            lastPlayed: currentSeed,
            currentInput: '',
            currentCount: 0
        });

        // Save score
        if (!session.generate) {
            addScore(currentSeed, newTotalGuesses);
            updateAverageTime(timePlayed);
        }

        // Google Analytics events - game won
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_complete', {
                'value': 1
            });
            gtag('event', 'game_won_event', {
                'value': newTotalGuesses,
                'total_guesses': newTotalGuesses,
                'time_played': timePlayed,
                'avg_time_played': session.avgTimePlayed
            });
        }

        winFunction();
        showTodayStats(timePlayed, newTotalGuesses);
        setTimeout(() => {
            $('#statsModal').modal('show');
        }, 800);
    } else if (newTotalGuesses >= 6) {
        // Lost
        gameEndStatus = -1;
        updateSession({ 
            wonStatus: -1, 
            lastPlayed: currentSeed,
            currentInput: '',
            currentCount: 0
        });

        // Save score
        if (!session.generate) {
            addScore(currentSeed, -1);
        }

        // Google Analytics events - game lost
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_complete', {
                'value': 0
            });
            gtag('event', 'game_lost_event', {
                'value': newTotalGuesses,
                'total_guesses': newTotalGuesses,
                'time_played': timePlayed,
                'avg_time_played': session.avgTimePlayed
            });
        }

        loseFunction();
        setTimeout(() => {
            $('#statsModal').modal('show');
        }, 800);
        } else {
            // Next guess
            if (!mobileReady) {
                $(`#a_${session.totalGuesses}`).css('display', 'none');
                $(`#a_${newTotalGuesses}`).css('display', 'block');
            }
            curCount = 0;
            // Clear current input when moving to next row
            updateSession({ currentInput: '', currentCount: 0 });
    }

    enterEnabled = true;
}

/**
 * Update a guess row with results
 */
function updateGuessRow(rowIndex, results) {
    const session = getSession();
    const keyCodes = CHAR_LIST;

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const boxIndex = (rowIndex * 9) + result.index;
        const box = $('.box').eq(boxIndex);
        const keyIndex = keyCodes.indexOf(result.char);
        const keyButton = $('.box2').eq(keyIndex);

        // Update box
        box.removeClass('btn-outline-secondary');
        box.addClass('text-white');
        box.text(result.char);

        if (result.status === 1) {
            box.addClass('btn-success');
            keyButton.addClass('btn-success text-light');
            keyButton.removeClass('btn-warning btn-secondary btn-dark');
        } else if (result.status === 0) {
            box.addClass('btn-warning');
            if (keyButton.hasClass('btn-secondary')) {
                keyButton.addClass('btn-warning text-light');
                keyButton.removeClass('btn-secondary');
            }
        } else {
            box.addClass('btn-dark');
            if (!keyButton.hasClass('btn-warning') && !keyButton.hasClass('btn-success')) {
                keyButton.addClass('btn-dark text-light');
            }
        }
    }
}

/**
 * Update history display
 */
function updateHistory(totalGuesses, guessHistory) {
    for (let h = 0; h < guessHistory.length; h++) {
        updateGuessRow(h, guessHistory[h]);
    }
}

/**
 * Shake animation for invalid input
 */
function shakeShake() {
    const session = getSession();
    const modeColor = getDarkMode() ? 'white' : 'black';

    for (let i = 0; i < curCount; i++) {
        const boxIndex = (session.totalGuesses * 9) + i;
        $('.box').eq(boxIndex).addClass('shake');
    }

    $(`#a_${session.totalGuesses}`).children().first().css('color', 'red');
    $('#a_mobile').css('color', 'red');

    setTimeout(function() {
        $(`#a_${session.totalGuesses}`).children().first().css('color', modeColor);
        $('#a_mobile').css('color', modeColor);
        for (let i = 0; i < curCount; i++) {
            const boxIndex = (session.totalGuesses * 9) + i;
            $('.box').eq(boxIndex).removeClass('shake');
        }
    }, 500);
}

/**
 * Win function
 */
function winFunction() {
    $('.box2').each(function() {
        $(this).removeClass('btn-secondary btn-success btn-warning btn-dark');
        $(this).html('&nbsp;');
    });

    // Show WIN
    $('.box2').eq(6).text('W').addClass('btn-danger');
    $('.box2').eq(7).text('I').addClass('btn-danger');
    $('.box2').eq(8).text('N').addClass('btn-danger');

    // Hide other buttons
    for (let i = 0; i < 6; i++) {
        $('.box2').eq(i).css('display', 'none');
    }
    for (let i = 9; i < 15; i++) {
        $('.box2').eq(i).css('display', 'none');
    }

    $('.box2').eq(15).addClass('btn-success text-white').text('Share');

    const remainingTime = nextWordTime();
    document.getElementById('notif').innerHTML = `Come back for a new equation<br>in <b>${remainingTime}</b>!`;
}

/**
 * Lose function
 */
function loseFunction() {
    $('.box2').each(function() {
        $(this).removeClass('btn-secondary btn-success btn-warning btn-dark');
        $(this).html('&nbsp;');
    });

    // Show LOST
    $('.box2').eq(6).text('L').addClass('btn-danger');
    $('.box2').eq(7).text('O').addClass('btn-danger');
    $('.box2').eq(8).text('S').addClass('btn-danger');
    $('.box2').eq(9).text('T').addClass('btn-danger');

    // Hide other buttons
    for (let i = 0; i < 6; i++) {
        $('.box2').eq(i).css('display', 'none');
    }
    for (let i = 10; i < 15; i++) {
        $('.box2').eq(i).css('display', 'none');
    }

    $('.box2').eq(15).addClass('btn-success text-white').text('Share');

    const remainingTime = nextWordTime();
    document.getElementById('notif').innerHTML = `Come back for a new equation<br>in <b>${remainingTime}</b>!<br>Today's equation was: <br><b>${truthEquation}</b>`;
}

/**
 * Copy results to clipboard
 */
function copyText() {
    const session = getSession();
    const dayCount = session.generate ? `#mynumble: ${session.generateKey}` : `# ${getDayCount()}`;
    
    let resultStr = '';
    for (let h = 0; h < session.guessHistory.length; h++) {
        for (let i = 0; i < session.guessHistory[h].length; i++) {
            const status = session.guessHistory[h][i].status;
            if (status === 1) resultStr += '🟩';
            else if (status === 0) resultStr += '🟨';
            else resultStr += '⬛️';
        }
        resultStr += '\n';
    }

    const scoreStr = gameEndStatus === 1 ? `${session.totalGuesses}/6` : 'X/6';
    const text = `#Numble ${dayCount}\n\n${resultStr}\n${scoreStr}\n\nwww.thenumble.app`;

    const textarea = document.createElement('textarea');
    textarea.textContent = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
    } catch (ex) {
        console.warn('Copy to clipboard failed.', ex);
        prompt('Copy to clipboard: Ctrl+C, Enter', text);
    } finally {
        document.body.removeChild(textarea);
    }
}

/**
 * Update average time played
 */
function updateAverageTime(timePlayed) {
    const session = getSession();
    const scores = JSON.parse(localStorage.getItem('numble_scores') || '{}');
    
    let totalWon = 0;
    for (const seed in scores) {
        if (scores[seed] !== -1) {
            totalWon++;
        }
    }

    let avgTime = session.avgTimePlayed;
    if (avgTime === -1) {
        avgTime = timePlayed;
    } else {
        avgTime = (avgTime * (totalWon - 1) + timePlayed) / totalWon;
    }

    updateSession({ avgTimePlayed: avgTime });
}

/**
 * Show today's stats
 */
function showTodayStats(timePlayed, guesses) {
    document.getElementById('todaystats').style.display = 'block';
    
    let timeStr = 'Today, it took you <b>';
    if (timePlayed < 60) {
        timeStr += `just ${timePlayed} seconds 🚀`;
    } else if (timePlayed < 120) {
        timeStr += '1 minute 💯';
    } else {
        timeStr += `${Math.floor(timePlayed / 60)} minutes ⏳`;
    }
    timeStr += '</b><br>';

    const session = getSession();
    if (session.avgTimePlayed !== -1) {
        const avgTimeStr = convertTimeToMinutes(session.avgTimePlayed);
        let diffStr = 'You were <b>';
        
        if (Math.round(timePlayed) === Math.round(session.avgTimePlayed)) {
            diffStr += 'on par 🎯</b> with your average';
        } else if (timePlayed > session.avgTimePlayed) {
            const ratio = ((timePlayed / session.avgTimePlayed) - 1).toFixed(1);
            diffStr += `${ratio}x slower 🐢</b> than your average of ${avgTimeStr}`;
        } else {
            const ratio = ((session.avgTimePlayed / timePlayed) - 1).toFixed(1);
            diffStr += `${ratio}x faster 💨</b> than your average of ${avgTimeStr}`;
        }
        timeStr += diffStr;
    }

    document.getElementById('your_timeplayed_minutes').innerHTML = timeStr;
}

/**
 * Convert time to minutes and seconds
 */
function convertTimeToMinutes(time) {
    const mins = Math.floor(time / 60);
    const secs = Math.round(time % 60);
    return `${mins}m ${secs}s`;
}

/**
 * Update your stats display
 */
function updateYourStats() {
    const stats = getScores();
    const session = getSession();

    $('#your_score_played').text(stats.played);
    $('#your_score_won').text(stats.won);
    $('#your_score_percent').text(stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0);

    // Update guess distribution
    const maxList = mobileReady ? 250 / Math.max(...stats.distribution, 1) : 403 / Math.max(...stats.distribution, 1);

    for (let dist = 0; dist < stats.distribution.length; dist++) {
        const count = stats.distribution[dist];
        $(`#your_guess_${dist + 1}`).text(count);
        
        if (count > 0 && count * maxList > 12) {
            $(`#your_guess_${dist + 1}`).css('paddingLeft', `${count * maxList}px`);
        }
    }

    // Update average time
    if (session.avgTimePlayed !== -1) {
        const avgTimeStr = convertTimeToMinutes(session.avgTimePlayed);
        $('#avg_time_played_span').text(avgTimeStr);
    } else {
        $('#avg_time_played_span').text('?');
    }
}

/**
 * Apply dark mode
 */
function applyDarkMode() {
    const isDark = getDarkMode();
    const stylesheet = document.getElementById('theme-stylesheet');
    
    if (isDark) {
        stylesheet.href = 'css/dark.css';
    } else {
        stylesheet.href = 'css/light.css';
    }
}

/**
 * Save current input state to localStorage
 */
function saveCurrentInput() {
    const session = getSession();
    if (gameEndStatus !== 0) return; // Don't save if game is finished
    
    let currentInput = '';
    const currentRow = session.totalGuesses;
    
    // Get current input from the boxes
    for (let i = 0; i < curCount; i++) {
        const boxIndex = (currentRow * 9) + i;
        const boxText = $('.box').eq(boxIndex).text().trim();
        if (boxText && boxText !== '&nbsp;') {
            currentInput += boxText;
        }
    }
    
    // Save to localStorage
    updateSession({
        currentInput: currentInput,
        currentCount: curCount
    });
}
