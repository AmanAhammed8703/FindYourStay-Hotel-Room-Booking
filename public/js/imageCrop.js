
    function viewImage1(event) {
        const imagebox = document.getElementById('image-box')
    const crop_btn = document.getElementById('crop-btn')
    var fileInput = document.getElementById('img1');

    let file1 = event.target.files[0].name
    let file = event.target.files[0]
    let extension = file1.split('.').pop()
    if (extension == 'jpeg' || extension == 'png' || extension == 'jpg') {
        document.getElementById('imagePreview1').src = URL.createObjectURL(event.target.files[0])
            document.getElementById('imagePreview1').style.display = 'block'

    const img_data = fileInput.files[0]
    const url = URL.createObjectURL(img_data)
    imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`
        const image = document.getElementById('image')
        document.getElementById('image-box').style.display = 'block'
        document.getElementById('crop-btn').style.display = 'block'
        document.getElementById('confirm-btn').style.display = 'none'

        const cropper = new Cropper(image, {
            autoCropArea: 1,
        viewMode: 1,
        scalable: false,
        zoomable: false,
        movable: false,
        aspectRatio: 16 / 9,
        //  preview: '.preview',
        minCropBoxWidth: 180,
        minCropBoxHeight: 200,
            })
            crop_btn.addEventListener('click', () => {
            cropper.getCroppedCanvas().toBlob((blob) => {
                let fileInputElement = document.getElementById('img1');
                let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
                let container = new DataTransfer();
                
                container.items.add(file);  
                const img = container.files[0] 
                var url = URL.createObjectURL(img)
                fileInputElement.files = container.files;
                document.getElementById('imagePreview1').src = url
                document.getElementById('image-box').style.display = 'none'
                document.getElementById('crop-btn').style.display = 'none'
                document.getElementById('confirm-btn').style.display = 'block'
            });     
            });

        } else {

            document.getElementById('errormessage1').style.display = 'block'
            document.getElementById('imagePreview1').style.display = 'none'
        $('#img1').val(null)
        }

    }
        function viewImage2(event) {
         const imagebox = document.getElementById('image-box')
        const crop_btn = document.getElementById('crop-btn')
        var fileInput = document.getElementById('img2');

        let file = event.target.files[0].name
        let extension = file.split('.').pop()
        if (extension == 'jpeg' || extension == 'png' || extension == 'jpg') {
            document.getElementById('imagePreview2').src = URL.createObjectURL(event.target.files[0])
            document.getElementById('imagePreview2').style.display = 'block'

        const img_data = fileInput.files[0]
        const url = URL.createObjectURL(img_data)
        imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`
            const image = document.getElementById('image')
            document.getElementById('image-box').style.display = 'block'
            document.getElementById('crop-btn').style.display = 'block'
            //document.getElementById('confirm-btn').style.display = 'none'

            const cropper = new Cropper(image, {
                autoCropArea: 1,
            viewMode: 1,
            scalable: false,
            zoomable: false,
            movable: false,
            aspectRatio: 16 / 9,
            //  preview: '.preview',
            minCropBoxWidth: 180,
            minCropBoxHeight: 200,
            })
            crop_btn.addEventListener('click', () => {
                cropper.getCroppedCanvas().toBlob((blob) => {
                    let fileInputElement = document.getElementById('img2');
                    let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
                    let container = new DataTransfer();

                    container.items.add(file);
                    const img = container.files[0]
                    var url = URL.createObjectURL(img)
                    fileInputElement.files = container.files;
                    document.getElementById('imagePreview2').src = url
                    document.getElementById('image-box').style.display = 'none'
                    document.getElementById('crop-btn').style.display = 'none'
                    //document.getElementById('confirm-btn').style.display = 'block'
                });
            });
        } else {
                document.getElementById('errormessage2').style.display = 'block'
            document.getElementById('imagePreview2').style.display = 'none'
            $('#img2').val(null)
        }
    }
            function viewImage3(event) {
          const imagebox = document.getElementById('image-box')
            const crop_btn = document.getElementById('crop-btn')
            var fileInput = document.getElementById('img3');

            let file = event.target.files[0].name
            let extension = file.split('.').pop()
            if (extension == 'jpeg' || extension == 'png' || extension == 'jpg') {
                document.getElementById('imagePreview3').src = URL.createObjectURL(event.target.files[0])
            document.getElementById('imagePreview3').style.display = 'block'

            const img_data = fileInput.files[0]
            const url = URL.createObjectURL(img_data)
            imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`
                const image = document.getElementById('image')
                document.getElementById('image-box').style.display = 'block'
                document.getElementById('crop-btn').style.display = 'block'
                document.getElementById('confirm-btn').style.display = 'none'

                const cropper = new Cropper(image, {
                    autoCropArea: 1,
                viewMode: 1,
                scalable: false,
                zoomable: false,
                movable: false,
                aspectRatio: 16 / 9,
                //  preview: '.preview',
                minCropBoxWidth: 180,
                minCropBoxHeight: 200,
            })
            crop_btn.addEventListener('click', () => {
                    cropper.getCroppedCanvas().toBlob((blob) => {
                        let fileInputElement = document.getElementById('img3');
                        let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
                        let container = new DataTransfer();

                        container.items.add(file);
                        const img = container.files[0]
                        var url = URL.createObjectURL(img)
                        fileInputElement.files = container.files;
                        document.getElementById('imagePreview3').src = url
                        document.getElementById('image-box').style.display = 'none'
                        document.getElementById('crop-btn').style.display = 'none'
                        document.getElementById('confirm-btn').style.display = 'block'
                    });
            });
        } else {
                    document.getElementById('errormessage3').style.display = 'block'
            document.getElementById('imagePreview3').style.display = 'none'
                $('#img3').val(null)
        }
    }
                function viewImage4(event) {
        const imagebox = document.getElementById('image-box')
                const crop_btn = document.getElementById('crop-btn')
                var fileInput = document.getElementById('img4');

                let file = event.target.files[0].name
                let extension = file.split('.').pop()
                if (extension == 'jpeg' || extension == 'png' || extension == 'jpg') {
                    document.getElementById('imagePreview4').src = URL.createObjectURL(event.target.files[0])
            document.getElementById('imagePreview4').style.display = 'block'


                const img_data = fileInput.files[0]
                const url = URL.createObjectURL(img_data)
                imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`
                    const image = document.getElementById('image')
                    document.getElementById('image-box').style.display = 'block'
                    document.getElementById('crop-btn').style.display = 'block'
                    document.getElementById('confirm-btn').style.display = 'none'

                    const cropper = new Cropper(image, {
                        autoCropArea: 1,
                    viewMode: 1,
                    scalable: false,
                    zoomable: false,
                    movable: false,
                    aspectRatio: 16 / 9,
                    //  preview: '.preview',
                    minCropBoxWidth: 180,
                    minCropBoxHeight: 200,
            })
            crop_btn.addEventListener('click', () => {
                        cropper.getCroppedCanvas().toBlob((blob) => {
                            let fileInputElement = document.getElementById('img4');
                            let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
                            let container = new DataTransfer();

                            container.items.add(file);
                            const img = container.files[0]
                            var url = URL.createObjectURL(img)
                            fileInputElement.files = container.files;
                            document.getElementById('imagePreview4').src = url
                            document.getElementById('image-box').style.display = 'none'
                            document.getElementById('crop-btn').style.display = 'none'
                            document.getElementById('confirm-btn').style.display = 'block'
                        });
            });
        } else {
                        document.getElementById('errormessage4').style.display = 'block'
            document.getElementById('imagePreview4').style.display = 'none'
                    $('#img4').val(null)
        }
    }
           