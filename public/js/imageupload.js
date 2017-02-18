define(["jquery"], function ($) {
    $().ready(function () {
        function fileUpload(event) {
            var uploadedFile = event.dataTransfer.files[0],
                reader = new FileReader();

            event.stopPropagation();
            event.preventDefault();


            reader.onload = function (fileEvent) { // finished reading file data.

                $.ajax({
                    url: url + '/imagetomatrix',
                    data: {
                        image: fileEvent.target.result
                    }
                }).done(function (result) {
                    PixelFrame.loadMatrixToFrame(PixelFrame.getCurrentFrameNumber(), JSON.parse(result));
                    PixelFrame.showFrame(PixelFrame.getCurrentFrameNumber())
                });


            };
            reader.readAsDataURL(uploadedFile);

        }

        function handleDragOver(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'move';
        }


        var dropZone = document.getElementById('pixelframe');
        dropZone.addEventListener('dragover', handleDragOver, false);
        dropZone.addEventListener('drop', fileUpload, false);
    });
});