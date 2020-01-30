import Phaser from 'phaser';

let Scene1 = new Phaser.Scene();

class PhysBlock extends Phaser.Physics.Arcade.Sprite {
    constructor(x, y, data) {
        super(Scene1, x, y, data);
        this.setData('color', data);
        this.setData('static', false);
        this.scene.add.existing(this);
    }

    makeStatic() {
        Scene1.staticBlocks.add(new StaticBlock(this.x, this.y, this.getData('color')))
        this.destroy();
    }
}

class StaticBlock extends Phaser.Physics.Arcade.Sprite {
    constructor(x, y, data) {
        super(Scene1, x, y, data);
        this.setData('color', data);
        this.setData('static', true);
        this.scene.add.existing(this);
    }

    makePhys() {
        Scene1.physBlocks.add(new PhysBlock(this.x, this.y, this.getData('color')))
        this.destroy();
    }
}


Scene1.init = function () {
    this.WIDTH = game.config.width;
    this.HEIGHT = game.config.height;
    this.CENTER_X = this.WIDTH / 2;
    this.CENTER_Y = this.HEIGHT / 2;
    this.BOUNDS = {
        x: 20,
        y: 28
    };
    this.GRID_COLS = 14;
    this.GRID_ROWS = 14;
    this.BLOCK_WIDTH = 16;
    this.HALF_BLOCK_WIDTH = this.BLOCK_WIDTH / 2;
    this.RAILS = []; // The "rails" (columns) that each block is fixed to
    for (let i = 0; i < this.GRID_COLS; i++) {
        this.RAILS[i] = i * this.BLOCK_WIDTH + this.HALF_BLOCK_WIDTH + this.BOUNDS.x;
    }
    /*this.DROP_POS = [{
            x: this.RAILS[6], // top left
            y: this.BOUNDS.y - this.BLOCK_WIDTH
        },
        {
            x: this.RAILS[7], // top right
            y: this.BOUNDS.y - this.BLOCK_WIDTH
        },
        {
            x: this.RAILS[7], // bottom right
            y: this.BOUNDS.y
        },
        {
            x: this.RAILS[6], // bottom left
            y: this.BOUNDS.y
        }
    ]*/

    this.ZONE = [];
    this.ZONE[0] = this.add.rectangle(this.BOUNDS.x, 0, this.BLOCK_WIDTH + this.HALF_BLOCK_WIDTH, this.HEIGHT).setOrigin(0, 0).setStrokeStyle(1, 0xffffff);
    for (let i = 1; i < this.RAILS.length - 2; i++) {
        this.ZONE[i] = this.add.rectangle(this.RAILS[i], 0, this.BLOCK_WIDTH, this.HEIGHT).setOrigin(0, 0).setStrokeStyle(1, 0xffffff);
    }
    this.ZONE[this.RAILS.length - 2] = this.add.rectangle(this.RAILS[this.RAILS.length - 2], 0, this.BLOCK_WIDTH + this.HALF_BLOCK_WIDTH, this.HEIGHT).setOrigin(0, 0).setStrokeStyle(1, 0xffffff);

    this.ZONE.forEach((z, i) => {
        z.setInteractive();
        z.on('pointerover', () => {
            this.zoneOver = i;
        });
        z.on('pointerdown', () => {
            this.dropOK = true;
        });
        z.on('pointerup', () => {
            this.dropOK = false;
        })
    })

    this.DROP_POS = [];
    
    for (let i = 0; i < this.ZONE.length; i++) {
        this.DROP_POS[i] = [{
            x: this.RAILS[i], // top left
            y: this.BOUNDS.y - this.BLOCK_WIDTH
        },
        {
            x: this.RAILS[i + 1], // top right
            y: this.BOUNDS.y - this.BLOCK_WIDTH
        },
        {
            x: this.RAILS[i + 1], // bottom right
            y: this.BOUNDS.y
        },
        {
            x: this.RAILS[i], // bottom left
            y: this.BOUNDS.y
        }]
    }

    this.cycle = 'gen'; // the game's "stages" for what the update function should do
    this.zoneOver = 6;
    this.dropOK = false;
    this.moveable = true;
    this.grid = [];

    this.gridAlign = function () {
        for (let row = 0; row < this.GRID_ROWS; row++) {
            this.grid[row] = [];

            for (let col = 0; col < this.GRID_COLS; col++) {
                let block = undefined;
                let pos = {
                    xmin: (col * this.BLOCK_WIDTH + this.BOUNDS.x),
                    xmax: (col * this.BLOCK_WIDTH + this.BLOCK_WIDTH + this.BOUNDS.x),
                    x: (col * this.BLOCK_WIDTH + this.HALF_BLOCK_WIDTH + this.BOUNDS.x),
                    ymin: (row * this.BLOCK_WIDTH + this.BOUNDS.y),
                    ymax: (row * this.BLOCK_WIDTH + this.BLOCK_WIDTH + this.BOUNDS.y),
                    y: (row * this.BLOCK_WIDTH + this.HALF_BLOCK_WIDTH + this.BOUNDS.y),
                }

                this.staticBlocks.getChildren().some(e => {
                    if (e.x > pos.xmin && e.x < pos.xmax && e.y > pos.ymin && e.y < pos.ymax) {
                        block = e;
                    }
                })

                if (block) {
                    block.x = pos.x;
                    block.y = pos.y;
                    block.refreshBody();
                }
                this.grid[row][col] = block;
            }
        }
    }

    this.pushPhysLeft = function () {
        let blocked = false;
        this.physBlocks.getChildren().forEach(a => {
            let pos = {
                xmin: ((a.x - this.BLOCK_WIDTH) - this.HALF_BLOCK_WIDTH),
                xmax: ((a.x - this.BLOCK_WIDTH) + this.HALF_BLOCK_WIDTH),
                ymin: (a.y - this.BLOCK_WIDTH),
                ymax: (a.y + this.BLOCK_WIDTH)
            }
            this.staticBlocks.getChildren().some(b => {
                if (b.x > pos.xmin && b.x <= pos.xmax && b.y > pos.ymin && b.y <= pos.ymax) {
                    blocked = true;
                }
            })
            if (pos.xmax < this.RAILS[0]) {
                blocked = true;
            }
        })
        if (!blocked) {
            this.physBlocks.getChildren().forEach(e => {
                e.x -= this.BLOCK_WIDTH;
            })
        }
    }

    this.pushPhysRight = function () {
        let blocked = false;
        this.physBlocks.getChildren().forEach(a => {
            let pos = {
                xmin: ((a.x + this.BLOCK_WIDTH) - this.HALF_BLOCK_WIDTH),
                xmax: ((a.x + this.BLOCK_WIDTH) + this.HALF_BLOCK_WIDTH),
                ymin: (a.y - this.BLOCK_WIDTH),
                ymax: (a.y + this.BLOCK_WIDTH)
            }
            this.staticBlocks.getChildren().some(b => {
                if (b.x > pos.xmin && b.x <= pos.xmax && b.y > pos.ymin && b.y <= pos.ymax) {
                    blocked = true;
                }
            })
            if (pos.xmin > this.RAILS[this.RAILS.length - 1]) {
                blocked = true;
            }
        })
        if (!blocked) {
            this.physBlocks.getChildren().forEach(e => {
                e.x += this.BLOCK_WIDTH;
            })
        }
    }

    this.randColor = function () {
        let rand = Phaser.Math.Between(0, 3);
        switch (rand) {
            case 0:
                return 'red';
            case 1:
                return 'blue';
            case 2:
                return 'yellow';
            case 3:
                return 'green';
            case 4:
                return 'purple';
        }
    }

    this.rotateCW = function () {
        let tl, tr, br, bl;
        this.physBlocks.getChildren().forEach(e => {
            switch (e.getData('pos')) {
                case 0:
                    tl = e;
                    break;
                case 1:
                    tr = e;
                    break;
                case 2:
                    br = e;
                    break;
                case 3:
                    bl = e;
                    break;
            }
        })
        let x = tl.x;
        let y = tl.y;

        tl.x = tr.x;
        tl.y = tr.y;

        tr.x = br.x;
        tr.y = br.y;

        br.x = bl.x;
        br.y = bl.y;

        bl.x = x;
        bl.y = y;
    }

    this.moveBlocksTo = function (zone) {
        let tl, tr, br, bl;
        this.physBlocks.getChildren().forEach(e => {
            switch (e.getData('pos')) {
                case 0:
                    tl = e;
                    break;
                case 1:
                    tr = e;
                    break;
                case 2:
                    br = e;
                    break;
                case 3:
                    bl = e;
                    break;
            }
        })
        tl.x = this.DROP_POS[zone][0].x;
        tl.y = this.DROP_POS[zone][0].y;

        tr.x = this.DROP_POS[zone][1].x;
        tr.y = this.DROP_POS[zone][1].y;

        br.x = this.DROP_POS[zone][2].x;
        br.y = this.DROP_POS[zone][2].y;

        bl.x = this.DROP_POS[zone][3].x;
        bl.y = this.DROP_POS[zone][3].y;
    }
};

Scene1.preload = function () {
    this.load.image('red', 'assets/redBlock.png');
    this.load.image('blue', 'assets/blueBlock.png');
    this.load.image('yellow', 'assets/yellowBlock.png');
    this.load.image('green', 'assets/greenBlock.png');
    this.load.image('purple', 'assets/purpleBlock.png');
    this.load.image('grey', 'assets/greyBlock.png');
};

Scene1.create = function () {
    this.score = 0;

    this.scoreText = this.add.text(4, 0, `Score: ${this.score}`, {
        fontSize: '12pt',
        color: '#fff'
    });

    this.physBlocks = this.physics.add.group();
    this.staticBlocks = this.physics.add.staticGroup();

    // Bottom row
    this.bottom = this.physics.add.staticGroup();
    this.RAILS.forEach((e) => {
        let block = new StaticBlock(e, (this.GRID_ROWS * this.BLOCK_WIDTH) + this.HALF_BLOCK_WIDTH + this.BOUNDS.y, 'grey');
        block.setData('static', true);
        block.setData('color', 'bottom');
        this.bottom.add(block);
    })

    // Collision
    this.physics.add.collider(this.physBlocks, this.staticBlocks, (a, b) => {
        a.makeStatic();
        this.gridAlign();
    });
    this.physics.add.collider(this.physBlocks, this.bottom, (a, b) => {
        a.makeStatic();
        this.gridAlign();
    });

    // setup for space key
    this.spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.pushonce = true;
    this.input.mouse.disableContextMenu();
};

Scene1.update = function () {

    switch (this.cycle) {
        case 'gen':
            // create 4 blocks in center top
            this.physBlocks.add(new PhysBlock(this.DROP_POS[6][0].x, this.DROP_POS[6][0].y, this.randColor()).setData('pos', 0));
            this.physBlocks.add(new PhysBlock(this.DROP_POS[6][2].x, this.DROP_POS[6][2].y, this.randColor()).setData('pos', 2));
            this.physBlocks.add(new PhysBlock(this.DROP_POS[6][3].x, this.DROP_POS[6][3].y, this.randColor()).setData('pos', 3));
            this.physBlocks.add(new PhysBlock(this.DROP_POS[6][1].x, this.DROP_POS[6][1].y, this.randColor()).setData('pos', 1));

            this.cycle = 'move';

            break;

        case 'move':

            this.moveBlocksTo(this.zoneOver);

            if (this.dropOK && this.pushonce) {
                
                this.cycle = 'drop';

                this.pushonce = false;
            }

            //this.cycle = 'drop';

            break;

        case 'drop':
                this.physBlocks.setVelocityY(200);

            // content for single press space key
            if (this.spaceKey.isDown && this.pushonce) {

                this.rotateCW();

                // end single push
                this.pushonce = false;
            }

            // Check if there are any free blocks left
            if (this.physBlocks.getChildren().length === 0) {
                this.cycle = 'align';
            }

            break;

        case 'align':
            this.gridAlign();
            this.cycle = 'gen';

            this.staticBlocks.getChildren().forEach(e => {
                if (e.y <= this.BOUNDS.y + this.BLOCK_WIDTH &&
                    (e.x === this.RAILS[6] || e.x === this.RAILS[7])) {
                    this.cycle = 'gameover'
                }
            })
            console.log(this.cycle)
            break;

        case 'gameover':


            break;

    }

    if (this.spaceKey.isUp) this.pushonce = true;
};

const config = {
    type: Phaser.AUTO,
    parent: 'cnv',
    width: 260,
    height: 260,
    pixelArt: true,
    zoom: 3,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Scene1
};

const game = new Phaser.Game(config);
console.log(game);