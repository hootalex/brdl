//set theme 

const queryString = window.location.search.substring(1);;
console.log(queryString);

if (queryString) {
  document.head.insertAdjacentHTML("beforeend", "<link rel='stylesheet' href='"+queryString+".css' />")

}

//begin Worble app

const $ = (s, e = document.body) => e.querySelector(s);
const $$ = (s, e = document.body) => [...e.querySelectorAll(s)];
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
let close = "close",
  correct = "correct",
  wrong = "wrong",
  correctClass = "key--hint-correct",
  closeClass = "key--hint-close",
  wrongClass = "key--hint-wrong";

const dom = (tag, attrs, ...children) => {
  const el = document.createElement(tag);
  if (attrs instanceof HTMLElement) {
    children.unshift(attrs);
  } else {
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === "class" && value instanceof Array) {
        value = value.join(" ");
      }
      el.setAttribute(key, value);
    });
  }
  el.append(...children.flat());
  return el;
};

const KEYS = ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"];
const PRETTY_KEYS = {
  "+": "Enter",
  "-": "Del",
};

const ROUNDS = 6;
const LENGTH = 4;

const dictionaryRequest = fetch("/dictionary.txt").then((r) => r.text());
const board = $(".board");
const keyboard = $(".keyboard");

window.onload = () => init().catch((e) => console.error(e));

async function init() {
  
  const board = generateBoard();
  const kb = generateKeyboard();

  //Get BRDL number and then pull a JSON thing like brdlauto[brdlnum]

  const words = (await dictionaryRequest).split("\n");

  const word = brdl;

  await startGame({ word, kb, board, words });
}

async function animate(el, name, ms) {
  el.style.animation = `${ms}ms ${name}`;
  await wait(ms * 1.2);
  el.style.animation = "none";
}

function addUrlParam(value) {
    // const params = new URLSearchParams(window.location.search);
    // params.set("", value);
    // window.history.replaceState({}, "", decodeURIComponent(`${window.location.pathname}?${params}`));
}

addUrlParam(autobrdlcount);

function showFeedback(content, kind) {
document.querySelector(".feedback").classList.remove("green","yellow","red");
document.querySelector(".feedback").classList.add("feedbackshow");
document.querySelector(".feedback").classList.add(kind);
document.querySelector(".feedback").innerText = content
}


    function hideFeedback() {
      document.querySelector(".feedback").classList.remove("feedbackshow");
    }

if (brdl === undefined) {
  
  showFeedback("🥚 Load error! Your device may have its clock set incorrectly. Try refreshing? 💾","red")
  
} else {

      showFeedback("🐦 "+brdlcount + " loaded! 💾","green")
      setTimeout(() => { hideFeedback() }, 2500);
}

async function startGame({ word, kb, board, words }) {
  let round = 0;
  for (round = 0; round < ROUNDS; round++) {
    const solution = word.split("");
    const guess = await collectGuess({ kb, board, round, words });
    const hints = new Array(guess.length).fill("wrong");
    for (let i = 0; i < guess.length; i++) {
      if (solution[i] === guess[i]) {
        hints[i] = "correct";
        solution[i] = undefined;
      }
    }
    for (let i = 0; i < guess.length; i++) {
      if (hints[i] === "wrong") {
        const index = solution.indexOf(guess[i]);
        if (index !== -1) {
          hints[i] = "close";
          solution[index] = undefined;
        }
      }
    }
    board.revealHint(round, hints);
    kb.revealHint(guess, hints);
    if (guess.join("") === word) {
      document.querySelector(".feedback").style.pointerEvents = "auto";

      document.querySelector(".gojobuttons").classList.add("gojoshow");
      
      addUrlParam("win"+autobrdlcount)

      confetti({
        colors: ["#b2d075", "#0270a2", "#FD752D", "#BB54EE"],
      });
      getStats();
      return;
    }
  }
  
  addUrlParam("lost"+autobrdlcount)
  
  showFeedback(`Better luck tomorrow!\nThe correct bird was 🪶 ${word}`,"yellow")
}

let help = 0

function collectGuess({ kb, board, round, words }) {
  return new Promise((submit) => {
    let letters = [];
    async function keyHandler(key) {
      if (key === "+") {
        if (letters.length === 4) {
          const guessIsValid = words.includes(letters.join(""));
          if (!guessIsValid) {
            
            if (help == 0) {
              addUrlParam("h"+autobrdlcount)
              
            showFeedback("Invalid code! 🐟 Backspace and try again","yellow")
              help++
            } else {
              addUrlParam("hh"+autobrdlcount)
              
              showFeedback("Invalid code! 🐟 Hint: Checking a guide is fine unless you’re on “hard mode” 📚","red")
            }
            
            
            await animate($$(".round")[round], "shake", 800);
          } else {
            hideFeedback();
            kb.off(keyHandler);
            submit(letters);
          }
        }
      } else if (key === "-") {
        if (letters.length > 0) {
          letters.pop();
        }
        board.updateGuess(round, letters);
      } else {
        if (letters.length < 4) {
          letters.push(key);
        }
        board.updateGuess(round, letters);
      }
    }
    kb.on(keyHandler);
  });
}

function generateBoard() {
  const rows = [];
  for (let i = 0; i < ROUNDS; i++) {
    const row = dom("div", {
      class: "round",
      "data-round": i,
    });
    for (let j = 0; j < LENGTH; j++) {
      row.append(
        dom("div", {
          class: "letter",
          "data-pos": j,
        })
      );
    }
    board.append(row);
  }
  return {
    updateGuess: (round, letters) => {
      const blanks = $$(".letter", $$(".round")[round]);
      blanks.forEach((b, i) => (b.innerText = letters[i] || ""));
    },
    revealHint: (round, hints) => {
      const blanks = $$(".letter", $$(".round")[round]);
      hints.forEach((hint, i) => {
        if (hint) {
          blanks[i].classList.add("letter--hint-" + hint);
        }
      });
    },
  };
}

function generateKeyboard() {
  keyboard.append(
    ...KEYS.map((row) =>
      dom(
        "div",
        {
          class: "keyboard__row",
        },
        row.split("").map((key) =>
          dom(
            "button",
            {
              class: `key${PRETTY_KEYS[key] ? " key--pretty" : ""}`,
              "data-key": key,
            },
            PRETTY_KEYS[key] || key
          )
        )
      )
    )
  );
  const keyListeners = new Set();
  keyboard.addEventListener("click", (e) => {
    e.preventDefault();
    const key = e.target.getAttribute("data-key");
    if (key) {
      keyListeners.forEach((l) => l(key));
    }
  });
  document.addEventListener("keyup", function (event) {
    let key = event.key.toUpperCase();
    if (key === "ENTER") {
      key = "+";
    }
    if (key === "BACKSPACE") {
      key = "-";
    }
    if (KEYS.join("").includes(key)) {
      keyListeners.forEach((l) => l(key));
    }
  });
  return {
    on: (l) => keyListeners.add(l),
    off: (l) => keyListeners.delete(l),
    revealHint: (guess, hints) => {
      let thisRoundCorrect = [];
      let thisRoundClose = [];
      hints.forEach((hint, i) => {
        let thisGuess = guess[i];
        let elem = $(`[data-key="${thisGuess}"]`);
        if (hint === close && !thisRoundCorrect.includes(thisGuess)) {
          thisRoundClose.push(thisGuess);
          elem.classList = "key";
          elem.classList.add(closeClass);
        } else if (
          hint === wrong &&
          !thisRoundCorrect.includes(thisGuess) &&
          !thisRoundClose.includes(thisGuess)
        ) {
          elem.classList.add(wrongClass);
        } else if (hint === correct) {
          thisRoundCorrect.push(thisGuess);
          elem.classList = "key";
          elem.classList.add(correctClass);
        }
      });
    },
  };
}

//added 

let emojipasta = [];
let count = 0;

function copyToClipboard(textString) {
  const magicTextarea = document.createElement("textarea");

  magicTextarea.innerHTML = textString.trim();

  const parentElement = document.getElementById("copy");
  parentElement.appendChild(magicTextarea);

  magicTextarea.select();

  document.execCommand("copy");

  parentElement.removeChild(magicTextarea);
}

function getStats() {
  const letters = document.querySelectorAll(".letter");

  letters.forEach((letter) => {
    if (letter.classList.contains("letter--hint-wrong")) {
      emojipasta.push("🥚");
      count++;
    }

    if (letter.classList.contains("letter--hint-close")) {
      emojipasta.push("🪶");
      count++;
    }

    if (letter.classList.contains("letter--hint-correct")) {
      emojipasta.push("🐦");
      count++;
    }

    if (
      count == 4 ||
      count == 8 ||
      count == 12 ||
      count == 16 ||
      count == 20 ||
      count == 24
    ) {
      if (emojipasta[emojipasta.length - 1] === "<br>") {
      } else {
        emojipasta.push("<br>");
      }
    }
  });

  let emojistring = emojipasta.join("");

  document.getElementById("stats").innerHTML = brdlcount + "<br>" + emojistring;
}

function copyStats() {
  copyToClipboard(document.getElementById("stats").innerText);
  document.getElementById("copystats").innerHTML = "Copied! ✅";
  document.getElementById("copystats").classList.add("copied");
}

document.addEventListener("DOMContentLoaded", function(event) {
  

document.querySelector("#copystats").addEventListener("click", (e) => { copyStats(); 
addUrlParam("copied"+autobrdlcount)
                                                                      });

document.querySelector("#screenshot").addEventListener("click", (e) => {   document.getElementById("stats").classList.add("screenshot");           addUrlParam("screenshot"+autobrdlcount)
 });

 document.querySelector("#stats").addEventListener("click", (e) => {   document.getElementById("stats").classList.remove("screenshot");
  });
  
   document.querySelector(".feedback").addEventListener("click", (e) => {   
     hideFeedback()
  });
  
});