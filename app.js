const FREE_LIMIT = 7;
const WHATSAPP_NUMBER = "963992147669";
const LANGUAGES = {
  en: { name: "الإنجليزية", sample: "Where is the nearest train station?", speech: "en-US" },
  fr: { name: "الفرنسية", sample: "Où est la gare la plus proche ?", speech: "fr-FR" },
  es: { name: "الإسبانية", sample: "¿Dónde está la estación de tren más cercana?", speech: "es-ES" },
  de: { name: "الألمانية", sample: "Wo ist der nächste Bahnhof?", speech: "de-DE" },
  it: { name: "الإيطالية", sample: "Dov'è la stazione ferroviaria più vicina?", speech: "it-IT" },
  tr: { name: "التركية", sample: "En yakın tren istasyonu nerede?", speech: "tr-TR" },
  ru: { name: "الروسية", sample: "Где находится ближайшая железнодорожная станция?", speech: "ru-RU" },
  zh: { name: "الصينية", sample: "最近的火车站在哪里？", speech: "zh-CN" },
  ja: { name: "اليابانية", sample: "一番近い駅はどこですか？", speech: "ja-JP" },
  ko: { name: "الكورية", sample: "가장 가까운 기차역은 어디인가요?", speech: "ko-KR" },
  pt: { name: "البرتغالية", sample: "Onde fica a estação de trem mais próxima?", speech: "pt-PT" },
  hi: { name: "الهندية", sample: "सबसे नज़दीकी रेलवे स्टेशन कहाँ है?", speech: "hi-IN" },
  nl: { name: "الهولندية", sample: "Waar is het dichtstbijzijnde treinstation?", speech: "nl-NL" },
  el: { name: "اليونانية", sample: "Πού είναι ο πλησιέστερος σιδηροδρομικός σταθμός;", speech: "el-GR" },
  sv: { name: "السويدية", sample: "Var ligger den närmaste tågstationen?", speech: "sv-SE" },
  ar: { name: "العربية", sample: "أين أقرب محطة قطار؟", speech: "ar-SA" },
};

const $ = (selector) => document.querySelector(selector);
const state = {
  freeUses: Number(localStorage.getItem("sakabFreeUses") || 0),
  cart: JSON.parse(localStorage.getItem("sakabCart") || "[]"),
  currentResult: null,
  sourceFile: null,
  recognition: null,
  toastTimer: null,
};

const els = {
  body: document.body,
  themeToggle: $("#themeToggle"),
  cartButton: $("#cartButton"),
  cartDrawer: $("#cartDrawer"),
  drawerBackdrop: $("#drawerBackdrop"),
  closeDrawer: $("#closeDrawer"),
  cartCount: $("#cartCount"),
  drawerCount: $("#drawerCount"),
  cartList: $("#cartList"),
  cartEmpty: $("#cartEmpty"),
  plans: $("#plans"),
  transcript: $("#transcript"),
  audioFile: $("#audioFile"),
  fileLabel: $("#fileLabel"),
  clearSource: $("#clearSource"),
  recordButton: $("#recordButton"),
  moonRecorder: $("#moonRecorder"),
  recorderLabel: $("#recorderLabel"),
  languageSelect: $("#languageSelect"),
  generateButton: $("#generateButton"),
  addToCartButton: $("#addToCartButton"),
  emptyResult: $("#emptyResult"),
  resultSuccess: $("#resultSuccess"),
  resultText: $("#resultText"),
  resultAudio: $("#resultAudio"),
  progressArea: $("#progressArea"),
  progressBar: $("#progressBar"),
  progressPercent: $("#progressPercent"),
  progressStatus: $("#progressStatus"),
  quotaNumber: $("#quotaNumber"),
  quotaLabel: $("#quotaLabel"),
  quotaProgress: $("#quotaProgress"),
  toast: $("#toast"),
  screenShield: $("#screenShield"),
  loginOverlay: $("#loginOverlay"),
  loginForm: $("#loginForm"),
  passwordInput: $("#passwordInput"),
  loginError: $("#loginError"),
};

function saveState() {
  localStorage.setItem("sakabFreeUses", String(state.freeUses));
  localStorage.setItem("sakabCart", JSON.stringify(state.cart.map(({ audioUrl, ...item }) => item)));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3000);
}

function updateQuota() {
  const remaining = Math.max(FREE_LIMIT - state.freeUses, 0);
  els.quotaNumber.textContent = remaining;
  els.quotaLabel.textContent = remaining ? "محاولات مجانية" : "الباقة المجانية";
  els.quotaProgress.style.strokeDashoffset = String(106.8 - (remaining / FREE_LIMIT) * 106.8);
  els.quotaProgress.style.stroke = remaining ? "" : "var(--coral)";
}

function setTheme(theme) {
  els.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem("sakabTheme", theme);
}

function toggleCart(open) {
  els.cartDrawer.classList.toggle("open", open);
  els.cartDrawer.setAttribute("aria-hidden", String(!open));
  if (open) renderCart();
}

function whatsappUrl(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function renderCart() {
  els.cartCount.textContent = state.cart.length;
  els.drawerCount.textContent = state.cart.length;
  els.cartEmpty.classList.toggle("hidden", state.cart.length > 0);
  els.plans.classList.toggle("hidden", !state.cart.some((item) => !item.free));
  els.cartList.querySelectorAll(".cart-item").forEach((item) => item.remove());

  state.cart.forEach((item) => {
    const card = document.createElement("article");
    card.className = "cart-item";
    const translated = LANGUAGES[item.language] || LANGUAGES.en;
    const purchaseMessage = `مرحباً، أريد شراء الصوت المترجم إلى ${translated.name} — ${item.text}`;
    card.innerHTML = `
      <div class="item-icon">♫</div>
      <div class="item-details">
        <strong>${escapeHtml(item.text)}</strong>
        <small>${translated.name} · ${item.free ? "ضمن المجاني" : "يتطلب شراء"}</small>
      </div>
      <div class="item-actions">
        ${item.free
          ? `<a href="${item.audioUrl || "#"}" download="sakab-voice-${item.id}.wav">تحميل الصوت</a>`
          : `<a class="buy-link" href="${whatsappUrl(purchaseMessage)}" target="_blank" rel="noreferrer">الشراء عبر واتساب</a>`}
        <button type="button" data-remove="${item.id}" aria-label="حذف الصوت">حذف</button>
      </div>`;
    els.cartList.appendChild(card);
  });
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (match) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[match]));
}

function createDemoWav(seconds = 2.2) {
  const sampleRate = 22050;
  const length = Math.floor(sampleRate * seconds);
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  writeString(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i += 1) {
    const envelope = Math.min(1, i / 900, (length - i) / 900);
    const wave = Math.sin((i / sampleRate) * Math.PI * 2 * (190 + Math.sin(i / 4000) * 32));
    view.setInt16(44 + i * 2, wave * envelope * 8500, true);
  }
  return URL.createObjectURL(new Blob([view], { type: "audio/wav" }));
}

function getSourceText() {
  const typed = els.transcript.value.trim();
  if (typed) return typed;
  if (state.sourceFile) return `صوت من الملف: ${state.sourceFile.name}`;
  return "";
}

function animateFlash() {
  els.moonRecorder.classList.remove("flash");
  void els.moonRecorder.offsetWidth;
  els.moonRecorder.classList.add("flash");
}

function startRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showToast("المتصفح لا يدعم التحدث المباشر؛ يمكنك رفع ملف أو كتابة الجملة.");
    return;
  }
  if (state.recognition) {
    state.recognition.stop();
    return;
  }
  const recognition = new Recognition();
  state.recognition = recognition;
  recognition.lang = "ar-SA";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    els.recordButton.classList.add("recording");
    els.recorderLabel.textContent = "أستمع إليك...";
    animateFlash();
  };
  recognition.onresult = (event) => {
    els.transcript.value = event.results[0][0].transcript;
    showToast("تم التقاط صوتك، اضغط تحويل الصوت الآن.");
  };
  recognition.onerror = () => showToast("لم نتمكن من التقاط الصوت. جرّب مرة أخرى.");
  recognition.onend = () => {
    state.recognition = null;
    els.recordButton.classList.remove("recording");
    els.recorderLabel.textContent = "اضغط للتحدث";
  };
  recognition.start();
}

function createResult(text, language) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const translated = LANGUAGES[language] || LANGUAGES.en;
  const isFree = state.freeUses < FREE_LIMIT;
  return {
    id,
    language,
    text: translated.sample,
    sourceText: text,
    free: isFree,
    audioUrl: state.sourceFile ? URL.createObjectURL(state.sourceFile) : createDemoWav(),
  };
}

function processVoice() {
  const sourceText = getSourceText();
  if (!sourceText) {
    showToast("أدخل صوتاً أو اكتب جملة قبل البدء.");
    return;
  }
  const sourceDuration = state.sourceFile?.duration || 0;
  const duration = Math.max(3000, Math.min(18000, (sourceDuration / 60) * 3000 || 3600));
  els.generateButton.disabled = true;
  els.emptyResult.classList.add("hidden");
  els.resultSuccess.classList.add("hidden");
  els.progressArea.classList.remove("hidden");
  els.progressStatus.textContent = "نحلل الصوت ونجهّز الترجمة...";
  let progress = 0;
  const started = performance.now();
  const timer = setInterval(() => {
    progress = Math.min(100, ((performance.now() - started) / duration) * 100);
    els.progressBar.style.width = `${progress}%`;
    els.progressPercent.textContent = `${Math.round(progress)}%`;
    if (progress >= 100) {
      clearInterval(timer);
      finishProcessing(sourceText);
    }
  }, 80);
}

function finishProcessing(sourceText) {
  state.currentResult = createResult(sourceText, els.languageSelect.value);
  state.freeUses += 1;
  els.progressArea.classList.add("hidden");
  els.resultSuccess.classList.remove("hidden");
  els.resultText.textContent = state.currentResult.text;
  els.resultAudio.src = state.currentResult.audioUrl;
  els.generateButton.disabled = false;
  els.generateButton.querySelector("span:nth-child(2)").textContent = "تحويل صوت جديد";
  updateQuota();
  saveState();
  animateFlash();
  showToast(state.currentResult.free ? "اكتمل الصوت — أضفه إلى السلة لتحميله." : "اكتمل الصوت — هذا الملف يحتاج إلى شراء.");
}

function addCurrentToCart() {
  if (!state.currentResult) return;
  state.cart.unshift(state.currentResult);
  saveState();
  renderCart();
  toggleCart(true);
  showToast(state.currentResult.free ? "أُضيف الصوت إلى السلة ويمكن تحميله." : "أُضيف الصوت إلى السلة — الشراء عبر واتساب.");
}

async function checkSession() {
  try {
    const response = await fetch("/api/session");
    if (!response.ok) return;
    const data = await response.json();
    if (data.protected && !data.authenticated) els.loginOverlay.classList.remove("hidden");
  } catch {
    // Static hosting has no server gate; the app remains usable as a front-end demo.
  }
}

async function login(event) {
  event.preventDefault();
  els.loginError.textContent = "";
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: els.passwordInput.value }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "كلمة المرور غير صحيحة");
    els.loginOverlay.classList.add("hidden");
    els.passwordInput.value = "";
  } catch (error) {
    els.loginError.textContent = error.message;
  }
}

function protectVisibleContent() {
  document.addEventListener("visibilitychange", () => {
    els.screenShield.classList.toggle("active", document.visibilityState !== "visible");
  });
  window.addEventListener("blur", () => els.screenShield.classList.add("active"));
  window.addEventListener("focus", () => els.screenShield.classList.remove("active"));
}

els.themeToggle.addEventListener("click", () => setTheme(els.body.classList.contains("dark") ? "light" : "dark"));
els.cartButton.addEventListener("click", () => toggleCart(true));
els.closeDrawer.addEventListener("click", () => toggleCart(false));
els.drawerBackdrop.addEventListener("click", () => toggleCart(false));
els.recordButton.addEventListener("click", startRecognition);
els.generateButton.addEventListener("click", processVoice);
els.addToCartButton.addEventListener("click", addCurrentToCart);
els.loginForm.addEventListener("submit", login);
els.audioFile.addEventListener("change", (event) => {
  state.sourceFile = event.target.files[0] || null;
  els.fileLabel.textContent = state.sourceFile ? state.sourceFile.name : "اختيار ملف صوتي";
  if (state.sourceFile) showToast("تم اختيار الملف. اضغط تحويل الصوت الآن.");
});
els.clearSource.addEventListener("click", () => {
  state.sourceFile = null;
  els.audioFile.value = "";
  els.fileLabel.textContent = "اختيار ملف صوتي";
  els.transcript.value = "";
});
els.cartList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove]");
  if (!removeButton) return;
  state.cart = state.cart.filter((item) => item.id !== removeButton.dataset.remove);
  saveState();
  renderCart();
});

setTheme(localStorage.getItem("sakabTheme") || "light");
updateQuota();
renderCart();
protectVisibleContent();
checkSession();