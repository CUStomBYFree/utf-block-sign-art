const fontsToLoad = [
  'Chill Bitmap 7px',
  '精品點陣體7×7 1.71',
  'QuanPixel 8px',
  'Fusion Pixel 8px Proportional',
  'Fusion Pixel 8px Monospaced',
  'GuanZhi',
  '美績點陣體',
  '美績點陣體 - 明'
];

fontsToLoad.forEach(fontName => {
  document.fonts.load(`8px '${fontName}'`);
});

let selectedFont = 'Chill Bitmap 7px';

const fontSelect = document.getElementById('fontSelect');
const fontSelectText = document.getElementById('fontSelectText');
const fontSelectTrigger = fontSelect.querySelector('.custom-select-trigger');
const fontSelectDropdown = fontSelect.querySelector('.custom-select-dropdown');
const fontCustomInput = document.getElementById('fontCustomInput');
const fontOptions = fontSelect.querySelectorAll('.custom-select-option');

fontSelectText.style.fontFamily = `'${selectedFont}', monospace`;
document.querySelector("#inputWrapper > textarea").style.fontFamily = `'${selectedFont}'`;

fontSelectTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  fontSelect.classList.toggle('open');
});

fontOptions.forEach(option => {
  option.addEventListener('click', () => {
    selectedFont = option.dataset.value;
    fontSelectText.textContent = option.dataset.value;
    fontSelectText.style.fontFamily = `'${option.dataset.value}', monospace`;
    fontOptions.forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    fontSelect.classList.remove('open');
    document.querySelector("#inputWrapper > textarea").style.fontFamily = `'${selectedFont}'`;
  });
});

fontCustomInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && fontCustomInput.value.trim()) {
    applyCustomFont();
  }
});

fontCustomInput.addEventListener('blur', () => {
  if (fontCustomInput.value.trim()) {
    applyCustomFont();
  }
});

function applyCustomFont() {
  selectedFont = fontCustomInput.value.trim();
  fontSelectText.textContent = selectedFont;
  fontSelectText.style.fontFamily = `'${selectedFont}', monospace`;
  fontOptions.forEach(o => o.classList.remove('active'));
  fontSelect.classList.remove('open');
  document.querySelector("#inputWrapper > textarea").style.fontFamily = `'${selectedFont}'`;
  fontCustomInput.value = '';
}

fontCustomInput.addEventListener('click', (e) => e.stopPropagation());

let mouseDownTarget = null;

document.addEventListener('mousedown', (e) => {
  mouseDownTarget = e.target;
});

document.addEventListener('click', (e) => {
  if (mouseDownTarget && fontSelect.contains(mouseDownTarget)) {
    mouseDownTarget = null;
    return;
  }
  mouseDownTarget = null;
  fontSelect.classList.remove('open');
});

fontSelectDropdown.addEventListener('click', (e) => e.stopPropagation());

async function main() {
  if (!document.fonts.check(`8px '${selectedFont}'`)) {
    showToast('字体加载中...');
    await document.fonts.load(`8px '${selectedFont}'`);
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }
  }

  const inputText = document.querySelector("#inputWrapper > textarea").value;
  const isHangingSign = document.querySelector(".signType:checked").value == "hangingSign";
  const gameVersion = document.querySelector(".gameVersion:checked").value;
  customChar = getCustomChar();

  const canvases = text2canvases(inputText, isHangingSign, gameVersion, selectedFont);
  const signs = canvases2signs(canvases);

  const signsWrapper = document.querySelector("#signsWrapper");
  const canvasWrapper = document.querySelector("#canvasWrapper");

  renderCanvases(canvases, canvasWrapper);
  renderSigns(signs, signsWrapper);
}

function text2canvases(text, isHangingSign, gameVersion, fontName) {
  let canvases = [];
  let cannotDraw = false;
  const paragraphs = text.replace(/\r/g, '').split('\n');
  for (const para of paragraphs) {
    let textArray = Array.from(para);
    while (textArray.length) {
      let canvas = newCanvas(isHangingSign, gameVersion, fontName);
      let ctx = canvas.getContext("2d");
      let widthUsed = 0;
      let widthCharNext = 0;
      do {
        let Char = textArray.shift();
        let charWidth = ctx.measureText(Char).width;
        if (charWidth > canvas.width) {
          cannotDraw = true;
          continue;
        }
        ctx.fillText(Char, widthUsed, canvas.height - 1);
        widthUsed += charWidth;
        if (!textArray.length) break;
        widthCharNext = ctx.measureText(textArray[0]).width;
      } while (widthUsed + widthCharNext <= canvas.width);
      canvases.push(canvas);
    }
  }
  if (cannotDraw) {
    showToast('部分字符无法绘制，已跳过');
  }
  return canvases;

  function newCanvas(isHangingSign, gameVersion, fontName) {
    let canvas = document.createElement("canvas");
    canvas.className = "previewCanvas";
    canvas.height = 8;
    
    if (isHangingSign) {
      canvas.width = 12;
    } else if (gameVersion === "1.20") {
      canvas.width = 10;
    } else {
      canvas.width = 20;
    }
    
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.font = `8px '${fontName}'`;
    return canvas;
  }
}

function canvases2signs(canvases) {
  let signs = [];

  canvases.forEach(canvas => {
    let canvasData = Array.from(new Array(canvas.height), () => new Array(canvas.width));
    let sign = Array.from(new Array(canvas.height / 2), () => new Array(canvas.width / 2));

    let ctx = canvas.getContext("2d");
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        let i = (y * canvas.width + x) * 4;
        const R = imgData[i];
        const G = imgData[i + 1];
        const B = imgData[i + 2];
        let pixel = ((R + G + B) / 3 < 127) ? 1 : 0;

        canvasData[y][x] = pixel;
        if (y % 2 && x % 2) {
          let p1 = canvasData[y - 1][x - 1],
            p2 = canvasData[y - 1][x],
            p3 = canvasData[y][x - 1];
          sign[(y - 1) / 2][(x - 1) / 2] = customChar[(p1 << 3) | (p2 << 2) | (p3 << 1) | pixel];
        }
      }
    }
    sign = sign.map(e => e.join(""));
    signs.push(sign);
  });
  return signs;
}

function renderCanvases(canvases, wrapper) {
  wrapper.innerHTML = "";
  canvases.forEach(canvas => {
    wrapper.appendChild(canvas);
  });
}

function renderSigns(signs, wrapper) {
  wrapper.innerHTML = "";
  signs.forEach(sign => {
    let signElement = document.createElement("div");
    signElement.className = "sign";

    sign.forEach(signLineText => {
      let lineContainer = document.createElement("div");
      lineContainer.className = "signLineContainer";
      
      let signLineElement = document.createElement("pre");
      signLineElement.className = "signLine";
      signLineElement.innerText = signLineText;
      lineContainer.appendChild(signLineElement);

      let copyButton = document.createElement("button");
      copyButton.className = "lineCopyButton";
      copyButton.innerText = "复制";
      copyButton.title = "复制";
      copyButton.addEventListener("click", () => {
        try {
          let text = signLineText;
          if ((text.match(/[◙◛◚]/g) || []).length >= 11) {
            text = text.replace(/ $/, '');
          }
          copyToClipboard(text);
        } catch (err) {
          window.alert("复制失败: " + err);
        }
      });
      lineContainer.appendChild(copyButton);

      signElement.appendChild(lineContainer);
    });

    let copyAllButton = document.createElement("button");
    copyAllButton.innerText = "复制全部";
    copyAllButton.addEventListener("click", () => {
      try {
        copyToClipboard(sign.join("\n"));
      } catch (err) {
        window.alert("复制失败: " + err);
      }
    });
    signElement.appendChild(copyAllButton);

    wrapper.appendChild(signElement);
  });
}

function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function copyToClipboard(text) {
  const clipboard = navigator.clipboard;
  if (clipboard) {
    clipboard.writeText(text).then(() => {
      showToast('复制成功！');
    }).catch(() => {
      execCommandCopyToClipboard();
    });
  }
  else {
    execCommandCopyToClipboard();
  }

  function execCommandCopyToClipboard() {
    let textArea = document.createElement("textArea");
    textArea.className = "clipboard-helper";
    textArea.setAttribute("readonly", "readonly");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("Copy");
    textArea.remove();
    showToast('复制成功！');
  }
}
