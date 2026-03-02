const themeToggle = document.querySelector(".theme-toggle");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

// ВАЖЛИВО: Ваш токен (краще створити новий з правами 'Write')
const API_KEY = "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";

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes",
  "An old steampunk airship floating through golden clouds",
  "A cyberpunk city with neon signs and flying cars",
  "A dragon sleeping on gold coins in a crystal cave"
];

// --- Управління темою ---
(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDarkTheme = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// --- Розміри (кратні 16) ---
const getImageDimensions = (aspectRatio) => {
    const [w, h] = aspectRatio.split("/").map(Number);
    const base = 512;
    const factor = base / Math.sqrt(w * h);
    return { 
        width: Math.floor((w * factor) / 16) * 16, 
        height: Math.floor((h * factor) / 16) * 16 
    };
};

// --- Оновлення картки ---
const updateImageCard = (index, url) => {
    const card = document.getElementById(`img-card-${index}`);
    if (!card) return;
    card.classList.remove("loading");
    card.innerHTML = `
        <img src="${url}" class="result-img" alt="AI" />
        <div class="img-overlay">
            <a href="${url}" class="img-download-btn" download="ai-img-${Date.now()}.png">
                <i class="fa-solid fa-download"></i>
            </a>
        </div>`;
};

// --- СПРОЩЕНА ГЕНЕРАЦІЯ (БЕЗ Content-Type ДЛЯ ОБХОДУ CORS) ---
const generateImages = async (model, count, ratio, text) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${model}`;
    const { width, height } = getImageDimensions(ratio);
    generateBtn.disabled = true;

    const promises = Array.from({ length: count }, async (_, i) => {
        try {
            // МІНІМАЛЬНИЙ НАБІР ЗАГОЛОВКІВ
            const response = await fetch(MODEL_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    // МИ НЕ ДОДАЄМО Content-Type: application/json
                    // Це перетворює запит на "Simple Request" для браузера
                },
                body: JSON.stringify({
                    inputs: text,
                    parameters: { width, height, wait_for_model: true }
                })
            });

            if (!response.ok) {
                // Якщо помилка 503 - модель вантажиться, треба почекати
                if (response.status === 503) {
                    throw new Error("Model is loading... Try again in 30s");
                }
                throw new Error("API Limit or Blocked");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            updateImageCard(i, url);
        } catch (error) {
            console.error(error);
            const card = document.getElementById(`img-card-${i}`);
            if (card) {
                card.classList.replace("loading", "error");
                card.querySelector(".status-text").textContent = error.message;
            }
        }
    });

    await Promise.allSettled(promises);
    generateBtn.disabled = false;
};

// --- Створення скелетів ---
const createImageCards = (model, count, ratio, text) => {
    gridGallery.innerHTML = "";
    for (let i = 0; i < count; i++) {
        gridGallery.innerHTML += `
            <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${ratio}">
                <div class="status-container">
                    <div class="spinner"></div>
                    <p class="status-text">Generating...</p>
                </div>
            </div>`;
    }
    generateImages(model, count, ratio, text);
};

// --- Події ---
promptForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = promptInput.value.trim();
    const model = modelSelect.value;
    if (!text || !model) return alert("Fill all fields!");
    createImageCards(model, parseInt(countSelect.value), ratioSelect.value, text);
});

promptBtn.addEventListener("click", () => {
    promptInput.value = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.focus();
});

themeToggle.addEventListener("click", toggleTheme);