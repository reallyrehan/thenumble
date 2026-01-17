/**
 * Game Logic - Converted from Python backend
 * Implements equation generation, validation, and checking
 */

// Character list for valid inputs
const CHAR_LIST = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '/', '*'];

/**
 * Generate a random number generator seeded with a value
 * Simple LCG (Linear Congruential Generator) implementation
 */
function seededRandom(seed) {
    let value = seed;
    return function() {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

/**
 * Generate a random integer between min (inclusive) and max (exclusive)
 */
function randomInt(rng, min, max) {
    return Math.floor(rng() * (max - min)) + min;
}

/**
 * Convert a seed string to a numeric seed
 * Equivalent to Python's get_var_seed function
 */
function getVarSeed(seedStr) {
    try {
        return parseInt(seedStr.split('').map(c => String(c.charCodeAt(0) % 100)).join(''), 10);
    } catch (e) {
        return 97;
    }
}

/**
 * Generate a daily seed based on current date
 * Equivalent to Python's get_seed function
 */
function getSeed() {
    const today = new Date();
    const year = String(today.getFullYear());
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return year + month + day;
}

/**
 * Get the day count since the start date
 * Equivalent to Python's get_day_count function
 */
function getDayCount() {
    const startDate = new Date('2022-01-31');
    const curDate = new Date();
    const diffTime = curDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Generate a new equation based on a seed
 * Converted from Python's new_equation_generator function
 */
function newEquationGenerator(seed) {
    const rng = seededRandom(parseInt(seed, 10));
    const opList = ['+', '-', '/', '*'];
    let retry = true;

    while (retry) {
        let ansSt = "";
        let ansLs = [];

        // Generate equation string
        while (true) {
            const a = randomInt(rng, 0, 10);
            const b = opList[randomInt(rng, 0, 4)];
            ansLs.push(a);
            ansSt = ansSt + String(a) + b;

            if (ansSt.length > 7) {
                break;
            }
        }

        const finalTrue = ansSt.substring(0, 7);

        try {
            // Evaluate the equation
            const evalResult = Function('"use strict"; return (' + finalTrue + ')')();

            // Check if result is valid integer and within bounds
            if (Number.isInteger(evalResult) && 
                Math.abs(evalResult) < 200 && 
                !/(0\*)|(\*0)|(\/0)|(0\/)/.test(finalTrue)) {
                
                // Check if all divisions result in whole numbers
                let divisionValid = true;
                for (let i = 0; i < finalTrue.length; i++) {
                    if (finalTrue[i] === '/') {
                        const beforeDiv = parseInt(finalTrue[i - 1], 10);
                        const afterDiv = parseInt(finalTrue[i + 1], 10);
                        
                        const val = beforeDiv / afterDiv;
                        const roundVal = Math.round(val);
                        
                        if (val !== roundVal) {
                            divisionValid = false;
                            break;
                        }
                    }
                }

                if (divisionValid) {
                    retry = false;
                    return { equation: finalTrue, value: evalResult };
                }
            }
        } catch (e) {
            // Invalid equation, retry
        }
    }
}

/**
 * Evaluate if input is valid
 * Converted from Python's evaluator function
 */
function evaluator(inp, truthAns) {
    if (inp.length !== 7) {
        return { valid: false, error: 'Invalid Length' };
    }

    for (let i = 0; i < inp.length; i++) {
        if (!CHAR_LIST.includes(inp[i])) {
            return { valid: false, error: 'Invalid Character' };
        }
    }

    try {
        const evalResult = Function('"use strict"; return (' + inp.join('') + ')')();
        
        if (evalResult !== truthAns) {
            return { valid: false, error: 'Equation Unsolved' };
        }
    } catch (e) {
        return { valid: false, error: 'Invalid Equation' };
    }

    return { valid: true, error: null };
}

/**
 * Check guess against the truth equation
 * Converted from Python's checker function
 */
function checker(inp, truthEquation) {
    const truthLs = truthEquation.split('');
    const truthDict = {};
    
    // Count occurrences of each character in truth equation
    for (let i = 0; i < truthEquation.length; i++) {
        const char = truthEquation[i];
        truthDict[char] = (truthDict[char] || 0) + 1;
    }

    const resultLs = [];
    const truthAns = Function('"use strict"; return (' + truthEquation + ')')();
    const evalStatus = evaluator(inp, truthAns);

    if (!evalStatus.valid) {
        return { results: resultLs, status: -1, error: evalStatus.error };
    }

    // First pass: mark exact matches (green)
    for (let c = 0; c < inp.length; c++) {
        const i = inp[c];
        const j = truthLs[c];
        if (i === j) {
            truthDict[i]--;
            resultLs.push({ index: c, status: 1, char: i });
        }
    }

    // Second pass: mark wrong position matches (yellow)
    for (let c = 0; c < inp.length; c++) {
        const i = inp[c];
        const j = truthLs[c];
        
        if (i !== j && truthLs.includes(i)) {
            if (truthDict[i] > 0) {
                truthDict[i]--;
                resultLs.push({ index: c, status: 0, char: i });
            }
        }
    }

    // Third pass: mark non-existent characters (dark)
    const matchedIndices = resultLs.map(r => r.index);
    for (let i = 0; i < 7; i++) {
        if (!matchedIndices.includes(i)) {
            resultLs.push({ index: i, status: -1, char: inp[i] });
        }
    }

    // Check if won
    if (inp.join('') === truthEquation) {
        return { results: resultLs, status: 1, error: null };
    } else {
        return { results: resultLs, status: 0, error: null };
    }
}

// Cache for equations
let equationCache = {};

/**
 * Get the truth equation for the current seed
 * Equivalent to Python's get_truth_value function
 */
function getTruthValue(seed) {
    if (!seed) {
        seed = getSeed();
    }
    
    if (equationCache[seed]) {
        return equationCache[seed].equation;
    }
    
    const { equation, value } = newEquationGenerator(seed);
    equationCache[seed] = { equation, value };
    return equation;
}

/**
 * Get the truth answer (evaluated value) for the current seed
 * Equivalent to Python's get_truth_ans function
 */
function getTruthAns(seed) {
    if (!seed) {
        seed = getSeed();
    }
    
    if (equationCache[seed]) {
        return equationCache[seed].value;
    }
    
    const { equation, value } = newEquationGenerator(seed);
    equationCache[seed] = { equation, value };
    return value;
}

/**
 * Get time until next word
 */
function nextWordTime() {
    const today = new Date();
    const hours = 23 - today.getHours();
    const minutes = 59 - today.getMinutes();
    return `${hours} hours and ${minutes} minutes`;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSeed,
        getVarSeed,
        getDayCount,
        newEquationGenerator,
        evaluator,
        checker,
        getTruthValue,
        getTruthAns,
        nextWordTime,
        CHAR_LIST
    };
}
