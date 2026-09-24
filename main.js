const imageInput =
document.getElementById("imageInput");

const resetImagesButton =
document.getElementById(
    "resetImagesButton"
);

const canvas =
document.getElementById("canvas");

const ctx =
canvas.getContext("2d");

const grid =
document.getElementById("grid");

const imageList =
document.getElementById("imageList");

const prevButton =
document.getElementById("prevButton");

const nextButton =
document.getElementById("nextButton");

const imageInfo =
document.getElementById("imageInfo");

const upButton =
document.getElementById("upButton");

const downButton =
document.getElementById("downButton");

const leftButton =
document.getElementById("leftButton");

const rightButton =
document.getElementById("rightButton");

const zoomOutButton =
document.getElementById("zoomOutButton");

const zoomInButton =
document.getElementById("zoomInButton");

const gridSizeInfo =
document.getElementById("gridSizeInfo");

const colorButton =
document.getElementById("colorButton");

const widthButton =
document.getElementById("widthButton");

const gridColorInfo =
document.getElementById("gridColorInfo");

const gridWidthInfo =
document.getElementById("gridWidthInfo");

const resetImageTransformButton =
document.getElementById(
    "resetImageTransformButton"
);


// ======================================
// 画像
// ======================================

let images = [];

let currentIndex = 0;


// ======================================
// 画像の拡大・移動
// ======================================

/*
    画像を切り替えても、この3つの値は
    そのまま維持する。

    つまり、すべての画像で
    同じ拡大率・位置を共有する。
*/

let imageScale = 1;

let imageX = 0;

let imageY = 0;


const MOVE_STEP = 1;

const SCALE_STEP = 0.05;

const MIN_IMAGE_SCALE = 0.1;

const MAX_IMAGE_SCALE = 5.0;


// ======================================
// グリッド
// ======================================

let gridX = 0;

let gridY = 0;

let gridSize = 50;

let gridWidth = 1;

let gridColorIndex = 0;


// ======================================
// グリッド色
// ======================================

const gridColors = [

    {
        name: "赤",
        color: "rgba(255, 0, 0, 0.55)"
    },

    {
        name: "青",
        color: "rgba(0, 80, 255, 0.55)"
    },

    {
        name: "緑",
        color: "rgba(0, 180, 80, 0.55)"
    },

    {
        name: "黒",
        color: "rgba(0, 0, 0, 0.55)"
    },

    {
        name: "白",
        color: "rgba(255, 255, 255, 0.75)"
    },

    {
        name: "黄色",
        color: "rgba(255, 220, 0, 0.65)"
    },

    {
        name: "水色",
        color: "rgba(0, 210, 255, 0.60)"
    },

    {
        name: "赤紫",
        color: "rgba(220, 0, 150, 0.60)"
    }

];


const gridWidths = [
    1,
    2,
    3,
    4,
    5
];


// ======================================
// グリッド表示更新
// ======================================

function updateGrid() {

    grid.style.backgroundPosition =
        `${gridX}px ${gridY}px`;

    grid.style.backgroundSize =
        `${gridSize}px ${gridSize}px`;

    const color =
        gridColors[gridColorIndex].color;

    const width =
        gridWidth;

    grid.style.backgroundImage = `
        linear-gradient(
            to right,
            ${color} 0,
            ${color} ${width}px,
            transparent ${width}px
        ),
        linear-gradient(
            to bottom,
            ${color} 0,
            ${color} ${width}px,
            transparent ${width}px
        )
    `;

    gridColorInfo.textContent =
        gridColors[gridColorIndex].name;

    gridWidthInfo.textContent =
        `${gridWidth} px`;
}


// ======================================
// 画像の拡大率・位置を反映
// ======================================

function updateImageTransform() {

    canvas.style.transform = `
        translate(
            ${imageX}px,
            ${imageY}px
        )
        scale(
            ${imageScale}
        )
    `;

    gridSizeInfo.textContent =
        `${Math.round(imageScale * 100)} %`;
}


// ======================================
// 画像の拡大率変更
// ======================================

function changeImageScale(amount) {

    imageScale += amount;

    imageScale =
        Math.max(
            MIN_IMAGE_SCALE,
            Math.min(
                MAX_IMAGE_SCALE,
                imageScale
            )
        );

    updateImageTransform();
}


// ======================================
// 拡大
// ======================================

zoomInButton.addEventListener(
    "click",
    () => {

        changeImageScale(
            SCALE_STEP
        );

    }
);


// ======================================
// 縮小
// ======================================

zoomOutButton.addEventListener(
    "click",
    () => {

        changeImageScale(
            -SCALE_STEP
        );

    }
);


// ======================================
// 色変更
// ======================================

colorButton.addEventListener(
    "click",
    () => {

        gridColorIndex++;

        if (
            gridColorIndex >=
            gridColors.length
        ) {

            gridColorIndex = 0;

        }

        updateGrid();

    }
);


// ======================================
// 太さ変更
// ======================================

widthButton.addEventListener(
    "click",
    () => {

        const currentWidthIndex =
            gridWidths.indexOf(
                gridWidth
            );

        let nextWidthIndex =
            currentWidthIndex + 1;

        if (
            nextWidthIndex >=
            gridWidths.length
        ) {

            nextWidthIndex = 0;

        }

        gridWidth =
            gridWidths[
                nextWidthIndex
            ];

        updateGrid();

    }
);


// ======================================
// 画像読み込み・追加
// ======================================

imageInput.addEventListener(
    "change",
    () => {

        const files =
            Array.from(
                imageInput.files
            );

        if (
            files.length === 0
        ) {
            return;
        }


        // ==============================
        // 追加する画像を作成
        // ==============================

        const newImages =
            files.map(
                file => {

                    const image =
                        new Image();

                    image.src =
                        URL.createObjectURL(
                            file
                        );

                    return {

                        image: image,

                        name: file.name,

                        id:
                            crypto.randomUUID()

                    };

                }
            );


        // ==============================
        // 既存画像の後ろに追加
        // ==============================

        const oldImageCount =
            images.length;

        images.push(
            ...newImages
        );


        // ==============================
        // 一覧更新
        // ==============================

        createImageList();


        // ==============================
        // 最初の画像だった場合
        // ==============================

        if (
            oldImageCount === 0
        ) {

            currentIndex = 0;

            const firstImage =
                images[0].image;

            if (
                firstImage.complete
            ) {

                showImage(0);

            } else {

                firstImage.addEventListener(
                    "load",
                    () => {

                        showImage(0);

                    },
                    {
                        once: true
                    }
                );

            }

        } else {

            updateButtons();

            updateSelectedImage();

        }


        // ==============================
        // inputをリセット
        // ==============================

        imageInput.value = "";

    }
);


// ======================================
// 画像一覧作成
// ======================================

function createImageList() {

    imageList.innerHTML = "";

    images.forEach(
        (item, index) => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "image-item";

            element.draggable = true;

            element.dataset.index =
                index;


            // ==========================
            // サムネイル
            // ==========================

            const thumbnail =
                document.createElement(
                    "img"
                );

            thumbnail.className =
                "image-thumbnail";

            thumbnail.src =
                item.image.src;

            thumbnail.alt =
                item.name;


            // ==========================
            // ファイル名
            // ==========================

            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "image-name";

            name.textContent =
                item.name;


            // ==========================
            // 上下ボタン
            // ==========================

            const orderButtons =
                document.createElement(
                    "div"
                );

            orderButtons.className =
                "image-order-buttons";


            const up =
                document.createElement(
                    "button"
                );

            up.type = "button";

            up.textContent = "↑";

            up.title = "上へ";


            const down =
                document.createElement(
                    "button"
                );

            down.type = "button";

            down.textContent = "↓";

            down.title = "下へ";


            // 上へ

            up.disabled =
                index === 0;

            up.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    moveImage(
                        index,
                        index - 1
                    );

                }
            );


            // 下へ

            down.disabled =
                index ===
                images.length - 1;

            down.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    moveImage(
                        index,
                        index + 1
                    );

                }
            );


            orderButtons.appendChild(
                up
            );

            orderButtons.appendChild(
                down
            );


            // ==========================
            // 要素を組み立て
            // ==========================

            element.appendChild(
                thumbnail
            );

            element.appendChild(
                name
            );

            element.appendChild(
                orderButtons
            );


            // ==========================
            // クリック
            // ==========================

            element.addEventListener(
                "click",
                () => {

                    currentIndex =
                        index;

                    showImage(
                        currentIndex
                    );

                }
            );


            // ==========================
            // ドラッグ開始
            // ==========================

            element.addEventListener(
                "dragstart",
                event => {

                    element.classList.add(
                        "dragging"
                    );

                    event.dataTransfer.setData(
                        "text/plain",
                        String(index)
                    );

                }
            );


            // ==========================
            // ドラッグ終了
            // ==========================

            element.addEventListener(
                "dragend",
                () => {

                    element.classList.remove(
                        "dragging"
                    );

                }
            );


            // ==========================
            // ドラッグ中
            // ==========================

            element.addEventListener(
                "dragover",
                event => {

                    event.preventDefault();

                }
            );


            // ==========================
            // ドロップ
            // ==========================

            element.addEventListener(
                "drop",
                event => {

                    event.preventDefault();

                    const fromIndex =
                        Number(
                            event.dataTransfer
                                .getData(
                                    "text/plain"
                                )
                        );

                    const toIndex =
                        index;

                    if (
                        fromIndex !==
                        toIndex
                    ) {

                        moveImage(
                            fromIndex,
                            toIndex
                        );

                    }

                }
            );


            imageList.appendChild(
                element
            );

        }
    );

    updateSelectedImage();
}


// ======================================
// 画像並び替え
// ======================================

function moveImage(
    fromIndex,
    toIndex
) {

    if (
        fromIndex < 0 ||
        fromIndex >= images.length
    ) {
        return;
    }

    if (
        toIndex < 0 ||
        toIndex >= images.length
    ) {
        return;
    }

    if (
        fromIndex === toIndex
    ) {
        return;
    }


    const movedImage =
        images.splice(
            fromIndex,
            1
        )[0];

    images.splice(
        toIndex,
        0,
        movedImage
    );


    // ==============================
    // 現在位置を補正
    // ==============================

    if (
        currentIndex === fromIndex
    ) {

        currentIndex =
            toIndex;

    } else if (
        fromIndex <
            currentIndex &&
        toIndex >=
            currentIndex
    ) {

        currentIndex--;

    } else if (
        fromIndex >
            currentIndex &&
        toIndex <=
            currentIndex
    ) {

        currentIndex++;

    }


    createImageList();

    showImage(
        currentIndex
    );

}


// ======================================
// 選択中画像を表示
// ======================================

function updateSelectedImage() {

    const items =
        imageList.querySelectorAll(
            ".image-item"
        );

    items.forEach(
        (item, index) => {

            if (
                index ===
                currentIndex
            ) {

                item.classList.add(
                    "selected"
                );

            } else {

                item.classList.remove(
                    "selected"
                );

            }

        }
    );

}


// ======================================
// Canvasに画像を表示
// ======================================

function showImage(index) {

    const item =
        images[index];

    if (
        !item ||
        !item.image.complete
    ) {
        return;
    }


    const image =
        item.image;


    canvas.width =
        image.naturalWidth;

    canvas.height =
        image.naturalHeight;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.drawImage(
        image,
        0,
        0
    );


    imageInfo.textContent =
        `画像 ${index + 1} / ${images.length}`;


    /*
       imageScale / imageX / imageY は
       ここでは変更しない。

       そのため、画像を切り替えても
       切り替え前の拡大率と位置が
       そのまま適用される。
    */

    updateImageTransform();

    updateButtons();

    updateSelectedImage();

}


// ======================================
// 前の画像
// ======================================

prevButton.addEventListener(
    "click",
    () => {

        if (
            currentIndex > 0
        ) {

            currentIndex--;

            showImage(
                currentIndex
            );

        }

    }
);


// ======================================
// 次の画像
// ======================================

nextButton.addEventListener(
    "click",
    () => {

        if (
            currentIndex <
            images.length - 1
        ) {

            currentIndex++;

            showImage(
                currentIndex
            );

        }

    }
);


// ======================================
// 画像切り替えボタン状態
// ======================================

function updateButtons() {

    prevButton.disabled =
        images.length === 0 ||
        currentIndex === 0;


    nextButton.disabled =
        images.length === 0 ||
        currentIndex ===
        images.length - 1;


    if (
        images.length === 0
    ) {

        imageInfo.textContent =
            "画像 0 / 0";

    }

}


// ======================================
// 画像移動
// ======================================

function moveCurrentImage(
    deltaX,
    deltaY
) {

    if (
        images.length === 0
    ) {
        return;
    }


    imageX += deltaX;

    imageY += deltaY;

    updateImageTransform();
}


// ======================================
// 上
// ======================================

upButton.addEventListener(
    "click",
    () => {

        moveCurrentImage(
            0,
            -MOVE_STEP
        );

    }
);


// ======================================
// 下
// ======================================

downButton.addEventListener(
    "click",
    () => {

        moveCurrentImage(
            0,
            MOVE_STEP
        );

    }
);


// ======================================
// 左
// ======================================

leftButton.addEventListener(
    "click",
    () => {

        moveCurrentImage(
            -MOVE_STEP,
            0
        );

    }
);


// ======================================
// 右
// ======================================

rightButton.addEventListener(
    "click",
    () => {

        moveCurrentImage(
            MOVE_STEP,
            0
        );

    }
);


// ======================================
// 画像をドラッグ
// ======================================

let dragging = false;

let startPointerX = 0;

let startPointerY = 0;

let startImageX = 0;

let startImageY = 0;


canvas.addEventListener(
    "pointerdown",
    event => {

        if (
            images.length === 0
        ) {
            return;
        }


        /*
           タッチ操作時のピンチ開始では
           1本指ドラッグを開始しない。
        */

        if (
            event.pointerType === "touch"
        ) {

            return;

        }


        dragging = true;


        startPointerX =
            event.clientX;

        startPointerY =
            event.clientY;


        startImageX =
            imageX;

        startImageY =
            imageY;


        canvas.setPointerCapture(
            event.pointerId
        );


        event.preventDefault();

    }
);


canvas.addEventListener(
    "pointermove",
    event => {

        if (!dragging) {
            return;
        }


        const deltaX =
            event.clientX -
            startPointerX;

        const deltaY =
            event.clientY -
            startPointerY;


        imageX =
            startImageX +
            deltaX;

        imageY =
            startImageY +
            deltaY;


        updateImageTransform();


        event.preventDefault();

    }
);


canvas.addEventListener(
    "pointerup",
    event => {

        dragging = false;

        event.preventDefault();

    }
);


canvas.addEventListener(
    "pointercancel",
    () => {

        dragging = false;

    }
);


// ======================================
// PC：マウスホイール
// ======================================

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();


        if (
            event.deltaY < 0
        ) {

            changeImageScale(
                SCALE_STEP
            );

        } else {

            changeImageScale(
                -SCALE_STEP
            );

        }

    },
    {
        passive: false
    }
);


// ======================================
// スマホ：2本指ピンチ
// ======================================

let pinchStartDistance = 0;

let pinchStartScale = 1;


function getTouchDistance(
    touch1,
    touch2
) {

    const dx =
        touch2.clientX -
        touch1.clientX;

    const dy =
        touch2.clientY -
        touch1.clientY;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


canvas.addEventListener(
    "touchstart",
    event => {

        if (
            event.touches.length !== 2
        ) {
            return;
        }


        if (
            images.length === 0
        ) {
            return;
        }


        pinchStartDistance =
            getTouchDistance(
                event.touches[0],
                event.touches[1]
            );


        pinchStartScale =
            imageScale;


        event.preventDefault();

    },
    {
        passive: false
    }
);


canvas.addEventListener(
    "touchmove",
    event => {

        if (
            event.touches.length !== 2
        ) {
            return;
        }


        if (
            images.length === 0
        ) {
            return;
        }


        const currentDistance =
            getTouchDistance(
                event.touches[0],
                event.touches[1]
            );


        if (
            pinchStartDistance <= 0
        ) {
            return;
        }


        const scale =
            currentDistance /
            pinchStartDistance;


        let newScale =
            pinchStartScale *
            scale;


        newScale =
            Math.max(
                MIN_IMAGE_SCALE,
                Math.min(
                    MAX_IMAGE_SCALE,
                    newScale
                )
            );


        imageScale =
            newScale;


        updateImageTransform();


        event.preventDefault();

    },
    {
        passive: false
    }
);


// ======================================
// 画像位置・拡大率リセット
// ======================================

resetImageTransformButton.addEventListener(
    "click",
    () => {

        imageScale = 1;

        imageX = 0;

        imageY = 0;

        updateImageTransform();

    }
);


// ======================================
// すべての画像をリセット
// ======================================

resetImagesButton.addEventListener(
    "click",
    () => {

        // ==============================
        // Blob URLを解放
        // ==============================

        images.forEach(
            item => {

                if (
                    item.image.src
                        .startsWith("blob:")
                ) {

                    URL.revokeObjectURL(
                        item.image.src
                    );

                }

            }
        );


        // ==============================
        // 画像データを削除
        // ==============================

        images = [];

        currentIndex = 0;


        // ==============================
        // 画像位置・拡大率をリセット
        // ==============================

        imageScale = 1;

        imageX = 0;

        imageY = 0;


        // ==============================
        // Canvasをクリア
        // ==============================

        canvas.width = 300;

        canvas.height = 150;

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // ==============================
        // Canvasの変形をリセット
        // ==============================

        updateImageTransform();


        // ==============================
        // 画像一覧をクリア
        // ==============================

        imageList.innerHTML = "";


        // ==============================
        // 画像情報をリセット
        // ==============================

        imageInfo.textContent =
            "画像 0 / 0";


        // ==============================
        // ボタン状態を更新
        // ==============================

        updateButtons();


        // ==============================
        // ファイル入力をリセット
        // ==============================

        imageInput.value = "";

    }
);


// ======================================
// 初期化
// ======================================

updateGrid();

updateButtons();

updateImageTransform();
