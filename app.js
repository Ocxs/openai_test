const CHATGPT_URL_PRIMARY = 'https://chatgpt.com/';
const CHATGPT_URL_FALLBACK = 'https://chat.openai.com/';
const GEMINI_URL = 'https://gemini.google.com/';
const HISTORY_KEY = 'dual-llm-workbench-history-v1';
const HISTORY_LIMIT = 20;

const questionEl = document.getElementById('question');
const statusEl = document.getElementById('status');
const historyListEl = document.getElementById('historyList');

const copyBtn = document.getElementById('copyBtn');
const openChatGPTBtn = document.getElementById('openChatGPTBtn');
const openGeminiBtn = document.getElementById('openGeminiBtn');
const openBothBtn = document.getElementById('openBothBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function getPrompt() {
  return questionEl.value.trim();
}

function fallbackCopy(text) {
  // Clipboard API may fail in Safari or non-secure contexts; fallback to execCommand copy.
  const temp = document.createElement('textarea');
  temp.value = text;
  temp.setAttribute('readonly', '');
  temp.style.position = 'fixed';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);
  temp.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(temp);
  return copied;
}

async function copyQuestion() {
  const text = getPrompt();
  if (!text) {
    setStatus('请先输入问题。', 'warn');
    return false;
  }

  // Clipboard API needs secure context + user activation in most browsers.
  try {
    await navigator.clipboard.writeText(text);
    setStatus('已复制到剪贴板。', 'ok');
    savePromptToHistory(text);
    return true;
  } catch {
    const copied = fallbackCopy(text);
    if (copied) {
      setStatus('已复制到剪贴板（兼容模式）。', 'ok');
      savePromptToHistory(text);
      return true;
    }

    questionEl.focus();
    questionEl.select();
    setStatus('复制失败：请手动复制（Cmd/Ctrl + C）。建议在 localhost 或 https 打开。', 'warn');
    return false;
  }
}

function openSite(url, name, fallbackUrl) {
  // window.open must be called from a user gesture; otherwise popup blockers will block it.
  const w = window.open(url, name, 'noopener,noreferrer');
  if (!w && fallbackUrl) {
    return window.open(fallbackUrl, name, 'noopener,noreferrer');
  }
  return w;
}

function tryTileWindows(chatWin, geminiWin) {
  // Browsers often block moveTo/resizeTo. We try quietly and provide guidance if blocked.
  try {
    const leftWidth = Math.floor(screen.availWidth / 2);
    const rightWidth = screen.availWidth - leftWidth;
    const height = screen.availHeight;

    if (chatWin) {
      chatWin.moveTo(0, 0);
      chatWin.resizeTo(leftWidth, height);
    }

    if (geminiWin) {
      geminiWin.moveTo(leftWidth, 0);
      geminiWin.resizeTo(rightWidth, height);
    }

    setStatus('已尝试左右分屏；若未生效，请手动分屏。', 'info');
  } catch {
    setStatus('浏览器限制了窗口调整，请手动分屏。', 'warn');
  }
}

function openBoth() {
  const chatWin = openSite(CHATGPT_URL_PRIMARY, 'chatgpt_window', CHATGPT_URL_FALLBACK);
  const geminiWin = openSite(GEMINI_URL, 'gemini_window');

  if (!chatWin || !geminiWin) {
    setStatus('弹窗可能被拦截。请允许弹窗，或分别点击“打开 ChatGPT / 打开 Gemini”。', 'warn');
    return;
  }

  tryTileWindows(chatWin, geminiWin);
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
}

function savePromptToHistory(text) {
  const history = loadHistory();
  const filtered = history.filter(item => item !== text);
  filtered.unshift(text);
  saveHistory(filtered);
  renderHistory();
}

function renderHistory() {
  const history = loadHistory();
  historyListEl.innerHTML = '';

  if (history.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No history yet.';
    historyListEl.appendChild(empty);
    return;
  }

  history.forEach(item => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'history-item';
    btn.textContent = item;
    btn.title = '点击回填到输入框';
    btn.addEventListener('click', () => {
      questionEl.value = item;
      questionEl.focus();
      setStatus('已回填历史问题。', 'info');
    });
    li.appendChild(btn);
    historyListEl.appendChild(li);
  });
}

copyBtn.addEventListener('click', copyQuestion);
openChatGPTBtn.addEventListener('click', () => {
  const win = openSite(CHATGPT_URL_PRIMARY, 'chatgpt_window', CHATGPT_URL_FALLBACK);
  if (!win) {
    setStatus('ChatGPT 弹窗被拦截，请允许弹窗后重试。', 'warn');
  }
});
openGeminiBtn.addEventListener('click', () => {
  const win = openSite(GEMINI_URL, 'gemini_window');
  if (!win) {
    setStatus('Gemini 弹窗被拦截，请允许弹窗后重试。', 'warn');
  }
});
openBothBtn.addEventListener('click', openBoth);
clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  setStatus('历史已清空。', 'info');
});

document.addEventListener('keydown', async (event) => {
  const metaOrCtrl = event.metaKey || event.ctrlKey;
  if (!metaOrCtrl) return;

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    await copyQuestion();
    return;
  }

  if (event.shiftKey && (event.key === 'O' || event.key === 'o')) {
    event.preventDefault();
    openBoth();
  }
});

renderHistory();
