import * as Phaser from 'phaser';
import { Preloader } from './preloader';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    backgroundColor: '#1c172e',
    parent: 'phaser-container',
    scene: [Preloader, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
        activePointers: 4,
    },
};

new Phaser.Game(config);
