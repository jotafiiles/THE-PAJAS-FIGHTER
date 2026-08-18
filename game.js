// Pixel Fighter - Juego de peleas estilo MUGEN
// Sistema de carga de personajes desde carpetas con sprites PNG

class SpriteLoader {
    constructor() {
        this.sprites = {};
    }

    // Carga todos los sprites de una carpeta de personaje
    async loadCharacter(characterPath, characterName) {
        const spriteFiles = [
            'idle', 'walk', 'run', 'jump', 'crouch',
            'punch_light', 'punch_heavy', 'kick_light', 'kick_heavy',
            'hit', 'knockdown', 'victory'
        ];

        for (const spriteName of spriteFiles) {
            try {
                const img = new Image();
                img.src = `${characterPath}/${spriteName}.png`;
                
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => {
                        console.log(`Sprite no encontrado: ${spriteName}.png (usando placeholder)`);
                        resolve(); // Continuar sin este sprite
                    };
                });

                this.sprites[`${characterName}_${spriteName}`] = img;
            } catch (error) {
                console.log(`Error cargando ${spriteName}:`, error);
            }
        }

        return this.sprites;
    }

    // Obtener sprite por nombre
    getSprite(name) {
        return this.sprites[name] || null;
    }
}

class Fighter {
    constructor({ position, velocity, color, name, characterPath, offset = { x: 0, y: 0 } }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 50;
        this.height = 150;
        this.lastKey = '';
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: offset,
            width: 100,
            height: 50
        };
        this.color = color;
        this.name = name;
        this.health = 100;
        this.isAttacking = false;
        this.isHit = false;
        this.isDead = false;
        this.facingRight = true;
        this.currentAction = 'idle';
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameSpeed = 100; // ms por frame
        
        // Sistema de sprites
        this.spriteLoader = new SpriteLoader();
        this.sprites = {};
        this.usingSprites = false;
        
        // Estados
        this.isGrounded = true;
        this.isCrouching = false;
        this.attackCooldown = 0;
        
        // Cargar sprites si hay ruta
        if (characterPath) {
            this.loadSprites(characterPath);
        }
    }

    async loadSprites(characterPath) {
        const spriteNames = [
            'idle', 'walk', 'run', 'jump', 'crouch',
            'punch_light', 'punch_heavy', 'kick_light', 'kick_heavy',
            'hit', 'knockdown', 'victory'
        ];

        for (const name of spriteNames) {
            const img = new Image();
            img.src = `${characterPath}/${name}.png`;
            
            await new Promise((resolve) => {
                img.onload = () => {
                    this.sprites[name] = img;
                    this.usingSprites = true;
                    resolve();
                };
                img.onerror = () => {
                    resolve(); // Continuar sin este sprite
                };
            });
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Dibujar sprite o rectángulo placeholder
        if (this.usingSprites && this.sprites[this.currentAction]) {
            const sprite = this.sprites[this.currentAction];
            const drawWidth = this.facingRight ? this.width : -this.width;
            
            ctx.translate(
                this.position.x + (this.facingRight ? 0 : this.width),
                this.position.y
            );
            
            if (!this.facingRight) {
                ctx.scale(-1, 1);
            }
            
            ctx.drawImage(sprite, 0, 0, this.width, this.height);
        } else {
            // Placeholder pixel art style
            ctx.fillStyle = this.color;
            
            // Cuerpo principal
            const drawHeight = this.isCrouching ? this.height * 0.6 : this.height;
            const drawY = this.isCrouching ? this.position.y + this.height * 0.4 : this.position.y;
            
            // Efecto pixelado
            const pixelSize = 4;
            for (let y = 0; y < drawHeight; y += pixelSize) {
                for (let x = 0; x < this.width; x += pixelSize) {
                    const shade = ((x + y) / pixelSize) % 2 === 0 ? 1 : 0.8;
                    ctx.fillStyle = `rgba(${parseInt(this.color.slice(1, 3), 16) * shade}, ${parseInt(this.color.slice(3, 5), 16) * shade}, ${parseInt(this.color.slice(5, 7), 16) * shade}, 1)`;
                    ctx.fillRect(
                        this.position.x + x,
                        drawY + y,
                        pixelSize - 1,
                        pixelSize - 1
                    );
                }
            }
            
            // Ojos para indicar dirección
            ctx.fillStyle = '#fff';
            const eyeX = this.facingRight ? this.position.x + this.width - 15 : this.position.x + 5;
            ctx.fillRect(eyeX, drawY + 20, 10, 10);
        }

        // Debug: Attack box
        // if (this.isAttacking) {
        //     ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        //     ctx.fillRect(
        //         this.attackBox.position.x,
        //         this.attackBox.position.y,
        //         this.attackBox.width,
        //         this.attackBox.height
        //     );
        // }

        ctx.restore();
    }

    update(canvasHeight) {
        this.draw(ctx => {}); // Dummy draw para actualizar posición
        
        // Gravedad
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;

        // Límites del canvas
        if (this.position.y + this.height + this.velocity.y >= canvasHeight - 50) {
            this.velocity.y = 0;
            this.position.y = canvasHeight - 50 - this.height;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Límites laterales
        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x + this.width > 1024) this.position.x = 1024 - this.width;

        // Actualizar attack box
        this.attackBox.position.x = this.facingRight 
            ? this.position.x + this.attackBox.offset.x 
            : this.position.x - this.attackBox.width + this.width - this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

        // Cooldown de ataque
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        // Timer de animación
        this.frameTimer += 16; // ~60fps
        if (this.frameTimer >= this.frameSpeed) {
            this.frameTimer = 0;
            this.frameIndex++;
        }
    }

    attack(type = 'light') {
        if (this.attackCooldown > 0 || this.isHit || this.isDead) return;
        
        this.isAttacking = true;
        this.attackCooldown = type === 'light' ? 20 : 30;
        this.currentAction = type === 'light' ? 'punch_light' : 'punch_heavy';
        
        setTimeout(() => {
            this.isAttacking = false;
            this.currentAction = 'idle';
        }, 100);
    }

    takeHit(damage) {
        if (this.isDead) return;
        
        this.health -= damage;
        this.isHit = true;
        this.currentAction = 'hit';
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.currentAction = 'knockdown';
        }
        
        setTimeout(() => {
            if (!this.isDead) {
                this.isHit = false;
                this.currentAction = 'idle';
            }
        }, 300);
    }

    setAction(action) {
        if (this.sprites[action] || ['idle', 'walk', 'run', 'jump', 'crouch', 
            'punch_light', 'punch_heavy', 'kick_light', 'kick_heavy', 
            'hit', 'knockdown', 'victory'].includes(action)) {
            this.currentAction = action;
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gravity = 0.7;
        this.keys = {};
        this.gameRunning = true;
        this.timer = 60;
        this.timerId = null;
        
        this.player1 = null;
        this.player2 = null;
        
        this.init();
    }

    init() {
        // Crear jugadores con soporte para sprites personalizados
        this.player1 = new Fighter({
            position: { x: 100, y: 0 },
            velocity: { x: 0, y: 0 },
            color: '#ff4444',
            name: 'Jugador 1',
            characterPath: 'characters/player1/', // Carpeta para sprites
            offset: { x: 0, y: 0 }
        });

        this.player2 = new Fighter({
            position: { x: 874, y: 0 },
            velocity: { x: 0, y: 0 },
            color: '#4444ff',
            name: 'Jugador 2',
            characterPath: 'characters/player2/', // Carpeta para sprites
            offset: { x: 0, y: 0 }
        });

        // Invertir dirección del jugador 2
        this.player2.facingRight = false;

        this.setupControls();
        this.startTimer();
        this.animate();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.key] = true; // Para flechas
            
            // Jugador 1
            if (e.key.toLowerCase() === 'f') {
                this.player1.attack('light');
            }
            if (e.key.toLowerCase() === 'g') {
                this.player1.attack('heavy');
            }

            // Jugador 2
            if (e.key.toLowerCase() === 'k') {
                this.player2.attack('light');
            }
            if (e.key.toLowerCase() === 'l') {
                this.player2.attack('heavy');
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.key] = false;
        });
    }

    handlePlayerInput(player, keys, isPlayer2 = false) {
        if (player.isHit || player.isDead) return;

        player.velocity.x = 0;
        
        const left = isPlayer2 ? keys['ArrowLeft'] : keys['a'];
        const right = isPlayer2 ? keys['ArrowRight'] : keys['d'];
        const up = isPlayer2 ? keys['ArrowUp'] : keys['w'];
        const down = isPlayer2 ? keys['ArrowDown'] : keys['s'];

        // Movimiento lateral
        if (left && !right) {
            player.velocity.x = -5;
            player.facingRight = false;
            player.setAction(player.isGrounded ? 'walk' : 'jump');
        } else if (right && !left) {
            player.velocity.x = 5;
            player.facingRight = true;
            player.setAction(player.isGrounded ? 'walk' : 'jump');
        } else {
            player.setAction(player.isGrounded ? 'idle' : 'jump');
        }

        // Salto
        if (up && player.isGrounded) {
            player.velocity.y = -15;
            player.setAction('jump');
        }

        // Agacharse
        if (down && player.isGrounded) {
            player.isCrouching = true;
            player.setAction('crouch');
        } else {
            player.isCrouching = false;
        }
    }

    checkCollision(attacker, defender) {
        if (!attacker.isAttacking) return false;

        const attackBox = {
            x: attacker.facingRight 
                ? attacker.position.x + attacker.attackBox.offset.x 
                : attacker.position.x - attacker.attackBox.width + attacker.width - attacker.attackBox.offset.x,
            y: attacker.position.y + attacker.attackBox.offset.y,
            width: attacker.attackBox.width,
            height: attacker.attackBox.height
        };

        const defenderBox = {
            x: defender.position.x,
            y: defender.position.y,
            width: defender.width,
            height: defender.isCrouching ? defender.height * 0.6 : defender.height
        };

        return (
            attackBox.x < defenderBox.x + defenderBox.width &&
            attackBox.x + attackBox.width > defenderBox.x &&
            attackBox.y < defenderBox.y + defenderBox.height &&
            attackBox.y + attackBox.height > defenderBox.y
        );
    }

    startTimer() {
        this.timerId = setInterval(() => {
            if (this.timer > 0 && this.gameRunning) {
                this.timer--;
                document.getElementById('timer').textContent = this.timer;
            }

            if (this.timer === 0) {
                this.determineWinner();
            }
        }, 1000);
    }

    determineWinner() {
        this.gameRunning = false;
        clearInterval(this.timerId);

        let message = '';
        if (this.player1.health === this.player2.health) {
            message = '¡EMPATE!';
        } else if (this.player1.health > this.player2.health) {
            message = '¡JUGADOR 1 GANA!';
        } else {
            message = '¡JUGADOR 2 GANA!';
        }

        const msgElement = document.getElementById('message');
        msgElement.textContent = message;
        msgElement.style.display = 'block';

        setTimeout(() => {
            location.reload();
        }, 3000);
    }

    updateHealthBars() {
        const p1Health = document.querySelector('#p1-health .health-fill');
        const p2Health = document.querySelector('#p2-health .health-fill');
        const p1Damage = document.querySelector('#p1-health .health-damage');
        const p2Damage = document.querySelector('#p2-health .health-damage');

        p1Health.style.width = this.player1.health + '%';
        p2Health.style.width = this.player2.health + '%';
        
        // Efecto de daño retardado
        setTimeout(() => {
            p1Damage.style.width = this.player1.health + '%';
            p2Damage.style.width = this.player2.health + '%';
        }, 100);
    }

    animate() {
        if (!this.gameRunning) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        requestAnimationFrame(() => this.animate());
        
        // Limpiar canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar fondo con gradiente
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2a2a4a');
        gradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar suelo
        this.ctx.fillStyle = '#3a3a5a';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Patrón de cuadrícula en el suelo
        this.ctx.strokeStyle = '#4a4a6a';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.canvas.height - 50);
            this.ctx.lineTo(i - 100, this.canvas.height);
            this.ctx.stroke();
        }

        // Manejar inputs
        this.handlePlayerInput(this.player1, this.keys, false);
        this.handlePlayerInput(this.player2, this.keys, true);

        // Actualizar jugadores
        this.player1.update(this.canvas.height);
        this.player2.update(this.canvas.height);

        // Aplicar gravedad
        this.player1.velocity.y += this.gravity;
        this.player2.velocity.y += this.gravity;

        // Verificar colisiones de ataques
        if (this.checkCollision(this.player1, this.player2)) {
            this.player1.isAttacking = false;
            const damage = this.player1.currentAction === 'punch_heavy' ? 15 : 10;
            this.player2.takeHit(damage);
            this.updateHealthBars();
        }

        if (this.checkCollision(this.player2, this.player1)) {
            this.player2.isAttacking = false;
            const damage = this.player2.currentAction === 'punch_heavy' ? 15 : 10;
            this.player1.takeHit(damage);
            this.updateHealthBars();
        }

        // Verificar muerte
        if (this.player1.isDead || this.player2.isDead) {
            this.determineWinner();
        }

        // Dibujar jugadores
        this.player1.draw(this.ctx);
        this.player2.draw(this.ctx);
    }
}

// Iniciar juego cuando cargue la página
window.addEventListener('load', () => {
    const game = new Game();
    
    // Hacer game accesible globalmente para debugging
    window.game = game;
});

// Instrucciones para cargar personajes personalizados
console.log(`
╔═══════════════════════════════════════════════════════════╗
║           PIXEL FIGHTER - Carga de Personajes             ║
╠═══════════════════════════════════════════════════════════╣
║ Para agregar personajes personalizados:                   ║
║                                                           ║
║ 1. Crea una carpeta: characters/player1/                  ║
║ 2. Agrega archivos PNG con estos nombres:                 ║
║    - idle.png (posición neutral)                          ║
║    - walk.png (caminando)                                 ║
║    - run.png (corriendo)                                  ║
║    - jump.png (saltando)                                  ║
║    - crouch.png (agachado)                                ║
║    - punch_light.png (golpe ligero)                       ║
║    - punch_heavy.png (golpe fuerte)                       ║
║    - kick_light.png (patada ligera)                       ║
║    - kick_heavy.png (patada fuerte)                       ║
║    - hit.png (recibiendo golpe)                           ║
║    - knockdown.png (derrotado)                            ║
║    - victory.png (victoria)                               ║
║                                                           ║
║ 3. Repite para player2/                                   ║
║                                                           ║
║ ¡El juego cargará automáticamente los sprites!            ║
╚═══════════════════════════════════════════════════════════╝
`);
