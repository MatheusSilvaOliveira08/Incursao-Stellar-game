import {
    PATH_SHIP_1,
    PATH_SHIP_2,
    PATH_SHIP_3,
    SHIP_VELOCITIES,
} from "../utils/constants.js";

import Projectile from "./Projectile.js";

class Player {
    constructor(canvasWidth, canvasHeight) {
        this.alive = true;
        this.width = 80;
        this.height = 80;

        // Nível da nave: 1 (inicial), 2 ou 3.
        this.shipLevel = 1;
        this.maxShipLevel = 3;
        this.velocity = SHIP_VELOCITIES[this.shipLevel];

        // Vida total = 1 (piloto-base) + astronautas resgatados ativos.
        // O número de ícones mostrados na barra é (lives - 1).
        this.lives = 1;
        this.maxLives = 3;

        // Animação de transição ao trocar de nave (em frames).
        this.upgradeDuration = 30;
        this.upgradeTimer = 0;

        // Fase da animação do fogo da turbina.
        this.flameTime = 0;

        this.position = {
            x: canvasWidth / 2 - this.width / 2,
            y: canvasHeight - this.height - 30,
        };

        // Índice 0 => nave 1, 1 => nave 2, 2 => nave 3.
        this.shipImages = [
            this.getImage(PATH_SHIP_1),
            this.getImage(PATH_SHIP_2),
            this.getImage(PATH_SHIP_3),
        ];
    }

    // Imagem da nave atual de acordo com o nível.
    get image() {
        return this.shipImages[this.shipLevel - 1];
    }

    // Evolui para a próxima nave (chamado ao resgatar um astronauta).
    upgrade() {
        if (this.shipLevel < this.maxShipLevel) {
            this.shipLevel += 1;
            this.velocity = SHIP_VELOCITIES[this.shipLevel];
            this.upgradeTimer = this.upgradeDuration;
        }
    }

    // Resgate de astronauta: sobe de nave e ganha um ponto de vida.
    rescue() {
        this.upgrade();
        this.lives = Math.min(this.lives + 1, this.maxLives);
    }

    // Recebe dano. Retorna true se o jogador foi destruído.
    takeDamage() {
        this.lives -= 1;
        return this.lives <= 0;
    }

    // Volta para a nave inicial (usado ao reiniciar o jogo).
    reset() {
        this.shipLevel = 1;
        this.velocity = SHIP_VELOCITIES[this.shipLevel];
        this.lives = 1;
        this.upgradeTimer = 0;
    }

    moveLeft(dt = 1) {
        this.position.x -= this.velocity * dt;
    }

    moveRight(dt = 1) {
        this.position.x += this.velocity * dt;
    }

    getImage(path) {
        const image = new Image();
        image.src = path;
        return image;
    }

    // Fogo da turbina: dois jatos (núcleo claro + halo alaranjado) que
    // tremulam continuamente. "thrust" deixa a chama mais longa ao acelerar.
    drawFlame(ctx, thrust = false, dt = 1) {
        if (!this.alive) return;

        this.flameTime += dt;

        const cx = this.position.x + this.width / 2;
        // Base do fogo: logo abaixo do corpo da nave.
        const baseY = this.position.y + this.height - 12;

        // Tremulação: combinação de duas senoides + ruído para parecer natural.
        const flicker =
            0.5 +
            0.3 * Math.sin(this.flameTime * 0.4) +
            0.2 * Math.sin(this.flameTime * 0.93) +
            Math.random() * 0.15;

        const thrustBoost = thrust ? 10 : 0;

        // A nave 1 é mais lenta: fogo menor que o das naves 2 e 3.
        const sizeFactor = this.shipLevel === 1 ? 0.62 : 1;

        const length = (16 + flicker * 14 + thrustBoost) * sizeFactor;
        const halfWidth = (8 + flicker * 2) * sizeFactor;

        ctx.save();

        // Halo externo (laranja, levemente transparente).
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#ff7a18";
        this.flameShape(ctx, cx, baseY, halfWidth, length);

        // Camada média (amarelo).
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "#ffd24d";
        this.flameShape(ctx, cx, baseY, halfWidth * 0.62, length * 0.78);

        // Núcleo (quase branco/azulado).
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff4c2";
        this.flameShape(ctx, cx, baseY, halfWidth * 0.32, length * 0.5);

        ctx.restore();
    }

    // Desenha uma "gota" de chama apontando para baixo (base larga, ponta fina).
    flameShape(ctx, cx, baseY, halfWidth, length) {
        ctx.beginPath();
        ctx.moveTo(cx - halfWidth, baseY);
        ctx.quadraticCurveTo(cx, baseY + length * 0.5, cx, baseY + length);
        ctx.quadraticCurveTo(cx, baseY + length * 0.5, cx + halfWidth, baseY);
        ctx.closePath();
        ctx.fill();
    }

    draw(ctx, dt = 1) {
        let scale = 1;

        if (this.upgradeTimer > 0) {
            // Vai de 1 -> 0 ao longo da animação; o seno cria um "pulo".
            const p = this.upgradeTimer / this.upgradeDuration;
            scale = 1 + 0.35 * Math.sin(p * Math.PI);
        }

        const w = this.width * scale;
        const h = this.height * scale;
        const dx = this.position.x - (w - this.width) / 2;
        const dy = this.position.y - (h - this.height) / 2;

        ctx.drawImage(this.image, dx, dy, w, h);

        if (this.upgradeTimer > 0) this.upgradeTimer -= dt;
    }

    shoot(projectiles) {
        const origin = {
            x: this.position.x + this.width / 2 - 2,
            y: this.position.y + 2,
        };

        // Nave 3: o tiro se divide em dois, abrindo em "V" (plasma azul).
        if (this.shipLevel === 3) {
            projectiles.push(
                new Projectile({ x: origin.x, y: origin.y }, -10, -2.2, "plasma")
            );
            projectiles.push(
                new Projectile({ x: origin.x, y: origin.y }, -10, 2.2, "plasma")
            );
            return;
        }

        // Naves 1 e 2: tiro simples.
        projectiles.push(new Projectile({ x: origin.x, y: origin.y }, -10));
    }

    // Colisão AABB com uma "hitbox" interna (mais perdoável que o sprite).
    hit(projectile) {
        const padX = 24;
        const padTop = 18;
        const padBottom = 14;

        const boxX = this.position.x + padX;
        const boxY = this.position.y + padTop;
        const boxW = this.width - padX * 2;
        const boxH = this.height - padTop - padBottom;

        return (
            projectile.position.x < boxX + boxW &&
            projectile.position.x + projectile.width > boxX &&
            projectile.position.y < boxY + boxH &&
            projectile.position.y + projectile.height > boxY
        );
    }
}

export default Player;
