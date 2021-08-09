# 简易马里奥游戏

## 运行

由于`chrome`限制不支持`<script type="module">`，需要本地开启一个服务器才可以运行，可以使用`vscode`打开`index.html`，在代码区域右键选择`Open with live server`即可在浏览器中运行游戏

也可将`js`文件夹下的`.js`文件整合成一个文件引入`index.html`中，去除`type="module"`即可通过直接在浏览器中打开`index.html`文件运行游戏

## 项目结构

```
|   index.html                   入口文件
|   README.MD                    
|   style.css                    使用DOMDisplay时的样式
|   
+---img
|       player.png
|       sprites.png
|       
\---js
    |   index.js                 js主入口文件
    |   Levels.js                各等级对应的地图
    |   
    +---display
    |       CanvasDisplay.js     使用canvas绘制界面
    |       DOMDisplay.js        使用css table样式绘制界面
    |       
    \---game
            game.js              游戏包含的各种类Level State Player Coin Lava Monster Vec等
            GameRunUtils.js      运行游戏的函数

```
