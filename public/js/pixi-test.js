var Counter = function(){
    this.i = 0;
    return {
        get : function(){i = i + 1; return i}
    }
}();

class TreeNode {
    //parent node
    //child tree
    //siblings
    constructor() {
      this.parent = null; //root
      this.child = null;
      this.sibling = null;
      this.nodeID = Counter.get()
    }
  
    insertChild(child) {
      child.parent = this;
      child.sibling = this.child;
        this.child = child;
    }

    insertSibling(sibling) {
        if(this.parent != null) { //not root
            sibling.parent = this.parent;
            sibling.sibling = this.sibling;
            this.sibling = sibling;
        }
    }

    deleteChild() {
        if(this.child != null) {
            this.child = this.child.sibling;
        }
    }

    deleteSibling() {
        if(this.child != null) {
            this.sibling = this.sibling.sibling;
        }
    }

    getnextSibling() {
        return this.sibling;
    }   

    getfirstChild() {
        return this.child;
    }
}

  
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

    class Activity extends TreeNode{
        constructor(type){
            super()
            this.type = type

            this.input = [] //test
            this.out = []
            this.input_lines = []
            this.output_lines = []
            this.rect_height = 0
            //draw activity graphics block
            this.rect = (function(data){

                function traslateOutputLines(lines, positions){
                    
                    lines.forEach((element, index) => {
                        if(element instanceof PIXI.Graphics){
                            var pos = positions[index]
                            element.updatePoints(pos)
                        }
                    });
                }

                function traslateInputLines(lines, pos){
                    lines.forEach(element => {
                        if(element instanceof PIXI.Graphics){
                            element.updatePoints(pos)
                        }
                    })
                }

                function onDragStart(event){
                    this.data = event.data
                    this.alpha = 0.5
                    this.dragging = true;
                    this.oldPosition = this.data.getLocalPosition(this.parent)
                }
            
                function onDragEnd(){
                    this.alpha = 1
                    this.dragging = false
                    this.data = null
                }
            
                function onDragMove(event){

                    function getOutPositions(out){
                        var positions = []
                        out.forEach(element => {
                            var globalPosition = element.getGlobalPosition()
                            positions.push([globalPosition.x, globalPosition.y, null, null])
                        })
                        return positions;
                    }

                    function getInputPosition(input){
                        var position = []
                        var globalPosition = input.getGlobalPosition()
                        position = [null, null, globalPosition.x, globalPosition.y]
                        return position
                    }

                    if(this.dragging){
                        var newPosition = this.data.getLocalPosition(this.parent);
                        this.position.x += (newPosition.x - this.oldPosition.x)
                        this.position.y += (newPosition.y - this.oldPosition.y)
                        this.oldPosition = newPosition
                        if(event.currentTarget.input_lines.length){
                            var position = getInputPosition(event.currentTarget.input[0])
                            traslateInputLines(event.currentTarget.input_lines, position)
                        }
                        if(event.currentTarget.output_lines.length){
                            var positions = getOutPositions(event.currentTarget.out)
                            traslateOutputLines(event.currentTarget.output_lines, positions)
                        }

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
                .on('touchmove', onDragMove)
                .output_lines = data.output_lines

                graphics.input_lines = data.input_lines
                graphics.out = data.out
                graphics.input = data.input
                graphics.nodeID = data.nodeID

                Activity.rect_height = graphics.height
                return graphics
            })(this);
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
            obj.interactive = true
            var x_circle = this.rect.position.x + offset*(this.out.length + 1);
            var y_circle = this.rect.position.y + Activity.rect_height;
            obj.position.set(x_circle, y_circle);
            reposition_out(this.out)
            this.rect.addChild(obj)
            this.out.push(obj)
            this.output_lines.push({})

            function onDragStart(event){
                event.stopPropagation()
                this.alpha = 0.5
                this.dragging = true
                var index = event.currentTarget.line_index
                var globalPosition = obj.getGlobalPosition()
                var line = new Line([globalPosition.x, globalPosition.y, event.data.global.x, event.data.global.y], 10, 0x6EA62E)
                viewport.addChild(line)
                event.currentTarget.output_lines[index] = line
            }
        
            function onDragEnd(event){

                function checkCollision(mouse, input){
                    if(input){
                        var box = input.getBounds()

                        return mouse.x >= box.x &&
                               mouse.x <= box.x + box.width &&
                               mouse.y >= box.y &&
                               mouse.y <= box.y + box.height 
                    }
                    return false
                }

                event.stopPropagation()
                this.alpha = 1
                this.dragging = false
                var collision = false;

                var activity = app.renderer.plugins.interaction.hitTest(event.data.global)
                if(activity && activity.nodeID != event.currentTarget.nodeID){
                    if(checkCollision(event.data.global, activity.input[0])){
                        collision = true
                        activity.input_lines.push(event.currentTarget.output_lines[event.currentTarget.line_index])
                    }
                }
                    
            }
        
            function onDragMove(event){
                if(this.dragging){
                    event.stopPropagation()
                    var index = event.currentTarget.line_index
                    var line = event.currentTarget.output_lines[index]
                    var globalPosition = obj.getGlobalPosition()
                    line.updatePoints([globalPosition.x, globalPosition.y, event.data.global.x, event.data.global.y])
                }
            }

            obj
                .on('mousedown', onDragStart)
                .on('touchstart', onDragStart)
                .on('mouseup', onDragEnd)
                .on('mouseupoutside', onDragEnd)
                .on('touchend', onDragEnd)
                .on('touchendoutside', onDragEnd)
                .on('mousemove', onDragMove)
                .on('touchmove', onDragMove)
                .line_index = this.out.length - 1
            obj.output_lines = this.output_lines
            obj.nodeID = this.nodeID


        }

        draw_input(color){
            if(true){
                var obj = new PIXI.Graphics();
                obj.lineStyle(2, 0x000000, 1);
                obj.beginFill(color);
                obj.drawCircle(0, 0, 10);
                obj.endFill();
                var x = this.rect.position.x + this.rect.width/2;
                var y = this.rect.position.y
                obj.position.set(x, y)
                this.input.push(obj)
                this.rect.addChild(obj)
            }
        }

    }

    class Line extends PIXI.Graphics {
        constructor(points, lineSize, lineColor){
            super();
            var size = this.lineWidth = lineSize || 5;
            var color = this.lineColor = lineColor || 0x000000;

            this.points = points;

            this.lineStyle(size, color)

            this.moveTo(points[0], points[1])
            this.lineTo(points[2], points[3])
        }

        updatePoints(p){
            var points = this.points = p.map((val, index) => val || this.points[index])

            var size = this.lineWidth
            var color = this.lineColor

            this.clear()
            this.lineStyle(size, color)
            this.moveTo(points[0], points[1])
            this.lineTo(points[2], points[3])
        }
    }

    var activity = new Activity("pippo")
    activity.draw_output(BUTTON_COLOR)
    activity.draw_output(BUTTON_COLOR)
    activity.draw_output(BUTTON_COLOR)
    activity.draw_input(BUTTON_COLOR)

    var act = new Activity("pluto")
    act.draw_output(BUTTON_COLOR)


})