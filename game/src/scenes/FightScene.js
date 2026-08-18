import Phaser from 'phaser';

/**
 * FightScene - Escena principal de pelea
 * Maneja movimiento, ataques, hitboxes y sistema de combate
 */
export class FightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FightScene' });
    this.round = 1;
    this.p1RoundsWon = 0;
    this.p2RoundsWon = 0;
    this.maxRounds = 3; // Mejor de 3
    this.timer = 99; // 99 segundos por round
    this.isPaused = false;
    this.fightEnded = false;
  }

  init(data) {
    this.player1Data = data.player1 || null;
    this.player2Data = data.player2 || null;
    this.stageData = data.stage || null;
    this.gameMode = data.mode || 'VERSUS';
    
    // Si no hay datos de personajes, usar placeholders
    if (!this.player1Data) {
      this.player1Data = { name: 'RYU', displayName: 'RYU', health: 1000 };
    }
    if (!this.player2Data) {
      this.player2Data = { name: 'KEN', displayName: 'KEN', health: 1000 };
    }
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo del escenario (placeholder)
    this.createBackground(width, height);

    // Crear jugadores
    this.createPlayers();

    // Crear HUD (barras de vida, timer, nombres)
    this.createHUD(width, height);

    // Configurar colisiones
    this.setupCollisions();

    // Controles
    this.setupControls();

    // Iniciar round
    this.time.delayedCall(1000, () => {
      this.startRound();
    });
  }

  createBackground(width, height) {
    // Fondo degradado (placeholder - se reemplazará con imágenes reales)
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x1a1a2e, 0x16213e, 0x16213e, 0x0f3460, 1);
    gradient.fillRect(0, 0, width, height);

    // Suelo
    const floor = this.add.rectangle(0, height - 100, width, 100, 0x2d2d44);
    floor.setOrigin(0, 1);

    // Línea decorativa
    const line = this.add.rectangle(0, height - 150, width, 2, 0x4a4a6a);
    line.setOrigin(0, 1);
  }

  createPlayers() {
    const groundY = 668; // Posición Y del suelo

    // Jugador 1 (izquierda)
    this.player1 = this.createFighter(200, groundY, this.player1Data, 'p1');
    this.player1.setFlipX(false); // Mirando a la derecha

    // Jugador 2 (derecha)
    this.player2 = this.createFighter(824, groundY, this.player2Data, 'p2');
    this.player2.setFlipX(true); // Mirando a la izquierda

    // Cámara sigue a los jugadores
    this.cameras.main.setBounds(0, 0, 1024, 768);
    this.cameras.main.startFollow(this.player1, true, 0.1, 0.1);
  }

  createFighter(x, y, charData, label) {
    // Placeholder geométrico para el personaje (se reemplazará con sprites)
    const fighter = this.physics.add.sprite(x, y, null);
    
    // Crear gráfico placeholder
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const color = label === 'p1' ? 0x0066ff : 0xff3300;
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, 50, 100); // Tamaño del personaje
    graphics.generateTexture(`${label}_texture`, 50, 100);
    
    fighter.setTexture(`${label}_texture`);
    fighter.setDisplaySize(50, 100);
    fighter.setCollideWorldBounds(true);
    fighter.setMaxVelocity(300, 500);
    fighter.setDragX(800); // Fricción horizontal
    
    // Datos del luchador
    fighter.label = label;
    fighter.charData = charData;
    fighter.health = charData.health || 1000;
    fighter.maxHealth = charData.health || 1000;
    fighter.isAttacking = false;
    fighter.isHit = false;
    fighter.isBlocking = false;
    fighter.currentAttack = null;
    
    // Hitbox de ataque (invisible inicialmente)
    fighter.attackHitbox = null;
    
    return fighter;
  }

  createHUD(width, height) {
    // Barra de vida Jugador 1 (izquierda)
    this.p1HealthBarBg = this.add.rectangle(50, 50, 400, 30, 0x333333);
    this.p1HealthBarBg.setOrigin(0, 0.5);
    this.p1HealthBar = this.add.rectangle(50, 50, 390, 20, 0xff0000);
    this.p1HealthBar.setOrigin(0, 0.5);
    
    // Nombre P1
    this.p1NameText = this.add.text(50, 80, this.player1Data.displayName, {
      font: 'bold 20px "Courier New"',
      fill: '#ffffff'
    });

    // Barra de vida Jugador 2 (derecha)
    this.p2HealthBarBg = this.add.rectangle(width - 50, 50, 400, 30, 0x333333);
    this.p2HealthBarBg.setOrigin(1, 0.5);
    this.p2HealthBar = this.add.rectangle(width - 50, 50, 390, 20, 0xff0000);
    this.p2HealthBar.setOrigin(1, 0.5);
    
    // Nombre P2
    this.p2NameText = this.add.text(width - 50, 80, this.player2Data.displayName, {
      font: 'bold 20px "Courier New"',
      fill: '#ffffff'
    });
    this.p2NameText.setOrigin(1, 0);

    // Timer central
    this.timerBg = this.add.rectangle(width / 2, 50, 80, 50, 0x000000);
    this.timerBg.setStrokeStyle(2, 0xffff00);
    this.timerText = this.add.text(width / 2, 50, this.timer.toString(), {
      font: 'bold 36px "Courier New"',
      fill: '#ffff00'
    });
    this.timerText.setOrigin(0.5);

    // Round indicator
    this.roundText = this.add.text(width / 2, 120, `ROUND ${this.round}`, {
      font: 'bold 28px "Courier New"',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.roundText.setOrigin(0.5);
    this.roundText.setVisible(false);

    // Texto de inicio de round
    this.readyText = this.add.text(width / 2, height / 2, 'READY?', {
      font: 'bold 64px "Courier New"',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6
    });
    this.readyText.setOrigin(0.5);
    this.readyText.setVisible(false);

    this.fightText = this.add.text(width / 2, height / 2, 'FIGHT!', {
      font: 'bold 64px "Courier New"',
      fill: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 6
    });
    this.fightText.setOrigin(0.5);
    this.fightText.setVisible(false);
  }

  setupCollisions() {
    // Colisión entre jugadores
    this.physics.add.collider(this.player1, this.player2);
    
    // Colisión con el suelo (simplificado - solo límite inferior)
    const groundY = 668;
    this.player1.body.setGravityY(1200);
    this.player2.body.setGravityY(1200);
    
    // Plataforma invisible para el suelo
    const ground = this.add.rectangle(512, groundY + 50, 1024, 100, 0x000000);
    ground.setVisible(false);
    this.physics.add.existing(ground, true);
    
    this.physics.add.collider(this.player1, ground);
    this.physics.add.collider(this.player2, ground);
  }

  setupControls() {
    // Controles Jugador 1 (WASD + teclas de ataque)
    this.p1Keys = {
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      lightPunch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      mediumPunch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G),
      heavyPunch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
      lightKick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      mediumKick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      heavyKick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
    };

    // Controles Jugador 2 (Flechas + numérico)
    this.p2Keys = {
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      lightPunch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_1),
      mediumPunch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_2),
      heavyPunch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_3),
      lightKick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_4),
      mediumKick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_5),
      heavyKick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_6)
    };

    this.lastInputTime = 0;
    this.inputDelay = 50; // ms
  }

  startRound() {
    this.readyText.setVisible(true);
    
    this.time.delayedCall(1000, () => {
      this.readyText.setVisible(false);
      this.fightText.setVisible(true);
      
      this.time.delayedCall(800, () => {
        this.fightText.setVisible(false);
        this.roundText.setVisible(true);
        this.isPaused = false;
        
        // Iniciar timer del round
        this.startTimer();
      });
    });
  }

  startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true
    });
  }

  onTimerTick() {
    if (this.fightEnded) return;
    
    this.timer--;
    this.timerText.setText(this.timer.toString());
    
    if (this.timer <= 10) {
      this.timerText.setColor('#ff0000');
    }
    
    if (this.timer <= 0) {
      this.endRoundByTime();
    }
  }

  update(time) {
    if (this.isPaused || this.fightEnded) return;
    
    if (time < this.lastInputTime + this.inputDelay) return;
    
    // Actualizar Jugador 1
    this.updatePlayer(this.player1, this.p1Keys, time);
    
    // Actualizar Jugador 2
    this.updatePlayer(this.player2, this.p2Keys, time);
    
    // Actualizar cámara para seguir ambos jugadores
    this.updateCamera();
    
    // Verificar hitboxes de ataque
    this.checkAttacks();
  }

  updatePlayer(player, keys, time) {
    if (player.isHit || player.isAttacking) return; // No controlar si está siendo golpeado o atacando
    
    const speed = 200;
    const jumpForce = -500;
    
    // Movimiento horizontal
    let moving = false;
    if (keys.left.isDown) {
      player.setVelocityX(-speed);
      player.setFlipX(player.label === 'p1'); // Mirar hacia la izquierda
      moving = true;
    } else if (keys.right.isDown) {
      player.setVelocityX(speed);
      player.setFlipX(player.label !== 'p1'); // Mirar hacia la derecha
      moving = true;
    } else {
      player.setVelocityX(0);
    }
    
    // Salto
    if (keys.up.isDown && player.body.touching.down) {
      player.setVelocityY(jumpForce);
    }
    
    // Agacharse / Bloqueo
    player.isBlocking = keys.down.isDown && !player.body.touching.down;
    if (player.isBlocking) {
      player.setVelocityX(0);
      // Cambiar apariencia para indicar bloqueo (placeholder)
      player.setTint(0x00ff00);
    } else {
      player.clearTint();
    }
    
    // Ataques
    if (!player.isAttacking && !player.isHit) {
      if (Phaser.Input.Keyboard.JustDown(keys.lightPunch)) {
        this.performAttack(player, 'light_punch', 30, 200);
      } else if (Phaser.Input.Keyboard.JustDown(keys.mediumPunch)) {
        this.performAttack(player, 'medium_punch', 50, 300);
      } else if (Phaser.Input.Keyboard.JustDown(keys.heavyPunch)) {
        this.performAttack(player, 'heavy_punch', 80, 400);
      } else if (Phaser.Input.Keyboard.JustDown(keys.lightKick)) {
        this.performAttack(player, 'light_kick', 35, 200);
      } else if (Phaser.Input.Keyboard.JustDown(keys.mediumKick)) {
        this.performAttack(player, 'medium_kick', 55, 300);
      } else if (Phaser.Input.Keyboard.JustDown(keys.heavyKick)) {
        this.performAttack(player, 'heavy_kick', 85, 400);
      }
    }
  }

  performAttack(player, attackType, damage, hitStun) {
    player.isAttacking = true;
    player.currentAttack = { damage, hitStun, type: attackType };
    
    // Crear hitbox temporal
    const direction = player.flipX ? -1 : 1;
    const hitboxX = player.x + (direction * 60);
    const hitboxY = player.y - 20;
    
    player.attackHitbox = this.add.rectangle(hitboxX, hitboxY, 40, 40, 0xff0000, 0.5);
    player.attackHitbox.setVisible(false); // Invisible en esta versión
    
    // La hitbox dura pocos frames
    this.time.delayedCall(200, () => {
      player.isAttacking = false;
      player.currentAttack = null;
      if (player.attackHitbox) {
        player.attackHitbox.destroy();
        player.attackHitbox = null;
      }
    });
  }

  checkAttacks() {
    // Verificar si P1 está atacando y golpea a P2
    if (this.player1.isAttacking && this.player1.attackHitbox) {
      this.checkHit(this.player1, this.player2);
    }
    
    // Verificar si P2 está atacando y golpea a P1
    if (this.player2.isAttacking && this.player2.attackHitbox) {
      this.checkHit(this.player2, this.player1);
    }
  }

  checkHit(attacker, defender) {
    if (!attacker.currentAttack || defender.isHit) return;
    
    const distance = Phaser.Math.Distance.Between(
      attacker.x, attacker.y,
      defender.x, defender.y
    );
    
    // Verificar si está en rango
    if (distance < 80) {
      // Verificar dirección
      const directionToDefender = Math.sign(defender.x - attacker.x);
      const attackerFacing = attacker.flipX ? -1 : 1;
      
      if (directionToDefender === attackerFacing) {
        // Golpe conectado!
        this.applyHit(defender, attacker.currentAttack);
        
        // Resetear ataque
        attacker.isAttacking = false;
        attacker.currentAttack = null;
        if (attacker.attackHitbox) {
          attacker.attackHitbox.destroy();
          attacker.attackHitbox = null;
        }
      }
    }
  }

  applyHit(defender, attack) {
    defender.isHit = true;
    
    // Calcular daño reducido si está bloqueando
    let damage = attack.damage;
    if (defender.isBlocking) {
      damage = Math.floor(damage * 0.1); // 90% reducción por bloqueo
      // Efecto de bloqueo (chip damage)
      this.showDamageNumber(defender, damage, 0xffff00);
    } else {
      this.showDamageNumber(defender, damage, 0xff0000);
    }
    
    // Reducir vida
    defender.health = Math.max(0, defender.health - damage);
    this.updateHealthBars();
    
    // Empuje hacia atrás
    const pushDirection = defender.x > 512 ? -1 : 1;
    defender.setVelocityX(pushDirection * 100);
    
    // Verificar KO
    if (defender.health <= 0) {
      this.handleKO(defender);
    } else {
      // Recuperarse del hit después de un tiempo
      this.time.delayedCall(attack.hitStun, () => {
        defender.isHit = false;
      });
    }
  }

  showDamageNumber(fighter, damage, color) {
    const damageText = this.add.text(fighter.x, fighter.y - 50, `-${damage}`, {
      font: 'bold 24px "Courier New"',
      fill: color,
      stroke: '#000000',
      strokeThickness: 3
    });
    damageText.setOrigin(0.5);
    
    this.tweens.add({
      targets: damageText,
      y: fighter.y - 100,
      alpha: 0,
      duration: 800,
      onComplete: () => damageText.destroy()
    });
  }

  updateHealthBars() {
    const maxBarWidth = 390;
    
    // Actualizar barra P1
    const p1Percent = this.player1.health / this.player1.maxHealth;
    this.p1HealthBar.width = maxBarWidth * p1Percent;
    
    // Actualizar barra P2
    const p2Percent = this.player2.health / this.player2.maxHealth;
    this.p2HealthBar.width = maxBarWidth * p2Percent;
    
    // Cambiar color según vida restante
    if (p1Percent < 0.3) this.p1HealthBar.setFillStyle(0xffff00);
    if (p2Percent < 0.3) this.p2HealthBar.setFillStyle(0xffff00);
  }

  updateCamera() {
    // Cámara dinámica que muestra ambos jugadores
    const midX = (this.player1.x + this.player2.x) / 2;
    const distance = Math.abs(this.player1.x - this.player2.x);
    
    // Limitar movimiento de cámara
    const clampedX = Phaser.Math.Clamp(midX, 512, 1024 - 512);
    this.cameras.main.scrollX = clampedX - 512;
  }

  handleKO(koPlayer) {
    if (this.fightEnded) return;
    
    this.fightEnded = true;
    this.timerEvent.remove();
    
    // Determinar ganador
    const winner = koPlayer.label === 'p1' ? this.player2 : this.player1;
    const winnerData = winner.label === 'p1' ? this.player1Data : this.player2Data;
    
    // Actualizar rounds ganados
    if (winner.label === 'p1') {
      this.p1RoundsWon++;
    } else {
      this.p2RoundsWon++;
    }
    
    // Mostrar resultado del round
    this.showRoundResult(winnerData.displayName);
    
    // Verificar si hay ganador del match
    this.time.delayedCall(3000, () => {
      if (this.p1RoundsWon >= 2 || this.p2RoundsWon >= 2) {
        // Match terminado
        const finalWinner = this.p1RoundsWon >= 2 ? this.player1Data.displayName : this.player2Data.displayName;
        this.scene.start('ResultScene', {
          winner: finalWinner,
          resultType: 'K.O.',
          p1Name: this.player1Data.displayName,
          p2Name: this.player2Data.displayName,
          mode: this.gameMode
        });
      } else {
        // Siguiente round
        this.startNextRound();
      }
    });
  }

  endRoundByTime() {
    if (this.fightEnded) return;
    
    this.fightEnded = true;
    this.timerEvent.remove();
    
    // Ganador por vida restante
    let winner = null;
    if (this.player1.health > this.player2.health) {
      winner = this.player1Data.displayName;
      this.p1RoundsWon++;
    } else if (this.player2.health > this.player1.health) {
      winner = this.player2Data.displayName;
      this.p2RoundsWon++;
    } else {
      // Empate - doble KO
      this.showRoundResult('DOUBLE K.O.');
    }
    
    if (winner) {
      this.showRoundResult(winner);
    }
    
    this.time.delayedCall(3000, () => {
      if (this.p1RoundsWon >= 2 || this.p2RoundsWon >= 2) {
        const finalWinner = this.p1RoundsWon >= 2 ? this.player1Data.displayName : this.player2Data.displayName;
        this.scene.start('ResultScene', {
          winner: finalWinner,
          resultType: 'TIME OVER',
          p1Name: this.player1Data.displayName,
          p2Name: this.player2Data.displayName,
          mode: this.gameMode
        });
      } else {
        this.startNextRound();
      }
    });
  }

  showRoundResult(text) {
    const resultText = this.add.text(512, 384, text, {
      font: 'bold 72px "Courier New"',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6
    });
    resultText.setOrigin(0.5);
    
    this.tweens.add({
      targets: resultText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      repeat: 2
    });
  }

  startNextRound() {
    this.round++;
    this.timer = 99;
    this.fightEnded = false;
    
    // Resetear posiciones y vida
    this.player1.setPosition(200, 668);
    this.player2.setPosition(824, 668);
    this.player1.setVelocity(0, 0);
    this.player2.setVelocity(0, 0);
    this.player1.health = this.player1.maxHealth;
    this.player2.health = this.player2.maxHealth;
    this.player1.isHit = false;
    this.player2.isHit = false;
    
    // Actualizar UI
    this.timerText.setText(this.timer.toString());
    this.timerText.setColor('#ffff00');
    this.roundText.setText(`ROUND ${this.round}`);
    this.updateHealthBars();
    
    // Iniciar round
    this.startRound();
  }
}
