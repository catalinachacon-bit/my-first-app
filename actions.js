"use strict";

// =====================================
// VARIABLES
// =====================================

let clicks = 0;
let duration = 10;
let startTime = 0;
let gameActive = false;
let animationFrame = null;

const STORAGE_KEY = "clickSpeedLeaderboard";
const MAX_RANKING = 10;

let selectedRankingDuration = 10;

let leaderboard = loadLeaderboard();


// =====================================
// OBTENER ELEMENTOS
// =====================================

const playerNameInput = document.getElementById("playerName");
const durationSelect = document.getElementById("duration");

const timerDisplay = document.getElementById("timer");
const clickDisplay = document.getElementById("clickCount");

const startButton = document.getElementById("startButton");
const clickButton = document.getElementById("clickButton");

const resultDisplay = document.getElementById("result");
const statusDisplay = document.getElementById("status");

const modal = document.getElementById("leaderboardModal");
const rankingTable = document.getElementById("rankingTable");
const emptyRanking = document.getElementById("emptyRanking");


// =====================================
// CARGAR LEADERBOARD
// =====================================

function loadLeaderboard() {

    const empty = {
        10: [],
        20: [],
        30: []
    };

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return empty;

        const data = JSON.parse(saved);

        [10, 20, 30].forEach(time => {

            const entries = Array.isArray(data[time])
                ? data[time]
                : [];

            empty[time] = entries
                .filter(entry =>
                    entry &&
                    typeof entry.name === "string" &&
                    typeof entry.score === "number" &&
                    Number.isFinite(entry.score) &&
                    entry.score >= 0
                )
                .sort((a, b) => b.score - a.score)
                .slice(0, MAX_RANKING);

        });

        return empty;

    } catch (error) {

        console.error("Error cargando ranking:", error);

        return empty;
    }
}


// =====================================
// GUARDAR LEADERBOARD
// =====================================

function saveLeaderboard() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(leaderboard)
        );

        return true;

    } catch (error) {

        console.error("Error guardando ranking:", error);

        return false;
    }
}


// =====================================
// FORMATO DEL TEMPORIZADOR
// =====================================

function formatTime(ms) {

    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor(ms % 1000);

    return String(seconds).padStart(2, "0") + "." +
           String(milliseconds).padStart(3, "0");
}


// =====================================
// INICIAR PARTIDA
// =====================================

function startGame() {

    console.log("Botón iniciar presionado.");

    if (gameActive) return;

    const name = playerNameInput.value.trim();

    if (name === "") {

        resultDisplay.textContent =
            "¡Primero debes escribir tu nombre!";

        playerNameInput.focus();

        return;
    }

    // Reiniciar partida
    clicks = 0;

    duration = Number(durationSelect.value);

    clickDisplay.textContent = "0";
    timerDisplay.textContent = "00.000";

    resultDisplay.textContent = "";

    statusDisplay.textContent =
        "¡Jugando! Buena suerte, " + name + ".";

    // Bloquear configuración
    playerNameInput.disabled = true;
    durationSelect.disabled = true;

    startButton.disabled = true;
    clickButton.disabled = false;

    // Iniciar reloj
    gameActive = true;
    startTime = performance.now();

    // Ejecutar temporizador
    updateTimer();
}


// =====================================
// TEMPORIZADOR
// =====================================

function updateTimer() {

    if (!gameActive) return;

    const elapsed = performance.now() - startTime;
    const totalTime = duration * 1000;

    if (elapsed >= totalTime) {

        timerDisplay.textContent = formatTime(totalTime);

        endGame();

        return;
    }

    timerDisplay.textContent = formatTime(elapsed);

    animationFrame = requestAnimationFrame(updateTimer);
}


// =====================================
// CONTAR CLICKS
// =====================================

function registerClick() {

    if (!gameActive) return;

    const elapsed = performance.now() - startTime;

    if (elapsed >= duration * 1000) {

        endGame();

        return;
    }

    clicks++;

    clickDisplay.textContent = clicks;
}


// =====================================
// GUARDAR PUNTUACIÓN
// =====================================

function registerScore() {

    const category = String(duration);

    const scores = leaderboard[category];

    const qualifies =
        scores.length < MAX_RANKING ||
        clicks > scores[scores.length - 1].score;

    if (!qualifies) return false;

    const previousScores = [...scores];

    scores.push({
        name: playerNameInput.value.trim(),
        score: clicks,
        date: new Date().toISOString()
    });

    scores.sort((a, b) => {

        if (b.score !== a.score) {
            return b.score - a.score;
        }

        return new Date(a.date) - new Date(b.date);
    });

    leaderboard[category] = scores.slice(0, MAX_RANKING);

    if (!saveLeaderboard()) {

        leaderboard[category] = previousScores;

        return false;
    }

    return true;
}


// =====================================
// FINALIZAR PARTIDA
// =====================================

function endGame() {

    if (!gameActive) return;

    gameActive = false;

    if (animationFrame !== null) {

        cancelAnimationFrame(animationFrame);

        animationFrame = null;
    }

    timerDisplay.textContent = formatTime(duration * 1000);

    clickButton.disabled = true;
    startButton.disabled = false;

    playerNameInput.disabled = false;
    durationSelect.disabled = false;

    const newRecord = registerScore();

    resultDisplay.textContent =
        playerNameInput.value.trim() +
        ", conseguiste " + clicks + " clicks.";

    statusDisplay.textContent = newRecord
        ? "¡Nuevo récord! Entraste en el Top 10."
        : "Partida terminada. ¡Inténtalo otra vez!";

    // Abrir ranking automáticamente
    openLeaderboard(duration);
}


// =====================================
// ABRIR LEADERBOARD
// =====================================

function openLeaderboard(time = selectedRankingDuration) {

    selectedRankingDuration = time;

    modal.classList.remove("hidden");

    showRanking(time);
}


// =====================================
// MOSTRAR RANKING
// =====================================

function showRanking(time) {

    selectedRankingDuration = time;

    rankingTable.replaceChildren();

    document.querySelectorAll(".tab").forEach(tab => {

        tab.classList.toggle(
            "active",
            Number(tab.textContent.replace("s", "")) === time
        );
    });

    const scores = leaderboard[String(time)];

    if (!scores || scores.length === 0) {

        emptyRanking.style.display = "block";

        return;
    }

    emptyRanking.style.display = "none";

    scores.forEach((entry, index) => {

        const row = document.createElement("tr");

        const position = document.createElement("td");
        const name = document.createElement("td");
        const score = document.createElement("td");

        position.textContent =
            ["🥇", "🥈", "🥉"][index] || (index + 1);

        name.textContent = entry.name;
        score.textContent = entry.score;

        row.append(position, name, score);

        rankingTable.appendChild(row);
    });
}


// =====================================
// CERRAR LEADERBOARD
// =====================================

function closeLeaderboard() {

    modal.classList.add("hidden");
}


// =====================================
// ESTADO INICIAL
// =====================================

clickButton.disabled = true;
startButton.disabled = false;

console.log("Click Speed Challenge listo.");
console.log("startGame disponible:", typeof startGame);