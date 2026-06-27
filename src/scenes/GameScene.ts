import * as Phaser from 'phaser';
import { PlayerFrames, EnemyFrames } from '../frames';

const PUNCH_RANGE = 120;
const PUNCH_DURATION = 250;
const HIT_DURATION = 300;
const ENEMY_SPEED = 60;
const ENEMY_PATROL_MIN = 500;
const ENEMY_PATROL_MAX = 720;
const ENEMY_PUNCH_RANGE = 150;
const ENEMY_PUNCH_DURATION = 400;
const ENEMY_MAX_HEALTH = 100;
const ENEMY_HIT_DAMAGE = 20;
const HEALTH_BAR_WIDTH = 50;
const HEALTH_BAR_HEIGHT = 6;
const PLAYER_MIN_Y = 180;
const PLAYER_MAX_Y = 460;
const ENEMY_MIN_Y = 180;
const ENEMY_MAX_Y = 460;
const ENEMY_VERTICAL_SPEED = 35;
const KNOCKOUT_FLY_SPEED = 200;
const KNOCKOUT_FLY_DURATION = 600;
const KNOCKOUT_GRAVITY = 800;

export class GameScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Sprite;
    private enemy!: Phaser.GameObjects.Sprite;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private keyW!: Phaser.Input.Keyboard.Key;
    private keyS!: Phaser.Input.Keyboard.Key;
    private keyO!: Phaser.Input.Keyboard.Key;
    private keyP!: Phaser.Input.Keyboard.Key;
    private punchFrame: number = PlayerFrames.punchA;
    private isPunching = false;
    private punchTimer = 0;
    private isUppercutting = false;
    private enemyIsHit = false;
    private enemyHitTimer = 0;
    private enemyDirection = -1;
    private enemyIsPunching = false;
    private enemyPunchTimer = Phaser.Math.Between(1000, 3000);
    private enemyPunchFrame: number = EnemyFrames.punchA;
    private enemyPunchDurationTimer = 0;
    private playerIsHit = false;
    private playerHitTimer = 0;
    private enemyHealth = ENEMY_MAX_HEALTH;
    private enemyHealthBar!: Phaser.GameObjects.Graphics;
    private enemyIsKnockedOut = false;
    private knockoutFlyTimer = 0;
    private knockoutVelX = 0;
    private knockoutVelY = 0;
    private knockoutHasGravity = false;
    private knockoutRemoveTimer = 0;

    constructor() {
        super('GameScene');
    }

    create() {
        this.player = this.add.sprite(400, 350, 'characters', PlayerFrames.idle);
        this.player.setScale(1.5);
        this.player.setOrigin(0.5, 1);

        this.enemy = this.add.sprite(600, 350, 'enemy', EnemyFrames.idle);
        this.enemy.setScale(1.5);
        this.enemy.setOrigin(0.5, 1);
        this.enemy.setFlipX(true);

        this.enemyHealthBar = this.add.graphics();

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('characters', { start: PlayerFrames.walkStart, end: PlayerFrames.walkEnd }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'uppercut',
            frames: this.anims.generateFrameNumbers('characters', { frames: PlayerFrames.uppercut }),
            frameRate: 6,
            repeat: 0,
        });

        this.anims.create({
            key: 'enemy-walk',
            frames: this.anims.generateFrameNumbers('enemy', { start: EnemyFrames.walkStart, end: EnemyFrames.walkEnd }),
            frameRate: 6,
            repeat: -1,
        });

        const kb = this.input.keyboard!;
        this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyO = kb.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        this.keyP = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        this.enemy.play('enemy-walk');
    }

    private drawHealthBar() {
        this.enemyHealthBar.clear();
        const x = this.enemy.x - HEALTH_BAR_WIDTH / 2;
        const y = this.enemy.y - this.enemy.displayHeight - 10;
        const healthPct = this.enemyHealth / ENEMY_MAX_HEALTH;

        this.enemyHealthBar.fillStyle(0x333333);
        this.enemyHealthBar.fillRect(x, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

        const barColor = healthPct > 0.5 ? 0x00cc00 : healthPct > 0.25 ? 0xffaa00 : 0xff3300;
        this.enemyHealthBar.fillStyle(barColor);
        this.enemyHealthBar.fillRect(x, y, HEALTH_BAR_WIDTH * healthPct, HEALTH_BAR_HEIGHT);
    }

    private triggerEnemyKnockout(fromUppercut = false) {
        this.enemyIsKnockedOut = true;
        this.knockoutFlyTimer = KNOCKOUT_FLY_DURATION;
        if (fromUppercut) {
            const T = KNOCKOUT_FLY_DURATION / 1000;
            const dy = this.player.y - this.enemy.y;
            this.knockoutVelX = (this.player.x < this.enemy.x ? 1 : -1) * KNOCKOUT_FLY_SPEED * 0.6;
            this.knockoutVelY = (dy - 0.5 * KNOCKOUT_GRAVITY * T * T) / T;
            this.knockoutHasGravity = true;
        } else {
            this.knockoutVelX = (this.player.x < this.enemy.x ? 1 : -1) * KNOCKOUT_FLY_SPEED;
            this.knockoutVelY = 0;
            this.knockoutHasGravity = false;
        }
        this.enemyIsHit = false;
        this.enemy.clearTint();
        this.enemy.stop();
        this.enemy.setFlipX(this.player.x < this.enemy.x);
        this.enemy.setFrame(EnemyFrames.knockoutFly);
        this.enemyHealthBar.clear();
    }

    private respawnEnemy() {
        this.enemyIsKnockedOut = false;
        this.enemyHealth = ENEMY_MAX_HEALTH;
        this.enemyIsHit = false;
        this.enemyIsPunching = false;
        this.enemyPunchFrame = EnemyFrames.punchA;
        this.enemyPunchTimer = Phaser.Math.Between(1000, 3000);
        this.enemy.clearTint();
        this.enemy.setVisible(false);
        this.time.delayedCall(500, () => {
            this.enemy.x = 700;
            this.enemy.y = 350;
            this.enemy.setFlipX(true);
            this.enemy.setFrame(EnemyFrames.idle);
            this.enemy.setVisible(true);
            this.enemy.play('enemy-walk');
        });
    }

    private tryHitPlayer() {
        if (this.playerIsHit) return;
        this.playerIsHit = true;
        this.playerHitTimer = HIT_DURATION;
        this.player.setTint(0xff6666);
    }

    private tryHitEnemy(fromUppercut = false) {
        if (this.enemyIsKnockedOut) return;
        const dx = this.enemy.x - this.player.x;
        const facingRight = !this.player.flipX;
        const inRange = Math.abs(dx) < PUNCH_RANGE;
        const correctDirection = facingRight ? dx > 0 : dx < 0;

        if (inRange && correctDirection) {
            this.enemyHealth = Math.max(0, this.enemyHealth - ENEMY_HIT_DAMAGE);

            if (this.enemyHealth <= 0) {
                this.triggerEnemyKnockout(fromUppercut);
                return;
            }

            this.enemyIsHit = true;
            this.enemyHitTimer = HIT_DURATION;
            this.enemy.stop();
            this.enemy.setFrame(EnemyFrames.hit);
            this.enemy.setTint(0xff6666);
        }
    }

    update(_time: number, delta: number) {
        const speed = 150;

        this.drawHealthBar();

        // Player hit flash
        if (this.playerIsHit) {
            this.playerHitTimer -= delta;
            if (this.playerHitTimer <= 0) {
                this.playerIsHit = false;
                this.player.clearTint();
            }
        }

        if (this.enemyIsKnockedOut) {
            if (this.knockoutFlyTimer > 0) {
                this.knockoutFlyTimer -= delta;
                const dt = delta / 1000;
                this.enemy.x += this.knockoutVelX * dt;
                this.enemy.y += this.knockoutVelY * dt;
                if (this.knockoutHasGravity) this.knockoutVelY += KNOCKOUT_GRAVITY * dt;
                if (this.knockoutFlyTimer <= 0) {
                    this.enemy.setFrame(EnemyFrames.knockoutDown);
                    this.knockoutRemoveTimer = 2000;
                }
            } else if (this.knockoutRemoveTimer > 0) {
                this.knockoutRemoveTimer -= delta;
                if (this.knockoutRemoveTimer <= 0) {
                    this.respawnEnemy();
                }
            }
        } else {
            // Enemy punch timer
            if (!this.enemyIsHit && !this.enemyIsPunching) {
                this.enemyPunchTimer -= delta;
                if (this.enemyPunchTimer <= 0) {
                    const distToPlayer = Math.abs(this.player.x - this.enemy.x);
                    if (distToPlayer < ENEMY_PUNCH_RANGE) {
                        this.enemyIsPunching = true;
                        this.enemyPunchDurationTimer = ENEMY_PUNCH_DURATION;
                        this.enemy.stop();
                        this.enemy.setFlipX(this.player.x < this.enemy.x);
                        this.enemy.setFrame(this.enemyPunchFrame);
                        this.enemyPunchFrame = this.enemyPunchFrame === EnemyFrames.punchA ? EnemyFrames.punchB : EnemyFrames.punchA;
                        this.tryHitPlayer();
                    }
                    this.enemyPunchTimer = Phaser.Math.Between(800, 2500);
                }
            }

            // Enemy punch duration
            if (this.enemyIsPunching) {
                this.enemyPunchDurationTimer -= delta;
                if (this.enemyPunchDurationTimer <= 0) {
                    this.enemyIsPunching = false;
                    this.enemy.setFrame(EnemyFrames.idle);
                    this.enemy.play('enemy-walk');
                }
            }

            // Enemy patrol
            if (!this.enemyIsHit && !this.enemyIsPunching) {
                this.enemy.x += this.enemyDirection * ENEMY_SPEED * delta / 1000;

                if (this.enemy.x >= ENEMY_PATROL_MAX) {
                    this.enemyDirection = -1;
                    this.enemy.setFlipX(true);
                } else if (this.enemy.x <= ENEMY_PATROL_MIN) {
                    this.enemyDirection = 1;
                    this.enemy.setFlipX(false);
                }

                // Slowly track player's Y
                if (this.enemy.y < this.player.y) {
                    this.enemy.y += ENEMY_VERTICAL_SPEED * delta / 1000;
                } else if (this.enemy.y > this.player.y) {
                    this.enemy.y -= ENEMY_VERTICAL_SPEED * delta / 1000;
                }
                this.enemy.y = Phaser.Math.Clamp(this.enemy.y, ENEMY_MIN_Y, ENEMY_MAX_Y);

                if (!this.enemy.anims.isPlaying) this.enemy.play('enemy-walk');
            }

            // Enemy hit timer
            if (this.enemyIsHit) {
                this.enemyHitTimer -= delta;
                if (this.enemyHitTimer <= 0) {
                    this.enemyIsHit = false;
                    this.enemy.clearTint();
                    this.enemy.setFrame(EnemyFrames.idle);
                    this.enemy.play('enemy-walk');
                }
            }
        }

        // Uppercut
        if (Phaser.Input.Keyboard.JustDown(this.keyP) && !this.isPunching && !this.isUppercutting) {
            this.isUppercutting = true;
            this.player.stop();
            this.player.play('uppercut');
            this.tryHitEnemy(true);
            this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                this.isUppercutting = false;
                this.player.setFrame(PlayerFrames.idle);
            });
        }

        // Punch
        if (Phaser.Input.Keyboard.JustDown(this.keyO) && !this.isUppercutting) {
            this.isPunching = true;
            this.punchTimer = PUNCH_DURATION;
            this.player.stop();
            this.player.setFrame(this.punchFrame);
            this.punchFrame = this.punchFrame === PlayerFrames.punchA ? PlayerFrames.punchB : PlayerFrames.punchA;
            this.tryHitEnemy();
        }

        if (this.isPunching) {
            this.punchTimer -= delta;
            if (this.punchTimer <= 0) this.isPunching = false;
        }

        if (this.isPunching || this.isUppercutting) return;

        const movingLeft = this.keyA.isDown;
        const movingRight = this.keyD.isDown;
        const movingUp = this.keyW.isDown;
        const movingDown = this.keyS.isDown;

        if (movingLeft) {
            this.player.x -= speed * delta / 1000;
            this.player.setFlipX(true);
        } else if (movingRight) {
            this.player.x += speed * delta / 1000;
            this.player.setFlipX(false);
        }

        if (movingUp) {
            this.player.y -= speed * delta / 1000;
        } else if (movingDown) {
            this.player.y += speed * delta / 1000;
        }

        this.player.y = Phaser.Math.Clamp(this.player.y, PLAYER_MIN_Y, PLAYER_MAX_Y);

        if (movingLeft || movingRight || movingUp || movingDown) {
            if (!this.player.anims.isPlaying) this.player.play('walk');
        } else {
            this.player.stop();
            this.player.setFrame(PlayerFrames.idle);
        }
    }
}
