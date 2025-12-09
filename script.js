let abilities = {};
let enabledJobs = []; // Default to an empty array
let lives = 3;
let currentAbilityIndex = 0;
let shuffledAbilities = [];
let score = 0;
let streak = 0;
let highScore = localStorage.getItem('highScore') || 0;
let soundEnabled = JSON.parse(localStorage.getItem('soundEnabled') ?? 'true');
let audioContext = null;
let currentAbility = null;
let gameOver = false;
const achievements = [
    { id: 'streak-5', label: 'Limit Break I (5 streak)', icon: 'Ⅰ', condition: () => streak >= 5 },
    { id: 'streak-10', label: 'Limit Break II (10 streak)', icon: 'Ⅱ', condition: () => streak >= 10 },
    { id: 'streak-15', label: 'Limit Break III (15 streak)', icon: 'Ⅲ', condition: () => streak >= 15 },
    { id: 'streak-25', label: 'Duty Master (25 streak)', icon: '★', condition: () => streak >= 25 },
    { id: 'streak-50', label: 'Raid Legend (50 streak)', icon: '✨', condition: () => streak >= 50 },
    { id: 'streak-100', label: 'Warrior of Light (100 streak)', icon: '✦', condition: () => streak >= 100 },
    { id: 'score-50', label: 'Treasure Hunter (50 score)', icon: '☼', condition: () => score >= 50 },
    { id: 'score-100', label: 'Allagan Archivist (100 score)', icon: '∞', condition: () => score >= 100 }
];
let unlockedAchievements = new Set(JSON.parse(localStorage.getItem('achievementsUnlocked') || '[]'));

document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('play-again').addEventListener('click', resetGame);
document.getElementById('replay-button').addEventListener('click', startGame);
const titleEl = document.getElementById('game-title');
updateLives();
updateStreak();
document.getElementById('high-score').textContent = highScore;
renderAchievements();

const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
    soundToggle.checked = soundEnabled;
    soundToggle.addEventListener('change', (event) => {
        soundEnabled = event.target.checked;
        localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
    });
}

const achievementsToggle = document.getElementById('achievements-toggle');
const achievementsModal = document.getElementById('achievements-modal');
const closeAchievements = document.getElementById('close-achievements');
if (achievementsToggle && achievementsModal) {
    achievementsToggle.addEventListener('click', () => {
        achievementsModal.style.display = 'block';
    });
}
if (closeAchievements && achievementsModal) {
    closeAchievements.addEventListener('click', () => {
        achievementsModal.style.display = 'none';
    });
}
window.addEventListener('click', (event) => {
    if (event.target === achievementsModal) {
        achievementsModal.style.display = 'none';
    }
});

function startGame() {
    if (enabledJobs.length === 0) {
        displayMessage("Please select at least one job.");
        return;
    }

    lives = 3;
    score = 0;
    streak = 0;
    currentAbility = null;
    gameOver = false;
    updateLives();
    document.getElementById('score').textContent = score;
    updateStreak();
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('job-selection').style.display = 'none';
    document.getElementById('instructions-button').style.display = 'none';
    document.getElementById('play-again').style.display = 'none';
    document.getElementById('replay-button').style.display = 'none';
    document.getElementById('next-button').style.display = 'none';
    document.getElementById('game-info').style.display = 'block';
    if (titleEl) titleEl.style.display = 'none';
    loadAbilities();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomJob() {
    const randomIndex = Math.floor(Math.random() * enabledJobs.length);
    return enabledJobs[randomIndex];
}

function getRandomOptions(correctAbility) {
    const options = new Set();
    options.add(correctAbility.name);

    while (options.size < 4) {
        const job = getRandomJob();
        const randomAbility = abilities[job][Math.floor(Math.random() * abilities[job].length)].name;
        options.add(randomAbility);
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
}

function displayAbility(ability) {
    const iconContainer = document.getElementById('icon-container');
    const jobHint = document.getElementById('job-hint');
    const optionsContainer = document.getElementById('options-container');
    const nextButton = document.getElementById('next-button');
    currentAbility = ability;
    gameOver = false;

    const loader = document.createElement('div');
    loader.className = 'icon-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading ability icon');

    iconContainer.innerHTML = '';
    iconContainer.appendChild(loader);

    const iconImage = new Image();
    iconImage.alt = ability.name;
    iconImage.onload = () => {
        iconContainer.innerHTML = '';
        iconContainer.appendChild(iconImage);
    };
    iconImage.onerror = () => {
        iconContainer.innerHTML = '';
        const fallback = document.createElement('div');
        fallback.className = 'icon-fallback';
        fallback.textContent = '?';
        fallback.setAttribute('aria-label', 'Icon unavailable');
        iconContainer.appendChild(fallback);
    };
    iconImage.src = ability.icon;

    if (jobHint) {
        jobHint.textContent = ability.job ? ability.job : '';
    }

    optionsContainer.innerHTML = '';

    const options = getRandomOptions(ability);
    console.log("Options for ability:", ability.name, options);

    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.dataset.option = option;
        const label = document.createElement('span');
        label.className = 'option-label';
        label.textContent = option;
        button.appendChild(label);

        if (index < 4) {
            const keyHint = document.createElement('span');
            keyHint.className = 'key-hint';
            keyHint.textContent = index + 1;
            button.appendChild(keyHint);
            button.setAttribute('aria-label', `${option} (press ${index + 1})`);
        } else {
            button.setAttribute('aria-label', option);
        }

        button.onclick = () => checkAnswer(option, ability.name, button);
        optionsContainer.appendChild(button);
    });

    nextButton.style.display = 'none';
}

function checkAnswer(selected, correct, button) {
    if (gameOver) return;
    if (selected === correct) {
        score++;
        streak++;
        updateStreak();
        document.getElementById('score').textContent = score;
        button.classList.add('correct-answer');
        playSound('correct');
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            document.getElementById('high-score').textContent = highScore;
        }
        if (score % 5 === 0 && lives < 5) {
            lives++;
            updateLives();
        }
        displayMessage("Correct!");
        checkAchievements();
        document.getElementById('next-button').style.display = 'block';
    } else {
        console.log("Incorrect answer selected:", selected);
        button.classList.add('incorrect-answer');
        button.disabled = true;
        lives--;
        streak = 0;
        updateStreak();
        updateLives();
        playSound('incorrect');
        displayMessage("Wrong! Try again.");
        if (lives === 0) {
            endGame();
        }
    }
}

function updateLives() {
    const total = 3;
    const hearts = '💜'.repeat(lives);
    const empty = '♡'.repeat(Math.max(total - lives, 0));
    document.getElementById('lives').textContent = hearts + empty;
}

function updateStreak() {
    document.getElementById('streak').textContent = streak;
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;

        if (type === 'correct') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(660, now);
            oscillator.frequency.exponentialRampToValueAtTime(990, now + 0.18);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.35);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(260, now);
            oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.25);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.4);
        }
    } catch (error) {
        console.warn('Audio playback failed', error);
    }
}

function renderAchievements() {
    const badgeRow = document.getElementById('achievement-badges');
    if (!badgeRow) return;
    badgeRow.innerHTML = '';
    achievements.forEach((achievement) => {
        const badge = document.createElement('div');
        const unlocked = unlockedAchievements.has(achievement.id);
        badge.className = `badge ${unlocked ? 'unlocked' : ''}`;
        const icon = document.createElement('span');
        icon.className = 'badge-icon';
        icon.textContent = achievement.icon || '★';

        const label = document.createElement('span');
        label.textContent = achievement.label;

        badge.appendChild(icon);
        badge.appendChild(label);
        badgeRow.appendChild(badge);
    });
}

function checkAchievements() {
    let unlockedNow = [];
    achievements.forEach((achievement) => {
        if (!unlockedAchievements.has(achievement.id) && achievement.condition()) {
            unlockedAchievements.add(achievement.id);
            unlockedNow.push(achievement.label);
        }
    });
    if (unlockedNow.length > 0) {
        localStorage.setItem('achievementsUnlocked', JSON.stringify(Array.from(unlockedAchievements)));
        renderAchievements();
        const messageContainer = document.getElementById('message-container');
        const achievementText = `Achievement unlocked: ${unlockedNow.join(', ')}`;
        if (messageContainer) {
            messageContainer.textContent = messageContainer.textContent
                ? `${messageContainer.textContent} • ${achievementText}`
                : achievementText;
        }
    }
}

function displayMessage(message) {
    const messageContainer = document.getElementById('message-container');
    messageContainer.textContent = message;
}

function resetGame() {
    lives = 3;
    score = 0;
    currentAbilityIndex = 0; // Reset the ability index
    streak = 0;
    currentAbility = null;
    gameOver = false;
    document.getElementById('job-selection').style.display = 'block';
    document.getElementById('instructions-button').style.display = 'block';
    document.getElementById('play-again').style.display = 'none';
    document.getElementById('replay-button').style.display = 'none';
    document.getElementById('game-info').style.display = 'none';
    if (titleEl) titleEl.style.display = 'block';
    document.getElementById('icon-container').innerHTML = '';
    document.getElementById('options-container').innerHTML = '';
    document.getElementById('message-container').textContent = '';
    document.getElementById('score').textContent = score;
    updateLives();
    updateStreak();
}

function endGame() {
    gameOver = true;
    const correctAnswer = currentAbility ? currentAbility.name : 'Unknown';
    displayMessage(`Game Over! Correct answer: ${correctAnswer}. Your score: ${score}`);
    document.getElementById('play-again').style.display = 'block';
    document.getElementById('replay-button').style.display = 'block';
    document.getElementById('instructions-button').style.display = 'inline-block'; // Ensure the button is displayed correctly
    document.getElementById('next-button').style.display = 'none';

    const buttons = document.querySelectorAll('#options-container button');
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.option === correctAnswer) {
            btn.classList.add('correct-answer');
        }
    });
}

function loadAbilities() {
    console.log("Loading abilities...");
    fetch('abilities.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            abilities = data;
            console.log("Abilities loaded:", abilities);
            prepareShuffledAbilities();
            nextRound();
        })
        .catch(error => {
            console.error("Failed to load abilities:", error);
        });
}

function prepareShuffledAbilities() {
    shuffledAbilities = [];
    enabledJobs.forEach(job => {
        if (!abilities[job]) return;
        const withJob = abilities[job].map(ability => ({ ...ability, job }));
        shuffledAbilities = shuffledAbilities.concat(withJob);
    });
    shuffledAbilities = shuffleArray(shuffledAbilities);
    console.log("Shuffled abilities:", shuffledAbilities);
}

function nextRound() {
    if (lives > 0) {
        if (currentAbilityIndex >= shuffledAbilities.length) {
            currentAbilityIndex = 0; // Reshuffle if all abilities have been shown
            shuffledAbilities = shuffleArray(shuffledAbilities);
        }
        const ability = shuffledAbilities[currentAbilityIndex];
        currentAbilityIndex++;
        displayAbility(ability);
        displayMessage('');
    }
}

function initializeJobSelection() {
    document.querySelectorAll('.job-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const job = event.target.getAttribute('data-job');
            if (event.target.checked) {
                enabledJobs.push(job);
            } else {
                enabledJobs = enabledJobs.filter(enabledJob => enabledJob !== job);
            }
        });

        // Ensure the default checked checkboxes are added to enabledJobs
        if (checkbox.checked) {
            enabledJobs.push(checkbox.getAttribute('data-job'));
        }
    });

    document.getElementById('select-all-dps').addEventListener('click', () => {
        selectJobs(["Monk", "Dragoon", "Samurai", "Reaper", "Viper", "Ninja", "Bard", "Machinist", "Dancer", "Black Mage", "Summoner", "Red Mage", "Pictomancer"], true);
    });

    document.getElementById('select-all-tank').addEventListener('click', () => {
        selectJobs(["Paladin", "Warrior", "Dark Knight", "Gunbreaker"], true);
    });

    document.getElementById('select-all-healers').addEventListener('click', () => {
        selectJobs(["White Mage", "Scholar", "Astrologian", "Sage"], true);
    });

    document.getElementById('clear-selected-jobs').addEventListener('click', clearSelectedJobs);
    document.getElementById('random-jobs').addEventListener('click', selectRandomJobs);

    document.getElementById('select-all-crafters').addEventListener('click', () => {
        selectJobs(["Carpenter", "Blacksmith", "Armorer", "Goldsmith", "Leatherworker", "Weaver", "Alchemist", "Culinarian"], true);
    });

    document.getElementById('select-all-gatherers').addEventListener('click', () => {
        selectJobs(["Miner", "Botanist", "Fisher"], true);
    });

    function selectJobs(jobs, addToCurrent = false) {
        if (!addToCurrent) {
            enabledJobs = jobs;
        } else {
            jobs.forEach(job => {
                if (!enabledJobs.includes(job)) {
                    enabledJobs.push(job);
                }
            });
        }
        document.querySelectorAll('.job-checkbox').forEach(checkbox => {
            const job = checkbox.getAttribute('data-job');
            checkbox.checked = enabledJobs.includes(job);
        });
    }

    function clearSelectedJobs() {
        enabledJobs = [];
        document.querySelectorAll('.job-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    function selectRandomJobs() {
        clearSelectedJobs();
        const allJobs = [
            "Paladin", "Warrior", "Dark Knight", "Gunbreaker",
            "Monk", "Dragoon", "Samurai", "Reaper", "Viper", "Ninja", "Bard", "Machinist", "Dancer", "Black Mage", "Summoner", "Red Mage", "Pictomancer",
            "White Mage", "Scholar", "Astrologian", "Sage",
            "Blue Mage",
            "Carpenter", "Blacksmith", "Armorer", "Goldsmith", "Leatherworker", "Weaver", "Alchemist", "Culinarian",
            "Miner", "Botanist", "Fisher"
        ];
        const randomJobs = shuffleArray(allJobs).slice(0, Math.floor(Math.random() * allJobs.length) + 1);
        selectJobs(randomJobs);
    }
}

document.getElementById('next-button').addEventListener('click', nextRound);
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    initializeJobSelection();
});

document.addEventListener('keydown', (event) => {
    const modal = document.getElementById('instructions-modal');
    if (modal && modal.style.display === 'block') {
        return;
    }

    const validKeys = ['1', '2', '3', '4'];
    if (!validKeys.includes(event.key)) {
        return;
    }

    const index = parseInt(event.key, 10) - 1;
    const buttons = document.querySelectorAll('#options-container button');
    if (buttons[index] && !buttons[index].disabled) {
        buttons[index].click();
    }
});

// Instructions modal functionality
document.getElementById('instructions-button').addEventListener('click', function () {
    document.getElementById('instructions-modal').style.display = 'block';
});

document.querySelector('.close-button').addEventListener('click', function () {
    document.getElementById('instructions-modal').style.display = 'none';
});

window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('instructions-modal')) {
        document.getElementById('instructions-modal').style.display = 'none';
    }
});
