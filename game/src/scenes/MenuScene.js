import Phaser from 'phaser';

/**
 * MenuScene - Menú principal del juego
 * Opciones: ARCADE, VERSUS, ENTRENAMIENTO, OPCIONES, SALIR
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.selectedOption = 0;
    this.menuOptions = ['ARCADE', 'VERSUS', 'ENTRENAMIENTO', 'OPCIONES', 'SALIR'];
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo (placeholder - se reemplazará con imagen real)
    const bg = this.add.rectangle(0, 0, width, height, 0x1a1a2e);
    bg.setOrigin(0);

    // Título
    const titleText = this.add.text(width / 2, 150, 'STREET FIGHTER RETRO', {
      font: 'bold 64px "Courier New"',
      fill: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 6
    });
    titleText.setOrigin(0.5);

    const subtitleText = this.add.text(width / 2, 220, 'EDICIÓN ARCADE', {
      font: '32px "Courier New"',
      fill: '#ffff00'
    });
    subtitleText.setOrigin(0.5);

    // Opciones del menú
    this.menuItems = [];
    this.menuOptions.forEach((option, index) => {
      const y = 350 + index * 60;
      const text = this.add.text(width / 2, y, option, {
        font: 'bold 36px "Courier New"',
        fill: index === 0 ? '#ffff00' : '#ffffff'
      });
      text.setOrigin(0.5);
      
      // Flecha indicadora para la opción seleccionada
      if (index === 0) {
        const arrow = this.add.text(width / 2 - 150, y, '▶', {
          font: '36px "Courier New"',
          fill: '#ffff00'
        });
        arrow.setOrigin(0.5);
        this.menuItems.push({ text, arrow });
      } else {
        this.menuItems.push({ text, arrow: null });
      }
    });

    // Controles de teclado
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.lastInputTime = 0;
    this.inputDelay = 200; // ms entre inputs

    // Instrucciones
    const instructions = this.add.text(width / 2, height - 80, 
      '↑↓ PARA NAVEGAR - ENTER PARA SELECCIONAR', {
        font: '20px "Courier New"',
        fill: '#888888'
      });
    instructions.setOrigin(0.5);

    // Copyright
    const copyright = this.add.text(width / 2, height - 40,
      '© 2024 FIGHTING GAME ENGINE', {
        font: '14px "Courier New"',
        fill: '#444444'
      });
    copyright.setOrigin(0.5);
  }

  update(time) {
    // Control de delay para navegación
    if (time < this.lastInputTime + this.inputDelay) return;

    let changed = false;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedOption = (this.selectedOption - 1 + this.menuOptions.length) % this.menuOptions.length;
      changed = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
      changed = true;
    }

    if (changed) {
      this.lastInputTime = time;
      this.updateMenuVisuals();
    }

    // Selección con ENTER
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.selectOption();
    }
  }

  updateMenuVisuals() {
    this.menuItems.forEach((item, index) => {
      if (index === this.selectedOption) {
        item.text.setStyle({ fill: '#ffff00' });
        if (!item.arrow) {
          const arrow = this.add.text(item.text.x - 150, item.text.y, '▶', {
            font: '36px "Courier New"',
            fill: '#ffff00'
          });
          arrow.setOrigin(0.5);
          item.arrow = arrow;
        }
      } else {
        item.text.setStyle({ fill: '#ffffff' });
        if (item.arrow) {
          item.arrow.destroy();
          item.arrow = null;
        }
      }
    });
  }

  selectOption() {
    const option = this.menuOptions[this.selectedOption];
    
    switch (option) {
      case 'ARCADE':
      case 'VERSUS':
      case 'ENTRENAMIENTO':
        // Ir a selección de personaje
        this.scene.start('CharacterSelectScene', { mode: option });
        break;
      case 'OPCIONES':
        // TODO: Implementar pantalla de opciones
        console.log('Opciones - Pendiente de implementar');
        break;
      case 'SALIR':
        // En navegador no se puede cerrar realmente, mostramos mensaje
        const exitText = this.add.text(512, 680, 'CIERRA LA PESTAÑA PARA SALIR', {
          font: '24px "Courier New"',
          fill: '#ff0000'
        });
        exitText.setOrigin(0.5);
        break;
    }
  }
}
