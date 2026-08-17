/* =================================================================
   Daglig todo — app.js

   Redigera TASK_TEMPLATE nedan för att ändra dina återkommande
   dagliga uppgifter. Varje uppgift behöver ett unikt "id" (ändra
   inte id på en befintlig rad om du bara vill byta text — då
   räknas den som en ny uppgift) och en "text" som visas i listan.
================================================================= */

const TASK_TEMPLATE = [
  { id: "medicin", text: "Ta medicin" },
  { id: "kreatin", text: "Drick kreatin" },
  { id: "stada", text: "Städa 15 min" },
  { id: "aktivitet", text: "30 min aktivitet (promenad/träning)" },
];

/* ================================================================= */

const STORAGE_KEY = "dagligtodo.state.v1";

const WEEKDAYS = [
  "Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag",
];
const MONTHS = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

const listEl = document.getElementById("list");
const weekdayEl = document.getElementById("weekday");
const datelineEl = document.getElementById("dateline");
const progressEl = document.getElementById("progress");

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildFreshState(date = new Date()) {
  return {
    date: todayKey(date),
    tasks: TASK_TEMPLATE.map((t) => ({
      id: t.id,
      text: t.text,
      done: false,
      custom: false,
    })),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.date !== "string" || !Array.isArray(parsed.tasks)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureFreshForToday() {
  const key = todayKey();
  const loaded = loadState();
  if (!loaded || loaded.date !== key) {
    state = buildFreshState();
    saveState();
    return true;
  }
  state = loaded;
  return false;
}

let state = buildFreshState();
ensureFreshForToday();

let addFormOpen = false;

function formatHeader(d = new Date()) {
  weekdayEl.textContent = WEEKDAYS[d.getDay()];
  datelineEl.textContent = `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

function formatProgress() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  if (total === 0) {
    progressEl.textContent = "";
    return;
  }
  progressEl.textContent = `${done} av ${total} klara`;
}

function render() {
  formatHeader();
  formatProgress();

  listEl.innerHTML = "";

  if (state.tasks.length === 0 && !addFormOpen) {
    const empty = document.createElement("p");
    empty.className = "list__empty";
    empty.textContent = "Inget kvar idag.";
    listEl.appendChild(empty);
  }

  for (const task of state.tasks) {
    listEl.appendChild(renderRow(task));
  }

  listEl.appendChild(renderAddRow());
}

function renderRow(task) {
  const row = document.createElement("div");
  row.className = "row" + (task.done ? " is-done" : "");

  const tap = document.createElement("button");
  tap.type = "button";
  tap.className = "row__tap";
  tap.setAttribute("aria-pressed", String(task.done));

  const mark = document.createElement("span");
  mark.className = "row__mark";
  mark.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "row__label";
  label.textContent = task.text;

  tap.appendChild(mark);
  tap.appendChild(label);
  tap.addEventListener("click", () => toggleTask(task.id));

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "row__remove";
  remove.setAttribute("aria-label", `Ta bort "${task.text}" för idag`);
  remove.textContent = "×";
  remove.addEventListener("click", (e) => {
    e.stopPropagation();
    removeTask(task.id);
  });

  row.appendChild(tap);
  row.appendChild(remove);
  return row;
}

function renderAddRow() {
  const wrap = document.createElement("div");
  wrap.className = "add-row";

  if (!addFormOpen) {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "add-row__trigger";
    trigger.innerHTML = '<span class="add-row__plus">+</span> Lägg till uppgift';
    trigger.addEventListener("click", () => {
      addFormOpen = true;
      render();
      const input = listEl.querySelector(".add-row__input");
      if (input) input.focus();
    });
    wrap.appendChild(trigger);
    return wrap;
  }

  const form = document.createElement("form");
  form.className = "add-row__form";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "add-row__input";
  input.placeholder = "Ny uppgift för idag…";
  input.maxLength = 60;

  const confirm = document.createElement("button");
  confirm.type = "submit";
  confirm.className = "add-row__confirm";
  confirm.setAttribute("aria-label", "Lägg till");
  confirm.textContent = "✓";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "add-row__cancel";
  cancel.setAttribute("aria-label", "Avbryt");
  cancel.textContent = "×";
  cancel.addEventListener("click", () => {
    addFormOpen = false;
    render();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      addTask(text);
    }
    addFormOpen = false;
    render();
  });

  form.appendChild(input);
  form.appendChild(confirm);
  form.appendChild(cancel);
  wrap.appendChild(form);
  return wrap;
}

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveState();
  render();
}

function removeTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  saveState();
  render();
}

function addTask(text) {
  state.tasks.push({
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    done: false,
    custom: true,
  });
  saveState();
}

function checkForNewDay() {
  const changed = ensureFreshForToday();
  if (changed) render();
}

render();

setInterval(checkForNewDay, 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkForNewDay();
});
window.addEventListener("focus", checkForNewDay);
