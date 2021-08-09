import { Level, State } from './game.js';
//记录按键keys
function trackKeys(keys) {
    let down=Object.create(null);

    function track(e) {
        if (keys.includes(e.key)) {
            down[e.key]=e.type=="keydown";
            e.preventDefault();
        }
    }
    window.addEventListener("keydown", track);
    window.addEventListener("keyup", track);
    down.unregister=() => {
        window.removeEventListener("keydown", track);
        window.removeEventListener("keyup", track);
    };
    return down;
}


const arrowKeys=trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

function runAnimation(frameFunc) {
    let lastTime=null;

    function frame(time) {
        if (lastTime!=null) {
            //当运行标签被隐藏时，rAF函数会暂停计时，设置最大100防止再次运行时time太大
            let timeStep=Math.min(time-lastTime, 100)/1000;
            if (frameFunc(timeStep)===false) return;
        }
        lastTime=time;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}


//空格键可以暂停
function runLevel(level, Display) {
    let display=new Display(document.body, level);
    let state=State.start(level);
    let ending=1; //结束时停1s显示结束特效
    let running="yes";

    return new Promise(resolve => {
        function spaceHandler(e) {
            if (e.key!==" ") return;
            e.preventDefault();
            if (running==="no") {
                running="yes";
                runAnimation(frame);
            } else if (running==="yes") {
                running="pausing";
            } else {
                running="yes";
            }
        }
        window.addEventListener("keydown", spaceHandler);
        let arrowKeys=trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

        function frame(time) {
            if (running=="pausing") {
                running="no";
                return false;
            }

            state=state.update(time, arrowKeys);
            display.syncState(state);
            if (state.status=="playing") {
                return true;
            } else if (ending>0) {
                ending-=time;
                return true;
            } else {
                display.clear();
                window.removeEventListener("keydown", spaceHandler);
                arrowKeys.unregister();
                resolve(state.status);
                return false;
            }
        }
        runAnimation(frame);
    });
}

const LIVES=+prompt('How many lives do you want?');

async function runGame(plans, Display) {
    let lives=LIVES;
    for (let level=0; level<plans.length&&lives>0;) {
        if (lives!=LIVES) alert(`Level ${level+1}, lives: ${lives}`);
        let status=await runLevel(new Level(plans[level]), Display);
        if (status==="won") level++;
        else lives--;
    }

    if (lives>0) alert("You're won!");
    else alert("Game over");
};

export { runGame };