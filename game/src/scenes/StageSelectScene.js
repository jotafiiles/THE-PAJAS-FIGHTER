import Phaser from 'phaser';

/**
 * StageSelectScene - Selección de escenario (opcional en v1)
 * Carga dinámicamente los escenarios desde /stages/
 */
export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageSelectScene' });
    this.stages = [];
    this.selectedIndex = 0;
  }

  async init(data) {
    this.fightData = data; // Datos de personajes seleccionados
    await this.loadStages();
  }

  async loadStages() {
    try {
      const stageFolders = ['training_stage'];
      
      for (const folder of stageFolders) {
        try {
          const response = await fetch(`/stages/${folder}/stage.json`);
          if (response.ok) {
            const stageData = await response.json();
            stageData.folder = folder;
            this.stages.push(stageData);
          }
        } catch (error) {
          console.warn(`No se pudo cargar ${folder}:`, error);
        }
      }

      // Si no hay stages, usar uno por defecto
      if (this.stages.length === 0) {
        this.stages.push({
          name: 'Training Stage',
          displayName: 'TRAINING',
          folder: 'training_stage'
        });
      }
    } catch (error) {
      console.error('Error cargando escenarios:', error);
    }
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo
    const bg = this.add.rectangle(0, 0, width, height, 0x0a0a2e);
    bg.setOrigin(0);

    // Título
    const titleText = this.add.text(width / 2, 100, 'SELECT STAGE', {
      font: 'bold 48px "Courier New"',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    });
    titleText.setOrigin(0.5);

    // Lista de escenarios
    this.stages.forEach((stage, index) => {
      const y = 250 + index * 80;
      const text = this.add.text(width / 2, y, stage.displayName || stage.name, {
        font: 'bold 36px "Courier New"',
        fill: index === 0 ? '#00ff00' : '#ffffff'
      });
      text.setOrigin(0.5);

      if (index === 0) {
        const arrow = this.add.text(width / 2 - 200, y, '▶', {
          font: '36px "Courier New"',
          fill: '#00ff00'
        });
        arrow.setOrigin(0.5);
      }
    });

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.lastInputTime = 0;
    this.inputDelay = 200;

    // Instrucciones
    const instructions = this.add.text(width / 2, height - 80,
      '↑↓ PARA SELECCIONAR - ENTER PARA CONFIRMAR', {
        font: '20px "Courier New"',
        fill: '#888888'
      });
    instructions.setOrigin(0.5);
  }

  update(time) {
    if (time < this.lastInputTime + this.inputDelay) return;

    let changed = false;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.stages.length) % this.stages.length;
      changed = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.stages.length;
      changed = true;
    }

    if (changed) {
      this.lastInputTime = time;
      this.scene.restart(); // Reiniciar para actualizar visuales
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.startFight();
    }
  }

  startFight() {
    const selectedStage = this.stages[this.selectedIndex];
    
    this.scene.start('FightScene', {
      player1: this.fightData.player1,
      player2: this.fightData.player2,
      stage: selectedStage,
      mode: this.fightData.mode
    });
  }
}
