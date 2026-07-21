const patterns = {
  "1.0": {
    pixelMapping: ["  ", " ▗", "▖ ", "▄", " ▝", " ▐", "▞", "▟", "▘ ", "▚", "▌ ", "▙", "▀", "▜", "▛", "█"],
    canvasWidth: {
      jeSign: 20,
      jeHangingSign: 12,
      beSign: 20,
      beHangingSign: 12,
    },
  },
  "1.20": {
    pixelMapping: ["  ", " ◛", "◛ ", "◛◛", " ◚", " ◙", "◛◚", "◛◙", "◚ ", "◚◛", "◙ ", "◙◛", "◚◚", "◚◙", "◙◚", "◙◙"],
    canvasWidth: {
      jeSign: 20,
      jeHangingSign: 12,
      beSign: 20,
      beHangingSign: 12,
    },
  },
  "1.20-wide": {
    pixelMapping: ["    ", "  ▄", "▄  ", "▄▄", "  ▀", "  █", "▄▀", "▄█", "▀  ", "▀▄", "█  ", "█▄", "▀▀", "▀█", "█▀", "██"],
    canvasWidth: {
      jeSign: 10,
      jeHangingSign: 6,
      beSign: 10,
      beHangingSign: 6,
    },
  },
  "braille": {
    pixelMapping: ["⠀⠀", "⠀⣤", "⣤⠀", "⣤⣤", "⠀⠛", "⠀⣿", "⣤⠛", "⣤⣿", "⠛⠀", "⠛⣤", "⣿⠀", "⣿⣤", "⠛⠛", "⠛⣿", "⣿⠛", "⣿⣿"],
    canvasWidth: {
      jeSign: 20,
      jeHangingSign: 12,
      beSign: 20,
      beHangingSign: 12,
    },
  },
};
let pixelMapping;
setPixelMapping(patterns["1.0"].pixelMapping);

function togglePatternSection() {
  const section = document.getElementById('patternSection');
  const customRadio = document.querySelector('.patternSelect[value="custom"]');
  section.classList.toggle('expanded', customRadio.checked);
}

document.querySelectorAll('.patternSelect').forEach(radio => {
  radio.addEventListener('click', function () {
    if (this.value !== 'custom') {
      document.getElementById('patternSection').classList.remove('expanded');
    }
  });
});

function setPattern(patternName) {
  setPixelMapping(patterns[patternName].pixelMapping);
}

function setPixelMapping(pixelMapping) {
  const patternWrapper = document.querySelector("#patternWrapper");
  const patternTemplate = document.querySelector("#patternTemplate");
  patternWrapper.innerHTML = "";
  pixelMapping.forEach((char, index) => {
    const charName = index.toString(2).padStart(4, "0");
    const dom = patternTemplate.content.cloneNode(true);
    dom.querySelector("code").textContent = `0b${charName}`;
    const dom_input = dom.querySelector("input");
    dom_input.id = `pattern_0b${charName}`;
    dom_input.value = char;
    patternWrapper.appendChild(dom);
  });
}

function getPixelMapping() {
  const inputs = document.querySelectorAll("#patternWrapper input[name='pattern']");
  const result = [];
  inputs.forEach(input => {
    result.push(input.value);
  });
  return result;
}
