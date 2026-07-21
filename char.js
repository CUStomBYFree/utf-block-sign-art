const customChars = {
  "1.19": ["  ", " ▗", "▖ ", "▄", " ▝", " ▐", "▞", "▟", "▘ ", "▚", "▌ ", "▙", "▀", "▜", "▛", "█"],
  "1.19-new": ["  ", " ◛", "◛ ", "◛◛", " ◚", " ◙", "◛◚", "◛◙", "◚ ", "◚◛", "◙ ", "◙◛", "◚◚", "◚◙", "◙◚", "◙◙"],
  "1.20": ["    ", "  ▄", "▄  ", "▄▄", "  ▀", "  █", "▄▀", "▄█", "▀  ", "▀▄", "█  ", "█▄", "▀▀", "▀█", "█▀", "██"],
  "braille": ["⠀⠀", "⠀⣤", "⣤⠀", "⣤⣤", "⠀⠛", "⠀⣿", "⣤⠛", "⣤⣿", "⠛⠀", "⠛⣤", "⣿⠀", "⣿⣤", "⠛⠛", "⠛⣿", "⣿⠛", "⣿⣿"],
};
let userCustomChars = {
  "1.19": null,
  "1.19-new": null,
  "1.20": null,
  "braille": null,
};
let currentCharState = { gameVersion: "1.0" };

function getCharStorageKey(gameVersion) {
  if (gameVersion === "1.0") return "1.19";
  if (gameVersion === "1.0-new") return "1.19-new";
  if (gameVersion === "braille") return "braille";
  return "1.20";
}

function saveCurrentCustomChars() {
  const key = getCharStorageKey(currentCharState.gameVersion);
  userCustomChars[key] = getCustomChar();
}

function loadCharSet(gameVersion) {
  saveCurrentCustomChars();
  currentCharState = { gameVersion };
  const key = getCharStorageKey(gameVersion);
  const chars = userCustomChars[key] || customChars[key];
  setCustomChar(chars);
}

let customChar;
setCustomChar(customChars["1.19"]);

function toggleCustomCharSection() {
  const section = document.getElementById('customCharSection');
  section.classList.toggle('expanded');
}

document.querySelectorAll('.gameVersion').forEach(radio => {
  radio.addEventListener('click', function () {
    document.getElementById('customCharSection').classList.remove('expanded');
  });
});

function setCharSet(gameVersion) {
  loadCharSet(gameVersion);
}

function setCustomChar(customChar) {
  const customCharWrapper = document.querySelector("#customCharWrapper");
  const customCharTemplate = document.querySelector("#customCharTemplate");
  customCharWrapper.innerHTML = "";
  customChar.forEach((char, index) => {
    const charName = index.toString(2).padStart(4, "0");
    const dom = customCharTemplate.content.cloneNode(true);
    dom.querySelector("code").textContent = `0b${charName}`;
    const dom_input = dom.querySelector("input");
    dom_input.id = `customChar_0b${charName}`;
    dom_input.value = char;
    customCharWrapper.appendChild(dom);
  });
}

function getCustomChar() {
  const inputs = document.querySelectorAll("#customCharWrapper input[name='customChar']");
  const result = [];
  inputs.forEach(input => {
    result.push(input.value);
  });
  return result;
}
