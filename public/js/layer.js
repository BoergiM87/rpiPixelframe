define([], function () {
    function Layer(width, height) {
        var me = this;

        me.visible = true;
        me.x = 0;
        me.y = 0;
        me.width = width;
        me.height = height;
        me.matrix = [];

        me.empty();

    }

    Layer.fromObject = function(obj) {
        var me = new Layer(obj.width, obj.height);

        me.empty();

        me.visible = obj.visible;
        me.x = obj.x;
        me.y = obj.y;
        me.matrix = obj.matrix;

        return me;
    };

    Layer.prototype = {
        empty: function () {
            var me = this;

            for (var i = 0; i < me.width; i++) {
                me.matrix[i] = new Array(me.height);
            }
        },

        hide: function(){
            var me = this;

            me.visible = false;
        },

        show: function() {
            var me = this;

            me.visible = true;
        },

        /**
         * Pixel must be a frame related pixel, it is transformed here on the fly
         * @param pixel
         */
        setColor: function (pixel, color) {
            var me = this;

            pixel = me._transitionLayerPixel(pixel);

            me.matrix[pixel.x][pixel.y] = color;
        },

        getColor: function (pixel) {
            var me = this;

            pixel = me._transitionLayerPixel(pixel);

            return me.matrix[pixel.x][pixel.y];
        },

        setMatrix: function (matrix) {
            var me = this;

            me.matrix = matrix;
        },

        /**
         * By default the layer will be exactly the size of the frame. If the layer is moved, it is dynamically
         * extended.
         *
         * @param byX
         * @param byY
         */
        move: function(byX, byY) {
            var me = this;


            if (byX < 0) {
                me.x += byX;
            }
            if (byY < 0) {
                me.y += byY;
            }

            if (byX > 0) {
                me.width += 1;
                me.matrix.unshift(new Array(me.height));
            }
            if (byY > 0) {
                me.height += 1;
                for (var i = 0; i < me.width; i++) {
                    me.matrix[i].unshift(undefined);
                }
            }

            if (me.x + me.width <= 15) {
                me.width += 1;
                me.matrix.push(new Array(me.height));
            }
            if (me.y + me.height <= 15) {
                me.height += 1;
                for (var i = 0; i < me.width; i++) {
                    me.matrix[i].push(undefined);
                }
            }

        },

        drawToCanvas: function(canvas) {
            var me = this,
                ctx = canvas.getContext('2d'),
                pixel,
                color;


            /// create an extra step for re-sizing image
            var tmpCanvas = document.createElement('canvas'),
                tmpContext;

            // todo@dn: Replace 16 with actual frame size
            tmpCanvas.width = 16;
            tmpCanvas.height = 16;

            tmpContext = tmpCanvas.getContext('2d');


            tmpContext.beginPath();


            // todo@dn: Replace 16 with actual frame size
            for (var x = 0; x < 16; x++) {
                for (var y = 0; y < 16; y++) {
                    pixel = me._transitionLayerPixel({x: x, y:y});

                    color = me.matrix[pixel.x][pixel.y];

                    if (color == undefined) {
                        continue;
                    }

                    tmpContext.fillStyle = color;
                    tmpContext.fillRect(x, y, 1, 1);
                }
            }
            tmpContext.closePath();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tmpCanvas, 0, 0, 16, 16)
        },

        _transitionLayerPixel: function (pixel) {
            var me = this,
                x, y;

            x = pixel.x - me.x;
            y = pixel.y - me.y;

            return {
                x: x,
                y: y
            };

        }

    };

    return Layer;
});