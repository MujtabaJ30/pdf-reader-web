const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const pdfUpload = document.getElementById('pdf-upload');
    const pdfFile = document.getElementById('pdf-file');
    const fileInfo = document.getElementById('file-info');
    const openPdfButton = document.getElementById('open-pdf');
    const cancelPdfButton = document.getElementById('cancel-pdf');
    const pdfPreview = document.getElementById('pdf-preview');

    let selectedFile = null;

    pdfUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    pdfUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    // Change this event listener to 'click' instead of 'change'
    pdfUpload.addEventListener('click', () => {
        pdfFile.click();
    });

    pdfFile.addEventListener('input', handleFileSelection);

    openPdfButton.addEventListener('click', openPDF);

    cancelPdfButton.addEventListener('click', () => {
        selectedFile = null;
        fileInfo.textContent = '';
        openPdfButton.style.display = 'none';
        cancelPdfButton.style.display = 'none';
        pdfPreview.innerHTML = '';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && selectedFile) {
            openPDF();
        }
    });

    function handleFileSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            fileInfo.textContent = `Selected: ${file.name}`;
            openPdfButton.style.display = 'inline-block';
            cancelPdfButton.style.display = 'inline-block';
            
            // Generate preview
            generatePreview(file);

            // Clear the file input to ensure it triggers on subsequent selections of the same file
            event.target.value = '';
        } else {
            fileInfo.textContent = 'Please select a valid PDF file.';
            openPdfButton.style.display = 'none';
            cancelPdfButton.style.display = 'none';
            selectedFile = null;
            clearPreview();
        }
    }

    function generatePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const typedarray = new Uint8Array(e.target.result);

            pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                pdf.getPage(1).then(function(page) {
                    const scale = 1.5;
                    const viewport = page.getViewport({ scale: scale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };

                    page.render(renderContext);

                    const previewArea = document.getElementById('pdf-preview');
                    previewArea.innerHTML = '';
                    previewArea.appendChild(canvas);
                });
            });
        };
        reader.readAsArrayBuffer(file);
    }

    function clearPreview() {
        const previewArea = document.getElementById('pdf-preview');
        previewArea.innerHTML = '';
    }

    function openPDF() {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const pdfData = e.target.result;
                const blob = new Blob([pdfData], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                window.open(`pdf-viewer.html?pdf=${encodeURIComponent(url)}`, '_blank');
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    }
});