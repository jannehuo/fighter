export const PlayerFrames = {
    idle: 1,
    walkStart: 1,
    walkEnd: 3,
    punchA: 4,
    punchB: 5,
    uppercut: [11, 12, 0] as number[],
} as const;

export const EnemyFrames = {
    idle: 3,
    walkStart: 4,
    walkEnd: 5,
    hit: 0,
    punchA: 15,
    punchB: 17,
    knockoutFly: 20,
    knockoutDown: 26,
} as const;
