const elements = {
    favicon: document.querySelector("[data-ref='favicon']"),
    hide_btn: document.querySelector("[data-ref='hide-btn']"),
    intro_text: document.querySelector("[data-ref='intro-text']"),
    news: document.querySelector("[data-ref='news']"),
    book_select: document.querySelector("[data-ref='book-select']"),
    direction_select: document.querySelector("[data-ref='direction-select']"),
    search: document.querySelector("[data-ref='search']"),
    results_container: document.querySelector("[data-ref='results-container']"),
}


const replaceChars = {
    ē: "e",
    "(": "",
    ")": "",
    ü: "u",
    ö: "o",
    ä: "a",
    ï: "i"
};


// PAGE LOAD
const config = loadConfig();
config.direction ? {} : config.direction = {};
saveConfig();
setHidden(config.hidden || false, true);

// news
elements.news.innerText = config.news || "...";
fetch("https://jsonblob.com/api/jsonBlob/1112124075597381632").then(async (res) => {
    json = await res.json();
    elements.news.innerText = json.news;
    config.news = json.news;
    saveConfig();
})

var database = { books: [], lists: [] };
fetch("data/books.json").then(async (res) => {
    window.database.books = await res.json();
    elements.book_select.innerHTML = "";
    window.database.books.forEach((book) => elements.book_select.innerHTML += `<option value="${book.id}">${book.name}</option>`);
    elements.book_select.value = config.book || 0;
    bookChange(true);
});
elements.book_select.addEventListener("click", hideIntroText)
elements.book_select.addEventListener("change", bookChange)
async function bookChange(first = false) {
    config.book = elements.book_select.value;
    if (!first) saveConfig();
    if (!database.lists[config.book]) await fetch(`data/lists/${config.book}.json`).then(async (res) => database.lists[config.book] = await res.json());

    elements.direction_select.innerHTML = "";
    database.books.find((b) => b.id == config.book)?.directions.forEach((dir, idx) => elements.direction_select.innerHTML += `<option value="${idx}">${dir}</option>`)
    elements.direction_select.value = config.direction[config.book] || 0;
    elements.search.value = "";
    elements.results_container.innerHTML = "";
}
elements.direction_select.addEventListener("click", hideIntroText)
elements.direction_select.addEventListener("change", () => {
    config.direction[config.book] = parseInt(elements.direction_select.value);
    saveConfig();
    search(true);
})
function hideIntroText() {
    elements.intro_text.classList.add("hide-on-mobile");
    elements.news.classList.add("hide-on-mobile");
}
// PAGE LOAD


// HIDE BUTTON
elements.hide_btn.addEventListener("click", (e) => {
    e.preventDefault();
    setHidden(!config.hidden)
});

// CONFIG
function saveConfig() { localStorage.setItem("config", JSON.stringify(config)) };
function loadConfig() {
    const localConfig = localStorage.getItem("config")
    return localConfig ? JSON.parse(localStorage.getItem("config")) : {}
};

function setHidden(hidden, load = false) {
    if (config.hidden === hidden && !load) return;

    document.title = hidden ? "Gymnasium Haganum - Agenda" : "Woordjes | haganum.net";
    elements.favicon.href = hidden ? `https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_${new Date().getDate()}.ico` : "img/favicon.png";
    elements.hide_btn.children[0].innerText = hidden ? "visibility" : "visibility_off";
    if (load) return;
    config.hidden = hidden;
    saveConfig();
}



// SEARCH
old_search_term = elements.search.value;
elements.search.addEventListener("click", hideIntroText);
["change", "keyup", "input", "paste"].forEach((event) =>
    elements.search.addEventListener(event, search)
);

async function search(force = false) {
    const term = elements.search.value.toLowerCase();
    if (term === old_search_term && !force) return;
    if (term === "") return (elements.results_container.innerHTML = "");
    old_search_term = term;


    const list = database.lists[config.book]

    const results = term === '*' ? list : list.filter((w) => {
        if ((config.direction[config.book] || 0) === 0) w.searchIn = w.word;
        else if (config.direction[config.book] === 1) w.searchIn = w.translations.join("\n");

        Object.entries(replaceChars).forEach(([key, value]) => w.searchIn = w.searchIn.replaceAll(key, value));

        return w.searchIn.toLowerCase().includes(term);
    });

    renderResults(results);
}


function renderResults(results) {
    if (results.length < 1) return elements.results_container.innerHTML = "<h2>Geen resultaten.</h2>";

    results = results.map(generateWord);
    elements.results_container.innerHTML = results.join("");
}

const sleep = ms => new Promise(r => setTimeout(r, ms));


function generateWord(result) {
    return `<div class="word-box"><span class="word">${result.word}</span>${result.note ? `<span class='note'>${result.note}</span>` : ""}<div class="translation-container"><span class="translation">${["pf", "ppp", "ppa", "pfa"].includes(result.note) ? "→ " : ""}${result.translations.join("; ")}</span></div></div>`;
}