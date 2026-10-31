// ---- ショートカット文字列の生成（options.js と同じ処理） ----
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

// ---- ルール読み込み ----
let rules = [];
chrome.storage.local.get("rules", (d) => { rules = d.rules || []; });
chrome.storage.onChanged.addListener((changes) => {
  if (changes.rules) rules = changes.rules.newValue || [];
});

function siteMatches(site) {
  site = (site || "").trim().toLowerCase()
    .replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!site) return false;
  if (site === "*") return true;
  const host = location.hostname.toLowerCase();
  return host === site || host.endsWith("." + site);
}

function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

// ---- キー入力の監視 ----
document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const combo = comboFromEvent(e);
  if (!combo) return;

  // 修飾キーなしのショートカットは、入力欄での通常のタイピングを邪魔しない
  const hasMod = e.ctrlKey || e.altKey || e.metaKey;
  if (!hasMod && isEditable(document.activeElement)) return;

  for (const r of rules) {
    if (!r.enabled || r.combo !== combo || !r.selector) continue;
    if (!siteMatches(r.site)) continue;

    let el = null;
    try {
      el = document.querySelector(r.selector);
    } catch (err) {
      console.warn("[Click Shortcut] セレクタが不正です:", r.selector);
      continue;
    }
    if (!el) {
      console.debug("[Click Shortcut] 要素が見つかりません:", r.selector);
      continue;
    }
    e.preventDefault();
    e.stopPropagation();
    el.click();
    return;
  }
}, true);
