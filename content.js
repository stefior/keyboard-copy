"use strict";

const HINT_CHARACTERS = "1234567890";
const FONT_SIZE = 12;
const FONT = `bold ${FONT_SIZE}px Arial, sans-serif`;
const PADDING = 4;
const BASE_Z_INDEX = 2000000000;

let yankMode = false;
let yankType = null; // 'Y' for all text, 'y' for direct text only
let elements = [];
let hints = new Map();
let hintString = "";
let container, shadowRoot, notificationElement, canvas, ctx;

let hintLayers = [];
let currentLayerIndex = 0;
let maxLayerIndex = 0;
let colorMap = new Map();
let elementToHint = new Map();

function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    if (style.opacity === "0" || style.visibility === "hidden") {
        return false;
    }

    const rect = element.getBoundingClientRect();
    if (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
    ) {
        // Check if the element is actually visible to the user
        const pointX = rect.left + rect.width / 4;
        const pointY = rect.top + rect.height / 4;
        const elementAtPoint = document.elementFromPoint(pointX, pointY);

        return element.contains(elementAtPoint) || elementAtPoint === element;
    }
    return false;
}

function hasDirectTextContent(element) {
    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            return true;
        }
    }
    return false;
}

function isInputElement(element) {
    return (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.isContentEditable
    );
}

function enterYankMode(type) {
    yankMode = true;
    yankType = type;
    const criteriaElements = [];
    const elementMap = new Map();

    elementToHint.clear();
    hints.clear();

    function meetsCriteria(element) {
        if (element === container || !isElementVisible(element)) {
            return false;
        }
        if (type === "y") {
            return hasDirectTextContent(element);
        } else {
            return element.textContent.trim();
        }
    }

    function traverse(element, criteriaAncestorStack = []) {
        let currentCriteriaAncestor =
            criteriaAncestorStack.length > 0
                ? criteriaAncestorStack[criteriaAncestorStack.length - 1]
                : null;

        if (meetsCriteria(element)) {
            element.childrenCriteria = [];
            elementMap.set(element, { children: element.childrenCriteria });
            criteriaElements.push(element);

            element.parentCriteria = currentCriteriaAncestor;

            if (element.parentCriteria) {
                element.parentCriteria.childrenCriteria.push(element);
            }

            criteriaAncestorStack.push(element);
        } else {
            element.parentCriteria = currentCriteriaAncestor;
        }

        for (let child of element.children) {
            traverse(child, criteriaAncestorStack);
        }

        if (meetsCriteria(element)) {
            criteriaAncestorStack.pop();
        }
    }

    traverse(document.documentElement);

    if (criteriaElements.length === 0) {
        exitYankMode();
        showNotification("No text elements to yank", 1500);
        return;
    }

    function assignLayer(node) {
        if (!node.childrenCriteria || node.childrenCriteria.length === 0) {
            node.layer = 1;
        } else {
            for (let child of node.childrenCriteria) {
                assignLayer(child);
            }
            node.layer =
                Math.max(...node.childrenCriteria.map((child) => child.layer)) +
                1;
        }
    }

    const rootNodes = criteriaElements.filter(
        (element) => !element.parentCriteria,
    );

    for (let root of rootNodes) {
        assignLayer(root);
    }

    const layersMap = new Map();
    for (let element of criteriaElements) {
        if (!layersMap.has(element.layer)) {
            layersMap.set(element.layer, []);
        }
        layersMap.get(element.layer).push(element);
    }

    // Sort layers in ascending order so top layers are first
    hintLayers = Array.from(layersMap.keys())
        .sort((a, b) => a - b)
        .map((layer) => layersMap.get(layer));

    elements = criteriaElements;

    assignColorsToElements();

    assignHintLabels();

    createOverlay();
    generateHints();
    renderHints();
    showNotification(type === "y" ? "Yank Direct Text" : "Yank All Text");

    currentLayerIndex = 0;
    maxLayerIndex = hintLayers.length - 1;
}

function assignColorsToElements() {
    colorMap.clear();

    const totalElements = elements.length;
    const hueStep = 360 / totalElements;

    elements.forEach((el, index) => {
        const hue = (index * hueStep) % 360;
        const saturation = 100;
        const lightness = 50;
        const alpha = yankType === "y" ? 0.2 : 0.1;

        const color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        colorMap.set(el, color);
    });
}

function assignHintLabels() {
    const totalElements = elements.length;
    const hintChars = generateHintCharacters(totalElements);

    elements.forEach((el, index) => {
        const hintChar = hintChars[index];
        elementToHint.set(el, hintChar);
    });
}

function generateHintCharacters(count) {
    const hintChars = [];
    let hintLength = 1;
    while (Math.pow(HINT_CHARACTERS.length, hintLength) < count) {
        hintLength++;
    }

    function generateCombinations(prefix, length) {
        if (length === 0) {
            hintChars.push(prefix);
            return;
        }
        for (let i = 0; i < HINT_CHARACTERS.length; i++) {
            generateCombinations(prefix + HINT_CHARACTERS[i], length - 1);
        }
    }

    generateCombinations("", hintLength);
    return hintChars.slice(0, count);
}

function generateHints() {
    hints.clear();

    for (let layerIndex = 0; layerIndex < hintLayers.length; layerIndex++) {
        const layer = hintLayers[layerIndex];
        for (let el of layer) {
            const hintChar = elementToHint.get(el);
            const color = colorMap.get(el);
            const rect = el.getBoundingClientRect();
            hints.set(hintChar, {
                element: el,
                rect: rect,
                color: color,
                layer: el.layer,
            });
        }
    }
}

function createOverlay() {
    canvas = shadowRoot.querySelector("canvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.style.position = "fixed";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.zIndex = BASE_Z_INDEX;
        canvas.style.pointerEvents = "none";
        canvas.style.boxSizing = "border-box";
        canvas.style.overflow = "hidden";
        shadowRoot.appendChild(canvas);
    }
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    resizeCanvas();
}

function resizeCanvas() {
    if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (yankMode) {
        for (const hint of hints.values()) {
            hint.rect = hint.element.getBoundingClientRect();
        }
        renderHints();
    }
}

function removeOverlay() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function renderHints() {
    removeOverlay();
    ctx.font = FONT;
    ctx.textBaseline = "top";

    const sortedHints = Array.from(hints.values()).sort(
        (a, b) => b.layer - a.layer,
    );

    for (const hint of sortedHints) {
        const { rect, color } = hint;
        const hintChar = [...hints.entries()].find(
            ([key, val]) => val === hint,
        )[0];

        // Colored overlay
        ctx.fillStyle = color;
        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);

        // Border
        ctx.strokeStyle = "hsl(0, 0%, 0%)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

        // Hint text
        ctx.fillStyle = "hsl(0, 0%, 0%)";
        ctx.strokeStyle = "hsl(0, 0%, 100%)";
        ctx.lineWidth = 3;
        ctx.strokeText(hintChar, rect.left + PADDING, rect.top + PADDING);
        ctx.fillText(hintChar, rect.left + PADDING, rect.top + PADDING);
    }
}

function updateHintSelection() {
    removeOverlay();
    ctx.font = FONT;
    ctx.textBaseline = "top";

    // Sort hints in descending order to draw higher layers last
    const sortedHints = Array.from(hints.values()).sort(
        (a, b) => b.layer - a.layer,
    );

    for (const hint of sortedHints) {
        const { rect, color } = hint;
        const hintChar = [...hints.entries()].find(
            ([key, val]) => val === hint,
        )[0];

        if (hintChar.startsWith(hintString)) {
            // Colored overlay
            ctx.fillStyle = color;
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);

            // Border
            ctx.strokeStyle = "hsl(0, 0%, 0%)";
            ctx.lineWidth = 2;
            ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

            // Hint text with selection
            const selectedPart = hintChar.slice(0, hintString.length);
            const remainingPart = hintChar.slice(hintString.length);

            // Render selected part in one color
            ctx.fillStyle = "hsl(0, 100%, 50%)";
            ctx.strokeStyle = "hsl(0, 0%, 100%)";
            ctx.lineWidth = 3;
            ctx.strokeText(
                selectedPart,
                rect.left + PADDING,
                rect.top + PADDING,
            );
            ctx.fillText(selectedPart, rect.left + PADDING, rect.top + PADDING);

            const selectedWidth = ctx.measureText(selectedPart).width;

            // Render the remaining part in a different color
            ctx.fillStyle = "hsl(0, 0%, 0%)";
            ctx.strokeText(
                remainingPart,
                rect.left + PADDING + selectedWidth,
                rect.top + PADDING,
            );
            ctx.fillText(
                remainingPart,
                rect.left + PADDING + selectedWidth,
                rect.top + PADDING,
            );
        }
    }
}

function getTextContent(element) {
    if (yankType === "Y") {
        return element.textContent;
    } else {
        return Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent)
            .join(" ")
            .trim();
    }
}

function copyText(text, element) {
    navigator.clipboard.writeText(text).then(
        () => {
            showNotification("Copied!", 1500);
            flashYankedElement(element);
        },
        () => showNotification("Copy failed", 1500),
    );
}

function flashYankedElement(element) {
    const rect = element.getBoundingClientRect();
    const flashCanvas = document.createElement("canvas");
    flashCanvas.style.position = "fixed";
    flashCanvas.style.top = "0";
    flashCanvas.style.left = "0";
    flashCanvas.style.width = "100%";
    flashCanvas.style.height = "100%";
    flashCanvas.style.zIndex = BASE_Z_INDEX + 1;
    flashCanvas.style.pointerEvents = "none";
    shadowRoot.appendChild(flashCanvas);

    const flashCtx = flashCanvas.getContext("2d");
    flashCanvas.width = document.documentElement.clientWidth;
    flashCanvas.height = document.documentElement.clientHeight;

    flashCtx.strokeStyle = "hsl(0, 0%, 0%)";
    flashCtx.lineWidth = 3;
    flashCtx.strokeRect(rect.left, rect.top, rect.width, rect.height);

    setTimeout(() => shadowRoot.removeChild(flashCanvas), 150);
}

let notificationTimeout;

function showNotification(message, duration = null) {
    notificationElement.textContent = message;
    notificationElement.style.visibility = "visible";

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    if (duration !== null) {
        notificationTimeout = setTimeout(hideNotification, duration);
    }
}

function hideNotification() {
    notificationElement.style.visibility = "hidden";
}

function hideEndNodes(reverse = false) {
    if (reverse) {
        if (currentLayerIndex > 0) {
            currentLayerIndex--;
        } else {
            // Wrap around to last layer
            currentLayerIndex = maxLayerIndex;
        }
    } else {
        if (currentLayerIndex < maxLayerIndex) {
            currentLayerIndex++;
        } else {
            // Wrap around to first layer
            currentLayerIndex = 0;
        }
    }

    // Rebuild hints map with layers from currentLayerIndex
    hints.clear();

    const layersToShow = hintLayers.slice(currentLayerIndex);

    for (let layer of layersToShow) {
        for (let el of layer) {
            const hintChar = elementToHint.get(el);
            const color = colorMap.get(el);
            const rect = el.getBoundingClientRect();
            hints.set(hintChar, {
                element: el,
                rect: rect,
                color: color,
                layer: el.layer,
            });
        }
    }

    renderHints();
}

document.addEventListener("keydown", (e) => {
    if (
        (e.key === "Y" || e.key === "y") &&
        !yankMode &&
        !isInputElement(e.target)
    ) {
        e.preventDefault();
        enterYankMode(e.key);
    } else if (yankMode) {
        if (e.key === " ") {
            e.preventDefault();
            hideEndNodes(e.ctrlKey);
        } else if (HINT_CHARACTERS.includes(e.key)) {
            e.preventDefault();
            hintString += e.key;
            updateHintSelection();
            const matchingHints = Array.from(hints.keys()).filter((key) =>
                key.startsWith(hintString),
            );
            if (matchingHints.length === 1) {
                const selectedHint = hints.get(matchingHints[0]);
                const textToCopy = getTextContent(selectedHint.element);
                copyText(textToCopy, selectedHint.element);
                exitYankMode();
            } else if (matchingHints.length === 0) {
                hintString = "";
                updateHintSelection();
            }
        } else if (e.key === "Backspace") {
            e.preventDefault();
            hintString = hintString.slice(0, -1);
            updateHintSelection();
        } else if (e.key === "Escape" || e.key === "Y" || e.key === "y") {
            e.preventDefault();
            exitYankMode();
        }
    }
});

function exitYankMode() {
    yankMode = false;
    yankType = null;
    removeOverlay();
    hideNotification();
    hintString = "";
    hints.clear();
    elements = [];
    hintLayers = [];
    currentLayerIndex = 0;
    maxLayerIndex = 0;
    colorMap.clear();
    elementToHint.clear();
}

container = document.createElement("div");
container.id = "keyboard-copy-hint-container";
container.style.cssText = "all: initial;";
shadowRoot = container.attachShadow({ mode: "closed" });

const style = document.createElement("style");
style.textContent = `
  .keyboard-copy-notification {
    position: fixed;
    bottom: 0;
    right: 8px;
    background-color: hsl(0, 0%, 0%);
    border: 2px solid hsl(0, 0%, 100%);
    color: hsl(0, 0%, 100%);
    padding: 6px 8px; 
    border-radius: 4px 4px 0 0;
    font-size: 15px;
    line-height: 1.4;
    max-width: 320px;
    min-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap; 
    font-family: sans-serif;
    z-index: 2147483647;
    pointer-events: none;
    user-select: none;
    visibility: hidden;
    transform: translateZ(0);
  }
`;
shadowRoot.appendChild(style);

notificationElement = document.createElement("div");
notificationElement.className = "keyboard-copy-notification";
shadowRoot.appendChild(notificationElement);

document.documentElement.appendChild(container);

const SCROLL_CONFIG = true;
if (SCROLL_CONFIG) {
    window.addEventListener("scroll", () => {
        if (yankMode) {
            const currentType = yankType;
            exitYankMode();
            enterYankMode(currentType);
        }
    });
} else {
    window.addEventListener("scroll", () => {
        if (yankMode) {
            for (const hint of hints.values()) {
                hint.rect = hint.element.getBoundingClientRect();
            }
            renderHints();
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

window.addEventListener("resize", debounce(resizeCanvas, 100));
