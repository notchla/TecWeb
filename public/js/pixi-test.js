$(document).ready(function(){
    let app = new PIXI.Application({
        antialias: false,
        autoresize: true,
        resoluzion: window.devicePixelRatio
    })
    app.renderer.backgroundColor = 0x202125;
    app.renderer.view.style.position = 'absolute';
    app.renderer.view.style.display = 'block';
    document.body.appendChild(app.view);

    var viewport = new Viewport.Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 3500,
        worldHeight: 2000,
        disableOnContextMenu: true,
        interaction: app.renderer.plugins.interaction
    })

    app.stage.addChild(viewport)
    app.renderer.render(viewport)
    app.renderer.resize(window.innerWidth, window.innerHeight);
    function resize() {
        viewport.screenWidth = window.innerWidth;
        viewport.screenHeight = window.innerHeight;
        app.renderer.resize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', resize);

    var FONT = 'Arial';
    var FONT_SIZE = 18;
    var TEXT_COLOR = 'white';
    var BUTTON_COLOR = 0x5DBCD2;
    var BLOCK_WIDTH = 200
    var BLOCK_HEIGHT = 150

    function draw_block(type){
        var width = BLOCK_WIDTH
        var height = BLOCK_HEIGHT
        var graphics = new PIXI.Graphics();
        graphics.interactive = true
        graphics.lineStyle(2, 0x000000, 1);
        graphics.beginFill(BUTTON_COLOR);
        graphics.drawRect(0, 0, width, height);
        graphics.endFill();
        var text = new PIXI.Text(type,
            {
                fontFamily: FONT,
                fontSize: FONT_SIZE,
                fill: TEXT_COLOR,
            })
        text.anchor.set(0.5, 0.5);
        text.position.set(graphics.width / 2, graphics.height / 2);
        graphics.addChild(text);
        app.stage.addChild(graphics)

        graphics
        .on('mousedown', onDragStart)
        .on('touchstart', onDragStart)
        .on('mouseup', onDragEnd)
        .on('mouseupoutside', onDragEnd)
        .on('touchend', onDragEnd)
        .on('touchendoutside', onDragEnd)
        .on('mousemove', onDragMove)
        .on('touchmove', onDragMove);

    }

    draw_block("pippo")

    function onDragStart(event){
        this.data = event.data
        this.alpha = 0.5
        this.dragging = true;
    }

    function onDragEnd(){
        this.alpha = 1
        this.dragging = false
        this.data = null
    }

    function onDragMove(){
        if(this.dragging){
            var newPosition = this.data.getLocalPosition(this.parent);
            this.position.x = newPosition.x
            this.position.y = newPosition.y
        }
    }

})