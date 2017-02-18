define(["jquery", "pixelframe", "colorpicker", "controller"], function ($, PixelFrame, colorpicker, Controller) {
    $(function () {
        var url;

        $().ready(function () {
            url = $('body').data().url;



            PixelFrame.run();
            PixelFrame.setColor("#ff0000");

            var controller = new Controller(PixelFrame);
        });
    });
});
