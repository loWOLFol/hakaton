// --- Demo users ---
const demoUsers = {
  farmer1: { password: "pass", role: "farmer", name: "Фермер Петр" },
  agro1: { password: "pass", role: "agronomist", name: "Агроном Анна" },
  senior: { password: "pass", role: "senior", name: "Старший Никита" },
};

// state
let currentUser = null;
let lastTemp = null; // °C (max)
let lastRain = null; // mm (sum)

const $ = (s) => document.querySelector(s);

function init() {
  document.querySelectorAll(".nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView(btn.dataset.view);
      document
        .querySelectorAll(".nav button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  $("#loginBtn").addEventListener("click", openLogin);
  $("#logoutBtn").addEventListener("click", logout);
  $("#doLogin").addEventListener("click", doLogin);
  $("#cancelLogin").addEventListener("click", closeLogin);
  $("#newTaskBtn").addEventListener("click", () => switchView("tasks"));
  $("#openNewsBtn").addEventListener("click", () => switchView("news"));
  $("#openChatBtn").addEventListener("click", () => switchView("chat"));
  $("#addTaskBtn").addEventListener("click", () => {
    document.getElementById("taskName").focus();
  });
  $("#saveTaskBtn").addEventListener("click", saveTask);
  $("#clearTaskBtn").addEventListener("click", clearTaskForm);
  $("#groupFilter").addEventListener("change", renderTasks);
  $("#postNewsBtn").addEventListener("click", postNews);
  $("#sendMsgBtn").addEventListener("click", sendMsg);
  $("#getWeatherBtn").addEventListener("click", getWeather);

  document.addEventListener("click", (e) => {
    if (e.target.matches(".completeBtn")) toggleComplete(e.target.dataset.id);
    if (e.target.matches(".attachBtn")) attachPhoto(e.target.dataset.id);
    if (e.target.matches(".approvePhoto")) approvePhoto(e.target.dataset.id);
    if (e.target.matches(".rejectPhoto")) rejectPhoto(e.target.dataset.id);
  });

  if (!localStorage.getItem("agro_tasks")) {
    const sample = [
      {
        id: uid(),
        title: "Проверить влажность в поле A",
        group: "влажность",
        desc: "Проверить датчики",
        completed: false,
        photo: null,
        photoApproved: false,
        author: "farmer1",
      },
      {
        id: uid(),
        title: "Подкормка участок B",
        group: "удобрения",
        desc: "Внести азот",
        completed: false,
        photo: null,
        photoApproved: false,
        author: "agro1",
      },
    ];
    localStorage.setItem("agro_tasks", JSON.stringify(sample));
  }
  if (!localStorage.getItem("agro_news"))
    localStorage.setItem("agro_news", JSON.stringify([]));
  if (!localStorage.getItem("agro_msgs"))
    localStorage.setItem("agro_msgs", JSON.stringify([]));
  if (!localStorage.getItem("agro_alerts"))
    localStorage.setItem("agro_alerts", JSON.stringify([]));

  updateIndicators();
  renderTasks();
  renderNews();
  renderMessages();
  renderAlerts();
  renderGroupFilter();
  updateAuthUI();
  $("#msgInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMsg();
  });
}

function uid() {
  return "t" + Math.random().toString(36).slice(2, 9);
}
function switchView(view) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  const el = document.getElementById(view);
  if (el) el.classList.remove("hidden");
  $("#pageTitle").textContent =
    {
      dashboard: "Панель",
      tasks: "Задачи",
      news: "Стена новостей",
      chat: "Чат",
      weather: "Погода",
      alerts: "Сигналы",
      admin: "Модерация фото",
    }[view] || "Панель";
}

// --- Auth ---
function openLogin() {
  $("#loginModal").classList.remove("hidden");
}
function closeLogin() {
  $("#loginModal").classList.add("hidden");
}
function doLogin() {
  const u = $("#loginUser").value.trim();
  const p = $("#loginPass").value;
  const r = $("#roleSelect").value;
  if (demoUsers[u] && demoUsers[u].password === p) {
    currentUser = {
      login: u,
      role: demoUsers[u].role,
      name: demoUsers[u].name,
    };
  } else {
    currentUser = {
      login: u || "u" + Math.floor(Math.random() * 1000),
      role: r,
      name: u || "Пользователь",
    };
  }
  closeLogin();
  updateAuthUI();
}
function logout() {
  currentUser = null;
  updateAuthUI();
}

function updateAuthUI() {
  $("#roleLabel").textContent = currentUser ? currentUser.role : "гость";
  if (currentUser) {
    $("#loginBtn").classList.add("hidden");
    $("#logoutBtn").classList.remove("hidden");
  } else {
    $("#loginBtn").classList.remove("hidden");
    $("#logoutBtn").classList.add("hidden");
  }
  // admin
  document.getElementById("adminBtn").style.display =
    currentUser && currentUser.role === "senior" ? "block" : "none";
  document
    .getElementById("admin")
    .classList.toggle(
      "hidden",
      !(currentUser && currentUser.role === "senior")
    );

  // --- IMPORTANT: only senior can create tasks ---
  const canCreate = currentUser && currentUser.role === "senior";
  document.getElementById("addTaskBtn").style.display = canCreate
    ? "inline-block"
    : "none";
  document.getElementById("taskForm").style.display = canCreate
    ? "block"
    : "none";
  document.getElementById("saveTaskBtn").disabled = !canCreate;
}

// --- Tasks ---
function getTasks() {
  return JSON.parse(localStorage.getItem("agro_tasks") || "[]");
}
function saveTasks(ts) {
  localStorage.setItem("agro_tasks", JSON.stringify(ts));
  renderTasks();
  updateIndicators();
  renderAlerts();
}

function renderGroupFilter() {
  const groups = Array.from(new Set(getTasks().map((t) => t.group))).filter(
    Boolean
  );
  const sel = $("#groupFilter");
  sel.innerHTML = '<option value="all">Все группы</option>';
  groups.forEach((g) => {
    const o = document.createElement("option");
    o.value = g;
    o.textContent = g;
    sel.appendChild(o);
  });
}

function renderTasks() {
  const list = getTasks();
  const filter = $("#groupFilter").value;
  const wrap = $("#taskGroups");
  wrap.innerHTML = "";
  const groups = {};
  list.forEach((t) => {
    if (filter !== "all" && t.group !== filter) return;
    if (!groups[t.group || "прочее"]) groups[t.group || "прочее"] = [];
    groups[t.group || "прочее"].push(t);
  });
  for (const g in groups) {
    const h = document.createElement("div");
    h.innerHTML = `<h4 style="margin-top:8px">Группа: ${g}</h4>`;
    groups[g].forEach((t) => {
      const d = document.createElement("div");
      d.className = "task";
      d.innerHTML = `<div><strong>${t.title}</strong><div class="small">${
        t.desc || ""
      }</div></div><div style="display:flex;gap:6px;align-items:center"><div class="small">${
        t.photo
          ? t.photoApproved
            ? "Фото подтверждено"
            : "Ждёт подтверждения"
          : ""
      }</div><button class="btn completeBtn" data-id="${t.id}">${
        t.completed ? "Отменить" : "Выполнено"
      }</button><button class="btn secondary attachBtn" data-id="${
        t.id
      }">Прикрепить фото</button></div>`;
      h.appendChild(d);
    });
    wrap.appendChild(h);
  }
}

function saveTask() {
  // only senior allowed: double-check
  if (!(currentUser && currentUser.role === "senior")) {
    alert("Только старший сотрудник может создавать задачи");
    return;
  }
  const name = $("#taskName").value.trim();
  const group = $("#taskGroup").value.trim() || "прочее";
  const desc = $("#taskDesc").value.trim();
  if (!name) return alert("Введите название");
  const t = {
    id: uid(),
    title: name,
    group,
    desc,
    completed: false,
    photo: null,
    photoApproved: false,
    author: currentUser ? currentUser.login : "anon",
  };
  const ts = getTasks();
  ts.push(t);
  saveTasks(ts);
  clearTaskForm();
  renderGroupFilter();
}
function clearTaskForm() {
  $("#taskName").value = "";
  $("#taskGroup").value = "";
  $("#taskDesc").value = "";
}

function toggleComplete(id) {
  const ts = getTasks();
  const t = ts.find((x) => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  saveTasks(ts);
  if (!t.completed) {
    const alerts = JSON.parse(localStorage.getItem("agro_alerts"));
    alerts.push({
      id: uid(),
      text: `Задача \"${t.title}\" помечена как НЕ выполненная`,
    });
    localStorage.setItem("agro_alerts", JSON.stringify(alerts));
    renderAlerts();
  }
}

function attachPhoto(id) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    const f = input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const ts = getTasks();
      const t = ts.find((x) => x.id === id);
      t.photo = r.result;
      t.photoApproved = false;
      saveTasks(ts);
      alert("Фото прикреплено. Потребуется подтверждение старшим сотрудником.");
    };
    r.readAsDataURL(f);
  };
  input.click();
}

// Admin moderation
function renderModeration() {
  const ts = getTasks().filter((t) => t.photo && !t.photoApproved);
  const wrap = $("#photoModeration");
  wrap.innerHTML = "";
  if (ts.length === 0)
    wrap.innerHTML = '<div class="small">Нет фотографий на модерацию.</div>';
  ts.forEach((t) => {
    const el = document.createElement("div");
    el.className = "card";
    el.style.marginBottom = "8px";
    el.innerHTML = `<strong>${t.title}</strong><div class="small">${t.group} • автор: ${t.author}</div><div style="margin-top:8px"><img src="${t.photo}" style="max-width:100%;border-radius:8px"></div><div style="display:flex;gap:8px;margin-top:8px"><button class="btn approvePhoto" data-id="${t.id}">Подтвердить</button><button class="btn secondary rejectPhoto" data-id="${t.id}">Отклонить</button></div>`;
    wrap.appendChild(el);
  });
}
function approvePhoto(id) {
  const ts = getTasks();
  const t = ts.find((x) => x.id === id);
  if (!t) return;
  t.photoApproved = true;
  saveTasks(ts);
  renderModeration();
}
function rejectPhoto(id) {
  const ts = getTasks();
  const t = ts.find((x) => x.id === id);
  if (!t) return;
  t.photo = null;
  t.photoApproved = false;
  saveTasks(ts);
  renderModeration();
}

// --- News ---
function getNews() {
  return JSON.parse(localStorage.getItem("agro_news") || "[]");
}
function postNews() {
  const title = $("#newsTitle").value.trim();
  if (!title) return alert("Введите заголовок");
  const n = {
    id: uid(),
    title,
    author: currentUser ? currentUser.name : "Аноним",
    date: new Date().toLocaleString(),
  };
  const arr = getNews();
  arr.unshift(n);
  localStorage.setItem("agro_news", JSON.stringify(arr));
  $("#newsTitle").value = "";
  renderNews();
}
function renderNews() {
  const wall = $("#newsWall");
  const arr = getNews();
  wall.innerHTML = "";
  arr.forEach((n) => {
    const el = document.createElement("div");
    el.className = "news-item";
    el.innerHTML = `<strong>${n.title}</strong><div class="small">${n.author} • ${n.date}</div>`;
    wall.appendChild(el);
  });
}

// --- Chat ---
function getMsgs() {
  return JSON.parse(localStorage.getItem("agro_msgs") || "[]");
}
function sendMsg() {
  const text = $("#msgInput").value.trim();
  if (!text) return;
  const m = {
    id: uid(),
    from: currentUser ? currentUser.name : "Аноним",
    text,
    date: new Date().toLocaleTimeString(),
  };
  const arr = getMsgs();
  arr.push(m);
  localStorage.setItem("agro_msgs", JSON.stringify(arr));
  $("#msgInput").value = "";
  renderMessages();
}
function renderMessages() {
  const wrap = $("#messages");
  const arr = getMsgs();
  wrap.innerHTML = "";
  arr.forEach((m) => {
    const d = document.createElement("div");
    d.className = "msg";
    d.innerHTML = `<div><strong>${m.from}</strong> <span class="small">${m.date}</span></div><div>${m.text}</div>`;
    wrap.appendChild(d);
  });
  wrap.scrollTop = wrap.scrollHeight;
}

// --- Weather (Open-Meteo) ---
async function getWeather() {
  const city = $("#cityInput").value.trim() || "Petropavlovsk";
  $("#weatherRes").innerHTML = "Загрузка...";
  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}`
    ).then((r) => r.json());
    if (!geo.results || geo.results.length === 0) {
      $("#weatherRes").innerHTML = "Город не найден (демо)";
      return;
    }
    const top = geo.results[0];
    const lat = top.latitude,
      lon = top.longitude;
    const w = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&timezone=auto&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`
    ).then((r) => r.json());
    const today = w.daily; // arrays
    lastTemp = today.temperature_2m_max[0];
    lastRain = today.precipitation_sum[0];
    const html = `<div><strong>${top.name}, ${top.country}</strong><div class="small">Макс: ${lastTemp}°C, Мин: ${today.temperature_2m_min[0]}°C, Осадки: ${lastRain} мм</div></div>`;
    $("#weatherRes").innerHTML = html;
    updateIndicators(); // recalc risk now that weather available
  } catch (e) {
    console.error(e);
    $("#weatherRes").innerHTML = "Ошибка получения прогноза";
  }
}

// --- Alerts ---
function renderAlerts() {
  const arr = JSON.parse(localStorage.getItem("agro_alerts") || "[]");
  const wrap = $("#alertsList");
  wrap.innerHTML = "";
  arr
    .slice(-10)
    .reverse()
    .forEach((a) => {
      const el = document.createElement("div");
      el.className = "alert";
      el.style.marginBottom = "8px";
      el.textContent = a.text;
      wrap.appendChild(el);
    });
}

// --- Indicators & Risk (with detailed consequences for wheat in SKO) ---
function updateIndicators() {
  const tasks = getTasks();
  const hum = Math.max(
    10,
    Math.round(
      100 -
        tasks.filter((t) => t.group === "влажность" && !t.completed).length * 25
    )
  );
  const fert = Math.max(
    5,
    Math.round(
      100 -
        tasks.filter((t) => t.group === "удобрения" && !t.completed).length * 30
    )
  );
  const live = Math.max(
    30,
    Math.round(
      100 -
        tasks.filter((t) => t.group === "животные" && !t.completed).length * 20
    )
  );
  $("#soilHum").textContent = hum + "%";
  $("#fert").textContent = fert + "%";
  $("#livestock").textContent = live + "%";
  // risk score uses weather (lastTemp, lastRain) if available, else fallback to tasks
  let risk = 0;
  if (lastTemp !== null && lastRain !== null) {
    // heuristic: high temp & low rain -> drought risk; high temp & rain -> fungal; heavy rain -> logistics/nitrogen leaching
    const t = lastTemp;
    const r = lastRain;
    // normalize
    const tempFactor = Math.min(40, Math.max(-20, t)) / 40; // -0.5..1 -> 0..1 when shifted
    const rainFactor = Math.min(50, r) / 50; // 0..1
    // base risk
    risk = Math.round(
      (1 - tempFactor) * 20 + tempFactor * 40 + rainFactor * 30
    );
    risk = Math.max(0, Math.min(100, risk));
  } else {
    risk = Math.min(
      100,
      Math.round((100 - hum) * 0.4 + (100 - fert) * 0.35 + (100 - live) * 0.25)
    );
  }
  $("#riskScore").textContent = risk + "%";
  updateRiskText(risk);
}

function updateRiskText(risk) {
  const wrap = $("#riskTextWrap");
  wrap.innerHTML = "";
  // use lastTemp & lastRain to produce human-readable consequences for пшеница (СКО)
  if (lastTemp === null || lastRain === null) {
    wrap.innerHTML =
      '<div class="risk-text"><strong>Инфо:</strong> нет актуальных метеоданных. Нажмите «Погода» → «Получить», чтобы получить прогноз и точный анализ.</div>';
    return;
  }
  const t = lastTemp;
  const r = lastRain;
  let lines = [];
  // rules (wheat-focused)
  if (t >= 30 && r <= 2) {
    lines.push({
      title: "Высокая температура и дефицит осадков",
      impact: `Риск засухи и теплового стресса для пшеницы. Возможная потеря массы зерна и снижение выхода до 10-25%. Рекомендуется полив/орошение и контроль влажности почвы.`,
    });
  }
  if (t >= 25 && r >= 5) {
    lines.push({
      title: "Тёплая погода с осадками",
      impact: `Повышенный риск грибковых заболеваний (фузариоз, альтернариоз). Риск поражения колоса и ухудшения качества зерна. Рекомендуется обработка фунгицидами и проверка полива.`,
    });
  }
  if (r >= 15) {
    lines.push({
      title: "Интенсивные осадки",
      impact: `Возможен вымыв азота из пахотного слоя, задержка полевых работ и уборки. Для пшеницы это может привести к ухудшению качества и задержке уборки на 1–2 недели.`,
    });
  }
  if (t <= 12 && r >= 5) {
    lines.push({
      title: "Низкая температура с осадками",
      impact: `Риск переувлажнения и корневых гнилей, особенно на тяжёлых почвах. Рекомендуется улучшение дренажа и мониторинг состояния корневой системы.`,
    });
  }
  // secondary notes for other crops
  lines.push({
    title: "Примечание для других культур",
    impact:
      "Подсолнечник и кукуруза в СКО менее распространены; однако при высоких температурах без дождей — риск снижения вегетативного роста и завязывания плодов.",
  });

  // compose html
  const html = [
    '<div class="risk-text"><strong>Подробный прогноз последствий (пшеница, СКО — Петропавловск):</strong>',
  ];
  lines.forEach((l) => {
    html.push(
      `<div style="margin-top:8px"><em>${l.title}</em><div class="small" style="margin-top:4px">${l.impact}</div></div>`
    );
  });
  html.push(
    `<div style="margin-top:10px" class="small">Исходные метеоданные: Tmax=${t}°C, precipitation=${r} мм. Суммарный риск: ${risk}%.</div>`
  );
  html.push("</div>");
  wrap.innerHTML = html.join("");
}

// admin panel show/hide
document.getElementById("adminBtn").addEventListener("click", () => {
  switchView("admin");
  renderModeration();
});
document.querySelectorAll(".nav button[data-view]").forEach((b) =>
  b.addEventListener("click", () => {
    if (b.dataset.view === "tasks") renderTasks();
  })
);

// initial
init();
