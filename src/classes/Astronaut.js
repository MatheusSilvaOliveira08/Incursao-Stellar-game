class Astronaut {
    constructor(imagePath, canvasWidth) {
        this.width = 50;
        this.height = 58;

        this.position = {
            x: Math.random() * (canvasWidth - this.width),
            y: -this.height,
        };

        this.velocity = 2.2;
        this.image = this.getImage(imagePath);
    }

    getImage(path) {
        const image = new Image();
        image.src = path;
        return image;
    }

    draw(ctx) {
        ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.width,
            this.height
        );
    }

    update(dt = 1) {
        this.position.y += this.velocity * dt;
    }

    // Colisão (AABB) com o jogador: indica que o astronauta foi resgatado.
    caughtBy(player) {
        return (
            this.position.x < player.position.x + player.width &&
            this.position.x + this.width > player.position.x &&
            this.position.y < player.position.y + player.height &&
            this.position.y + this.height > player.position.y
        );
    }

    // Saiu pela parte de baixo da tela: resgate perdido.
    offScreen(canvasHeight) {
        return this.position.y > canvasHeight;
    }
}

export default Astronaut;
