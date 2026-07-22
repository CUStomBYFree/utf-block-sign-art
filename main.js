const fontsToLoad = [
  'Chill Bitmap 7px',
  '精品點陣體7×7 1.71',
  'QuanPixel 8px',
  'Fusion Pixel 8px Proportional',
  'Fusion Pixel 8px Monospaced',
  'GuanZhi',
  '美績點陣體',
  '美績點陣體 - 明',
  'Five',
  'Mojang Regular',
  'Public Pixel',
  '袖珍像素体',
  'Minecraft AE'
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
document.getElementById("textInput").style.fontFamily = `'${selectedFont}'`;

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
    document.getElementById("textInput").style.fontFamily = `'${selectedFont}'`;
    syncHighlight();
    updateDebugDisplay(selectedFont);
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
  document.getElementById("textInput").style.fontFamily = `'${selectedFont}'`;
  fontCustomInput.value = '';
  syncHighlight();
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

let isComposing = false;

document.getElementById("textInput").addEventListener('compositionstart', () => {
  isComposing = true;
});
document.getElementById("textInput").addEventListener('compositionend', () => {
  isComposing = false;
  syncHighlight();
});
document.getElementById("textInput").addEventListener('input', () => {
  if (!isComposing) syncHighlight();
});

async function main() {
  syncHighlight();

  if (!document.fonts.check(`8px '${selectedFont}'`)) {
    showToast('字体加载中...');
    await document.fonts.load(`8px '${selectedFont}'`);
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }
  }
  await document.fonts.load('16px "Mojangles"');
  await document.fonts.load('16px "GNU Unifont"');

  const inputText = document.getElementById("textInput").innerText;
  const signType = document.querySelector(".signType:checked").value;
  const edition = document.querySelector(".edition:checked")?.value || "je";
  const patternName = document.querySelector(".patternSelect:checked")?.value || "1.0";
  pixelMapping = getPixelMapping();

  const canvases = text2canvases(inputText, signType, edition, patternName, selectedFont);
  const signs = canvases2signs(canvases, selectedFont);

  const signsWrapper = document.querySelector("#signsWrapper");
  const canvasWrapper = document.querySelector("#canvasWrapper");

  renderCanvases(canvases, canvasWrapper);
  renderSigns(signs, signsWrapper, signType, patternName);
}

/* ===== 字体参数系统 =====
 * 每种字体可独立配置：offsetX / offsetY / mode
 * DEBUG 模式：Ctrl+D 开关，十字键实时调参，自动重绘
 */
const fontParams = {};

function getFontParams(fontName) {
  if (!fontParams[fontName]) {
    // 预设参数
    if (fontName === 'Fusion Pixel 8px Proportional') {
      fontParams[fontName] = { offsetX: -0.15, offsetY: 0, mode: '8x8', threshold: 121, gridShift: 2.7, cellW: 3 };
    } else if (fontName === 'Fusion Pixel 8px Monospaced') {
      fontParams[fontName] = { offsetX: -0.15, offsetY: 0, mode: '8x8', threshold: 121, gridShift: 2.7, cellW: 3 };
    } else if (fontName === 'GuanZhi') {
      fontParams[fontName] = { offsetX: 0.05, offsetY: 0, mode: '8x8', threshold: 127, gridShift: 2.5, cellW: 3 };
    } else if (fontName === 'Five') {
      fontParams[fontName] = { offsetX: -0.7, offsetY: 0, mode: '8x8', threshold: 60, gridShift: 2.7, cellW: 3.3 };
    } else if (fontName === 'Mojang Regular') {
      fontParams[fontName] = { offsetX: 0.03, offsetY: 0, mode: '8x8', threshold: 60, gridShift: 2, cellW: 3.1 };
    } else if (fontName === 'Public Pixel') {
      fontParams[fontName] = { offsetX: 0.00, offsetY: 0, mode: '8x8', threshold: 127, gridShift: 2, cellW: 3 };
    } else if (fontName === '袖珍像素体') {
      fontParams[fontName] = { offsetX: 0.00, offsetY: 0, mode: '8x8', threshold: 127, gridShift: 2, cellW: 3 };
    } else {
      fontParams[fontName] = { offsetX: 0, offsetY: 0, mode: '8x8', threshold: 127, gridShift: 2.7, cellW: 3 };
    }
  }
  return fontParams[fontName];
}

/* ===== DEBUG 面板 ===== */
let debugMode = false;


function toggleDebug() {
  debugMode = !debugMode;
  const panel = document.getElementById('debugPanel');
  panel.style.display = debugMode ? 'block' : 'none';
  const devBtn = document.getElementById('devModeBtn');
  if (devBtn) devBtn.classList.toggle('active', debugMode);
  if (debugMode) updateDebugDisplay(selectedFont);
}

function updateDebugDisplay(fontName) {
  if (!debugMode) return;
  const p = getFontParams(fontName);
  document.getElementById('debugFontName').textContent = fontName;
  document.getElementById('debugOffsetX').value = p.offsetX.toFixed(2);
  document.getElementById('debugOffsetY').value = p.offsetY.toFixed(2);
  document.getElementById('debugGridShift').value = p.gridShift.toFixed(1);
  document.getElementById('debugMode').textContent = p.mode;
  document.getElementById('debugThreshold').value = p.threshold;
  document.getElementById('debugCellW').value = p.cellW.toFixed(1);
  document.getElementById('debugThresholdPreview').style.backgroundColor = `rgb(${p.threshold},${p.threshold},${p.threshold})`;
}

function adjustParam(fontName, key, delta) {
  const p = getFontParams(fontName);
  p[key] += delta;
  updateDebugDisplay(fontName);
  // main() 由 updateDebugDisplay 触发的 input 事件自动调用
}

function resetParams(fontName) {
  fontParams[fontName] = { offsetX: 0, offsetY: 0, mode: '8x8', threshold: 127, gridShift: 2.7, cellW: 3 };
  updateDebugDisplay(fontName);
  // main() 由 updateDebugDisplay 触发的 input 事件自动调用
}

function toggleFontMode(fontName) {
  const p = getFontParams(fontName);
  p.mode = p.mode === '8x8' ? '7x7' : '8x8';
  updateDebugDisplay(fontName);
  main();
}

// Ctrl+D 开关
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    toggleDebug();
  }
});

// 十字键绑定
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('debugGridShiftRow').style.display = 'flex';
  document.getElementById('debugOffsetYRow').style.display = 'none';
  document.getElementById('debugReset').addEventListener('click', () => resetParams(selectedFont));
  document.getElementById('devModeBtn').addEventListener('click', toggleDebug);
  document.getElementById('debugThreshold').addEventListener('input', () => {
    const p = getFontParams(selectedFont);
    p.threshold = parseInt(document.getElementById('debugThreshold').value) || 127;
    document.getElementById('debugThresholdPreview').style.backgroundColor = `rgb(${p.threshold},${p.threshold},${p.threshold})`;
    main();
  });
  document.getElementById('debugOffsetX').addEventListener('input', () => {
    const p = getFontParams(selectedFont);
    p.offsetX = parseFloat(document.getElementById('debugOffsetX').value) || 0;
    main();
  });
  document.getElementById('debugOffsetY').addEventListener('input', () => {
    const p = getFontParams(selectedFont);
    p.offsetY = parseFloat(document.getElementById('debugOffsetY').value) || 0;
    main();
  });
  document.getElementById('debugGridShift').addEventListener('input', () => {
    const p = getFontParams(selectedFont);
    p.gridShift = parseFloat(document.getElementById('debugGridShift').value) || 0;
    main();
  });
  document.getElementById('debugCellW').addEventListener('input', () => {
    const p = getFontParams(selectedFont);
    p.cellW = parseFloat(document.getElementById('debugCellW').value) || 3;
    main();
  });
});

function text2canvases(text, signType, edition, patternName, fontName) {
  return text2canvases24(text, signType, edition, patternName, fontName, getFontParams(fontName));
}


function text2canvases24(text, signType, edition, patternName, fontName, params) {
  let canvases = [];
  let cannotDraw = false;
  const paragraphs = text.replace(/\r/g, '').split('\n');

  function getW() {
    const cw = patterns[patternName].canvasWidth;
    return signType === "hangingSign"
      ? (edition === "be" ? cw.beHangingSign : cw.jeHangingSign)
      : (edition === "be" ? cw.beSign : cw.jeSign);
  }
  const w8 = getW();
  const wRender = Math.round(w8 * params.cellW);

  for (const para of paragraphs) {
    let textArray = Array.from(para);
    while (textArray.length) {
      let canvasRender = document.createElement("canvas");
      canvasRender.height = 40;
      canvasRender.width = wRender;
      let ctxRender = canvasRender.getContext("2d");
      ctxRender.fillStyle = "#fff";
      ctxRender.fillRect(0, 0, wRender, 40);
      ctxRender.fillStyle = "#000";
      ctxRender.font = `24px '${fontName}'`;

      let widthUsed = 0;
      let widthCharNext = 0;
      do {
        let Char = textArray.shift();
        if (window._isGlyphSupported && !window._isGlyphSupported(fontName, Char)) {
          if (!textArray.length) break;
          widthCharNext = ctxRender.measureText(textArray[0]).width;
          continue;
        }
        let charWidth = ctxRender.measureText(Char).width;
        if (charWidth > wRender) {
          cannotDraw = true;
          break;
        }
        ctxRender.fillText(Char, Math.round(widthUsed) + params.offsetX * params.cellW, 30 + params.offsetY * 3);
        widthUsed += charWidth;
        if (!textArray.length) break;
        widthCharNext = ctxRender.measureText(textArray[0]).width;
      } while (widthUsed + widthCharNext <= wRender);

      if (widthUsed === 0) continue;

      let canvas8 = document.createElement("canvas");
      canvas8.className = "previewCanvas";
      canvas8.height = 8;
      canvas8.width = w8;
      let ctx8 = canvas8.getContext("2d");
      let sy = params.gridShift * 3;
      ctx8.drawImage(canvasRender, 0, sy, wRender, 24, 0, 0, w8, 8);
      canvases.push(canvas8);
    }
  }
  if (cannotDraw) { showToast('部分字符无法绘制，已跳过'); }
  return canvases;
}


function getBadChars() {
  const text = document.getElementById("textInput").innerText;
  const signType = document.querySelector(".signType:checked")?.value || "sign";
  const edition = document.querySelector(".edition:checked")?.value || "je";
  const patternName = document.querySelector(".patternSelect:checked")?.value || "1.0";

  const cw = patterns[patternName].canvasWidth;
  const w8 = signType === "hangingSign"
    ? (edition === "be" ? cw.beHangingSign : cw.jeHangingSign)
    : (edition === "be" ? cw.beSign : cw.jeSign);
  const w24 = w8 * (getFontParams(selectedFont).cellW || 3);

  let tempCanvas = document.createElement("canvas");
  let tempCtx = tempCanvas.getContext("2d");
  tempCtx.font = `24px '${selectedFont}'`;

  let bad = new Set();
  const unique = [...new Set(text.replace(/[\r\n]/g, ''))];
  for (const char of unique) {
    if (char === '\n') continue;
    const w = tempCtx.measureText(char).width;
    if (w > w24) { bad.add(char); continue; }
    if (w === 0) { bad.add(char); continue; }
    // 基于字体文件解析的cmap表检测字形缺失（替代原先不可靠的像素/tofu对比）
    if (window._isGlyphSupported && !window._isGlyphSupported(selectedFont, char)) {
      bad.add(char);
    }
  }

  return bad;
}

function syncHighlight() {
  const div = document.getElementById("textInput");
  if (!div) return;

  const bad = getBadChars();
  const sel = window.getSelection();
  let cursorOffset = 0;
  if (sel.rangeCount && div.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(div);
    preRange.setEnd(range.startContainer, range.startOffset);
    cursorOffset = preRange.toString().length;
  }

  const text = div.innerText;
  let html = '';
  for (const char of text) {
    if (char === '\n') {
      html += '<br>';
    } else if (bad.has(char)) {
      html += `<span class="bad-char">${char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : char}</span>`;
    } else {
      html += char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : char;
    }
  }
  div.innerHTML = html;

  // restore cursor
  let remaining = cursorOffset;
  const textNodes = [];
  function walk(n) {
    if (n.nodeType === 3) textNodes.push(n);
    else n.childNodes.forEach(walk);
  }
  walk(div);
  for (const node of textNodes) {
    if (remaining <= node.textContent.length) {
      const r = document.createRange();
      r.setStart(node, remaining);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    remaining -= node.textContent.length;
  }
  // fallback: place at end
  const last = textNodes[textNodes.length - 1];
  if (last) {
    const r = document.createRange();
    r.setStart(last, last.textContent.length);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

function canvases2signs(canvases, fontName) {
  let signs = [];
  const threshold = getFontParams(fontName).threshold;

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
        let pixel = ((R + G + B) / 3 < threshold) ? 1 : 0;

        canvasData[y][x] = pixel;
        if (y % 2 && x % 2) {
          let p1 = canvasData[y - 1][x - 1],
            p2 = canvasData[y - 1][x],
            p3 = canvasData[y][x - 1];
          sign[(y - 1) / 2][(x - 1) / 2] = pixelMapping[(p1 << 3) | (p2 << 2) | (p3 << 1) | pixel];
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

function renderSigns(signs, wrapper, signType, patternName) {
  wrapper.innerHTML = "";

  const edition = document.querySelector(".edition:checked")?.value || "je";

  signs.forEach(sign => {
    let signElement = document.createElement("div");
    signElement.className = "sign";
    if (signType === "hangingSign") {
      signElement.classList.add("sign-hanging");
    }
    if (patternName === "braille") {
      signElement.classList.add("sign-braille");
      signElement.classList.add(edition === "je" ? "sign-braille-je" : "sign-braille-be");
    }

    sign.forEach(signLineText => {
      let lineContainer = document.createElement("div");
      lineContainer.className = "signLineContainer";

      let signLineElement = document.createElement("pre");
      signLineElement.className = "signLine";
      signLineElement.style.fontFamily = '"Minecraft AE", monospace';
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

  requestAnimationFrame(() => {
    toast.classList.add('showing');
  });

  setTimeout(() => {
    toast.classList.remove('showing');
    toast.classList.add('hiding');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    }, { once: true });
  }, 3000);
}

function copyToClipboard(text) {
  const clipboard = navigator.clipboard;
  if (clipboard) {
    clipboard.writeText(text).then(() => {
      showToast('已复制到剪贴板');
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
    showToast('已复制到剪贴板');
  }
}