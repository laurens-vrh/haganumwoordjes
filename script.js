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
	const data = await fetch(`database.json`);
	db = await data.json();
}

async function searchCheck() {
	if (search_box.value == search_box_value_old) return;
	if (search_box.value == "") return (results_container.innerHTML = "");
	if (search_box.value.length < 2 && search_box.value != `*`) return (results_container.innerHTML = "Enter 2 or more characters.");
	search_box_value_old = search_box.value;
	search(search_box.value);
}

async function updateUpdates() {
	var res = await fetch("https://jsonblob.com/api/jsonBlob/e6c79a7a-05ab-11ec-aaee-9dc878e33fd5");
	updates.innerText = await res.json();
}

async function search(term) {
	results_container.innerHTML = "";
	var book = db[book_select.value];

	term = term.toLowerCase();

	// var results = book.filter((w) => {
	// 	w.translation = w.translation.join("\n");
	// 	Object.entries(replaceChars).forEach(([key, value]) => {
	// 		w.word = w.word.replace(key, value);
	// 		w.translation = w.translation.replace(key, value);
	// 	});
	// 	w.translation = w.translation.split(`\n`);
	// 	return w.word.includes(term) || w.translation.join(`\n`).includes(term);
	// });

	// book = [book[0], book[1], book[2], book[3], book[4], book[5], book[6], book[7], book[8]];

	book = book.map((w) => {
		w.relevance = calculateRelevance(w, term);
		w.lengthrelevance = calculateLengthRelevance(w, term);
		return w;
	});
	book = book.filter((w) => w.relevance > 0.5 && w.lengthrelevance > 0.2);

	var results = book
		.sort((a, b) => {
			return a.relevance - b.relevance;
		})
		.sort((a, b) => {
			return a.relevance == b.relevance ? a.lengthrelevance - b.lengthrelevance : 0;
		})
		.reverse();

	if (term == `*`) results = book;
	renderResults(results);
	// console.log(results[0], results[1], results[2], results[3], results[4], results[5], results[6]);
	console.log(results);
}

function calculateRelevance(w, term) {
	var word = w.word;
	Object.entries(replaceChars).forEach(([key, value]) => {
		word = word.replaceAll(key, value);
	});

	const wLength = word.length;
	const termLength = term.length;

	var termLetter = 0;
	var wLetter = 0;
	var matchingLetters = 0;

	while (wLetter < wLength && termLetter < termLength) {
		if (term[termLetter] == word[wLetter]) {
			termLetter++;
			wLetter++;
			matchingLetters++;
			continue;
		}
		wLetter++;
	}

	return matchingLetters / termLength;
}

function calculateLengthRelevance(w, term) {
	var word = w.word;
	Object.entries(replaceChars).forEach(([key, value]) => {
		word = word.replaceAll(key, value);
	});

	const wLength = word.length;
	const termLength = term.length;

	return termLength / wLength;
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
			wordText.innerHTML += ` <img src="https://fonts.gstatic.com/s/i/materialicons/content_copy/v15/24px.svg" style="width: 15px;" alt="" />`;
		});
		wordText.addEventListener("mouseleave", (e) => {
			wordText.innerHTML = wordText.innerHTML.substring(0, wordText.innerHTML.length - 88);
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
