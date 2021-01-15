const book_select = document.getElementById("book-select");
const search_box = document.getElementById("search-box");
const results_container = document.getElementById("results-container");

db = undefined;
loadDB();

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
	search_box_value_old = search_box.value;
	search(search_box.value);
}

async function search(term) {
	results_container.innerHTML = "";
	const book = db[book_select.value];
	var results = book.filter((w) => w.word.includes(term.toLowerCase()) || w.translation.join("\n").includes(term.toLowerCase()));
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
		wordText.innerText = result.word;
		div.appendChild(wordText);

		if (result.time) {
			var timeText = document.createElement("span");
			timeText.classList.add("time");
			timeText.innerText = result.time;
			div.appendChild(timeText);
		}

		if (result.sex) {
			var sexText = document.createElement("span");
			sexText.classList.add("sex");
			sexText.innerText = result.sex;
			div.appendChild(sexText);
		}

		if (result.goesWith) {
			var goesWithText = document.createElement("span");
			goesWithText.classList.add("goeswith");
			cases = ["nom", "gen", "dat", "acc", "abl", "voc"];
			goesWithText.innerText = `+ ${cases[result.goesWith]}.`;
			div.appendChild(goesWithText);
		}

		var div2 = document.createElement("div");
		div2.classList.add("translation-div");

		var translationText = document.createElement("span");
		translationText.classList.add("translation");
		if (!result.lesson[0].includes(".")) {
			translationText.innerText = result.translation.join(" / ");
			translationText.innerText += ` ${result.lesson}`;
		} else {
			counter = 0;
			result.translation.forEach((translation) => {
				translationText.innerText += `${translation}`;
				translationText.innerText += ` ${result.lesson[counter]}`;
				if (counter < result.translation.length - 1) translationText.innerText += ` / `;
				counter++;
			});
		}
		if (result.time == "pf") translationText.innerText = `←  ${result.translation}`;

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
