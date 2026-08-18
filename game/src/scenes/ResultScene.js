import Phaser from 'phaser';

/**
 * ResultScene - Pantalla de resultado (K.O. / PERFECT / GANADOR)
 */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data) {
    this.winner = data.winner;
    this.resultType = data.resultType || 'K.O.'; // K.O., PERFECT, DOUBLE K.O.
    this.p1Name = data.p1Name || 'PLAYER 1';
    this.p2Name = data.p2Name || 'PLAYER 2';
    this.mode = data.mode || 'VERSUS';
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo oscuro semi-transparente
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000);
    overlay.setAlpha(0.7);
    overlay.setOrigin(0);

    // Texto de resultado principal
    const resultText = this.add.text(width / 2, 200, this.resultType, {
      font: 'bold 96px "Courier New"',
      fill: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 8
    });
    resultText.setOrigin(0.5);

    // Animación de pulso para el resultado
    this.tweens.add({
      targets: resultText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      repeat: 3
    });

    // Ganador
    if (this.winner) {
      const winnerText = this.add.text(width / 2, 350, `${this.winner} WINS!`, {
        font: 'bold 64px "Courier New"',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 6
      });
      winnerText.setOrigin(0.5);
    } else if (this.resultType === 'DOUBLE K.O.') {
      const drawText = this.add.text(width / 2, 350, 'DOUBLE K.O.!', {
        font: 'bold 64px "Courier New"',
        fill: '#ff6600',
        stroke: '#000000',
        strokeThickness: 6
      });
      drawText.setOrigin(0.5);
    }

    // Instrucciones para continuar
    const continueText = this.add.text(width / 2, height - 150, 'PRESIONA ENTER PARA CONTINUAR', {
      font: 'bold 28px "Courier New"',
      fill: '#ffffff'
    });
    continueText.setOrigin(0.5);

    // Parpadeo del texto de continuar
    this.time.addEvent({
      delay: 500,
      callback: () => {
        continueText.setVisible(!continueText.visible);
      },
      loop: true
    });

    // Controles
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    // Esperar un poco antes de permitir continuar
    this.canContinue = false;
    this.time.delayedCall(2000, () => {
      this.canContinue = true;
    });
  }

  update() {
    if (!this.canContinue) return;

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      // Volver al menú principal o continuar según el modo
      this.scene.start('MenuScene');
    }
  }
}
