import Invader from "./Invader.js";
import { ENEMY_TYPES } from "../utils/constants.js";

class Grid {
    constructor(type, rows, cols, canvasWidth) {
        this.type = type;
        this.rows = rows;
        this.cols = cols;
        this.canvasWidth = canvasWidth;
        this.direction = "right";
        this.moveDown = false;
        this.boost = 0.1;

        // A velocidade base vem do tipo de inimigo (ENEMY_TYPES).
        this.invadersVelocity = ENEMY_TYPES[type].velocity;

        this.invaders = this.init();
    }

    init() {
        const array = [];
        const cfg = ENEMY_TYPES[this.type];

        // Espaçamento derivado do tamanho do sprite (evita sobreposição).
        const spacingX = cfg.width + 14;
        const spacingY = cfg.height + 12;

        // Centraliza a formação horizontalmente no canvas.
        const totalWidth = this.cols * spacingX - 14;
        const startX = Math.max(20, (this.canvasWidth - totalWidth) / 2);
        const startY = 82;

        for (let row = 0; row < this.rows; row += 1) {
            for (let col = 0; col < this.cols; col += 1) {
                const invader = new Invader(
                    {
                        x: startX + col * spacingX,
                        y: startY + row * spacingY,
                    },
                    this.invadersVelocity,
                    this.type
                );

                array.push(invader);
            }
        }

        return array;
    }

    draw(ctx, dt = 1) {
        this.invaders.forEach((invader) => invader.draw(ctx, dt));
    }

    update(playerStatus, dt = 1) {
        if (this.reachedRightBoundary()) {
            this.direction = "left";
            this.moveDown = true;
        } else if (this.reachedLeftBoundary()) {
            this.direction = "right";
            this.moveDown = true;
        }

        if (!playerStatus) this.moveDown = false;

        this.invaders.forEach((invader) => {
            if (this.moveDown) {
                invader.moveDown();
                invader.incrementVelocity(this.boost);
                this.invadersVelocity = invader.velocity;
            }

            if (this.direction === "right") invader.moveRight(dt);
            if (this.direction === "left") invader.moveLeft(dt);
        });

        this.moveDown = false;
    }

    reachedRightBoundary() {
        return this.invaders.some(
            (invader) => invader.position.x + invader.width >= this.canvasWidth
        );
    }

    reachedLeftBoundary() {
        return this.invaders.some((invader) => invader.position.x <= 0);
    }

    getRandomInvader() {
        const index = Math.floor(Math.random() * this.invaders.length);
        return this.invaders[index];
    }

    // Reconstrói a formação usando a configuração atual (type/rows/cols).
    // A velocidade volta para a base do tipo de inimigo da fase.
    restart() {
        this.invadersVelocity = ENEMY_TYPES[this.type].velocity;
        this.invaders = this.init();
        this.direction = "right";
        this.moveDown = false;
    }
}

export default Grid;
