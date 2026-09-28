const imageInput = document.getElementById("imageInput");
const dropArea = document.getElementById("dropArea");
const resetImagesButton = document.getElementById("resetImagesButton");
const imageList = document.getElementById("imageList");
const selectionImage = document.getElementById("selectionImage");
const selectionFrame = document.getElementById("selectionFrame");
const selectedCanvas = document.getElementById("selectedCanvas");
const selectedCtx = selectedCanvas ? selectedCanvas.getContext("2d") : null;

const selectionZoomInBtn = document.getElementById("selectionZoomInBtn");
const selectionZoomOutBtn = document.getElementById("selectionZoomOutBtn");
const selectionScaleXInBtn = document.getElementById("selectionScaleXInBtn");
const selectionScaleXOutBtn = document.getElementById("selectionScaleXOutBtn");
const selectionScaleYInBtn = document.getElementById("selectionScaleYInBtn");
const selectionScaleYOutBtn = document.getElementById("selectionScaleYOutBtn");

// 選択領域移動用ボタン
const moveUpButton = document.getElementById("moveUpButton");
const moveDownButton = document.getElementById("moveDownButton");
const moveLeftButton = document.getElementById("moveLeftButton");
const moveRightButton = document.getElementById("moveRightButton");

// グリッド移動用ボタン
const gridMoveUp = document.getElementById("gridMoveUp");
const gridMoveDown = document.getElementById("gridMoveDown");
const gridMoveLeft = document.getElementById("gridMoveLeft");
const gridMoveRight = document.getElementById("gridMoveRight");

const previousImageButton = document.getElementById("previousImageButton");
const nextImageButton = document.getElementById("nextImageButton");
const currentImageValue = document.getElementById("currentImageValue");
const toggleGridButton = document.getElementById("toggleGridButton");
const togglePrevOverlayButton = document.getElementById("togglePrevOverlayButton");
const prevOverlayOpacitySlider = document.getElementById("prevOverlayOpacitySlider");
const prevOverlayOpacityValue = document.getElementById("prevOverlayOpacityValue");

// グリッド設定用要素
const gridControls = document.getElementById("gridControls");
const gridZoomInBtn = document.getElementById("gridZoomInBtn");
const gridZoomOutBtn = document.getElementById("gridZoomOutBtn");
const gridLineWidthSlider = document.getElementById("gridLineWidthSlider");
const gridLineWidthValue = document.getElementById("gridLineWidthValue");
const gridCountDisplay = document.getElementById("gridCountDisplay");

// 画像データ
let images = [];
let currentImageIndex = 0;
let previousDisplayedImageIndex = -1;

// 選択領域 (元画像基準 px)
let selectionX = 0;
let selectionY = 0;
let selectionWidth = 1;
let selectionHeight = 1;

// 枠ドラッグ・リサイズ用フラグ
let resizing = false;
let resizeEdge = "";
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartSelectionX = 0;
let resizeStartSelectionY = 0;
let resizeStartSelectionWidth = 1;
let resizeStartSelectionHeight = 1;

let movingSelection = false;
let moveStartX = 0;
let moveStartY = 0;
let moveStartSelectionX = 0;
let moveStartSelectionY = 0;

// グリッド＆前画像オーバーレイ状態
let gridVisible = true;
let gridRows = 5;
let gridCols = 5;
let gridColor = "#ff0000";
let gridLineWidth = 2;

// 虫眼鏡（ズーム＆カメラ移動）状態
let cameraZoom = 1.0;     // 1.0 = ズームなし、>1.0 = ズームイン
let cameraX = 0;          // カメラ位置（選択領域内px基準: 0 〜 selectionWidth - visibleWidth）
let cameraY = 0;          // カメラ位置（選択領域内px基準: 0 〜 selectionHeight - visibleHeight）

let isDraggingCamera = false;
let cameraDragStartX = 0;
let cameraDragStartY = 0;
let initialCameraX = 0;
let initialCameraY = 0;

let activePointers = new Map();
let initialPinchDistance = null;
let initialPinchZoom = 1.0;

let prevOverlayVisible = false;
let prevOverlayTransparency = 0.75;

if (prevOverlayOpacitySlider) {
    prevOverlayOpacitySlider.min = "0.5";
    prevOverlayOpacitySlider.max = "0.95";
    prevOverlayOpacitySlider.step = "0.01";
    prevOverlayOpacitySlider.value = "0.75";
}

// ======================================
// 画像ファイル追加
// ======================================
function addImageFiles(files) {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const wasEmpty = images.length === 0;

    imageFiles.forEach(file => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.src = objectUrl;

        images.push({
            image: image,
            name: file.name,
            url: objectUrl,
            id: crypto.randomUUID()
        });
    });

    createImageList();

    if (wasEmpty) {
        currentImageIndex = 0;
        previousDisplayedImageIndex = -1;
        const firstImage = images[0].image;

        const initializeSelection = () => {
            selectionX = 0;
            selectionY = 0;
            selectionWidth = firstImage.naturalWidth;
            selectionHeight = firstImage.naturalHeight;
            showSelectionImage();
        };

        if (firstImage.complete && firstImage.naturalWidth > 0) {
            initializeSelection();
        } else {
            firstImage.addEventListener("load", initializeSelection, { once: true });
        }
    } else {
        updateImageSwitchControls();
    }
}

if (imageInput) {
    imageInput.addEventListener("change", () => {
        addImageFiles(imageInput.files);
        imageInput.value = "";
    });
}

if (dropArea) {
    dropArea.addEventListener("dragover", event => {
        event.preventDefault();
        dropArea.classList.add("dragover");
    });

    dropArea.addEventListener("dragleave", event => {
        if (event.relatedTarget && dropArea.contains(event.relatedTarget)) return;
        dropArea.classList.remove("dragover");
    });

    dropArea.addEventListener("drop", event => {
        event.preventDefault();
        dropArea.classList.remove("dragover");
        addImageFiles(event.dataTransfer.files);
    });
}

// ======================================
// 画像一覧作成 & 並び替え
// ======================================
function createImageList() {
    if (!imageList) return;
    imageList.innerHTML = "";

    images.forEach((item, index) => {
        const element = document.createElement("div");
        element.className = "image-item";
        element.draggable = true;

        const thumbnail = document.createElement("img");
        thumbnail.className = "image-thumbnail";
        thumbnail.src = item.url;
        thumbnail.alt = item.name;

        const name = document.createElement("div");
        name.className = "image-name";
        name.textContent = item.name;

        const orderButtons = document.createElement("div");
        orderButtons.className = "image-order-buttons";

        const upButton = document.createElement("button");
        upButton.type = "button";
        upButton.textContent = "↑";
        upButton.title = "上へ";
        upButton.disabled = index === 0;

        const downButton = document.createElement("button");
        downButton.type = "button";
        downButton.textContent = "↓";
        downButton.title = "下へ";
        downButton.disabled = index === images.length - 1;

        upButton.addEventListener("click", event => {
            event.stopPropagation();
            moveImage(index, index - 1);
        });

        downButton.addEventListener("click", event => {
            event.stopPropagation();
            moveImage(index, index + 1);
        });

        orderButtons.appendChild(upButton);
        orderButtons.appendChild(downButton);

        element.appendChild(thumbnail);
        element.appendChild(name);
        element.appendChild(orderButtons);

        element.addEventListener("dragstart", event => {
            element.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(index));
        });

        element.addEventListener("dragend", () => {
            element.classList.remove("dragging");
        });

        element.addEventListener("dragover", event => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });

        element.addEventListener("drop", event => {
            event.preventDefault();
            const fromIndex = Number(event.dataTransfer.getData("text/plain"));
            const toIndex = index;

            if (Number.isNaN(fromIndex) || fromIndex === toIndex) return;
            moveImage(fromIndex, toIndex);
        });

        imageList.appendChild(element);
    });
}

function moveImage(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= images.length) return;
    if (toIndex < 0 || toIndex >= images.length) return;
    if (fromIndex === toIndex) return;

    const movedImage = images.splice(fromIndex, 1)[0];
    images.splice(toIndex, 0, movedImage);

    const currentItem = images.findIndex(item => item.id === movedImage.id);
    createImageList();

    if (currentItem >= 0 && images[currentItem].id === movedImage.id) {
        currentImageIndex = currentItem;
    }
    showSelectionImage();
}

function getCurrentImage() {
    return images.length === 0 ? null : images[currentImageIndex];
}

function updateImageSwitchControls() {
    if (!currentImageValue || !previousImageButton || !nextImageButton) return;
    if (images.length === 0) {
        currentImageValue.textContent = "0 / 0";
        previousImageButton.disabled = true;
        nextImageButton.disabled = true;
        return;
    }

    currentImageValue.textContent = `${currentImageIndex + 1} / ${images.length}`;
    previousImageButton.disabled = currentImageIndex === 0;
    nextImageButton.disabled = currentImageIndex === images.length - 1;
}

function showSelectionImage() {
    if (images.length === 0) {
        if (selectionImage) selectionImage.removeAttribute("src");
        if (selectionFrame) selectionFrame.style.display = "none";
        if (selectedCanvas) {
            selectedCanvas.width = 1;
            selectedCanvas.height = 1;
            if (selectedCtx) selectedCtx.clearRect(0, 0, 1, 1);
        }
        updateImageSwitchControls();
        return;
    }

    const item = getCurrentImage();
    if (!item) return;

    const image = item.image;

    if (!image.complete || image.naturalWidth === 0) {
        if (selectionImage) selectionImage.src = item.url;
        if (selectionFrame) selectionFrame.style.display = "none";
        image.addEventListener("load", () => {
            showCurrentSelection();
        }, { once: true });
        updateImageSwitchControls();
        return;
    }

    showCurrentSelection();
}

function showCurrentSelection() {
    if (images.length === 0) return;
    const item = getCurrentImage();
    if (!item) return;

    const image = item.image;
    if (selectionImage) selectionImage.src = item.url;

    if (selectionWidth > image.naturalWidth) selectionWidth = image.naturalWidth;
    if (selectionHeight > image.naturalHeight) selectionHeight = image.naturalHeight;

    selectionX = Math.max(0, Math.min(selectionX, Math.max(0, image.naturalWidth - selectionWidth)));
    selectionY = Math.max(0, Math.min(selectionY, Math.max(0, image.naturalHeight - selectionHeight)));

    if (selectionFrame) selectionFrame.style.display = "block";
    updateSelectionDisplay();
    updateImageSwitchControls();
}

function switchImage(delta) {
    if (images.length === 0) return;
    const newIndex = currentImageIndex + delta;
    if (newIndex < 0 || newIndex >= images.length) return;

    previousDisplayedImageIndex = currentImageIndex;
    currentImageIndex = newIndex;
    showSelectionImage();
}

if (previousImageButton) previousImageButton.addEventListener("click", () => switchImage(-1));
if (nextImageButton) nextImageButton.addEventListener("click", () => switchImage(1));

function updateSelectionDisplay() {
    if (images.length === 0 || !selectionImage) return;
    const image = getCurrentImage().image;
    if (!image.complete || image.naturalWidth === 0) return;

    const displayWidth = selectionImage.clientWidth;
    const displayHeight = selectionImage.clientHeight;
    if (displayWidth <= 0 || displayHeight <= 0) return;

    const scaleX = displayWidth / image.naturalWidth;
    const scaleY = displayHeight / image.naturalHeight;

    if (selectionFrame) {
        selectionFrame.style.left = `${selectionX * scaleX}px`;
        selectionFrame.style.top = `${selectionY * scaleY}px`;
        selectionFrame.style.width = `${selectionWidth * scaleX}px`;
        selectionFrame.style.height = `${selectionHeight * scaleY}px`;
    }

    updateSelectedCanvas();
}

// ======================================
// Canvas描画
// ======================================
function clampCameraPosition() {
    const visibleW = selectionWidth / cameraZoom;
    const visibleH = selectionHeight / cameraZoom;

    const maxCamX = Math.max(0, selectionWidth - visibleW);
    const maxCamY = Math.max(0, selectionHeight - visibleH);

    cameraX = Math.max(0, Math.min(maxCamX, cameraX));
    cameraY = Math.max(0, Math.min(maxCamY, cameraY));
}

function updateSelectedCanvas() {
    if (images.length === 0 || !selectedCanvas || !selectedCtx) return;
    const image = getCurrentImage().image;
    if (!image.complete || image.naturalWidth === 0) return;

    clampCameraPosition();

    selectedCanvas.width = selectionWidth;
    selectedCanvas.height = selectionHeight;

    selectedCtx.clearRect(0, 0, selectionWidth, selectionHeight);

    // 虫眼鏡表示用（カメラ表示領域の計算）
    const srcX = selectionX + cameraX;
    const srcY = selectionY + cameraY;
    const srcW = selectionWidth / cameraZoom;
    const srcH = selectionHeight / cameraZoom;

    // 1. カレント画像
    selectedCtx.drawImage(
        image,
        srcX, srcY, srcW, srcH,
        0, 0, selectionWidth, selectionHeight
    );

    // 2. 前画像（重ね合わせ）
    if (prevOverlayVisible && previousDisplayedImageIndex >= 0 && previousDisplayedImageIndex < images.length) {
        const prevItem = images[previousDisplayedImageIndex];
        if (prevItem && prevItem.image && prevItem.image.complete) {
            selectedCtx.save();
            selectedCtx.globalAlpha = Math.max(0, Math.min(1, 1.0 - prevOverlayTransparency));
            selectedCtx.drawImage(
                prevItem.image,
                srcX, srcY, srcW, srcH,
                0, 0, selectionWidth, selectionHeight
            );
            selectedCtx.restore();
        }
    }

    // 3. グリッド（選択領域の画像に同期して拡大・移動描画）
    if (gridVisible) {
        drawCustomGrid();
    }

    if (!selectionImage) return;
    const displayImageWidth = selectionImage.clientWidth;
    const displayImageHeight = selectionImage.clientHeight;
    if (displayImageWidth <= 0 || displayImageHeight <= 0) return;

    const scaleX = displayImageWidth / selectionWidth;
    const scaleY = displayImageHeight / selectionHeight;
    const displayScale = Math.min(scaleX, scaleY);

    const displayWidth = Math.max(1, Math.round(selectionWidth * displayScale));
    const displayHeight = Math.max(1, Math.round(selectionHeight * displayScale));

    selectedCanvas.style.width = `${displayWidth}px`;
    selectedCanvas.style.height = `${displayHeight}px`;
}

function drawCustomGrid() {
    if (!selectedCtx) return;
    selectedCtx.save();

    // カメラ（虫眼鏡）のトランスフォームをセット（画像と同じ拡大率・位置でグリッドを描画）
    selectedCtx.scale(cameraZoom, cameraZoom);
    selectedCtx.translate(-cameraX, -cameraY);

    selectedCtx.strokeStyle = gridColor;
    selectedCtx.lineWidth = gridLineWidth / cameraZoom; // 拡大時も線の太さが一定に見えるように補正

    const cellW = selectionWidth / gridCols;
    const cellH = selectionHeight / gridRows;

    const strokeOffset = ((gridLineWidth / cameraZoom) % 2 !== 0) ? 0.5 : 0;

    selectedCtx.beginPath();
    selectedCtx.rect(
        strokeOffset, 
        strokeOffset, 
        selectionWidth, 
        selectionHeight
    );
    selectedCtx.stroke();

    for (let c = 1; c < gridCols; c++) {
        const x = (c * cellW) + strokeOffset;
        selectedCtx.beginPath();
        selectedCtx.moveTo(x, 0);
        selectedCtx.lineTo(x, selectionHeight);
        selectedCtx.stroke();
    }

    for (let r = 1; r < gridRows; r++) {
        const y = (r * cellH) + strokeOffset;
        selectedCtx.beginPath();
        selectedCtx.moveTo(0, y);
        selectedCtx.lineTo(selectionWidth, y);
        selectedCtx.stroke();
    }

    selectedCtx.restore();
}

const resizeHandles = document.querySelectorAll(".resize-handle");
resizeHandles.forEach(handle => {
    handle.addEventListener("pointerdown", event => {
        if (images.length === 0) return;
        resizing = true;
        resizeEdge = handle.dataset.edge;
        resizeStartX = event.clientX;
        resizeStartY = event.clientY;
        resizeStartSelectionX = selectionX;
        resizeStartSelectionY = selectionY;
        resizeStartSelectionWidth = selectionWidth;
        resizeStartSelectionHeight = selectionHeight;
        handle.setPointerCapture(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
    });

    handle.addEventListener("pointermove", event => {
        if (!resizing || images.length === 0 || !selectionImage) return;
        const image = getCurrentImage().image;
        const displayWidth = selectionImage.clientWidth;
        const displayHeight = selectionImage.clientHeight;
        if (displayWidth <= 0 || displayHeight <= 0) return;

        const deltaImageX = (event.clientX - resizeStartX) * image.naturalWidth / displayWidth;
        const deltaImageY = (event.clientY - resizeStartY) * image.naturalHeight / displayHeight;

        let newX = resizeStartSelectionX;
        let newY = resizeStartSelectionY;
        let newWidth = resizeStartSelectionWidth;
        let newHeight = resizeStartSelectionHeight;

        // Y軸方向の調整
        if (resizeEdge.includes("top")) {
            newY = Math.max(0, Math.min(resizeStartSelectionY + resizeStartSelectionHeight - 10, resizeStartSelectionY + deltaImageY));
            newHeight = resizeStartSelectionHeight - (newY - resizeStartSelectionY);
        }
        if (resizeEdge.includes("bottom")) {
            newHeight = Math.max(10, Math.min(image.naturalHeight - resizeStartSelectionY, resizeStartSelectionHeight + deltaImageY));
        }

        // X軸方向の調整
        if (resizeEdge.includes("left")) {
            newX = Math.max(0, Math.min(resizeStartSelectionX + resizeStartSelectionWidth - 10, resizeStartSelectionX + deltaImageX));
            newWidth = resizeStartSelectionWidth - (newX - resizeStartSelectionX);
        }
        if (resizeEdge.includes("right")) {
            newWidth = Math.max(10, Math.min(image.naturalWidth - resizeStartSelectionX, resizeStartSelectionWidth + deltaImageX));
        }

        selectionX = Math.round(newX);
        selectionY = Math.round(newY);
        selectionWidth = Math.max(1, Math.round(newWidth));
        selectionHeight = Math.max(1, Math.round(newHeight));

        updateSelectionDisplay();
        event.preventDefault();
    });

    handle.addEventListener("pointerup", event => {
        resizing = false;
        resizeEdge = "";
        try { handle.releasePointerCapture(event.pointerId); } catch (e) {}
    });

    handle.addEventListener("pointercancel", () => {
        resizing = false;
        resizeEdge = "";
    });
});

if (selectionFrame) {
    selectionFrame.addEventListener("pointerdown", event => {
        if (event.target.classList.contains("resize-handle") || images.length === 0) return;
        movingSelection = true;
        moveStartX = event.clientX;
        moveStartY = event.clientY;
        moveStartSelectionX = selectionX;
        moveStartSelectionY = selectionY;
        selectionFrame.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    selectionFrame.addEventListener("pointermove", event => {
        if (!movingSelection || images.length === 0 || !selectionImage) return;
        const image = getCurrentImage().image;
        const displayWidth = selectionImage.clientWidth;
        const displayHeight = selectionImage.clientHeight;
        if (displayWidth <= 0 || displayHeight <= 0) return;

        const deltaImageX = (event.clientX - moveStartX) * image.naturalWidth / displayWidth;
        const deltaImageY = (event.clientY - moveStartY) * image.naturalHeight / displayHeight;

        selectionX = Math.max(0, Math.min(image.naturalWidth - selectionWidth, Math.round(moveStartSelectionX + deltaImageX)));
        selectionY = Math.max(0, Math.min(image.naturalHeight - selectionHeight, Math.round(moveStartSelectionY + deltaImageY)));

        updateSelectionDisplay();
        event.preventDefault();
    });

    selectionFrame.addEventListener("pointerup", event => {
        if (!movingSelection) return;
        movingSelection = false;
        try { selectionFrame.releasePointerCapture(event.pointerId); } catch (e) {}
    });

    selectionFrame.addEventListener("pointercancel", () => { movingSelection = false; });
}

window.addEventListener("resize", () => { updateSelectionDisplay(); });

// ======================================
// 虫眼鏡機能（ドラッグ引っ張りでカメラ移動・ピンチ/ホイールでズーム）
// ======================================
function getCanvasScaleFactor() {
    if (!selectedCanvas || !selectedCanvas.clientWidth) return 1.0;
    return selectionWidth / selectedCanvas.clientWidth;
}

if (selectedCanvas) {
    selectedCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    selectedCanvas.addEventListener("pointerdown", event => {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (activePointers.size === 1) {
            isDraggingCamera = true;
            cameraDragStartX = event.clientX;
            cameraDragStartY = event.clientY;
            initialCameraX = cameraX;
            initialCameraY = cameraY;
            selectedCanvas.style.cursor = "grabbing";
        } else if (activePointers.size === 2) {
            isDraggingCamera = false;
            const points = Array.from(activePointers.values());
            initialPinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
            initialPinchZoom = cameraZoom;
        }
        try { selectedCanvas.setPointerCapture(event.pointerId); } catch (e) {}
    });

    selectedCanvas.addEventListener("pointermove", event => {
        if (!activePointers.has(event.pointerId)) {
            selectedCanvas.style.cursor = cameraZoom > 1.0 ? "grab" : "default";
            return;
        }

        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (activePointers.size === 1 && isDraggingCamera) {
            const displayScale = selectedCanvas.clientWidth / selectionWidth;
            // 引っ張り操作（ドラッグした方向に画像が表示されるよう逆方向に移動）
            const deltaX = (event.clientX - cameraDragStartX) / (displayScale * cameraZoom);
            const deltaY = (event.clientY - cameraDragStartY) / (displayScale * cameraZoom);

            cameraX = initialCameraX - deltaX;
            cameraY = initialCameraY - deltaY;

            clampCameraPosition();
            updateSelectedCanvas();
        } else if (activePointers.size === 2 && initialPinchDistance) {
            const points = Array.from(activePointers.values());
            const currentDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
            const ratio = currentDist / initialPinchDistance;

            cameraZoom = Math.max(1.0, Math.min(10.0, initialPinchZoom * ratio));
            clampCameraPosition();
            updateSelectedCanvas();
        }
    });

    const endPointer = (event) => {
        activePointers.delete(event.pointerId);
        if (activePointers.size < 2) initialPinchDistance = null;
        if (activePointers.size === 0) {
            isDraggingCamera = false;
            selectedCanvas.style.cursor = cameraZoom > 1.0 ? "grab" : "default";
        }
        try { selectedCanvas.releasePointerCapture(event.pointerId); } catch (e) {}
    };

    selectedCanvas.addEventListener("pointerup", endPointer);
    selectedCanvas.addEventListener("pointercancel", endPointer);

    selectedCanvas.addEventListener("wheel", event => {
        event.preventDefault();
        const zoomStep = 0.1;

        if (event.deltaY < 0) {
            cameraZoom = Math.min(10.0, cameraZoom + zoomStep);
        } else {
            cameraZoom = Math.max(1.0, cameraZoom - zoomStep);
        }

        clampCameraPosition();
        updateSelectedCanvas();
    }, { passive: false });
}

// ======================================
// 虫眼鏡ズーム＆カメラ操作コントロール
// ======================================
const cameraZoomStep = 0.03;

attachLongPressListener(gridZoomInBtn, () => {
    cameraZoom = Math.min(10.0, cameraZoom + cameraZoomStep);
    clampCameraPosition();
    updateSelectedCanvas();
});

attachLongPressListener(gridZoomOutBtn, () => {
    cameraZoom = Math.max(1.0, cameraZoom - cameraZoomStep);
    clampCameraPosition();
    updateSelectedCanvas();
});

function moveCamera(dx, dy) {
    const step = 5 / cameraZoom;
    cameraX += dx * step;
    cameraY += dy * step;
    clampCameraPosition();
    updateSelectedCanvas();
}

function updateGridCountDisplay() {
    if (gridCountDisplay) gridCountDisplay.textContent = `横${gridCols}列 × 縦${gridRows}行`;
}

const addGridColBtn = document.getElementById("addGridCol");
if (addGridColBtn) {
    addGridColBtn.addEventListener("click", () => {
        gridCols++;
        updateGridCountDisplay();
        updateSelectedCanvas();
    });
}

const removeGridColBtn = document.getElementById("removeGridCol");
if (removeGridColBtn) {
    removeGridColBtn.addEventListener("click", () => {
        if (gridCols > 1) {
            gridCols--;
            updateGridCountDisplay();
            updateSelectedCanvas();
        }
    });
}

const addGridRowBtn = document.getElementById("addGridRow");
if (addGridRowBtn) {
    addGridRowBtn.addEventListener("click", () => {
        gridRows++;
        updateGridCountDisplay();
        updateSelectedCanvas();
    });
}

const removeGridRowBtn = document.getElementById("removeGridRow");
if (removeGridRowBtn) {
    removeGridRowBtn.addEventListener("click", () => {
        if (gridRows > 1) {
            gridRows--;
            updateGridCountDisplay();
            updateSelectedCanvas();
        }
    });
}

const colorBtns = document.querySelectorAll(".color-btn");
colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        colorBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        gridColor = btn.dataset.color;
        updateSelectedCanvas();
    });
});

if (gridLineWidthSlider) {
    gridLineWidthSlider.addEventListener("input", () => {
        gridLineWidth = parseInt(gridLineWidthSlider.value, 10);
        if (gridLineWidthValue) gridLineWidthValue.textContent = `${gridLineWidth} px`;
        updateSelectedCanvas();
    });
}

if (toggleGridButton) {
    toggleGridButton.addEventListener("click", () => {
        gridVisible = !gridVisible;
        toggleGridButton.textContent = gridVisible ? "グリッド非表示" : "グリッド表示";
        updateSelectedCanvas();
    });
}

if (togglePrevOverlayButton) {
    togglePrevOverlayButton.addEventListener("click", () => {
        prevOverlayVisible = !prevOverlayVisible;
        togglePrevOverlayButton.textContent = prevOverlayVisible ? "前画像重ね表示: ON" : "前画像重ね表示: OFF";
        updateSelectedCanvas();
    });
}

if (prevOverlayOpacitySlider) {
    prevOverlayOpacitySlider.addEventListener("input", () => {
        prevOverlayTransparency = parseFloat(prevOverlayOpacitySlider.value);
        if (prevOverlayOpacityValue) {
            prevOverlayOpacityValue.textContent = `${Math.round(prevOverlayTransparency * 100)}%`;
        }
        updateSelectedCanvas();
    });
}

// ======================================
// リセット処理
// ======================================
if (resetImagesButton) {
    resetImagesButton.addEventListener("click", () => {
        images.forEach(item => { if (item.url) URL.revokeObjectURL(item.url); });
        images = [];
        currentImageIndex = 0;
        previousDisplayedImageIndex = -1;
        if (imageList) imageList.innerHTML = "";
        if (selectionImage) selectionImage.removeAttribute("src");
        if (selectionFrame) selectionFrame.style.display = "none";

        selectionX = 0; selectionY = 0;
        selectionWidth = 1; selectionHeight = 1;

        gridRows = 5;
        gridCols = 5;
        cameraZoom = 1.0;
        cameraX = 0;
        cameraY = 0;

        prevOverlayVisible = false;
        prevOverlayTransparency = 0.75;

        if (togglePrevOverlayButton) togglePrevOverlayButton.textContent = "前画像重ね表示: OFF";
        if (prevOverlayOpacitySlider) prevOverlayOpacitySlider.value = "0.75";
        if (prevOverlayOpacityValue) prevOverlayOpacityValue.textContent = "75%";
        updateGridCountDisplay();

        if (selectedCanvas && selectedCtx) {
            selectedCanvas.width = 1; selectedCanvas.height = 1;
            selectedCtx.clearRect(0, 0, 1, 1);
        }

        updateImageSwitchControls();
        if (imageInput) imageInput.value = "";
        if (dropArea) dropArea.classList.remove("dragover");
    });
}

// ======================================
// 移動＆長押し処理
// ======================================
function moveSelection(dx, dy) {
    if (images.length === 0) return;
    const image = getCurrentImage().image;
    if (!image.complete || image.naturalWidth === 0) return;

    const step = 2;
    const maxX = Math.max(0, image.naturalWidth - selectionWidth);
    const maxY = Math.max(0, image.naturalHeight - selectionHeight);

    selectionX = Math.max(0, Math.min(maxX, selectionX + dx * step));
    selectionY = Math.max(0, Math.min(maxY, selectionY + dy * step));

    updateSelectionDisplay();
}

function attachLongPressListener(button, action, initialDelay = 300, interval = 30) {
    if (!button) return;

    let timeoutTimer = null;
    let intervalTimer = null;
    let isPressing = false;

    const start = (e) => {
        // マウスの主ボタン（左クリック）以外は無視
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (isPressing) return;
        isPressing = true;

        if (e.cancelable) {
            e.preventDefault();
        }

        action();

        timeoutTimer = setTimeout(() => {
            intervalTimer = setInterval(() => {
                action();
            }, interval);
        }, initialDelay);
    };

    const stop = () => {
        if (!isPressing) return;
        isPressing = false;
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }
        if (intervalTimer) {
            clearInterval(intervalTimer);
            intervalTimer = null;
        }
    };

    button.addEventListener('contextmenu', (e) => e.preventDefault());

    // Pointer Events に一本化（PCのマウス・スマホのタッチ双方で安定動作します）
    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointerleave', stop);
    button.addEventListener('pointercancel', stop);
}

// 領域選択のホイール＆ピンチズーム・はみ出しガード関数
function resizeSelectionFrame(scaleFactorX, scaleFactorY) {
    if (images.length === 0) return;
    const image = getCurrentImage().image;
    if (!image.complete || image.naturalWidth === 0) return;

    let newWidth = Math.max(10, Math.round(selectionWidth * scaleFactorX));
    let newHeight = Math.max(10, Math.round(selectionHeight * scaleFactorY));

    // 画像サイズを超えないように制限
    newWidth = Math.min(newWidth, image.naturalWidth);
    newHeight = Math.min(newHeight, image.naturalHeight);

    // 中心位置を維持するように位置（X, Y）を再計算
    let newX = selectionX - Math.round((newWidth - selectionWidth) / 2);
    let newY = selectionY - Math.round((newHeight - selectionHeight) / 2);

    // 画像の外側にはみ出さないよう移動範囲をクランプ
    selectionX = Math.max(0, Math.min(image.naturalWidth - newWidth, newX));
    selectionY = Math.max(0, Math.min(image.naturalHeight - newHeight, newY));
    selectionWidth = newWidth;
    selectionHeight = newHeight;

    updateSelectionDisplay();
}

const selectionContainer = document.getElementById("selectionContainer");
if (selectionContainer) {
    // マウスホイールでの拡大縮小
    selectionContainer.addEventListener("wheel", event => {
        if (images.length === 0) return;
        event.preventDefault();

        const step = event.deltaY < 0 ? 1.05 : 0.95;
        resizeSelectionFrame(step, step);
    }, { passive: false });

    // スマホの2本指ピンチ操作
    let selectionPointers = new Map();
    let initialSelectionPinchDist = null;

    selectionContainer.addEventListener("pointerdown", event => {
        if (images.length === 0) return;
        selectionPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (selectionPointers.size === 2) {
            const points = Array.from(selectionPointers.values());
            initialSelectionPinchDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        }
    });

    selectionContainer.addEventListener("pointermove", event => {
        if (!selectionPointers.has(event.pointerId)) return;
        selectionPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (selectionPointers.size === 2 && initialSelectionPinchDist) {
            event.preventDefault();
            const points = Array.from(selectionPointers.values());
            const currentDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
            const ratio = currentDist / initialSelectionPinchDist;

            if (Math.abs(ratio - 1.0) > 0.02) {
                resizeSelectionFrame(ratio, ratio);
                initialSelectionPinchDist = currentDist;
            }
        }
    });

    const endSelectionPointer = event => {
        selectionPointers.delete(event.pointerId);
        if (selectionPointers.size < 2) initialSelectionPinchDist = null;
    };

    selectionContainer.addEventListener("pointerup", endSelectionPointer);
    selectionContainer.addEventListener("pointercancel", endSelectionPointer);
}

const selectionStep = 0.02; // ボタン長押し時の伸縮速度

// 全体 拡大 / 縮小
attachLongPressListener(selectionZoomInBtn, () => resizeSelectionFrame(1 + selectionStep, 1 + selectionStep));
attachLongPressListener(selectionZoomOutBtn, () => resizeSelectionFrame(1 - selectionStep, 1 - selectionStep));

// 横 拡大 / 縮小
attachLongPressListener(selectionScaleXInBtn, () => resizeSelectionFrame(1 + selectionStep, 1.0));
attachLongPressListener(selectionScaleXOutBtn, () => resizeSelectionFrame(1 - selectionStep, 1.0));

// 縦 拡大 / 縮小
attachLongPressListener(selectionScaleYInBtn, () => resizeSelectionFrame(1.0, 1 + selectionStep));
attachLongPressListener(selectionScaleYOutBtn, () => resizeSelectionFrame(1.0, 1 - selectionStep));

// 1. 選択領域移動ボタン
attachLongPressListener(moveUpButton, () => moveSelection(0, -1));
attachLongPressListener(moveDownButton, () => moveSelection(0, 1));
attachLongPressListener(moveLeftButton, () => moveSelection(-1, 0));
attachLongPressListener(moveRightButton, () => moveSelection(1, 0));

// 2. カメラ移動ボタン
attachLongPressListener(gridMoveUp, () => moveCamera(0, -1));
attachLongPressListener(gridMoveDown, () => moveCamera(0, 1));
attachLongPressListener(gridMoveLeft, () => moveCamera(-1, 0));
attachLongPressListener(gridMoveRight, () => moveCamera(1, 0));