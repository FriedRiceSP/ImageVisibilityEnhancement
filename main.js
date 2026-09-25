const imageInput = document.getElementById("imageInput");
const dropArea = document.getElementById("dropArea");
const resetImagesButton = document.getElementById("resetImagesButton");
const imageList = document.getElementById("imageList");
const selectionImage = document.getElementById("selectionImage");
const selectionFrame = document.getElementById("selectionFrame");
const selectedCanvas = document.getElementById("selectedCanvas");
const selectedCtx = selectedCanvas.getContext("2d");

const selectionWidthSlider = document.getElementById("selectionWidthSlider");
const selectionHeightSlider = document.getElementById("selectionHeightSlider");
const selectionWidthValue = document.getElementById("selectionWidthValue");
const selectionHeightValue = document.getElementById("selectionHeightValue");
const selectionInfo = document.getElementById("selectionInfo");

const moveUpButton = document.getElementById("moveUpButton");
const moveDownButton = document.getElementById("moveDownButton");
const moveLeftButton = document.getElementById("moveLeftButton");
const moveRightButton = document.getElementById("moveRightButton");

const previousImageButton = document.getElementById("previousImageButton");
const nextImageButton = document.getElementById("nextImageButton");
const currentImageValue = document.getElementById("currentImageValue");
const toggleGridButton = document.getElementById("toggleGridButton");
const togglePrevOverlayButton = document.getElementById("togglePrevOverlayButton");
const prevOverlayOpacitySlider = document.getElementById("prevOverlayOpacitySlider");
const prevOverlayOpacityValue = document.getElementById("prevOverlayOpacityValue");

// グリッド設定用要素
const gridControls = document.getElementById("gridControls");
const gridScaleSlider = document.getElementById("gridScaleSlider");
const gridScaleValue = document.getElementById("gridScaleValue");
const gridLineWidthSlider = document.getElementById("gridLineWidthSlider");
const gridLineWidthValue = document.getElementById("gridLineWidthValue");
const gridCountDisplay = document.getElementById("gridCountDisplay");

// 画像データ
let images = [];
let currentImageIndex = 0;
let previousDisplayedImageIndex = -1; // 直前まで表示していた画像のインデックスを記録

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

// ======================================
// グリッド状態データ & 前画像オーバーレイ状態
// ======================================
let gridVisible = true;
let gridRows = 5;       // 行（上下分割）
let gridCols = 5;       // 列（左右分割）
let gridOffsetX = 0;    // グリッド位置オフセット (ピクセル単位)
let gridOffsetY = 0;
let gridScale = 1.0;    // 拡大縮小倍率 (1.0 = 100%)
let gridColor = "#ff0000"; // 初期色: 赤
let gridLineWidth = 2;

let prevOverlayVisible = false;
let prevOverlayTransparency = 0.75; // 透明度 (0.5 = 50%, 0.95 = 95%)

// HTMLスライダー属性の最小・最大・初期値をスクリプト側からも明示設定
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

imageInput.addEventListener("change", () => {
    addImageFiles(imageInput.files);
    imageInput.value = "";
});

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

// ======================================
// 画像一覧作成 & 並び替え
// ======================================
function createImageList() {
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
        selectionImage.removeAttribute("src");
        selectionFrame.style.display = "none";
        selectedCanvas.width = 1;
        selectedCanvas.height = 1;
        selectedCtx.clearRect(0, 0, 1, 1);
        updateImageSwitchControls();
        return;
    }

    const item = getCurrentImage();
    if (!item) return;

    const image = item.image;

    if (!image.complete || image.naturalWidth === 0) {
        selectionImage.src = item.url;
        selectionFrame.style.display = "none";
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
    selectionImage.src = item.url;

    if (selectionWidth > image.naturalWidth) selectionWidth = image.naturalWidth;
    if (selectionHeight > image.naturalHeight) selectionHeight = image.naturalHeight;

    selectionX = Math.max(0, Math.min(selectionX, Math.max(0, image.naturalWidth - selectionWidth)));
    selectionY = Math.max(0, Math.min(selectionY, Math.max(0, image.naturalHeight - selectionHeight)));

    selectionFrame.style.display = "block";
    updateSelectionDisplay();
    updateImageSwitchControls();
}

function switchImage(delta) {
    if (images.length === 0) return;
    const newIndex = currentImageIndex + delta;
    if (newIndex < 0 || newIndex >= images.length) return;

    // 画像切り替え時に「直前に表示していた画像」のインデックスを保持
    previousDisplayedImageIndex = currentImageIndex;
    currentImageIndex = newIndex;
    showSelectionImage();
}

previousImageButton.addEventListener("click", () => switchImage(-1));
nextImageButton.addEventListener("click", () => switchImage(1));

function updateSelectionDisplay() {
    if (images.length === 0) return;
    const image = getCurrentImage().image;
    if (!image.complete || image.naturalWidth === 0) return;

    const displayWidth = selectionImage.clientWidth;
    const displayHeight = selectionImage.clientHeight;
    if (displayWidth <= 0 || displayHeight <= 0) return;

    const scaleX = displayWidth / image.naturalWidth;
    const scaleY = displayHeight / image.naturalHeight;

    selectionFrame.style.left = `${selectionX * scaleX}px`;
    selectionFrame.style.top = `${selectionY * scaleY}px`;
    selectionFrame.style.width = `${selectionWidth * scaleX}px`;
    selectionFrame.style.height = `${selectionHeight * scaleY}px`;

    selectionWidthSlider.min = "1";
    selectionWidthSlider.max = String(image.naturalWidth);
    selectionWidthSlider.value = String(selectionWidth);

    selectionHeightSlider.min = "1";
    selectionHeightSlider.max = String(image.naturalHeight);
    selectionHeightSlider.value = String(selectionHeight);

    selectionWidthValue.textContent = `${selectionWidth} px`;
    selectionHeightValue.textContent = `${selectionHeight} px`;

    selectionInfo.textContent = `選択領域：X ${selectionX} / Y ${selectionY} / 幅 ${selectionWidth} px / 高さ ${selectionHeight} px`;

    updateSelectedCanvas();
}

// ======================================
// Canvasへの描画＆重畳描画
// ======================================
function updateSelectedCanvas() {
    if (images.length === 0) return;
    const image = getCurrentImage().image;
    if (!image.complete || image.naturalWidth === 0) return;

    selectedCanvas.width = selectionWidth;
    selectedCanvas.height = selectionHeight;

    selectedCtx.clearRect(0, 0, selectionWidth, selectionHeight);

    // 1. トリミング画像の描画（現在の画像：一番下）
    selectedCtx.drawImage(
        image,
        selectionX, selectionY, selectionWidth, selectionHeight,
        0, 0, selectionWidth, selectionHeight
    );

    // 2. 直前画像の半透明重畳描画（ONかつ有効な直前画像が存在する場合）
    if (prevOverlayVisible && previousDisplayedImageIndex >= 0 && previousDisplayedImageIndex < images.length) {
        const prevItem = images[previousDisplayedImageIndex];
        if (prevItem && prevItem.image && prevItem.image.complete) {
            selectedCtx.save();
            // 透明度(Transparency: 0.5 ~ 0.95)から描画用不透明度(Alpha)に変換
            selectedCtx.globalAlpha = Math.max(0, Math.min(1, 1.0 - prevOverlayTransparency));
            selectedCtx.drawImage(
                prevItem.image,
                selectionX, selectionY, selectionWidth, selectionHeight,
                0, 0, selectionWidth, selectionHeight
            );
            selectedCtx.restore();
        }
    }

    // 3. グリッドの描画 (表示時のみ：一番上)
    if (gridVisible) {
        drawCustomGrid();
    }

    // 表示サイズ計算
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

// ======================================
// カスタムグリッド描画関数 (マス目範囲のみに制限)
// ======================================
function drawCustomGrid() {
    selectedCtx.save();

    // 画像描画範囲（選択領域内）のみ描画するようクリッピング
    selectedCtx.beginPath();
    selectedCtx.rect(0, 0, selectionWidth, selectionHeight);
    selectedCtx.clip();

    selectedCtx.strokeStyle = gridColor;
    selectedCtx.lineWidth = gridLineWidth;

    // ベースとなる1マスあたりの幅・高さ
    const baseCellW = selectionWidth / gridCols;
    const baseCellH = selectionHeight / gridRows;

    // 拡大縮小（スケール）適用後の1マスのサイズ
    const cellW = baseCellW * gridScale;
    const cellH = baseCellH * gridScale;

    // グリッド全体の幅と高さ
    const totalGridWidth = cellW * gridCols;
    const totalGridHeight = cellH * gridRows;

    // 線の太さによる中心ズレを補正 (0.5pxオフセット)
    const strokeOffset = (gridLineWidth % 2 !== 0) ? 0.5 : 0;

    // 1. 外枠（グリッド全体の境界線）を描画
    selectedCtx.beginPath();
    selectedCtx.rect(
        gridOffsetX + strokeOffset, 
        gridOffsetY + strokeOffset, 
        totalGridWidth, 
        totalGridHeight
    );
    selectedCtx.stroke();

    // 2. 内部の垂直線（グリッドの範囲内のみ）
    for (let c = 1; c < gridCols; c++) {
        const x = gridOffsetX + (c * cellW) + strokeOffset;
        selectedCtx.beginPath();
        selectedCtx.moveTo(x, gridOffsetY);
        selectedCtx.lineTo(x, gridOffsetY + totalGridHeight);
        selectedCtx.stroke();
    }

    // 3. 内部の水平線（グリッドの範囲内のみ）
    for (let r = 1; r < gridRows; r++) {
        const y = gridOffsetY + (r * cellH) + strokeOffset;
        selectedCtx.beginPath();
        selectedCtx.moveTo(gridOffsetX, y);
        selectedCtx.lineTo(gridOffsetX + totalGridWidth, y);
        selectedCtx.stroke();
    }

    selectedCtx.restore();
}

// ======================================
// 選択枠の操作・スライダー類
// ======================================
selectionWidthSlider.addEventListener("input", () => {
    if (images.length === 0) return;
    const image = getCurrentImage().image;
    const newWidth = Math.max(1, Number(selectionWidthSlider.value));
    selectionWidth = Math.min(newWidth, image.naturalWidth - selectionX);
    updateSelectionDisplay();
});

selectionHeightSlider.addEventListener("input", () => {
    if (images.length === 0) return;
    const image = getCurrentImage().image;
    const newHeight = Math.max(1, Number(selectionHeightSlider.value));
    selectionHeight = Math.min(newHeight, image.naturalHeight - selectionY);
    updateSelectionDisplay();
});

// 枠リサイズ処理
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
        if (!resizing || images.length === 0) return;
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

        if (resizeEdge === "top") {
            newY = Math.max(0, Math.min(resizeStartSelectionY + resizeStartSelectionHeight - 1, resizeStartSelectionY + deltaImageY));
            newHeight = resizeStartSelectionHeight - (newY - resizeStartSelectionY);
        }
        if (resizeEdge === "bottom") {
            newHeight = Math.max(1, Math.min(image.naturalHeight - resizeStartSelectionY, resizeStartSelectionHeight + deltaImageY));
        }
        if (resizeEdge === "left") {
            newX = Math.max(0, Math.min(resizeStartSelectionX + resizeStartSelectionWidth - 1, resizeStartSelectionX + deltaImageX));
            newWidth = resizeStartSelectionWidth - (newX - resizeStartSelectionX);
        }
        if (resizeEdge === "right") {
            newWidth = Math.max(1, Math.min(image.naturalWidth - resizeStartSelectionX, resizeStartSelectionWidth + deltaImageX));
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

// 選択枠ドラッグ移動
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
    if (!movingSelection || images.length === 0) return;
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

window.addEventListener("resize", () => { updateSelectionDisplay(); });

// ======================================
// グリッドのドラッグ移動・ピンチ拡大縮小操作 (Canvas上)
// ======================================
let isDraggingGrid = false;
let gridDragStartX = 0;
let gridDragStartY = 0;
let initialGridOffsetX = 0;
let initialGridOffsetY = 0;

let activePointers = new Map();
let initialPinchDistance = null;
let initialPinchScale = 1.0;

function getCanvasScaleFactor() {
    if (!selectedCanvas.clientWidth) return 1.0;
    return selectionWidth / selectedCanvas.clientWidth;
}

selectedCanvas.addEventListener("pointerdown", event => {
    if (!gridVisible) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size === 1) {
        isDraggingGrid = true;
        gridDragStartX = event.clientX;
        gridDragStartY = event.clientY;
        initialGridOffsetX = gridOffsetX;
        initialGridOffsetY = gridOffsetY;
    } else if (activePointers.size === 2) {
        isDraggingGrid = false;
        const points = Array.from(activePointers.values());
        initialPinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        initialPinchScale = gridScale;
    }
    selectedCanvas.setPointerCapture(event.pointerId);
});

selectedCanvas.addEventListener("pointermove", event => {
    if (!gridVisible || !activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size === 1 && isDraggingGrid) {
        const factor = getCanvasScaleFactor();
        const deltaX = (event.clientX - gridDragStartX) * factor;
        const deltaY = (event.clientY - gridDragStartY) * factor;

        gridOffsetX = initialGridOffsetX + deltaX;
        gridOffsetY = initialGridOffsetY + deltaY;

        updateSelectedCanvas();
    } else if (activePointers.size === 2 && initialPinchDistance) {
        const points = Array.from(activePointers.values());
        const currentDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        const ratio = currentDist / initialPinchDistance;

        let newScale = initialPinchScale * ratio;
        newScale = Math.max(0.2, Math.min(3.0, newScale));

        gridScale = newScale;
        gridScaleSlider.value = String(gridScale);
        gridScaleValue.textContent = `${Math.round(gridScale * 100)}%`;

        updateSelectedCanvas();
    }
});

function endPointer(event) {
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) initialPinchDistance = null;
    if (activePointers.size === 0) isDraggingGrid = false;
    try { selectedCanvas.releasePointerCapture(event.pointerId); } catch (e) {}
}

selectedCanvas.addEventListener("pointerup", endPointer);
selectedCanvas.addEventListener("pointercancel", endPointer);

// マウスホイールによる拡大縮小
selectedCanvas.addEventListener("wheel", event => {
    if (!gridVisible) return;
    event.preventDefault();

    const zoomStep = 0.05;
    if (event.deltaY < 0) {
        gridScale = Math.min(3.0, gridScale + zoomStep);
    } else {
        gridScale = Math.max(0.2, gridScale - zoomStep);
    }

    gridScaleSlider.value = String(gridScale);
    gridScaleValue.textContent = `${Math.round(gridScale * 100)}%`;
    updateSelectedCanvas();
}, { passive: false });

// ======================================
// グリッド操作パネル Event Listeners
// ======================================
gridScaleSlider.addEventListener("input", () => {
    gridScale = parseFloat(gridScaleSlider.value);
    gridScaleValue.textContent = `${Math.round(gridScale * 100)}%`;
    updateSelectedCanvas();
});

function updateGridCountDisplay() {
    gridCountDisplay.textContent = `横${gridCols}列 × 縦${gridRows}行`;
}

document.getElementById("addGridCol").addEventListener("click", () => {
    gridCols++;
    updateGridCountDisplay();
    updateSelectedCanvas();
});
document.getElementById("removeGridCol").addEventListener("click", () => {
    if (gridCols > 1) {
        gridCols--;
        updateGridCountDisplay();
        updateSelectedCanvas();
    }
});

document.getElementById("addGridRow").addEventListener("click", () => {
    gridRows++;
    updateGridCountDisplay();
    updateSelectedCanvas();
});
document.getElementById("removeGridRow").addEventListener("click", () => {
    if (gridRows > 1) {
        gridRows--;
        updateGridCountDisplay();
        updateSelectedCanvas();
    }
});

const colorBtns = document.querySelectorAll(".color-btn");
colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        colorBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        gridColor = btn.dataset.color;
        updateSelectedCanvas();
    });
});

gridLineWidthSlider.addEventListener("input", () => {
    gridLineWidth = parseInt(gridLineWidthSlider.value, 10);
    gridLineWidthValue.textContent = `${gridLineWidth} px`;
    updateSelectedCanvas();
});

// グリッド切り替え（OFF時でもコントロールパネルは常に表示）
toggleGridButton.addEventListener("click", () => {
    gridVisible = !gridVisible;
    toggleGridButton.textContent = gridVisible ? "グリッド非表示" : "グリッド表示";
    updateSelectedCanvas();
});

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
resetImagesButton.addEventListener("click", () => {
    images.forEach(item => { if (item.url) URL.revokeObjectURL(item.url); });
    images = [];
    currentImageIndex = 0;
    previousDisplayedImageIndex = -1;
    imageList.innerHTML = "";
    selectionImage.removeAttribute("src");
    selectionFrame.style.display = "none";

    selectionX = 0; selectionY = 0;
    selectionWidth = 1; selectionHeight = 1;

    gridRows = 5;
    gridCols = 5;
    gridOffsetX = 0;
    gridOffsetY = 0;
    gridScale = 1.0;
    gridScaleSlider.value = "1.0";
    gridScaleValue.textContent = "100%";
    prevOverlayVisible = false;
    prevOverlayTransparency = 0.5;

    if (togglePrevOverlayButton) {
        togglePrevOverlayButton.textContent = "前画像重ね表示: OFF";
    }
    if (prevOverlayOpacitySlider) {
        prevOverlayOpacitySlider.value = "0.75";
    }
    if (prevOverlayOpacityValue) {
        prevOverlayOpacityValue.textContent = "75%";
    }
    updateGridCountDisplay();

    selectionWidthSlider.min = "1"; selectionWidthSlider.max = "1"; selectionWidthSlider.value = "1";
    selectionHeightSlider.min = "1"; selectionHeightSlider.max = "1"; selectionHeightSlider.value = "1";
    selectionWidthValue.textContent = "1 px";
    selectionHeightValue.textContent = "1 px";
    selectionInfo.textContent = "選択領域：-";

    selectedCanvas.width = 1; selectedCanvas.height = 1;
    selectedCtx.clearRect(0, 0, 1, 1);

    updateImageSwitchControls();
    imageInput.value = "";
    dropArea.classList.remove("dragover");
});

// ======================================
// 移動処理関数（選択領域 & グリッド）
// ======================================

// 選択領域の移動
function moveSelection(dx, dy) {
    if (images.length === 0) return;
    const image = getCurrentImage().image;
    if (!image.complete || image.naturalWidth === 0) return;

    const step = 2; // 移動速度 (px)
    const maxX = Math.max(0, image.naturalWidth - selectionWidth);
    const maxY = Math.max(0, image.naturalHeight - selectionHeight);

    selectionX = Math.max(0, Math.min(maxX, selectionX + dx * step));
    selectionY = Math.max(0, Math.min(maxY, selectionY + dy * step));

    updateSelectionDisplay();
}

// グリッド位置の移動
function moveGrid(dx, dy) {
    gridOffsetX += dx;
    gridOffsetY += dy;
    updateSelectedCanvas();
}

// ======================================
// 長押し対応ヘルパー関数
// ======================================
function attachLongPressListener(button, action, initialDelay = 300, interval = 30) {
    if (!button) return;

    let timer = null;
    let isPressing = false;

    const start = (e) => {
        if (e.button && e.button !== 0) return; // 左クリックのみ有効
        if (isPressing) return;
        isPressing = true;

        if (e.type === 'touchstart') {
            e.preventDefault(); // スマホのスクロール・長押しメニュー防止
        }

        action(); // 押した瞬間に即時実行

        // 長押し処理
        timer = setTimeout(() => {
            timer = setInterval(() => {
                action();
            }, interval);
        }, initialDelay);
    };

    const stop = () => {
        isPressing = false;
        if (timer) {
            clearTimeout(timer);
            clearInterval(timer);
            timer = null;
        }
    };

    // マウスイベント
    button.addEventListener('mousedown', start);
    button.addEventListener('mouseup', stop);
    button.addEventListener('mouseleave', stop);

    // タッチイベント
    button.addEventListener('touchstart', start, { passive: false });
    button.addEventListener('touchend', stop);
    button.addEventListener('touchcancel', stop);
}

// ======================================
// 各移動ボタンへのイベントアタッチ
// ======================================

// ① 選択領域移動ボタン（長押し対応）
attachLongPressListener(moveUpButton, () => moveSelection(0, -1));
attachLongPressListener(moveDownButton, () => moveSelection(0, 1));
attachLongPressListener(moveLeftButton, () => moveSelection(-1, 0));
attachLongPressListener(moveRightButton, () => moveSelection(1, 0));

// ② グリッド移動ボタン（長押し対応）
const gridMoveUp = document.getElementById("gridMoveUp");
const gridMoveDown = document.getElementById("gridMoveDown");
const gridMoveLeft = document.getElementById("gridMoveLeft");
const gridMoveRight = document.getElementById("gridMoveRight");

const gridMoveStep = 2; // グリッド移動量 (px)

attachLongPressListener(gridMoveUp, () => moveGrid(0, -gridMoveStep));
attachLongPressListener(gridMoveDown, () => moveGrid(0, gridMoveStep));
attachLongPressListener(gridMoveLeft, () => moveGrid(-gridMoveStep, 0));
attachLongPressListener(gridMoveRight, () => moveGrid(gridMoveStep, 0));