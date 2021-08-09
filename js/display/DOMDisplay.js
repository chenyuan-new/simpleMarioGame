/**
 * 使用DOM绘图
 * 利用table绘制界面
 */

//绘制界面
function elt(name, attrs, ...children) {
    let dom=document.createElement(name);
    for (let attr of Object.keys(attrs)) {
        dom.setAttribute(attr, attrs[attr]);
    }
    for (let child of children) {
        dom.appendChild(child);
    }
    return dom;
}

//将game界面挂载到parent上
class DOMisplay {
    constructor(parent, level) {
        this.dom=elt('div', { class: "game" }, drawGrid(level));
        this.actorLayer=null;
        parent.appendChild(this.dom);
    }

    clear() {
        this.dom.remove();
    }

    //每次清空actors重新绘制
    syncState(state) {
        if (this.actorLayer) this.actorLayer.remove();
        this.actorLayer=drawActors(state.actors);
        this.dom.appendChild(this.actorLayer);
        this.dom.className=`game ${state.status}`;
        this.scrollPlayerIntoView(state);
    }

    //将player引入界面中间部分
    scrollPlayerIntoView(state) {
        let width=this.dom.clientWidth;
        let height=this.dom.clientHeight;
        let margin=width/3;

        //获得被卷起来的高和左边距离
        let left=this.dom.scrollLeft,
            right=left+width;
        let top=this.dom.scrollTop,
            bottom=top+height;

        let player=state.player;
        let center=player.pos.plus(player.size.times(0.5)).times(scale);

        //将player放在中间1/3的位置范围内
        if (center.x<left+margin) {
            this.dom.scrollLeft=center.x-margin;
        } else if (center.x>right-margin) {
            this.dom.scrollLeft=center.x+margin-width;
        }
        if (center.y<top+margin) {
            this.dom.scrollTop=center.y-margin;
        } else if (center.y>bottom-margin) {
            this.dom.scrollTop=center.y+margin-height;
        }
    }
}

//一个unit占据的像素，单位是px
const scale=20;

//使用table布局绘制界面
function drawGrid(level) {
    return elt("table",
        { class: "background", style: `width: ${level.width*scale}px` },
        ...level.rows.map(row => elt("tr",
            { style: `height: ${scale}px` },
            ...row.map(type => elt("td", { class: type })))));
}

//绘制actors
function drawActors(actors) {
    return elt("div", {}, ...actors.map(actor => {
        let rect=elt("div", { class: `actor ${actor.type}` });
        // console.log(actor.type);
        rect.style.width=`${actor.size.x*scale}px`;
        rect.style.height=`${actor.size.y*scale}px`;
        rect.style.left=`${actor.pos.x*scale}px`;
        rect.style.top=`${actor.pos.y*scale}px`;
        return rect;
    }));
}

export { DOMisplay };
