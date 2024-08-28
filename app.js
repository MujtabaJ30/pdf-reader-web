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

    pdfFile.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelection(e.target.files[0]);
        }
    });

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

    function handleFileSelection(file) {
        selectedFile = file;
        fileInfo.textContent = `Selected file: ${file.name}`;
        openPdfButton.style.display = 'inline-block';
        cancelPdfButton.style.display = 'inline-block';
        loadPDFPreview(file);
    }

    function loadPDFPreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const typedarray = new Uint8Array(e.target.result);
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                pdf.getPage(1).then(page => {
                    const scale = 0.5;
                    const viewport = page.getViewport({ scale });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };

                    pdfPreview.innerHTML = '';
                    pdfPreview.appendChild(canvas);
                    page.render(renderContext);
                });
            });
        };
        reader.readAsArrayBuffer(file);
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