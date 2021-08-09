// import { DOMisplay } from './display/DOMDisplay.js';
import { runGame } from './game/GameRunUtils.js'
import { CanvasDisplay } from './display/CanvasDisplay.js';
import { simpleLevelPlan, MonsterTest, GAME_LEVELS } from './Levels.js'

runGame(GAME_LEVELS, CanvasDisplay);

// runGame(simpleLevelPlan, CanvasDisplay);

//测试Monster 当从monster顶部接触时，会消除monster，因为没有monster图片所以使用DOMisplay测试
// runGame(MonsterTest, DOMisplay);