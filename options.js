// ---- ショートカット文字列の生成（content.js と同じ処理） ----
function comboFromEvent(e) {
  if (/^(Control|Shift|Alt|Meta)(Left|Right)$/.test(e.code)) return null;
  let key = e.code;
  if (key.startsWith("Key")) key = key.slice(3);
  else if (key.startsWith("Digit")) key = key.slice(5);
  if (!key) return null;
  const mods = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (e.metaKey) mods.push("Meta");
  return [...mods, key].join("+");
}

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const statusEl = document.getElementById("status");
let rules = [];
let saveTimer, statusTimer;

function h(tag, props = {}, ...children) {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...children);
  return el;
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.local.set({ rules }, () => {
      statusEl.classList.add("show");
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => statusEl.classList.remove("show"), 1500);
    });
  }, 250);
}

function renderRow(rule) {
  const row = h("div", { className: "row" + (rule.enabled ? "" : " off") });

  const site = h("input", { type: "text", placeholder: "example.com", value: rule.site, ariaLabel: "サイト" });
  site.addEventListener("input", () => { rule.site = site.value.trim(); save(); });

  const sel = h("input", { type: "text", className: "sel", placeholder: "body > #id-1", value: rule.selector, ariaLabel: "要素のセレクタ" });
  sel.addEventListener("input", () => { rule.selector = sel.value.trim(); save(); });

  const key = h("div", { className: "key", tabIndex: 0, role: "button", ariaLabel: "ショートカットキー" });
  const paint = () => {
    key.replaceChildren();
    if (rule.combo) rule.combo.split("+").forEach((p) => key.append(h("kbd", {}, p)));
    else key.append(
      h("span", { className: "hint hint-idle" }, "クリックして入力"),
    );
    if (!rule.combo) key.append(h("span", { className: "hint hint-rec" }, "キーを押してください"));
  };
  key.addEventListener("keydown", (e) => {
    if (e.key === "Tab") return;
    e.preventDefault();
    const noMod = !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey;
    if (noMod && (e.key === "Backspace" || e.key === "Delete")) {
      rule.combo = ""; paint(); save(); return;
    }
    const combo = comboFromEvent(e);
    if (!combo) return;
    rule.combo = combo; paint(); save();
  });
  paint();

  const on = h("input", { type: "checkbox", className: "toggle", checked: rule.enabled, ariaLabel: "有効" });
  on.addEventListener("change", () => {
    rule.enabled = on.checked;
    row.classList.toggle("off", !rule.enabled);
    save();
  });

  const del = h("button", { type: "button", className: "del", title: "削除", ariaLabel: "削除" }, "×");
  del.addEventListener("click", () => {
    rules = rules.filter((r) => r !== rule);
    render(); save();
  });

  row.append(site, sel, key, on, del);
  return row;
}

function render() {
  listEl.replaceChildren(...rules.map(renderRow));
  emptyEl.hidden = rules.length > 0;
}

document.getElementById("add").addEventListener("click", () => {
  rules.push({ site: "", selector: "", combo: "", enabled: true });
  render();
  listEl.lastElementChild?.querySelector("input")?.focus();
  save();
});

chrome.storage.local.get("rules", (d) => {
  rules = d.rules || [];
  render();
});
