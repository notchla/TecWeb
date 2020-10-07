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

    class Activity{
        constructor(type){
            this.type = type

            this.input = null
            this.out = []
            this.input = null

            this.rect_height = 0
            //draw activity graphics block
            this.rect = (function(){
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
                viewport.addChild(graphics)
        
                graphics
                .on('mousedown', onDragStart)
                .on('touchstart', onDragStart)
                .on('mouseup', onDragEnd)
                .on('mouseupoutside', onDragEnd)
                .on('touchend', onDragEnd)
                .on('touchendoutside', onDragEnd)
                .on('mousemove', onDragMove)
                .on('touchmove', onDragMove);

                Activity.rect_height = graphics.height
    
                return graphics
            })();
        }

        draw_output(color){
            var offset = this.rect.width / (this.out.length > 0 ? this.out.length + 2 : 2)
            
            function reposition_out(out){
                var index = out.length
                for (let i = 0; i < index; i++) {
                    var x = offset*(i+1)
                    var y = out[i].position.y
                    out[i].position.set(x, y)
                }
            }
            var obj = new PIXI.Graphics();
            obj.lineStyle(2, 0x000000, 1);
            obj.beginFill(color);
            obj.drawCircle(0, 0, 10);
            obj.endFill();
            var x_circle = this.rect.position.x + offset*(this.out.length + 1);
            var y_circle = this.rect.position.y + Activity.rect_height;
            obj.position.set(x_circle, y_circle);
            reposition_out(this.out)
            console.log(this.rect.position)
            this.rect.addChild(obj)
            this.out.push(obj)
        }

        draw_input(color){
            if(!this.input){
                var obj = new PIXI.Graphics();
                obj.lineStyle(2, 0x000000, 1);
                obj.beginFill(color);
                obj.drawCircle(0, 0, 10);
                obj.endFill();
                var x = this.rect.position.x + this.rect.width/2;
                var y = this.rect.position.y
                console.log(this.rect.position)
                obj.position.set(x, y)
                this.input = obj
                this.rect.addChild(obj)
            }
        }

    }

    var activity = new Activity("pippo")
    activity.draw_output(BUTTON_COLOR)
    activity.draw_output(BUTTON_COLOR)
    activity.draw_output(BUTTON_COLOR)
    activity.draw_input(BUTTON_COLOR)

})