const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pdfUrl = urlParams.get('pdf');
    const pdfViewer = document.getElementById('pdf-viewer');
    const zoomSlider = document.getElementById('zoom');
    const zoomValue = document.getElementById('zoom-value');
    const fitWidthBtn = document.getElementById('fit-width');
    const fitPageBtn = document.getElementById('fit-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageInput = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    let currentPdf = null;
    let currentScale = 1;
    let currentPage = 1;
    let totalPages = 0;

    if (pdfUrl) {
        renderPDF(pdfUrl);
    } else {
        showError("No PDF URL provided.");
    }

    zoomSlider.addEventListener('input', (e) => {
        currentScale = e.target.value / 100;
        zoomValue.textContent = `${e.target.value}%`;
        rerenderPage();
    });

    fitWidthBtn.addEventListener('click', fitToWidth);
    fitPageBtn.addEventListener('click', fitToPage);
    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));
    sidebarToggle.addEventListener('click', toggleSidebar);

    currentPageInput.addEventListener('change', () => {
        const pageNum = parseInt(currentPageInput.value);
        if (pageNum >= 1 && pageNum <= totalPages) {
            currentPage = pageNum;
            rerenderPage();
        } else {
            currentPageInput.value = currentPage;
        }
    });

    pdfViewer.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            currentScale = Math.max(0.1, Math.min(5, currentScale + delta));
            zoomSlider.value = currentScale * 100;
            zoomValue.textContent = `${Math.round(currentScale * 100)}%`;
            rerenderPage();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            changePage(-1);
        } else if (e.key === 'ArrowRight') {
            changePage(1);
        }
    });

    function renderPDF(url) {
        pdfjsLib.getDocument(url).promise.then(pdf => {
            currentPdf = pdf;
            totalPages = pdf.numPages;
            totalPagesSpan.textContent = totalPages;
            fitToWidth();
            renderSidebarThumbnails();
        }).catch(error => {
            showError(`Error loading PDF: ${error.message}`);
        });
    }

    function rerenderPage() {
        if (!currentPdf) return;

        currentPdf.getPage(currentPage).then(page => {
            const viewport = page.getViewport({ scale: currentScale });
            const pageContainer = document.createElement('div');
            pageContainer.className = 'page';
            pageContainer.style.position = 'relative';
            pageContainer.style.width = `${viewport.width}px`;
            pageContainer.style.height = `${viewport.height}px`;

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            pdfViewer.innerHTML = '';
            pdfViewer.appendChild(pageContainer);
            pageContainer.appendChild(canvas);

            page.render(renderContext);

            // Text layer
            const textLayerDiv = document.createElement('div');
            textLayerDiv.setAttribute('class', 'textLayer');
            pageContainer.appendChild(textLayerDiv);

            page.getTextContent().then(textContent => {
                pdfjsLib.renderTextLayer({
                    textContent: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
                addTextSelectionListener(textLayerDiv);
                console.log('Text selection listener added'); // Add this line
            });

            currentPageInput.value = currentPage;
        });
    }

    function fitToWidth() {
        if (!currentPdf) return;

        currentPdf.getPage(currentPage).then(page => {
            const viewportWidth = pdfViewer.clientWidth;
            const viewport = page.getViewport({ scale: 1 });
            currentScale = (viewportWidth - 20) / viewport.width;
            zoomSlider.value = currentScale * 100;
            zoomValue.textContent = `${Math.round(currentScale * 100)}%`;
            rerenderPage();
        });
    }

    function fitToPage() {
        if (!currentPdf) return;

        currentPdf.getPage(currentPage).then(page => {
            const viewportHeight = window.innerHeight - 60; // Subtract toolbar height
            const viewport = page.getViewport({ scale: 1 });
            currentScale = viewportHeight / viewport.height;
            zoomSlider.value = currentScale * 100;
            zoomValue.textContent = `${Math.round(currentScale * 100)}%`;
            rerenderPage();
        });
    }

    function changePage(delta) {
        const newPage = currentPage + delta;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            rerenderPage();
        }
    }

    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    function renderSidebarThumbnails() {
        sidebar.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            currentPdf.getPage(i).then(page => {
                const scale = 0.3;
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                page.render(renderContext);

                const wrapper = document.createElement('div');
                wrapper.className = 'thumbnail-wrapper';
                wrapper.appendChild(canvas);

                const pageNum = document.createElement('div');
                pageNum.className = 'thumbnail-page-num';
                pageNum.textContent = i;
                wrapper.appendChild(pageNum);

                wrapper.addEventListener('click', () => {
                    currentPage = i;
                    rerenderPage();
                });

                sidebar.appendChild(wrapper);
            });
        }
    }

    function showError(message) {
        document.getElementById('error-message').textContent = message;
    }

    let popup = null;
    let loadingIcon = null;

    function createPopup() {
        popup = document.createElement('div');
        popup.id = 'word-popup';
        popup.style.position = 'fixed';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        popup.style.color = 'white';
        popup.style.padding = '10px';
        popup.style.borderRadius = '5px';
        popup.style.zIndex = '9999';
        popup.style.display = 'none';
        document.body.appendChild(popup);

        loadingIcon = document.createElement('div');
        loadingIcon.innerHTML = '&#8987;'; // Hourglass emoji
        loadingIcon.style.fontSize = '24px';
        loadingIcon.style.textAlign = 'center';
        popup.appendChild(loadingIcon);

        console.log('Popup created:', popup);
    }

    createPopup();

    function addTextSelectionListener(textLayerDiv) {
        textLayerDiv.addEventListener('mouseup', handleTextSelection);
    }

    function handleTextSelection(e) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        console.log('Selected text:', selectedText);
        if (selectedText) {
            showPopup(selectedText, e.clientX, e.clientY);
        } else {
            hidePopup();
        }
    }

    document.addEventListener('click', (e) => {
        if (popup && !popup.contains(e.target)) {
            hidePopup();
        }
    });

    function showPopup(text, mouseX, mouseY) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const popupWidth = 300;
        const popupHeight = 100;

        let x = mouseX + 10; // 10px offset from cursor
        let y = mouseY + 10;

        // Adjust x-coordinate to keep popup within horizontal bounds
        if (x + popupWidth > viewportWidth) {
            x = mouseX - popupWidth - 10;
        }

        // Adjust y-coordinate to keep popup within vertical bounds
        if (y + popupHeight > viewportHeight) {
            y = mouseY - popupHeight - 10;
        }

        // Ensure the popup doesn't go outside the viewport
        x = Math.max(10, Math.min(viewportWidth - popupWidth - 10, x));
        y = Math.max(10, Math.min(viewportHeight - popupHeight - 10, y));

        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        popup.style.display = 'block';
        loadingIcon.style.display = 'block';
        
        fetchWordMeaning(text);
    }

    function hidePopup() {
        popup.style.display = 'none';
    }

    async function fetchWordMeaning(word) {
        console.log('Fetching meaning for:', word);
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await response.json();
            console.log('API response:', data);
            if (data.length > 0 && data[0].meanings && data[0].meanings[0].definitions) {
                const definition = data[0].meanings[0].definitions[0].definition;
                const sourceLink = `https://en.wiktionary.org/wiki/${word}`;
                displayMeaning(definition, sourceLink);
            } else {
                displayMeaning('No definition found');
            }
        } catch (error) {
            console.error('Error fetching word meaning:', error);
            displayMeaning('Error fetching definition');
        }
    }

    function displayMeaning(meaning, sourceLink = null) {
        loadingIcon.style.display = 'none';
        popup.innerHTML = ''; // Clear previous content
        const meaningDiv = document.createElement('div');
        meaningDiv.textContent = meaning;
        popup.appendChild(meaningDiv);

        if (sourceLink) {
            const link = document.createElement('a');
            link.href = sourceLink;
            link.target = '_blank';
            link.textContent = '🔗 Wiktionary';
            link.style.marginLeft = '5px';
            link.style.textDecoration = 'none';
            link.style.fontSize = '12px';
            meaningDiv.appendChild(link);
        }
        console.log('Displayed meaning:', meaning);
        
        // Ensure the popup is visible
        popup.style.display = 'block';
        
        // Log popup state after displaying meaning
        console.log('Popup visibility after meaning:', popup.style.display);
        console.log('Popup contents after meaning:', popup.innerHTML);
    }
});
