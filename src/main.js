/// <reference path="easeljs/easeljs.d.ts" />
/// <reference path="preloadjs/preloadjs.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var demo;
(function (demo) {
    var numParticles = 0;
    var forceMapIndexA = 0;
    var forceMapIndexB = 1;
    var stage;
    var particleList = [];
    var canvas;
    var colorList;
    var loadQueue;
    var SCALE_DOWN = 1.0;
    var stageW;
    var stageH;
    var ORIGINAL_W = 256;
    var ORIGINAL_H = 256;
    var spriteSheet;
    var STEP = 250;
    var STEP_MINI = 25;
    var renderMode;
    var resolution = false;
    var ratio;
    function init() {
        loadQueue = new createjs.LoadQueue(false);
        loadQueue.addEventListener("complete", handleComplete);
        loadQueue.loadManifest([
            { src: "imgs/forcemap.png", id: "forcemap" },
            { src: "imgs/arrow.png", id: "display" },
        ], false);
        loadQueue.load();
    }
    demo.init = init;
    function handleComplete(event) {
        var arrowImage = loadQueue.getResult("display");
        var forceMapImage = loadQueue.getResult("forcemap");
        var forceMapElement = document.createElement("canvas");
        forceMapElement.setAttribute("width", forceMapImage.width + "");
        forceMapElement.setAttribute("height", forceMapImage.height + "");
        var forceMapCanvas = forceMapElement.getContext("2d");
        forceMapCanvas.drawImage(forceMapImage, 0, 0);
        canvas = document.getElementById("myCanvas");
        stage = new createjs.SpriteStage(canvas, false, true);
        handleResize();
        // タッチを有効化
        if (createjs.Touch.isSupported()) {
            createjs.Touch.enable(stage);
        }
        // イベントはすべて切る
        stage.mouseChildren = stage.mouseEnabled = false;
        if (stage.isWebGL) {
            numParticles = STEP;
            renderMode = "WebGL";
        }
        else {
            numParticles = STEP;
            renderMode = "HTML5 Canvas";
        }
        spriteSheet = new createjs.SpriteSheet({
            images: [arrowImage],
            frames: { width: 64, height: 64, regX: +32, regY: +32 }
        });
        colorList = [];
        var maxY = forceMapImage.height * SCALE_DOWN;
        var maxX = forceMapImage.width * SCALE_DOWN;
        // getImageData() メソッドが特定のブラウザ(Mobile Firefox)で激遅でfor文で何度も使うとタイムアウトするため、getImageData()メソッドは一回だけ叩くようにする
        var imageDataList = forceMapCanvas.getImageData(0, 0, maxX, maxY).data;
        for (var y = 0; y < maxY; y++) {
            colorList[y] = [];
            for (var x = 0; x < maxX; x++) {
                var indexPixel = x * 4 + y * maxX * 4;
                var indexR = indexPixel + 0;
                var indexG = indexPixel + 1;
                var indexB = indexPixel + 2;
                colorList[y][x] = [imageDataList[indexR], imageDataList[indexG], imageDataList[indexB]];
            }
        }
        resetParticles();
        createjs.Ticker.setFPS(60);
        createjs.Ticker.timingMode = createjs.Ticker.RAF;
        createjs.Ticker.addEventListener("tick", tick);
        setInterval(resetForceMapIndex, 2000);
        setInterval(calcFps, 1000);
        // あとUI関連
        document.getElementById("btnAdd").addEventListener("click", onClickAdd);
        document.getElementById("btnRemove").addEventListener("click", onClickRemove);
        document.getElementById("radioHR").addEventListener("change", onClickReslution);
        window.addEventListener("resize", handleResize);
    }
    function onClickAdd(e) {
        if (numParticles < STEP) {
            numParticles += STEP_MINI;
        }
        else {
            numParticles += STEP;
        }
        resetParticles();
    }
    function onClickRemove(e) {
        if (numParticles <= STEP) {
            numParticles -= STEP_MINI;
        }
        else {
            numParticles -= STEP;
        }
        if (numParticles < STEP_MINI)
            numParticles = STEP_MINI;
        resetParticles();
    }
    function onClickReslution(e) {
        resolution = e.target.checked;
        handleResize();
    }
    function resetParticles() {
        stage.removeAllChildren();
        particleList = [];
        for (var i = 0; i < numParticles; i++) {
            var arrow = new Arrow(spriteSheet, Math.random() * stageW >> 0, Math.random() * stageH >> 0);
            arrow.alpha = Math.random();
            // arrow.compositeOperation = "lighter"; // SpriteStageでは無効
            arrow.scaleX = arrow.scaleY = ratio * 0.25;
            stage.addChild(arrow);
            particleList[i] = arrow;
        }
        document.getElementById("numParticle").innerHTML = numParticles + "";
    }
    function tick(event) {
        var factorW = SCALE_DOWN * ORIGINAL_W / stageW;
        var factorH = SCALE_DOWN * ORIGINAL_H / stageH;
        var maxY = colorList.length;
        var maxX = colorList[0].length;
        for (var i = 0; i < numParticles; i++) {
            var arrow = particleList[i];
            var indexY = Math.floor(arrow.y * factorW);
            var indexX = Math.floor(arrow.x * factorH);
            if (indexY >= maxY)
                indexY = maxY - 1;
            if (indexX >= maxX)
                indexX = maxX - 1;
            var data = colorList[indexY][indexX];
            arrow.step(data[forceMapIndexA], data[forceMapIndexB]);
        }
        stage.update();
    }
    function resetForceMapIndex() {
        var indexArr = [0, 1, 2];
        forceMapIndexA = indexArr[indexArr.length * Math.random() >> 0];
        forceMapIndexB = indexArr[indexArr.length * Math.random() >> 0];
    }
    function handleResize() {
        stageW = Number(window.innerWidth);
        stageH = Number(window.innerHeight) - 64;
        if (resolution) {
            ratio = window.devicePixelRatio || 1.0;
        }
        else {
            ratio = 1.0;
        }
        stageW *= ratio;
        stageH *= ratio;
        canvas.width = stageW;
        canvas.height = stageH;
        setTimeout(function () {
            canvas.style.zoom = 1 / ratio + "";
            //			canvas.style.width = stageW / radio + "px"; //なぜか効かない…
            //			canvas.style.height = stageH / radio + "px";
        }, 50);
        stage.updateViewport(stageW, stageH);
        resetParticles();
    }
    function calcFps() {
        document.getElementById("fps").innerHTML = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps" + " (" + renderMode + ")";
    }
    var Arrow = (function (_super) {
        __extends(Arrow, _super);
        function Arrow(imageOrUri, x, y) {
            _super.call(this, imageOrUri);
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.ax = 0;
            this.ay = 0;
            this.friction = 0.0001 * Math.random() + 0.0001;
        }
        Arrow.prototype.step = function (colorA, colorB) {
            this.ax += (colorA - 128) * this.friction * ratio;
            this.ay += (colorB - 128) * this.friction * ratio;
            this.vx += this.ax;
            this.vy += this.ay;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation = Math.atan2(this.ay, this.ax) * 180 / Math.PI;
            var velocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.alpha = velocity / 20 / ratio; // 20は適当
            this.ax *= .98;
            this.ay *= .98;
            this.vx *= .94;
            this.vy *= .94;
            (this.x > stageW) ? this.x = 0 : (this.x < 0) ? this.x = stageW : 0;
            (this.y > stageH) ? this.y = 0 : (this.y < 0) ? this.y = stageH : 0;
        };
        return Arrow;
    })(createjs.Sprite);
})(demo || (demo = {}));
window.addEventListener("load", function (event) {
    demo.init();
});
//# sourceMappingURL=main.js.map