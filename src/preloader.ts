import * as Phaser from 'phaser';
import charactersUrl from './assets/sprites/characters.png';
import enemyUrl from './assets/sprites/enemy.png'

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        this.load.spritesheet('characters', charactersUrl, {
            frameWidth: 64,
            frameHeight: 64,
        });

        this.load.spritesheet('enemy', enemyUrl, {
            frameWidth: 64,
            frameHeight: 64,
        });
    }

    create() {
        this.scene.start('GameScene');
    }
}
