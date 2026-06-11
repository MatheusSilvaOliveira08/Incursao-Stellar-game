class Particle {
    constructor(position, velocity, radius, color) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.opacity = 1;
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.globalAlpha = this.opacity;
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    update(dt = 1) {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        this.opacity = Math.max(0, this.opacity - 0.008 * dt);
    }
}

export default Particle;
