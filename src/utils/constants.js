// Naves do jogador (evoluções)
export const PATH_SHIP_1 = "src/assets/images/ship_1.png";
export const PATH_SHIP_2 = "src/assets/images/ship_2.png";
export const PATH_SHIP_3 = "src/assets/images/ship_3.png";

// Astronautas resgatáveis
export const PATH_ASTRONAUT_1 = "src/assets/images/astronaut_1.png";
export const PATH_ASTRONAUT_2 = "src/assets/images/astronaut_2.png";

// Ícone usado na barra de vida (canto superior da tela)
export const PATH_ASTRONAUT_ICON = "src/assets/images/astronaut_icon.png";

// Inimigos
export const PATH_ENEMY_1 = "src/assets/images/enemy_1.png";
export const PATH_ENEMY_2 = "src/assets/images/enemy_2.png";
export const PATH_ENEMY_3 = "src/assets/images/enemy_3.png";
export const PATH_ENEMY_4 = "src/assets/images/enemy_4.png";

// Velocidade horizontal de cada nave (indexada pelo nível da nave: 1, 2 ou 3)
export const SHIP_VELOCITIES = {
    1: 6,
    2: 10,
    3: 10,
};

// Definição de cada tipo de inimigo.
// pattern: "single" = tiro reto simples; "spread" = tiro em leque (3 projéteis).
// health: quantos tiros são necessários para destruir.
export const ENEMY_TYPES = {
    1: { image: PATH_ENEMY_1, width: 56, height: 32, health: 1, velocity: 1.0, pattern: "single" },
    2: { image: PATH_ENEMY_2, width: 56, height: 33, health: 1, velocity: 1.5, pattern: "single" },
    3: { image: PATH_ENEMY_3, width: 59, height: 31, health: 1, velocity: 1.3, pattern: "spread" },
    4: { image: PATH_ENEMY_4, width: 61, height: 41, health: 2, velocity: 2.2, pattern: "spread" },
};

// Configuração de cada fase: qual inimigo e quantos (linhas x colunas).
export const PHASES = {
    1: { type: 1, rows: 2, cols: 5 }, // inimigo 1
    2: { type: 1, rows: 3, cols: 6 }, // inimigo 1 (mais que a fase 1)
    3: { type: 2, rows: 2, cols: 6 }, // inimigo 2 (mais rápido)
    4: { type: 2, rows: 3, cols: 7 }, // inimigo 2 (mais que a fase 3)
    5: { type: 3, rows: 1, cols: 4 }, // inimigo 3 (poucos; tiro em leque)
    6: { type: 3, rows: 1, cols: 6 }, // inimigo 3
    7: { type: 4, rows: 1, cols: 3 }, // inimigo 4 (3 unidades, 2 vidas cada)
    8: { type: 4, rows: 1, cols: 4 }, // fase final (inimigo 4)
};

// Última fase definida.
export const MAX_PHASE = 8;

// Concluir esta fase vence o jogo.
export const FINAL_LEVEL = 8;

export const getPhaseConfig = (level) => {
    const clamped = Math.min(Math.max(level, 1), MAX_PHASE);
    return PHASES[clamped];
};

export const NUMBER_STARS = 100;

export const GameState = {
    START: "start",
    PLAYING: "playing",
    GAME_OVER: "gameOver",
    WIN: "win",
};
