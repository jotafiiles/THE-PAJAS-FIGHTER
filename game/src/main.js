import Phaser from 'phaser';

// Import scenes (will be created in next steps)
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { StageSelectScene } from './scenes/StageSelectScene.js';
import { FightScene } from './scenes/FightScene.js';
import { ResultScene } from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1200 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    CharacterSelectScene,
    StageSelectScene,
    FightScene,
    ResultScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);

export default game;
