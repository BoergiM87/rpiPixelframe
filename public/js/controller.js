/**
 * The controllers connects the PixelFrame logic with the UI related logic
 * This mostly concerns button presses, mouse clicks (ui => logic) but also affects draw events that need to be reflected
 * in the ui (logic => ui)
 */

define(["jquery", "layer"], function ($, Layer) {
    var _instance = null;

    var clipBoard = {
        layer: undefined
    };

    function Controller(pixelFrame) {
        var me = this;

        if (_instance) {
            return _instance;
        }


        me.pixelFrame = pixelFrame;

        $('body').keydown(me.keydown.bind(me));

        $('canvas').mouseup(function () {
            var me = this;
            me.redrawLayer();
        }.bind(me));

        $('canvas').on('color', function (e) {
            console.log(e);
        });

        $('#tools-pen').click(me.setTool.bind(me, {name: 'pen'}));
        $('#tools-rect').click(me.setTool.bind(me, {name: 'rect'}));
        $('#tools-fill').click(me.setTool.bind(me, {name: 'fill'}));
        $('#tools-pick').click(me.setTool.bind(me, {name: 'pick', callback: me.onColorPickerResult.bind(me)}));
        $('#tools-eraser').click((me.setTool.bind(me, {name: 'eraser'})));

        $('#framecontrol-btn-prev').click(me.previousFrame.bind(me));
        $('#framecontrol-btn-next').click(me.nextFrame.bind(me));
        $('#framecontrol-btn-play').click(me.playAnimation.bind(me, 0));


        $("input[name='layer']").click(me.selectLayer.bind(me));
        $("input[name='visibility']").click(me.toggleLayerVisibility.bind(me));
    }

    Controller.prototype = {
        layerToClipboard: function () {
            var me = this;

            clipBoard.layer = Layer.fromObject(JSON.parse(JSON.stringify(me.pixelFrame.getLayer())));
        },

        layerFromClipboard: function () {
            var me = this;

            if (!clipBoard.layer) {
                return;
            }

            // todo: do not directly modify the layers internal properties: Add a new layer to the current frame
            me.pixelFrame.getLayer().x = clipBoard.layer.x;
            me.pixelFrame.getLayer().y = clipBoard.layer.y;
            me.pixelFrame.getLayer().matrix = clipBoard.layer.matrix;
            me.pixelFrame.getLayer().visible = clipBoard.layer.visible;

            me.pixelFrame._redraw();
            me.redrawLayers();

        },

        onColorPickerResult: function (color) {
            var me = this;
            $("#picker").spectrum("set", color);
            me.pixelFrame.setColor(color);
        },

        setTool: function (tool) {
            var me = this;
            me.pixelFrame.setTool(tool);
        },

        toggleLayerVisibility: function (event) {
            var me = this;
            var layer = parseInt(event.target.value);

            if (event.target.checked) {
                me.pixelFrame.showLayer(me.pixelFrame.getCurrentLayerNumber());
            } else {
                me.pixelFrame.hideLayer((me.pixelFrame.getCurrentLayerNumber()));
            }
        },

        selectLayer: function () {
            var me = this;

            var selected = parseInt($("input[name='layer']:checked").val());

            me.pixelFrame.setCurrentLayer(selected);
        },

        copyFrame: function () {
            var me = this;
            toFrame = me.pixelFrame.getCurrentFrameNumber(),
                fromFrame = toFrame - 1;

            if (fromFrame < 0) {
                return;
            }

            me.pixelFrame.copyFrame(fromFrame, toFrame);
            me.pixelFrame.showFrame(toFrame);
            me.redrawLayers();

        },

        pick: function () {

        },

        clearFrame: function () {
            var me = this;
            me.pixelFrame.clear(me.pixelFrame.getCurrentFrameNumber());
            me.redrawLayers();
        },

        layerUp: function () {
            var me = this;
            me.pixelFrame.moveLayer(me.pixelFrame.getCurrentLayerNumber(), 0, -1);
            me.redrawLayer();
        },

        layerDown: function () {
            var me = this;
            me.pixelFrame.moveLayer(me.pixelFrame.getCurrentLayerNumber(), 0, 1);
            me.redrawLayer();
        },

        layerRight: function () {
            var me = this;
            me.pixelFrame.moveLayer(me.pixelFrame.getCurrentLayerNumber(), 1, 0);
            me.redrawLayer();
        },

        layerLeft: function () {
            var me = this;
            me.pixelFrame.moveLayer(me.pixelFrame.getCurrentLayerNumber(), -1, 0);
            me.redrawLayer();
        },

        moveLayerUp: function () {
            var me = this,
                currentLayer = me.pixelFrame.getCurrentLayerNumber();

            if (currentLayer == 0) {
                return;
            }

            me.pixelFrame.changeLayerOrder(currentLayer, currentLayer - 1);
            me.redrawLayer(currentLayer);
            me.redrawLayer(currentLayer - 1);
        },

        moveLayerDown: function () {
            var me = this;
            var currentLayer = me.pixelFrame.getCurrentLayerNumber();

            if (currentLayer == me.pixelFrame.getLayerCount()) {
                return;
            }

            me.pixelFrame.changeLayerOrder(currentLayer, currentLayer + 1);
            me.redrawLayer(currentLayer);
            me.redrawLayer(currentLayer + 1);
        },

        previousFrame: function () {
            var me = this;
            if (me.pixelFrame.getCurrentFrameNumber() <= 0) {
                return;
            }

            me.pixelFrame.showFrame(me.pixelFrame.getCurrentFrameNumber() - 1);
            me.redrawLayers();

            document.getElementById('framecontrol-current').innerHTML = me.pixelFrame.getCurrentFrameNumber();
        },

        nextFrame: function () {
            var me = this;
            me.pixelFrame.showFrame(me.pixelFrame.getCurrentFrameNumber() + 1);
            me.redrawLayers();
            
            document.getElementById('framecontrol-current').innerHTML = me.pixelFrame.getCurrentFrameNumber();
        },

        playAnimation: function (number) {
            var me = this;
            var count = me.pixelFrame.getFrameCount(),
                number = number || 0,
                frameRate = document.getElementById('framerate').selectedOptions[0].value;

            document.getElementById('framecontrol-current').innerHTML = number;

            me.pixelFrame.showFrame(number);

            if (me.pixelFrame.getCurrentFrameNumber() + 1 >= count) {
                return;
            }

            window.setTimeout(function () {
                me.playAnimation(me.pixelFrame.getCurrentFrameNumber() + 1);
            }, frameRate);
        },

        redrawLayers: function() {
            var me = this;

            for (var i = 0; i < me.pixelFrame.getLayerCount(); i++) {
                me.redrawLayer(i);
            }
        },

        redrawLayer: function (number) {
            var me = this,
                layerNo = typeof number === 'undefined' ? me.pixelFrame.getCurrentLayerNumber() : number,
                layer = me.pixelFrame.getLayer(layerNo),
                canvas = document.getElementById('layer-canvas-' + layerNo);

            layer.drawToCanvas(canvas);
        },

        keydown: function (event) {
            var me = this;

            switch (event.which) {
                case 37: // left
                    me.previousFrame();
                    break;
                case 38: // top
                    break;
                case 39: // right
                    me.nextFrame();
                    break;
                case 40: // down
                    break;
                case 13: // ENTER
                    me.copyFrame();
                    break;
                case 80: // p
                    me.setTool({name: 'pick', callback: me.onColorPickerResult.bind(me)});
                    break;
                case 27: // ESC
                    me.clearFrame();
                    break;
                case 87: // w
                    me.layerUp();
                    break;
                case 65: // a
                    me.layerLeft();
                    break;
                case 83: // s
                    me.layerDown();
                    break;
                case 68: // d
                    me.layerRight();
                    break;
                case 81: // q
                    me.previousFrame();
                    break;
                case 69: // e
                    me.nextFrame();
                    break;
                case 33: // PG UP
                    me.moveLayerUp();
                    break;
                case 34: // PG DOWN
                    me.moveLayerDown();
                    break;
                case 67: // c
                    me.layerToClipboard();
                    break;
                case 86: // v
                    me.layerFromClipboard();
                    break;
                default:
                    console.log(event.keyCode);
            }
        },
    }

    return Controller;
});