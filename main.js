const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const imageInfo = document.getElementById("imageInfo");

// アップロードされた画像
let images = [];

// 現在表示している画像の番号
let currentIndex = 0;

// ファイルが選択されたとき
imageInput.addEventListener("change", () => {
const files = Array.from(imageInput.files);

if (files.length === 0) {
    return;
}

// 画像を読み込む
images = files.map(file => {
    const image = new Image();

    image.src = URL.createObjectURL(file);

    return image;
});

currentIndex = 0;

// 画像の読み込み完了を待って表示
images[0].onload = () => {
    showImage(currentIndex);
};

updateButtons();


});

// 指定した画像をCanvasに表示する
function showImage(index) {
const image = images[index];

if (!image || !image.complete) {
    return;
}

canvas.width = image.width;
canvas.height = image.height;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(image, 0, 0);

imageInfo.textContent = `画像 ${index + 1} / ${images.length}`;

updateButtons();


}

// 前の画像
prevButton.addEventListener("click", () => {
if (currentIndex > 0) {
currentIndex--;
showImage(currentIndex);
}
});

// 次の画像
nextButton.addEventListener("click", () => {
if (currentIndex < images.length - 1) {
currentIndex++;
showImage(currentIndex);
}
});

// ボタンの状態を更新
function updateButtons() {
prevButton.disabled = currentIndex === 0;
nextButton.disabled = currentIndex === images.length - 1;

if (images.length === 0) {
    imageInfo.textContent = "画像 0 / 0";
    prevButton.disabled = true;
    nextButton.disabled = true;
}


}