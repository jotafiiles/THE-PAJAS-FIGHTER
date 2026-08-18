import Phaser from 'phaser';

/**
 * CharacterSelectScene - Selección de personajes
 * Carga dinámicamente los personajes desde /characters/
 */
export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
    this.characters = [];
    this.p1Selected = null;
    this.p2Selected = null;
    this.currentPlayer = 1;
    this.cursorIndex = 0;
    this.gridSize = 8; // 8 columnas
    this.timeLeft = 60; // 60 segundos para seleccionar
  }

  async init(data) {
    this.gameMode = data.mode || 'VERSUS';
    await this.loadCharacters();
  }

  /**
   * Carga dinámicamente todos los personajes desde la carpeta /characters/
   * Lee cada character.json y construye el array de personajes disponibles
   */
  async loadCharacters() {
    try {
      // Lista de carpetas de personajes (en producción esto se haría con fetch a un índice)
      const characterFolders = ['ryu', 'ken']; // Se expandirá automáticamente
      
      for (const folder of characterFolders) {
        try {
          const response = await fetch(`/characters/${folder}/character.json`);
          if (response.ok) {
            const charData = await response.json();
            charData.folder = folder; // Guardamos la ruta para cargar sprites después
            this.characters.push(charData);
          }
        } catch (error) {
          console.warn(`No se pudo cargar ${folder}:`, error);
        }
      }

      // Añadir slots vacíos "?" hasta completar la grid
      const totalSlots = this.gridSize * 3; // 3 filas
      while (this.characters.length < totalSlots) {
        this.characters.push({
          name: 'UNKNOWN',
          displayName: '?',
          isPlaceholder: true
        });
      }
    } catch (error) {
      console.error('Error cargando personajes:', error);
    }
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo
    const bg = this.add.rectangle(0, 0, width, height, 0x0a0a1a);
    bg.setOrigin(0);

    // Título
    const titleText = this.add.text(width / 2, 50, 'SELECT CHARACTER', {
      font: 'bold 48px "Courier New"',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    });
    titleText.setOrigin(0.5);

    // Grid de personajes
    this.createCharacterGrid(width, height);

    // Panel de información de jugadores
    this.createPlayerPanels(width, height);

    // Timer
    this.timerText = this.add.text(width / 2, 120, `TIME: ${this.timeLeft}`, {
      font: 'bold 32px "Courier New"',
      fill: '#ff0000'
    });
    this.timerText.setOrigin(0.5);

    // Temporizador
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true
    });

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.lastInputTime = 0;
    this.inputDelay = 150;

    // Instrucciones
    const instructions = this.add.text(width / 2, height - 60,
      '←→ PARA MOVER - ENTER PARA SELECCIONAR', {
        font: '20px "Courier New"',
        fill: '#888888'
      });
    instructions.setOrigin(0.5);
  }

  createCharacterGrid(width, height) {
    this.gridCells = [];
    const startX = 162;
    const startY = 180;
    const cellWidth = 100;
    const cellHeight = 120;
    const gap = 10;

    let index = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const x = startX + col * (cellWidth + gap);
        const y = startY + row * (cellHeight + gap);

        // Marco del personaje
        const frame = this.add.rectangle(x + cellWidth / 2, y + cellHeight / 2, cellWidth, cellHeight, 0x333333);
        frame.setStrokeStyle(2, 0x666666);

        const charData = this.characters[index];
        
        if (charData.isPlaceholder) {
          // Personaje "?" placeholder
          const questionMark = this.add.text(x + cellWidth / 2, y + cellHeight / 2, '?', {
            font: 'bold 64px "Courier New"',
            fill: '#666666'
          });
          questionMark.setOrigin(0.5);
          this.gridCells.push({ frame, content: questionMark, data: charData, x, y });
        } else {
          // Retrato del personaje (placeholder geométrico por ahora)
          const portrait = this.add.rectangle(x + cellWidth / 2, y + cellHeight / 2, cellWidth - 10, cellHeight - 10, this.getCharacterColor(charData.name));
          this.gridCells.push({ frame, content: portrait, data: charData, x, y });
          
          // Nombre debajo
          const nameText = this.add.text(x + cellWidth / 2, y + cellHeight + 15, charData.displayName, {
            font: 'bold 14px "Courier New"',
            fill: '#ffffff'
          });
          nameText.setOrigin(0.5);
        }

        index++;
      }
    }

    // Cursor de selección
    this.cursorSprite = this.add.rectangle(0, 0, cellWidth + 10, cellHeight + 10, 0xffff00);
    this.cursorSprite.setStrokeStyle(4, 0xffffff);
    this.cursorSprite.setAlpha(0.5);
    this.updateCursor();
  }

  createPlayerPanels(width, height) {
    // Panel Jugador 1
    this.p1Panel = this.add.rectangle(100, height / 2, 200, 300, 0x0000aa);
    this.p1Panel.setStrokeStyle(4, 0x0066ff);
    this.p1NameText = this.add.text(100, height / 2 - 50, 'JUGADOR 1', {
      font: 'bold 24px "Courier New"',
      fill: '#ffffff'
    });
    this.p1NameText.setOrigin(0.5);
    this.p1CharDisplay = this.add.text(100, height / 2 + 20, '???', {
      font: 'bold 32px "Courier New"',
      fill: '#ffff00'
    });
    this.p1CharDisplay.setOrigin(0.5);

    // Panel Jugador 2
    this.p2Panel = this.add.rectangle(width - 100, height / 2, 200, 300, 0xaa0000);
    this.p2Panel.setStrokeStyle(4, 0xff6600);
    this.p2NameText = this.add.text(width - 100, height / 2 - 50, 'JUGADOR 2', {
      font: 'bold 24px "Courier New"',
      fill: '#ffffff'
    });
    this.p2NameText.setOrigin(0.5);
    this.p2CharDisplay = this.add.text(width - 100, height / 2 + 20, '???', {
      font: 'bold 32px "Courier New"',
      fill: '#ffff00'
    });
    this.p2CharDisplay.setOrigin(0.5);

    // Indicador de turno
    this.turnIndicator = this.add.text(width / 2, height - 100, 'JUGADOR 1 - ELIGE TU LUCHADOR', {
      font: 'bold 28px "Courier New"',
      fill: '#00ff00'
    });
    this.turnIndicator.setOrigin(0.5);
  }

  getCharacterColor(name) {
    // Colores distintivos para cada personaje (placeholder)
    const colors = {
      'RYU': 0x0066ff,
      'KEN': 0xff3300
    };
    return colors[name.toUpperCase()] || 0x666666;
  }

  update(time) {
    if (time < this.lastInputTime + this.inputDelay) return;

    let moved = false;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.cursorIndex = (this.cursorIndex - 1 + this.characters.length) % this.characters.length;
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.cursorIndex = (this.cursorIndex + 1) % this.characters.length;
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.cursorIndex = (this.cursorIndex - this.gridSize + this.characters.length) % this.characters.length;
      moved = true;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.cursorIndex = (this.cursorIndex + this.gridSize) % this.characters.length;
      moved = true;
    }

    if (moved) {
      this.lastInputTime = time;
      this.updateCursor();
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.selectCharacter();
    }
  }

  updateCursor() {
    const cell = this.gridCells[this.cursorIndex];
    if (cell) {
      this.cursorSprite.setPosition(cell.x + 50, cell.y + 60);
    }
  }

  onTimerTick() {
    this.timeLeft--;
    this.timerText.setText(`TIME: ${this.timeLeft}`);

    if (this.timeLeft <= 10) {
      this.timerText.setColor('#ff0000');
    }

    if (this.timeLeft <= 0) {
      this.timeEvent.remove();
      // Selección automática o game over
      this.selectRandomCharacter();
    }
  }

  selectCharacter() {
    const selectedChar = this.gridCells[this.cursorIndex].data;

    if (selectedChar.isPlaceholder) {
      // No seleccionar personajes "?"
      return;
    }

    if (this.currentPlayer === 1) {
      this.p1Selected = selectedChar;
      this.p1CharDisplay.setText(selectedChar.displayName);
      
      if (this.gameMode === 'ARCADE') {
        // En arcade solo selecciona P1, va a escena de pelea
        this.startFight();
        return;
      }
      
      this.currentPlayer = 2;
      this.turnIndicator.setText('JUGADOR 2 - ELIGE TU LUCHADOR');
      this.turnIndicator.setColor('#ff0000');
    } else {
      this.p2Selected = selectedChar;
      this.p2CharDisplay.setText(selectedChar.displayName);
      
      // Ambos seleccionados, ir a pelea
      this.startFight();
    }
  }

  selectRandomCharacter() {
    // Selección automática si se acaba el tiempo
    const availableChars = this.characters.filter(c => !c.isPlaceholder);
    if (availableChars.length > 0) {
      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      
      if (this.currentPlayer === 1) {
        this.p1Selected = randomChar;
        this.p1CharDisplay.setText(randomChar.displayName);
        this.currentPlayer = 2;
      } else {
        this.p2Selected = randomChar;
        this.p2CharDisplay.setText(randomChar.displayName);
        this.startFight();
      }
    }
  }

  startFight() {
    this.timeEvent.remove();
    
    // Pasar datos de personajes a FightScene
    this.scene.start('FightScene', {
      player1: this.p1Selected,
      player2: this.p2Selected,
      mode: this.gameMode
    });
  }
}
