/**
 *game各种class的定义 
 *  
 */


//定位在图画中的位置原点为左上角
const Vec=class Vec {
    constructor(x, y) {
        this.x=x;
        this.y=y;
    }
    plus(other) {
        return new Vec(this.x+other.x, this.y+other.y);
    }
    times(factor) {
        return new Vec(this.x*factor, this.y*factor);
    }
}

//当前等级的界面布局
//string 为 empty wall 固定不动的lava ，无特殊属性，直接绘制即可

//其他为人物，coin或者特殊的lava ，会移动，需要存储初始的位置 
//通过静态方法create生成actors，因为actors可以移动，所以初始位置设定为empty，但actors通过定位覆盖在empty上
const Level=class Level {
    constructor(plan) {
        const rows=plan.trim().split("\n").map(l => [...l]);
        this.height=rows.length;
        this.width=rows[0].length;
        this.startActors=[];
        this.rows=rows.map((row, y) => {
            return row.map((ch, x) => {
                let type=levelChars[ch];
                if (typeof type==="string") return type;
                this.startActors.push(type.create(new Vec(x, y), ch));
                return "empty";
            });
        });
    }

    //判断碰到了什么,当超出边界时认为碰到了wall
    touches(pos, size, type) {
        let xStart=Math.floor(pos.x);
        let xEnd=Math.ceil(pos.x+size.x);
        let yStart=Math.floor(pos.y);
        let yEnd=Math.ceil(pos.y+size.y);

        for (let y=yStart; y<yEnd; y++) {
            for (let x=xStart; x<xEnd; x++) {
                let isOutside=x<0||x>=this.width||y<0||y>=this.height;
                let here=isOutside? "wal":this.rows[y][x];
                if (here===type) return true;
            }
        }

        return false;
    }
}

//判断是否重叠
function overlap(actor1, actor2) {
    return actor1.pos.x+actor1.size.x>actor2.pos.x&&
        actor1.pos.x<actor2.pos.x+actor2.size.x&&
        actor1.pos.y+actor1.size.y>actor2.pos.y&&
        actor1.pos.y<actor2.pos.y+actor2.size.y;
}

//存放每一帧当前的页面状态(actors)
//status 初始playing 最终 won / lost
const State=class State {
    constructor(level, actors, status) {
        this.level=level;
        this.actors=actors;
        this.status=status;
    }
    static start(level) {
        return new State(level, level.startActors, "playing");

    }

    get player() {
        return this.actors.find(a => a.type==="player");
    }

    //更新state
    //先调用actors的update更新actors
    //利用touches判断，是lava则lost
    //不是lava则判断collide 如果coin全部收集则won，否则从actors去除重叠的actor(coin)
    update(time, keys) {
        let actors=this.actors.map(actor => actor.update(time, this, keys));
        let newState=new State(this.level, actors, this.status);
        if (newState.status!=="playing") return newState;
        let player=newState.player;
        if (this.level.touches(player.pos, player.size, "lava")) {
            return new State(this.level, actors, "lost");
        }

        for (let actor of actors) {
            if (actor!==player&&overlap(actor, player)) {
                newState=actor.collide(newState);
            }
        }
        return newState;
    };
}


//设定palyer速度、重力和跳跃速度
const playerXSpeed=7;
const gravity=30;
const jumpSpeed=17;

//人物大小 0.8, 1.5
const Player=class Player {
    constructor(pos, speed) {
        this.pos=pos;
        this.speed=speed;
    }

    get type() {
        return "player";
    }
    static create(pos) {
        return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0, 0));
    }

    update(time, state, keys) {
        let xSpeed=0;
        if (keys.ArrowLeft) xSpeed-=playerXSpeed;
        if (keys.ArrowRight) xSpeed+=playerXSpeed;
        let pos=this.pos;
        let movedX=pos.plus(new Vec(xSpeed*time, 0));
        if (!state.level.touches(movedX, this.size, "wall")) {
            pos=movedX;
        }

        let ySpeed=this.speed.y+time*gravity;
        let movedY=pos.plus(new Vec(0, ySpeed*time));
        if (!state.level.touches(movedY, this.size, "wall")) {
            pos=movedY;
        } else if (keys.ArrowUp&&ySpeed>0) {
            ySpeed=-jumpSpeed;
        } else {
            ySpeed=0;
        }
        return new Player(pos, new Vec(xSpeed, ySpeed));
    }
}

//定义公有属性size(无法在class里直接定义公有属性，全是实例属性)
Player.prototype.size=new Vec(0.8, 1.5);


//设定不同lava的不同速度
const Lava=class Lava {
    constructor(pos, speed, reset) {
        this.pos=pos;
        this.speed=speed;
        this.reset=reset;
    }
    get type() {
        return "lava";
    }
    static create(pos, ch) {
        if (ch==="=") {
            return new Lava(pos, new Vec(2, 0));
        } else if (ch==="|") {
            return new Lava(pos, new Vec(0, 2));
        } else if (ch==="v") {
            return new Lava(pos, new Vec(0, 3), pos);
        }
    }

    collide(state) {
        return new State(state.level, state.actors, "lost");
    }

    //判断lava是否碰到wall 碰到则根据lava种类 重置位置/倒退
    update(time, state) {
        let newPos=this.pos.plus(this.speed.times(time));
        if (!state.level.touches(newPos, this.size, "wall")) {
            return new Lava(newPos, this.speed, this.reset);
        } else if (this.reset) {
            return new Lava(this.reset, this.speed, this.reset);
        } else {
            return new Lava(this.pos, this.speed.times(-1));
        }
    }
}

Lava.prototype.size=new Vec(1, 1);



//coin设置一个原地小幅度抖动(wobble)

const wobbleSpeed=8, wobbleDist=0.07;

const Coin=class Coin {
    constructor(pos, basePos, wobble) {
        this.pos=pos;
        this.basePos=basePos;
        this.wobble=wobble;
    }

    get type() {
        return "coin";
    }

    static create(pos) {
        let basePos=pos.plus(new Vec(0.2, 0.1));
        return new Coin(basePos, basePos, Math.random()*Math.PI*2);
    }

    collide(state) {
        let filtered=state.actors.filter(a => a!==this);
        let status=state.status;
        if (!filtered.some(a => a.type==="coin")) status="won";
        return new State(state.level, filtered, status);
    }

    update(time) {
        let wobble=this.wobble+time*wobbleSpeed;
        let wobblePos=Math.sin(wobble)*wobbleDist;
        return new Coin(this.basePos.plus(new Vec(0, wobblePos)), this.basePos, wobble);
    }
}

Coin.prototype.size=new Vec(0.6, 0.6);


//Monster会一直朝着player的方向水平移动
const monsterSpeed=4;
const Monster=class Monster {
    constructor(pos) {
        this.pos=pos;
    }

    get type() {
        return "monster";
    }

    static create(pos) {
        return new Monster(pos.plus(new Vec(0, -1)));
    }

    update(time, state) {
        let player=state.player;
        let speed=(player.pos.x<this.pos.x? -1:1)*time*monsterSpeed;
        let newPos=new Vec(this.pos.x+speed, this.pos.y);
        if (state.level.touches(newPos, this.size, "wall")) return this;
        else return new Monster(newPos);
    }

    collide(state) {
        let player=state.player;
        if (player.pos.y+player.size.y<this.pos.y+0.5) {
            let filtered=state.actors.filter(a => a!=this);
            return new State(state.level, filtered, state.status);
        } else {
            return new State(state.level, state.actors, "lost");
        }
    }
}

Monster.prototype.size=new Vec(1.2, 2);

const levelChars={
    ".": "empty",
    "#": "wall",
    "+": "lava",
    "@": Player,
    "o": Coin,
    "=": Lava,
    "|": Lava,
    "v": Lava,
    "M": Monster
}

export { Level, State };