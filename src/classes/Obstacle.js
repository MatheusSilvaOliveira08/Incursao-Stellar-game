class Obstacle {
    constructor(position, width, height, color) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
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
}

export default Obstacle;
