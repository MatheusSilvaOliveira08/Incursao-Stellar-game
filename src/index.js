import Grid from "./classes/Grid.js";
import Obstacle from "./classes/Obstacle.js";
import Particle from "./classes/Particle.js";
import Player from "./classes/Player.js";
import Astronaut from "./classes/Astronaut.js";
import SoundEffects from "./classes/SoundEffects.js";
import Star from "./classes/Star.js";
import {
    GameState,
    NUMBER_STARS,
    PATH_ASTRONAUT_1,
    PATH_ASTRONAUT_2,
    PATH_ASTRONAUT_ICON,
    FINAL_LEVEL,
    getPhaseConfig,
} from "./utils/constants.js";

const soundEffects = new SoundEffects();

const startScreen = document.querySelector(".start-screen");
const gameOverScreen = document.querySelector(".game-over");
const winScreen = document.querySelector(".win-screen");
const rankingScreen = document.querySelector(".ranking-screen");
const winRankingBody = winScreen.querySelector(".ranking-table tbody");
const lossRankingBody = rankingScreen.querySelector(".ranking-table tbody");
const buttonRestartWin = winScreen.querySelector(".button-restart-win");
const buttonRanking = gameOverScreen.querySelector(".button-ranking");
const buttonRestartRanking = rankingScreen.querySelector(
    ".button-restart-ranking"
);
const scoreUi = document.querySelector(".score-ui");
const scoreElement = scoreUi.querySelector(".score > span");
const levelElement = scoreUi.querySelector(".level > span");
const highElement = scoreUi.querySelector(".high > span");
const buttonPlay = document.querySelector(".button-play");
const buttonRestart = document.querySelector(".button-restart");

gameOverScreen.remove();
winScreen.remove();
rankingScreen.remove();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

ctx.imageSmoothingEnabled = false;

let currentState = GameState.START;
let winFireworkTimer = 0;
let lastRun = null;

// Pausa do jogo (alternada com a tecla "P" durante a partida).
let isPaused = false;

// ===== Disparo dos inimigos (controlado pelo loop, não por setInterval) =====
// Acumulador em milissegundos; o intervalo encurta conforme a fase avança.
let enemyShootAccumulator = 0;
const enemyShootInterval = () =>
    Math.max(350, 1000 - (gameData.level - 1) * 90);

// Animação de transição quando a nave evolui.
const upgradeAnim = { timer: 0, duration: 30 };

const gameData = {
    score: 0,
    level: 1,
    high: 0,
};

const showGameData = () => {
    scoreElement.textContent = gameData.score;
    levelElement.textContent = gameData.level;
    highElement.textContent = gameData.high;
};

const player = new Player(canvas.width, canvas.height);

const stars = [];
const playerProjectiles = [];
const invadersProjectiles = [];
const particles = [];
const obstacles = [];
const astronauts = [];

const initObstacles = () => {
    const x = canvas.width / 2 - 50;
    const y = canvas.height - 250;
    const offset = canvas.width * 0.15;
    const color = "crimson";

    const obstacle1 = new Obstacle({ x: x - offset, y }, 100, 20, color);
    const obstacle2 = new Obstacle({ x: x + offset, y }, 100, 20, color);

    obstacles.push(obstacle1);
    obstacles.push(obstacle2);
};

initObstacles();

// A primeira formação já nasce com a configuração da fase 1.
const firstPhase = getPhaseConfig(1);
const grid = new Grid(
    firstPhase.type,
    firstPhase.rows,
    firstPhase.cols,
    canvas.width
);

const keys = {
    left: false,
    right: false,
    shoot: {
        pressed: false,
        released: true,
    },
};

const incrementScore = (value) => {
    gameData.score += value;

    if (gameData.score > gameData.high) {
        gameData.high = gameData.score;
    }
};

const incrementLevel = () => {
    gameData.level += 1;
};

// Aplica a configuração da fase indicada à formação de inimigos.
const applyPhase = (level) => {
    const cfg = getPhaseConfig(level);
    grid.type = cfg.type;
    grid.rows = cfg.rows;
    grid.cols = cfg.cols;
    grid.canvasWidth = canvas.width;
    grid.restart(); // reconstrói e reaplica a velocidade base do tipo.
};

const generateStars = () => {
    for (let i = 0; i < NUMBER_STARS; i += 1) {
        stars.push(new Star(canvas.width, canvas.height));
    }
};

// Barra de vida: cada ponto é um astronauta, na ordem.
// Ponto 1 = astronauta inicial; ponto 2 = 1º resgatado; ponto 3 = 2º resgatado.
const loadIcon = (path) => {
    const image = new Image();
    image.src = path;
    return image;
};

const lifeIcons = [
    loadIcon(PATH_ASTRONAUT_ICON),
    loadIcon(PATH_ASTRONAUT_1),
    loadIcon(PATH_ASTRONAUT_2),
];

const drawLives = () => {
    const iconHeight = 34;
    const iconWidth = 26;
    const gap = 10;
    const startX = 16;
    const startY = 12;

    for (let i = 0; i < player.lives; i += 1) {
        const icon = lifeIcons[i] ?? lifeIcons[0];

        ctx.drawImage(
            icon,
            startX + i * (iconWidth + gap),
            startY,
            iconWidth,
            iconHeight
        );
    }
};

const drawStars = (dt) => {
    stars.forEach((star) => {
        star.draw(ctx);
        star.update(dt);
    });
};

const drawProjectiles = (dt) => {
    const projectiles = [...playerProjectiles, ...invadersProjectiles];

    projectiles.forEach((projectile) => {
        projectile.draw(ctx);
        projectile.update(dt);
    });
};

const drawParticles = (dt) => {
    particles.forEach((particle) => {
        particle.draw(ctx);
        particle.update(dt);
    });
};

const drawObstacles = () => {
    obstacles.forEach((obstacle) => obstacle.draw(ctx));
};

// Remoções percorrendo de trás para frente (evita pular itens ao usar splice).
const clearProjectiles = () => {
    for (let i = playerProjectiles.length - 1; i >= 0; i -= 1) {
        if (playerProjectiles[i].position.y <= 0) {
            playerProjectiles.splice(i, 1);
        }
    }

    for (let i = invadersProjectiles.length - 1; i >= 0; i -= 1) {
        if (invadersProjectiles[i].position.y > canvas.height) {
            invadersProjectiles.splice(i, 1);
        }
    }
};

const clearParticles = () => {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
        if (particles[i].opacity <= 0) {
            particles.splice(i, 1);
        }
    }
};

const createExplosion = (position, size, color) => {
    for (let i = 0; i < size; i += 1) {
        const particle = new Particle(
            {
                x: position.x,
                y: position.y,
            },
            {
                x: (Math.random() - 0.5) * 1.5,
                y: (Math.random() - 0.5) * 1.5,
            },
            2,
            color
        );

        particles.push(particle);
    }
};

// Explosão colorida e mais espalhada, usada nos fogos de artifício da vitória.
const FIREWORK_COLORS = [
    "#941CFF",
    "#4D9BE6",
    "crimson",
    "#FFD700",
    "#00E676",
    "#FF4FD8",
];

const createFirework = (position) => {
    const color =
        FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

    for (let i = 0; i < 28; i += 1) {
        particles.push(
            new Particle(
                { x: position.x, y: position.y },
                {
                    x: (Math.random() - 0.5) * 6,
                    y: (Math.random() - 0.5) * 6,
                },
                2,
                color
            )
        );
    }
};

// ===== Ranking persistente (localStorage) =====
const RANKING_KEY = "incursao-stellar-ranking";

const loadRanking = () => {
    try {
        const raw = localStorage.getItem(RANKING_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
};

const saveRanking = (list) => {
    try {
        localStorage.setItem(RANKING_KEY, JSON.stringify(list));
    } catch (error) {
        // Armazenamento indisponível: segue sem persistir.
    }
};

// Maior pontuação já registrada (usada para o "high" persistente).
const getHighScore = () =>
    loadRanking().reduce((max, entry) => Math.max(max, entry.score), 0);

// Registra a partida atual (vitória ou derrota) e devolve o registro criado.
const recordRun = (result) => {
    const entry = {
        id: Date.now(),
        score: gameData.score,
        result,
        date: new Date().toISOString(),
    };

    const list = loadRanking();
    list.push(entry);
    saveRanking(list);

    return entry;
};

const formatDate = (isoString) => {
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}`;
};

// Monta a tabela de ranking (em tbody) destacando a partida atual.
const renderRanking = (tbody, currentEntry) => {
    const sorted = loadRanking()
        .slice()
        .sort((a, b) => b.score - a.score);

    let rows = sorted.slice(0, 10);

    // Garante que a partida atual apareça, mesmo fora do top 10.
    if (currentEntry && !rows.some((entry) => entry.id === currentEntry.id)) {
        rows = rows.slice(0, 9);
        rows.push(currentEntry);
    }

    tbody.replaceChildren();

    rows.forEach((entry) => {
        const position = sorted.findIndex((item) => item.id === entry.id) + 1;
        const resultText = entry.result === "win" ? "Vitória" : "Derrota";

        const tr = document.createElement("tr");
        if (currentEntry && entry.id === currentEntry.id) {
            tr.classList.add("current");
        }

        // textContent evita qualquer injeção de HTML nos dados da tabela.
        const cells = [
            String(position),
            String(entry.score),
            resultText,
            formatDate(entry.date),
        ];

        cells.forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
};

const showWinScreen = (currentEntry) => {
    renderRanking(winRankingBody, currentEntry);
    document.body.append(winScreen);
};

// Tela de ranking acessada após a derrota (sem animação de vitória).
const showLossRanking = () => {
    renderRanking(lossRankingBody, lastRun);
    gameOverScreen.remove();
    document.body.append(rankingScreen);
};

const win = () => {
    if (currentState === GameState.WIN || currentState === GameState.GAME_OVER) {
        return;
    }

    currentState = GameState.WIN;
    soundEffects.playNextLevelSound();

    const entry = recordRun("win");
    lastRun = entry;
    gameData.high = Math.max(gameData.high, getHighScore());
    showWinScreen(entry);
};

const checkShootInvaders = () => {
    // Percorre invasores de trás para frente para poder remover com segurança.
    for (let i = grid.invaders.length - 1; i >= 0; i -= 1) {
        const invader = grid.invaders[i];

        for (let j = playerProjectiles.length - 1; j >= 0; j -= 1) {
            const projectile = playerProjectiles[j];

            if (invader.hit(projectile)) {
                playerProjectiles.splice(j, 1);

                const center = {
                    x: invader.position.x + invader.width / 2,
                    y: invader.position.y + invader.height / 2,
                };

                const destroyed = invader.takeDamage();
                soundEffects.playHitSound();

                if (destroyed) {
                    createExplosion(center, 10, "#941CFF");
                    incrementScore(10);
                    grid.invaders.splice(i, 1);
                } else {
                    // Dano sem destruir (inimigo com mais de uma vida).
                    createExplosion(center, 4, "#FFFFFF");
                }

                break; // este invasor já tratou o acerto deste quadro.
            }
        }
    }
};

const showGameOverScreen = () => {
    document.body.append(gameOverScreen);
};

const gameOver = () => {
    if (currentState === GameState.GAME_OVER || currentState === GameState.WIN) {
        return;
    }

    const center = {
        x: player.position.x + player.width / 2,
        y: player.position.y + player.height / 2,
    };

    createExplosion(center, 10, "white");
    createExplosion(center, 5, "#4D9BE6");
    createExplosion(center, 5, "crimson");

    player.alive = false;
    currentState = GameState.GAME_OVER;
    lastRun = recordRun("loss");
    gameData.high = Math.max(gameData.high, getHighScore());
    showGameOverScreen();
};

const checkShootPlayer = () => {
    for (let i = invadersProjectiles.length - 1; i >= 0; i -= 1) {
        const projectile = invadersProjectiles[i];

        if (player.hit(projectile)) {
            invadersProjectiles.splice(i, 1);

            const destroyed = player.takeDamage();

            if (destroyed) {
                soundEffects.playExplosionSound();
                gameOver();
            } else {
                // Dano: perde o último astronauta da barra, mas mantém a nave.
                soundEffects.playHitSound();
                createExplosion(
                    {
                        x: player.position.x + player.width / 2,
                        y: player.position.y + player.height / 2,
                    },
                    8,
                    "#4D9BE6"
                );
            }

            break;
        }
    }
};

const checkShootObstacles = () => {
    obstacles.forEach((obstacle) => {
        for (let i = playerProjectiles.length - 1; i >= 0; i -= 1) {
            if (obstacle.hit(playerProjectiles[i])) {
                playerProjectiles.splice(i, 1);
            }
        }

        for (let i = invadersProjectiles.length - 1; i >= 0; i -= 1) {
            if (obstacle.hit(invadersProjectiles[i])) {
                invadersProjectiles.splice(i, 1);
            }
        }
    });
};

const checkInvadersCollidedObstacles = () => {
    for (let i = obstacles.length - 1; i >= 0; i -= 1) {
        const collided = grid.invaders.some((invader) =>
            invader.collided(obstacles[i])
        );

        if (collided) {
            obstacles.splice(i, 1);
        }
    }
};

const checkPlayerCollidedInvaders = () => {
    // Colisão AABB: se algum invasor encostar na nave, é game over.
    const collided = grid.invaders.some(
        (invader) =>
            invader.position.x < player.position.x + player.width &&
            invader.position.x + invader.width > player.position.x &&
            invader.position.y + invader.height > player.position.y
    );

    if (collided) gameOver();
};

// Cria um astronauta caindo a partir do topo da tela.
const spawnAstronaut = (imagePath) => {
    astronauts.push(new Astronaut(imagePath, canvas.width));
};

const drawAstronauts = (dt) => {
    astronauts.forEach((astronaut) => {
        astronaut.draw(ctx);
        astronaut.update(dt);
    });
};

// Dispara a animação de transição de nave (anel + rajada de partículas).
const startUpgradeAnimation = () => {
    upgradeAnim.timer = upgradeAnim.duration;

    const center = {
        x: player.position.x + player.width / 2,
        y: player.position.y + player.height / 2,
    };

    createExplosion(center, 14, "#FFD700");
    createExplosion(center, 10, "#4D9BE6");
};

// Anéis de energia que se expandem em volta da nave durante a transição.
const drawUpgradeAnimation = (dt) => {
    if (upgradeAnim.timer <= 0) return;

    const p = upgradeAnim.timer / upgradeAnim.duration; // 1 -> 0
    const cx = player.position.x + player.width / 2;
    const cy = player.position.y + player.height / 2;
    const radius = player.width * 0.9 * (1 - p) + 6;

    ctx.save();
    ctx.globalAlpha = p;

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#4D9BE6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    upgradeAnim.timer -= dt;
};

// Resgate: encostar no astronauta evolui a nave; deixá-lo cair perde o upgrade.
const checkRescueAstronauts = () => {
    for (let i = astronauts.length - 1; i >= 0; i -= 1) {
        const astronaut = astronauts[i];

        if (astronaut.caughtBy(player)) {
            player.rescue();
            soundEffects.playNextLevelSound();
            startUpgradeAnimation();
            astronauts.splice(i, 1);
        } else if (astronaut.offScreen(canvas.height)) {
            astronauts.splice(i, 1);
        }
    }
};

const spawnGrid = () => {
    if (grid.invaders.length === 0) {
        // Fase que acabou de ser concluída (antes de incrementar).
        const completedLevel = gameData.level;

        // Concluiu a fase final: vitória.
        if (completedLevel >= FINAL_LEVEL) {
            win();
            return;
        }

        soundEffects.playNextLevelSound();

        incrementLevel();
        applyPhase(gameData.level);

        if (obstacles.length === 0) {
            initObstacles();
        }

        // Após a fase 2: primeiro astronauta. Após a fase 4: segundo astronauta.
        if (completedLevel === 2) spawnAstronaut(PATH_ASTRONAUT_1);
        if (completedLevel === 4) spawnAstronaut(PATH_ASTRONAUT_2);
    }
};

// Overlay simples mostrado quando o jogo está pausado.
const drawPauseOverlay = () => {
    ctx.save();

    // Escurece a cena congelada.
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = "#ffffff";
    ctx.font = "32px 'Press Start 2P', monospace";
    ctx.fillText("PAUSADO", cx, cy - 18);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.fillText("Pressione P para continuar", cx, cy + 34);

    ctx.restore();
};

// ===== Loop principal com delta time (independente da taxa de quadros) =====
let lastTime = 0;

const gameLoop = (time = 0) => {
    // dt = 1.0 a 60fps; clamp evita "saltos" ao voltar de outra aba.
    let dt = lastTime ? (time - lastTime) / 16.6667 : 1;
    dt = Math.min(dt, 4);
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pausa: redesenha a cena congelada (dt = 0 => nada se move) + overlay.
    if (currentState === GameState.PLAYING && isPaused) {
        drawStars(0);
        showGameData();
        drawProjectiles(0);
        drawParticles(0);
        drawObstacles();
        drawAstronauts(0);
        drawLives();
        grid.draw(ctx, 0);
        player.drawFlame(ctx, false, 0);
        player.draw(ctx, 0);
        drawPauseOverlay();

        requestAnimationFrame(gameLoop);
        return;
    }

    drawStars(dt);

    if (currentState === GameState.PLAYING) {
        showGameData();
        spawnGrid();

        // Disparo dos inimigos controlado pelo tempo (não por setInterval).
        // dt * 16.6667 = milissegundos decorridos neste quadro (já com clamp).
        enemyShootAccumulator += dt * 16.6667;
        if (enemyShootAccumulator >= enemyShootInterval()) {
            enemyShootAccumulator = 0;
            const invader = grid.getRandomInvader();
            if (invader) invader.shoot(invadersProjectiles);
        }

        drawProjectiles(dt);
        drawParticles(dt);
        drawObstacles();
        drawAstronauts(dt);
        drawLives();

        clearProjectiles();
        clearParticles();

        checkShootInvaders();
        checkShootPlayer();
        checkShootObstacles();
        checkInvadersCollidedObstacles();
        checkPlayerCollidedInvaders();
        checkRescueAstronauts();

        grid.draw(ctx, dt);
        grid.update(player.alive, dt);

        const thrusting = keys.left || keys.right;

        ctx.save();

        ctx.translate(
            player.position.x + player.width / 2,
            player.position.y + player.height / 2
        );

        if (keys.shoot.pressed && keys.shoot.released) {
            soundEffects.playShootSound();
            player.shoot(playerProjectiles);
            keys.shoot.released = false;
        }

        if (keys.left && player.position.x >= 0) {
            player.moveLeft(dt);
            ctx.rotate(-0.15);
        }

        if (keys.right && player.position.x <= canvas.width - player.width) {
            player.moveRight(dt);
            ctx.rotate(0.15);
        }

        ctx.translate(
            -player.position.x - player.width / 2,
            -player.position.y - player.height / 2
        );

        // Fogo da turbina (desenhado antes da nave para ficar "por baixo").
        player.drawFlame(ctx, thrusting, dt);
        player.draw(ctx, dt);
        ctx.restore();

        drawUpgradeAnimation(dt);
    }

    if (currentState === GameState.GAME_OVER) {
        checkShootObstacles();

        drawProjectiles(dt);
        drawParticles(dt);
        drawObstacles();

        clearProjectiles();
        clearParticles();

        grid.draw(ctx, dt);
        grid.update(player.alive, dt);
    }

    if (currentState === GameState.WIN) {
        // Fogos de artifício de comemoração.
        winFireworkTimer += dt;
        if (winFireworkTimer >= 22) {
            winFireworkTimer = 0;
            createFirework({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.6 + 40,
            });
        }

        drawParticles(dt);
        clearParticles();
    }

    requestAnimationFrame(gameLoop);
};

const startPlaying = () => {
    currentState = GameState.PLAYING;
    enemyShootAccumulator = 0;
    isPaused = false;
};

const restartGame = () => {
    player.alive = true;
    player.reset();

    astronauts.length = 0;
    playerProjectiles.length = 0;
    invadersProjectiles.length = 0;
    particles.length = 0;
    obstacles.length = 0;
    initObstacles();

    gameData.score = 0;
    gameData.level = 1;
    applyPhase(1); // reconstrói a formação na configuração da fase 1.

    winFireworkTimer = 0;
    upgradeAnim.timer = 0;

    gameOverScreen.remove();
    winScreen.remove();
    rankingScreen.remove();

    startPlaying();
};

// ===== Entrada por teclado =====
addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "a" || key === "arrowleft") keys.left = true;
    if (key === "d" || key === "arrowright") keys.right = true;
    if (key === " ") keys.shoot.pressed = true;

    // Pausa/despausa (só durante a partida; ignora o auto-repeat da tecla).
    if (key === "p" && !event.repeat && currentState === GameState.PLAYING) {
        isPaused = !isPaused;
    }
});

addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if (key === "a" || key === "arrowleft") keys.left = false;
    if (key === "d" || key === "arrowright") keys.right = false;
    if (key === " ") {
        keys.shoot.pressed = false;
        keys.shoot.released = true;
    }
});

// ===== Redimensionamento da janela =====
addEventListener("resize", () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.imageSmoothingEnabled = false; // resetado ao mudar o tamanho do canvas.

    // Mantém a nave dentro da tela e ancorada à base.
    player.position.y = canvas.height - player.height - 30;
    player.position.x = Math.min(
        Math.max(player.position.x, 0),
        canvas.width - player.width
    );

    grid.canvasWidth = canvas.width;

    stars.forEach((star) => {
        star.canvasWidth = canvas.width;
        star.canvasHeight = canvas.height;
    });
});

// ===== Botões de tela =====
buttonPlay.addEventListener("click", () => {
    startScreen.remove();
    scoreUi.style.display = "block";
    startPlaying();
});

buttonRestart.addEventListener("click", restartGame);
buttonRestartWin.addEventListener("click", restartGame);
buttonRestartRanking.addEventListener("click", restartGame);
buttonRanking.addEventListener("click", showLossRanking);

// Inicialização.
gameData.high = getHighScore();
generateStars();
requestAnimationFrame(gameLoop);
