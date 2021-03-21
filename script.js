const book_select = document.getElementById("book-select");
const search_box = document.getElementById("search-box");
const results_container = document.getElementById("results-container");
const updates = document.getElementById("updates");
const hide_show = document.getElementById("hide-show");
const favicon = document.getElementById("favicon");

const replaceChars = {
	ē: `e`,
	"(": ``,
	")": ``,
};

db = undefined;
loadDB();
updateUpdates();

hide_show.addEventListener("click", (e) => {
	e.preventDefault();
	if (hide_show.innerText == "Hide") {
		document.title = "Gymnasium Haganum - Agenda";
		favicon.href = `https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_${new Date().getDate()}.ico`;
		hide_show.innerText = "Show";
	} else {
		document.title = "Haganum Woordjes";
		favicon.href = "favicon.png";
		hide_show.innerText = "Hide";
	}
});

search_box_value_old = search_box.value;
["propertychange", "change", "click", "keyup", "input", "paste"].forEach((event) => {
	search_box.addEventListener(event, (e) => {
		searchCheck();
	});
});

book_select.addEventListener("change", (e) => {
	search_box.value = "";
	searchCheck();
});

async function loadDB() {
	readTextFile("./database.json", function (text) {
		db = JSON.parse(text);
	});
}

async function searchCheck() {
	if (search_box.value == search_box_value_old) return;
	if (search_box.value == "") return (results_container.innerHTML = "");
	if (search_box.value.length < 2) return (results_container.innerHTML = "Enter 2 or more characters.");
	search_box_value_old = search_box.value;
	search(search_box.value);
}

async function updateUpdates() {
	var res = await fetch("https://jsonblob.com/api/jsonBlob/465afa85-5b0a-11eb-b5da-bd88ca7c34a0");
	updates.innerText = await res.json();
}

async function search(term) {
	results_container.innerHTML = "";
	const book = db[book_select.value];

	term = term.toLowerCase();

	var results = book.filter((w) => {
		w.translation = w.translation.join("\n");
		Object.entries(replaceChars).forEach(([key, value]) => {
			w.word.replace(key, value);
			w.translation.replace(key, value);
		});
		w.translation = w.translation.split(`\n`);
		return w.word.includes(term) || w.translation.join(`\n`).includes(term);
	});
	renderResults(results);
}

async function renderResults(results) {
	if (results.length < 1) {
		var element = document.createElement("h2");
		element.innerText = "Geen resultaten.";
		results_container.appendChild(element);
		return;
	}
	results.forEach((result) => {
		var div = document.createElement("div");
		div.classList.add("word-box");

		var wordText = document.createElement("span");
		wordText.classList.add("word");
		wordText.classList.add("noselect");
		wordText.innerText = result.word;

		wordText.addEventListener("mouseenter", (e) => {
			wordText.innerHTML += ` <img src="https://fonts.gstatic.com/s/i/materialicons/content_copy/v15/24px.svg" style="width: 15px;" />`;
		});
		wordText.addEventListener("mouseleave", (e) => {
			wordText.innerHTML = wordText.innerHTML.substring(0, wordText.innerHTML.length - 82);
		});
		wordText.addEventListener("click", (e) => {
			const copy_hold = document.getElementById("copy-hold");
			copy_hold.value = wordText.innerText.substring(0, wordText.innerText.length - 1);

			copy_hold.select();
			copy_hold.setSelectionRange(0, 99999);

			document.execCommand("copy");
		});

		div.appendChild(wordText);

		if (result.time) {
			var timeText = document.createElement("span");
			timeText.classList.add("time");
			timeText.classList.add("noselect");
			timeText.innerText = result.time;
			div.appendChild(timeText);
		}

		if (result.sex) {
			var sexText = document.createElement("span");
			sexText.classList.add("sex");
			sexText.classList.add("noselect");
			sexText.innerText = result.sex;
			div.appendChild(sexText);
		}

		if (result.goesWith) {
			var goesWithText = document.createElement("span");
			goesWithText.classList.add("goeswith");
			goesWithText.classList.add("noselect");
			goesWithText.innerText = ` ${result.goesWith}`;
			div.appendChild(goesWithText);
		}

		var div2 = document.createElement("div");
		div2.classList.add("translation-div");

		var translationText = document.createElement("span");
		translationText.classList.add("translation");
		if (results.lesson && !result.lesson[0].includes(".")) {
			translationText.innerText = result.translation.join(" / ");
			translationText.innerText += ` ${result.lesson}`;
		} else {
			counter = 0;
			result.translation.forEach((translation) => {
				translationText.innerText += `${translation}`;
				if (counter < result.translation.length - 1) translationText.innerText += ` / `;
				counter++;
			});
		}
		if (result.time == "pf" || result.time == "ppp" || result.time == "ppa") translationText.innerText = `←  ${result.translation}`;

		div2.appendChild(translationText);
		div.appendChild(div2);
		results_container.appendChild(div);
	});
}

function readTextFile(file, callback) {
	var rawFile = new XMLHttpRequest();
	rawFile.overrideMimeType("application/json");
	rawFile.open("GET", file, true);
	rawFile.onreadystatechange = function () {
		if (rawFile.readyState === 4 && rawFile.status == "200") {
			callback(rawFile.responseText);
		}
	};
	rawFile.send(null);
}
