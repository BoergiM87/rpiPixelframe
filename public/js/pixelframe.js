define(["layer"], function (Layer) {
    var _instance = null;

    function PixelFrame() {
        var me = this;

        if (_instance) {
            return _instance;
        }


        me.canvas = null;
        me.ctx = null;
        me.container = null;

        me.pixel_x = 0;
        me.pixel_y = 0;
        me.ppp = 0;
        me.ratio = 0;
        me.strokeColor = '#ff0000';

        me.tool = {name: 'pen'};

        me.baseColor = '#ffffff';
        me.frames = [
            {
                current_layer: 0,
                layers: []
            }
        ];

        me.current_frame = 0;

        me.is_drawing = false;

        _instance = me;
    }


    PixelFrame.prototype.moveLayer = function (layerNumber, x, y) {
        var me = this;
        me.getLayer(layerNumber).move(x, y);
        me._redraw();
    };

    PixelFrame.prototype.hideLayer = function (layerNumber) {
        var me = this;
        me.getLayer(layerNumber).hide();
        me._redraw();
    };


    PixelFrame.prototype.showLayer = function (layerNumber) {
        var me = this;
        me.getLayer(layerNumber).show();
        me._redraw();
    };

    PixelFrame.prototype.clear = function (frame) {
        var me = this;

        me.frames[me.current_frame] = me._createEmptyFrame();

        if (!frame) {
            me.frames = [];
            me.current_frame = 0;
        }

        me._redraw();
    };

    PixelFrame.prototype.showFrame = function (toFrame) {
        var me = this;

        if (!(toFrame in me.frames)) {
            me.copyFrame(me.current_frame, toFrame);
        }
        me.current_frame = toFrame;

        me._redraw();
    };

    PixelFrame.prototype.copyFrame = function (fromFrame, toFrame) {
        var me = this;

        me.frames[toFrame] = JSON.parse(JSON.stringify(me.frames[fromFrame]));
        me.frames[toFrame].layers = me.frames[toFrame].layers.map(function (layer) {
            return Layer.fromObject(layer);
        });
    };

    PixelFrame.prototype.getFrameCount = function () {
        var me = this;

        return me.frames.length;
    };

    PixelFrame.prototype.getLayerCount = function () {
        var me = this,
            frame = me.getCurrentFrame();

        return frame.layers.length;
    };

    PixelFrame.prototype.getCurrentFrame = function () {
        var me = this;

        return me.frames[me.current_frame];
    };

    PixelFrame.prototype.getLayer = function (number) {
        var me = this,
            curFrame = me.getCurrentFrame();


        return curFrame.layers[typeof  number === 'undefined' ? curFrame.current_layer : number];
    };

    PixelFrame.prototype.getCurrentFrameNumber = function () {
        var me = this;

        return me.current_frame;
    };

    PixelFrame.prototype.getCurrentLayerNumber = function () {
        var me = this;

        return me.getCurrentFrame().current_layer;
    };

    PixelFrame.prototype.changeLayerOrder = function (fromLayer, toLayer) {
        var me = this,
            frame = me.getCurrentFrame(),
            layers = frame.layers;

        layers.splice(toLayer, 0, layers.splice(fromLayer, 1)[0]);
        frame.layers = layers;
        me._redraw();
    };

    PixelFrame.prototype.addLayer = function () {

    };

    PixelFrame.prototype.setCurrentLayer = function (layer) {
        var me = this;

        if (!(layer in me.getCurrentFrame().layers)) {
            alert("Layer not found");
        }

        me.getCurrentFrame().current_layer = layer;
    };

    PixelFrame.prototype.setTool = function (tool) {
        var me = this;
        me.tool = tool;
    };


    PixelFrame.prototype.loadMatrixToFrame = function (frameNo, matrix) {
        var me = this,
            frame = me.frames[frameNo];

        frame.layers[frame.current_layer].matrix = matrix;
        me._redraw();
    };


    PixelFrame.prototype.run = function () {
        var me = this;

        me.canvas = document.getElementById('pixelframe');
        me.container = document.getElementById('container');
        me.ctx = me.canvas.getContext('2d');

        me.pixel_x = parseInt(me.canvas.dataset.width);
        me.pixel_y = parseInt(me.canvas.dataset.height);
        me.ratio = me.pixel_x / me.pixel_y;

        me.frames[me.current_frame] = me._createEmptyFrame();

        me._registerEvents();

        me._redraw();
    };

    PixelFrame.prototype.setColor = function (color) {
        var me = this;

        me.strokeColor = color;
    };


    PixelFrame.prototype._createEmptyFrame = function () {
        var me = this;

        return {
            current_layer: 0,
            layers: [
                new Layer(me.pixel_x, me.pixel_y),
                new Layer(me.pixel_x, me.pixel_y),
                new Layer(me.pixel_x, me.pixel_y),
                new Layer(me.pixel_x, me.pixel_y),
                new Layer(me.pixel_x, me.pixel_y),
                new Layer(me.pixel_x, me.pixel_y)
            ]
        };

    };

    PixelFrame.prototype._startDrawing = function (e) {
        var me = this;

        me.is_drawing = true;
        me._draw(e);
    };

    PixelFrame.prototype._stopDrawing = function (e) {
        var me = this,
            pixel = me._getPixelFromEvent(e),
            startX, endX,
            startY, endY;

        if (!me.is_drawing) {
            return;
        }

        if (me.tool.name == 'rect') {
            // rect tool should not finish / paint when the mouse leaves the canvas.
            if (e.type == 'mouseout') {
                return;
            }
            if (!pixel) {
                return;
            }
            startX = pixel.x;
            endX = me.tool.start.x;
            startY = pixel.y;
            endY = me.tool.start.y;

            if (pixel.x > me.tool.start.x) {
                startX = me.tool.start.x;
                endX = pixel.x;
            }

            if (pixel.y > me.tool.start.y) {
                startY = me.tool.start.y;
                endY = pixel.y;
            }

            for (var x = startX; x <= endX; x++) {
                for (var y = startY; y <= endY; y++) {
                    me._drawPen({x: x, y: y}, me.strokeColor);
                }
            }
            me.tool.start = undefined;
        }

        me.is_drawing = false;
    };

    PixelFrame.prototype._draw = function (e) {
        var me = this,
            color = me.strokeColor,
            pixel;

        if (!me.is_drawing) {
            return
        }

        pixel = me._getPixelFromEvent(e);

        if (pixel.x >= me.pixel_x || pixel.y >= me.pixel_y ||
            pixel.x < 0 || pixel.y < 0 ||
            isNaN(pixel.x) || isNaN(pixel.y)
        ) {
            return;
        }


        if (me.tool.name == 'rect') {
            if (me.tool.start == undefined) {
                me.tool.start = pixel;
            }
        }

        if (me.tool.name == 'eraser') {
            me._drawPen(pixel, undefined);
        }


        if (me.tool.name == 'pen') {
            me._drawPen(pixel, color);
        }

        if (me.tool.name == 'fill') {
            me._drawFill(pixel, me.getLayer().getColor(pixel), color, 1);
            me._redraw();
        }

        if (me.tool.name == 'pick') {
            me.tool.callback(me.getLayer().getColor(pixel));
        }
    };

    /**
     * Simple flood fill functionality.
     * todo: Currently recursion is used to find all pixels to be filled. This works fine for small grids (e.g.
     * 16x16 or 32x32) but might easily reach max call stack for larger grids.
     *
     * @param pixel
     * @param fromColor
     * @param toColor
     * @private
     */
    PixelFrame.prototype._drawFill = function (pixel, fromColor, toColor, depth) {
        var me = this,
            neighbours = [],
            curColor;

        me.getLayer().setColor(pixel, toColor);

        neighbours = [
            {x: pixel.x - 1, y: pixel.y},
            {x: pixel.x + 1, y: pixel.y},
            {x: pixel.x, y: pixel.y + 1},
            {x: pixel.x, y: pixel.y - 1}
        ];

        depth = depth + 1;

        neighbours.forEach(function (pixel) {
            if (pixel.x >= me.pixel_x || pixel.y >= me.pixel_y ||
                pixel.x < 0 || pixel.y < 0 ||
                isNaN(pixel.x) || isNaN(pixel.y)
            ) {
                return;
            }
            curColor = me.getLayer().getColor(pixel);

            if (curColor != fromColor || curColor == toColor) {
                return;
            }
            me._drawFill(pixel, fromColor, toColor, depth);
        });

    };

    PixelFrame.prototype._drawPen = function (pixel, color) {
        var me = this;

        me.getLayer().setColor(pixel, color);

        me._drawPixelThroughAllLayers(pixel);
    };

    PixelFrame.prototype._drawPixelThroughAllLayers = function (pixel) {
        var me = this,
            layerPixel,
            frame = me.getCurrentFrame(),
            layers = frame.layers,
            noPixelDrawn = true,
            layer = frame.layers[frame.current_layer];


        me.ctx.beginPath();
        for (var l = 0; l < layers.length; l++) {
            layer = layers[l];

            if (!layer.visible) {
                continue;
            }

            var color = layer.getColor(pixel);

            if (color == undefined) {
                continue;
            }

            noPixelDrawn = false;
            me._drawSinglePixel(pixel, color);
        }

        // if no pixel was set in any layer, we enforce a default pixel
        if (noPixelDrawn) {
            me._drawTransparentPixel(pixel);
        }

        me.ctx.closePath();
    };

    /**
     * todo: Instead of directly painting those "transparent" pixels each time, there could be a whole canvas
     * layer "background" with z-index=0; the canvas will take care of the layering / transparency itself and the
     * amount of data on the actual "paint" canvas element is kept simple.
     *
     * @param pixel
     * @private
     */
    PixelFrame.prototype._drawTransparentPixel = function (pixel) {
        var me = this,
            ppp = me.ppp - 2,
            ctx = me.ctx,
            pixNum = 4,
            transPixelSize = ppp / pixNum,
            col1 = '#ffffff', col2 = '#c0c0c0',
            offX, offY;

        for (var i = 1; i <= Math.pow(pixNum, 2); i++) {
            offY = Math.ceil(i / 4) - 1;
            offX = i % 4;

            me.ctx.fillStyle = (offY + offX) % 2 == 0 ? col1 : col2;


            me.ctx.fillRect(pixel.x * me.ppp + 1 + (offX * transPixelSize), pixel.y * me.ppp + 1 + (offY * transPixelSize), transPixelSize, transPixelSize);
        }

    };


    PixelFrame.prototype._drawSinglePixel = function (pixel, color) {
        var me = this,
            ctx = me.ctx,
            ppp = me.ppp;


        ctx.fillStyle = color;
        ctx.fillRect(pixel.x * ppp + 1, pixel.y * ppp + 1, ppp - 2, ppp - 2);

    };

    PixelFrame.prototype._getPixelFromEvent = function (e) {
        var me = this,
            rect = me.canvas.getBoundingClientRect(),
            posX = e.clientX - rect.left,
            posY = e.clientY - rect.top,

            ppp = me.ppp,
            pixelX = Math.floor(posX / ppp),
            pixelY = Math.floor(posY / ppp);

        return {
            x: Math.floor(pixelX),
            y: Math.floor(pixelY)
        };
    };

    PixelFrame.prototype._redraw = function () {
        var me = this,
            parentRect = me.container.getBoundingClientRect(),
            width, height;

        // floor the "pixel per pixel" value, so we can have full pixel strokes
        // - this forces the ppp value to be an int
        width = Math.floor(parentRect.height / me.pixel_x) * me.pixel_x;

        if (width > parentRect.width) {
            width = parentRect.width;
            height = Math.floor(parentRect.width / me.pixel_y) * me.pixel_y;
        }

        me.ppp = width / me.pixel_x;

        me.canvas.width = width;
        me.canvas.height = me.canvas.width * me.ratio;

        me._draw_grid();
    };

    PixelFrame.prototype._draw_grid = function () {
        var me = this,
            ppp = me.ppp,
            width = ppp * me.pixel_x,
            height = ppp * me.pixel_y,
            ctx = me.ctx;

        ctx.clearRect(0, 0, me.canvas.width, me.canvas.height);

        ctx.beginPath();

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';


        // box
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.lineTo(0, 0);

        // vertical lines
        for (var i = 0; i < me.pixel_x; i++) {
            ctx.moveTo(i * ppp, 0);
            ctx.lineTo(i * ppp, height);
        }
        for (i = 0; i < me.pixel_y; i++) {
            ctx.moveTo(0, i * ppp);
            ctx.lineTo(width, i * ppp);
        }
        ctx.stroke();


        // fill matrix
        for (var x = 0; x < me.pixel_x; x++) {
            for (var y = 0; y < me.pixel_y; y++) {
                me._drawPixelThroughAllLayers({
                        x: x,
                        y: y
                    }
                )
            }
        }


        ctx.closePath();
    };


    PixelFrame.prototype._registerEvents = function () {
        var me = this;

        window.addEventListener('resize', me._redraw.bind(me));


        // touch conversion
        me.canvas.addEventListener("touchstart", function (e) {

            if (e.touches.length > 1) {
                return;
            }

            var touch = e.touches[0];
            var mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            me.canvas.dispatchEvent(mouseEvent);
            e.preventDefault();
        }, false);

        me.canvas.addEventListener("touchend", function (e) {
            if (e.touches.length > 1) {
                return;
            }
            var mouseEvent = new MouseEvent("mouseup", {});
            me.canvas.dispatchEvent(mouseEvent);
            e.preventDefault();
        }, false);

        me.canvas.addEventListener("touchmove", function (e) {

            if (e.touches.length > 1) {
                return;
            }

            var touch = e.touches[0];
            var mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            me.canvas.dispatchEvent(mouseEvent);
            e.preventDefault();
        }, false);

        /*
         me.canvas.addEventListener('touchstart', me._startDrawing.bind(me));
         me.canvas.addEventListener('touchmove', me._draw.bind(me));
         me.canvas.addEventListener('touchend', me._stopDrawing.bind(me));
         */

        // mouse start
        me.canvas.addEventListener('mousedown', me._startDrawing.bind(me));
        // mouse draw
        me.canvas.addEventListener('mousemove', me._draw.bind(me));
        // mouse end
        me.canvas.addEventListener('mouseup', me._stopDrawing.bind(me));
        me.canvas.addEventListener('mouseout', me._stopDrawing.bind(me));
    };


    return new PixelFrame();
});