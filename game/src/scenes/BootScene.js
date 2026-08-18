import Phaser from 'phaser';

/**
 * BootScene - Pantalla de carga inicial
 * Carga assets esenciales y muestra barra de progreso
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Barra de progreso
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(312, 350, 400, 50);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Texto de carga
    const loadingText = this.add.text(width / 2, 325, 'CARGANDO...', {
      font: '24px "Courier New"',
      fill: '#ffffff'
    });
    loadingText.setOrigin(0.5);

    // Logo placeholder (se reemplazará con arte real)
    const logoText = this.add.text(width / 2, 200, 'STREET FIGHTER RETRO', {
      font: 'bold 48px "Courier New"',
      fill: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 4
    });
    logoText.setOrigin(0.5);

    // Evento de progreso
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xff0000, 1);
      progressBar.fillRect(322, 360, 380 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Cargar assets básicos de UI (placeholders por ahora)
    // En el futuro aquí se cargarán las fuentes, SFX, etc.
  }

  create() {
    // Transición al menú principal después de un breve delay
    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }
}
