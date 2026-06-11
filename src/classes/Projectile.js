// Estilos de disparo. "default" = retângulo branco simples (naves 1/2 e
// inimigos 1/2/3). Os estilizados desenham um "raio neon" simples: um brilho
// (glow) via sombra colorida mais um núcleo claro, alinhado à direção.
const PROJECTILE_STYLES = {
    plasma: {
        glow: "rgba(77, 155, 230, 0.55)", // azul (ship_3)
        mid: "rgba(150, 210, 255, 0.9)",
        core: "#ffffff",
    },
    alien: {
        glow: "rgba(0, 230, 118, 0.55)", // verde (enemy_4 / disco voador)
        mid: "rgba(150, 255, 140, 0.9)",
        core: "#eaffea",
    },
};

class Projectile {
    constructor(position, velocity, velocityX = 0, style = "default") {
        this.position = position;
        this.width = 2;
        this.height = 20;
        this.velocity = velocity;
        this.velocityX = velocityX;

        this.style = style;
        this.styleConfig = PROJECTILE_STYLES[style] ?? null;

        // Fase de pulsação (animação) com início aleatório.
        this.pulse = Math.random() * Math.PI * 2;
    }

    draw(ctx) {
        // Disparo padrão: retângulo branco (comportamento original).
        if (!this.styleConfig) {
            ctx.fillStyle = "white";
            ctx.fillRect(
                this.position.x,
                this.position.y,
                this.width,
                this.height
            );
            return;
        }

        const cfg = this.styleConfig;
        const cx = this.position.x + this.width / 2;
        const cy = this.position.y + this.height / 2;

        // Pulso suave de tamanho para o disparo parecer "vivo".
        const pulse = 1 + 0.12 * Math.sin(this.pulse);
        const halfW = 3 * pulse;
        const halfH = 9 * pulse;

        ctx.save();
        ctx.translate(cx, cy);
        // Alinha o eixo do raio com a direção do movimento.
        ctx.rotate(Math.atan2(this.velocityX, this.velocity));

        // Brilho neon: uma única forma com sombra colorida (glow simples).
        ctx.shadowColor = cfg.glow;
        ctx.shadowBlur = 10;
        ctx.fillStyle = cfg.mid;
        this.blob(ctx, halfW, halfH);

        // Núcleo claro por cima, sem reforçar o brilho.
        ctx.shadowBlur = 0;
        ctx.fillStyle = cfg.core;
        this.blob(ctx, halfW * 0.5, halfH * 0.66);

        ctx.restore();
    }

    // Elipse alongada centrada na origem (já transladada/rotacionada).
    blob(ctx, halfW, halfH) {
        ctx.beginPath();
        ctx.ellipse(0, 0, halfW, halfH, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // dt = fator de tempo normalizado (1.0 equivale a um quadro a 60fps).
    update(dt = 1) {
        this.position.y += this.velocity * dt;
        this.position.x += this.velocityX * dt;
        this.pulse += 0.3 * dt;
    }
}

export default Projectile;
