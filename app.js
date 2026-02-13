const CHATGPT_URL = 'https://chatgpt.com/';
const CHATGPT_FALLBACK_URL = 'https://chat.openai.com/';
const GEMINI_URL = 'https://gemini.google.com/';
const HISTORY_KEY = 'dual-llm-workbench-history-v1';
const HISTORY_LIMIT = 20;

const questionEl = document.getElementById('question');
const statusEl = document.getElementById('status');
const toastEl = document.getElementById('toast');
const historyListEl = document.getElementById('historyList');

const copyBtn = document.getElementById('copyBtn');
const openChatgptBtn = document.getElementById('openChatgptBtn');
const openGeminiBtn = document.getElementById('openGeminiBtn');
const openBothBtn = document.getElementById('openBothBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function showToast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.classList.remove('show', 'error');
  if (isError) toastEl.classList.add('error');
  requestAnimationFrame(() => toastEl.classList.add('show'));
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function getText() {
  return questionEl.value.trim();
}

async function copyQuestion() {
  const text = getText();
  if (!text) {
    setStatus('请先输入问题。', true);
    showToast('请先输入问题', true);
    return false;
  }

  // Clipboard API usually needs secure context (https/localhost) and user activation.
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      persistHistory(text);
      setStatus('已复制到剪贴板。');
      showToast('已复制');
      return true;
    }
    throw new Error('Clipboard API unavailable');
  } catch {
    // Fallback for browsers/environments where navigator.clipboard is blocked.
    // execCommand is legacy but still helps in Safari/older contexts.
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    temp.setSelectionRange(0, temp.value.length);

    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(temp);
      if (ok) {
        persistHistory(text);
        setStatus('已复制到剪贴板（兼容模式）。');
        showToast('已复制（兼容模式）');
        return true;
      }
    } catch {
      document.body.removeChild(temp);
    }

    setStatus('复制失败：请手动全选并复制。建议在 https 或 localhost 打开。', true);
    showToast('复制失败，请手动复制', true);
    return false;
  }
}

function openOne(url, name) {
  // window.open must be called from a user gesture; pop-up blockers may still block it.
  return window.open(url, name, 'noopener,noreferrer');
}

function trySplitWindows(leftWin, rightWin) {
  // Browsers may deny moveTo/resizeTo for tabs or restricted pop-up settings.
  try {
    const halfWidth = Math.floor(window.screen.availWidth / 2);
    const height = window.screen.availHeight;
    leftWin?.moveTo(0, 0);
    leftWin?.resizeTo(halfWidth, height);
    rightWin?.moveTo(halfWidth, 0);
    rightWin?.resizeTo(halfWidth, height);
    setStatus('已尝试左右分屏；若未生效，请手动分屏。');
  } catch {
    setStatus('窗口已打开，但浏览器限制了自动分屏，请手动分屏。');
  }
}

function openChatgpt() {
  const popup = openOne(CHATGPT_URL, 'dual-llm-chatgpt');
  if (!popup) {
    setStatus('ChatGPT 窗口被拦截，请允许弹窗后重试。', true);
    showToast('ChatGPT 窗口被拦截', true);
    return;
  }

  // Optional fallback URL if primary domain is redirected/blocked in some regions.
  popup.focus();
  setTimeout(() => {
    try {
      if (popup.location.href === 'about:blank') popup.location.href = CHATGPT_FALLBACK_URL;
    } catch {
      // Cross-origin access can throw; ignore silently.
    }
  }, 600);

  setStatus('已打开 ChatGPT。');
}

function openGemini() {
  const popup = openOne(GEMINI_URL, 'dual-llm-gemini');
  if (!popup) {
    setStatus('Gemini 窗口被拦截，请允许弹窗后重试。', true);
    showToast('Gemini 窗口被拦截', true);
    return;
  }
  popup.focus();
  setStatus('已打开 Gemini。');
}

function openBoth() {
  // Must happen in one click handler; otherwise blockers are even more likely.
  const left = openOne(CHATGPT_URL, 'dual-llm-chatgpt');
  const right = openOne(GEMINI_URL, 'dual-llm-gemini');

  if (!left || !right) {
    setStatus('“同时打开”被弹窗策略拦截。请允许弹窗，或改为分别点击打开。', true);
    showToast('同时打开被拦截，可分别打开', true);
    return;
  }

  trySplitWindows(left, right);
  showToast('已打开两边窗口');
}

function readHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_LIMIT)));
}

function persistHistory(text) {
  const list = readHistory();
  const deduped = [text, ...list.filter(item => item !== text)].slice(0, HISTORY_LIMIT);
  writeHistory(deduped);
  renderHistory();
}

function renderHistory() {
  const items = readHistory();
  historyListEl.innerHTML = '';

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '暂无历史记录。';
    historyListEl.appendChild(li);
    return;
  }

  items.forEach((text, index) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'history-item';
    btn.textContent = `${index + 1}. ${text}`;
    btn.title = '点击回填到输入框';
    btn.addEventListener('click', () => {
      questionEl.value = text;
      questionEl.focus();
      setStatus('已从历史记录回填。');
    });
    li.appendChild(btn);
    historyListEl.appendChild(li);
  });
}

copyBtn.addEventListener('click', copyQuestion);
openChatgptBtn.addEventListener('click', openChatgpt);
openGeminiBtn.addEventListener('click', openGemini);
openBothBtn.addEventListener('click', openBoth);
clearHistoryBtn.addEventListener('click', () => {
  writeHistory([]);
  renderHistory();
  setStatus('历史记录已清空。');
});

document.addEventListener('keydown', (event) => {
  const isCmdOrCtrl = event.metaKey || event.ctrlKey;
  if (!isCmdOrCtrl) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    copyQuestion();
    return;
  }

  if ((event.key === 'O' || event.key === 'o') && event.shiftKey) {
    event.preventDefault();
    openBoth();
  }
});

renderHistory();
setStatus('准备就绪：先打开窗口，再复制问题。');
