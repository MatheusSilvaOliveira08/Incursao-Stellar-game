import { ENEMY_TYPES } from "../utils/constants.js";
import Projectile from "./Projectile.js";

class Invader {
    constructor(position, velocity, type = 1) {
        const config = ENEMY_TYPES[type];

        this.type = type;
        this.position = position;
        this.velocity = velocity;

        this.width = config.width;
        this.height = config.height;
        this.pattern = config.pattern;

        this.maxHealth = config.health;
        this.health = config.health;

        // Inimigos com disparo em "V" (leque) exibem um indicador simples.
        this.hasSpreadFire = this.pattern === "spread";
        this.pulseTime = Math.random() * 10; // fase inicial variada.

        this.image = this.getImage(config.image);
    }

    moveRight(dt = 1) {
        this.position.x += this.velocity * dt;
    }

    moveLeft(dt = 1) {
        this.position.x -= this.velocity * dt;
    }

    // Descida em degrau fixo (não depende do dt: é um passo discreto).
    moveDown() {
        this.position.y += this.height;
    }

    incrementVelocity(boost) {
        this.velocity += boost;
    }

    getImage(path) {
        const image = new Image();
        image.src = path;
        return image;
    }

    draw(ctx, dt = 1) {
        // Indicador do disparo em "V" (inimigos 3 e 4): desenhado antes do
        // sprite, logo abaixo da base, para o sprite ficar por cima.
        if (this.hasSpreadFire) this.drawSpreadIndicator(ctx, dt);

        ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.width,
            this.height
        );
    }

    // Animação simples: um pequeno chevron (V) que pulsa abaixo do sprite,
    // sinalizando o disparo em leque. Uma única forma e um único pulso de
    // opacidade — sem camadas nem flicker aleatório.
    drawSpreadIndicator(ctx, dt) {
        this.pulseTime += dt;

        const cx = this.position.x + this.width / 2;
        const baseY = this.position.y + this.height - 2;

        const pulse = 0.55 + 0.3 * Math.sin(this.pulseTime * 0.15);
        const size = 7;

        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = "#ff7a18";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(cx - size, baseY);
        ctx.lineTo(cx, baseY + size);
        ctx.lineTo(cx + size, baseY);
        ctx.stroke();
        ctx.restore();
    }

    shoot(projectiles) {
        const originX = this.position.x + this.width / 2 - 2;
        const originY = this.position.y + this.height;

        // Tiro em leque (inimigos 3 e 4): um reto e dois diagonais.
        // O inimigo 4 usa o disparo estilizado (plasma verde).
        if (this.pattern === "spread") {
            const style = this.type === 4 ? "alien" : "default";
            projectiles.push(
                new Projectile({ x: originX, y: originY }, 9, -3, style)
            );
            projectiles.push(
                new Projectile({ x: originX, y: originY }, 9, 0, style)
            );
            projectiles.push(
                new Projectile({ x: originX, y: originY }, 9, 3, style)
            );
            return;
        }

        // Tiro simples (inimigos 1 e 2).
        projectiles.push(new Projectile({ x: originX, y: originY }, 10, 0));
    }

    // Retorna true se o invasor foi destruído nesse acerto.
    takeDamage() {
        this.health -= 1;
        return this.health <= 0;
    }

    // Colisão AABB (caixa contra caixa) com um projétil.
    hit(projectile) {
        return (
            projectile.position.x < this.position.x + this.width &&
            projectile.position.x + projectile.width > this.position.x &&
            projectile.position.y < this.position.y + this.height &&
            projectile.position.y + projectile.height > this.position.y
        );
    }

    // Colisão AABB com um obstáculo.
    collided(obstacle) {
        return (
            obstacle.position.x < this.position.x + this.width &&
            obstacle.position.x + obstacle.width > this.position.x &&
            obstacle.position.y < this.position.y + this.height &&
            obstacle.position.y + obstacle.height > this.position.y
        );
    }
}

export default Invader;
