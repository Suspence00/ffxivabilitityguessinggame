let abilities = {};
let enabledJobs = []; // Default to an empty array
let lives = 3;
let currentAbility = null;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('play-again').addEventListener('click', resetGame);

function startGame() {
    if (enabledJobs.length === 0) {
        displayMessage("Please select at least one job.");
        return;
    }

    lives = 3;
    score = 0;
    document.getElementById('lives').textContent = '💜💜💜';
    document.getElementById('score').textContent = score;
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('job-selection').style.display = 'none';
    document.getElementById('instructions-button').style.display = 'none';
    document.getElementById('play-again').style.display = 'none';
    document.getElementById('next-button').style.display = 'none';
    document.getElementById('game-info').style.display = 'block';
    loadAbilities();
}

function getRandomJob() {
    const randomIndex = Math.floor(Math.random() * enabledJobs.length);
    return enabledJobs[randomIndex];
}

function getRandomAbility(job) {
    const jobAbilities = abilities[job];
    const randomIndex = Math.floor(Math.random() * jobAbilities.length);
    return jobAbilities[randomIndex];
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
    const optionsContainer = document.getElementById('options-container');
    const nextButton = document.getElementById('next-button');
    
    iconContainer.innerHTML = `<img src="icons/${ability.icon}" alt="${ability.name}">`;
    optionsContainer.innerHTML = '';

    const options = getRandomOptions(ability);

    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => checkAnswer(option, ability.name, button);
        optionsContainer.appendChild(button);
    });

    nextButton.style.display = 'none';
}

function checkAnswer(selected, correct, button) {
    if (selected === correct) {
        score++;
        document.getElementById('score').textContent = score;
        button.classList.add('correct-answer');
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
        document.getElementById('next-button').style.display = 'block';
    } else {
        console.log("Incorrect answer selected:", selected);
        button.classList.add('incorrect-answer');
        button.disabled = true;
        lives--;
        updateLives();
        displayMessage("Wrong! Try again.");
        if (lives === 0) {
            endGame();
        }
    }
}

function updateLives() {
    const hearts = '💜'.repeat(lives) + '♡'.repeat(5 - lives);
    document.getElementById('lives').textContent = hearts;
}

function displayMessage(message) {
    const messageContainer = document.getElementById('message-container');
    messageContainer.textContent = message;
}

function resetGame() {
    lives = 3;
    score = 0;
    document.getElementById('job-selection').style.display = 'block';
    document.getElementById('instructions-button').style.display = 'block';
    document.getElementById('play-again').style.display = 'none';
    document.getElementById('game-info').style.display = 'none';
    document.getElementById('icon-container').innerHTML = '';
    document.getElementById('options-container').innerHTML = '';
    document.getElementById('message-container').textContent = '';
}

function endGame() {
    displayMessage("Game Over! Your score: " + score);
    document.getElementById('play-again').style.display = 'block';
    document.getElementById('instructions-button').style.display = 'inline-block'; // Ensure the button is displayed correctly
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
            nextRound();
        })
        .catch(error => {
            console.error("Failed to load abilities:", error);
        });
}

function nextRound() {
    if (lives > 0) {
        const job = getRandomJob();
        const ability = getRandomAbility(job);
        currentAbility = ability;
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
        selectJobs(["Monk", "Dragoon", "Samurai", "Reaper", "Ninja", "Bard", "Machinist", "Dancer", "Black Mage", "Summoner", "Red Mage"]);
    });

    document.getElementById('select-all-tank').addEventListener('click', () => {
        selectJobs(["Paladin", "Warrior", "Dark Knight", "Gunbreaker"]);
    });

    document.getElementById('select-all-healers').addEventListener('click', () => {
        selectJobs(["White Mage", "Scholar", "Astrologian", "Sage"]);
    });

    function selectJobs(jobs) {
        enabledJobs = jobs;
        document.querySelectorAll('.job-checkbox').forEach(checkbox => {
            const job = checkbox.getAttribute('data-job');
            checkbox.checked = jobs.includes(job);
        });
    }
}

document.getElementById('next-button').addEventListener('click', nextRound);
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    initializeJobSelection();
});

// Instructions modal functionality
document.getElementById('instructions-button').addEventListener('click', function() {
    document.getElementById('instructions-modal').style.display = 'block';
});

document.querySelector('.close-button').addEventListener('click', function() {
    document.getElementById('instructions-modal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('instructions-modal')) {
        document.getElementById('instructions-modal').style.display = 'none';
    }
});
