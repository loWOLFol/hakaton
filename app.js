// --- App state and helpers ---
const demoEmail = "sales@agrotech.example";
const $ = (s) => document.querySelector(s);
let currentUser = null;
let usersKey = "ag_users_v3";
let tasksKey = "ag_tasks_v3";
let newsKey = "ag_news_v3";
let chatKey = "ag_chat_v3";
let adminQueueKey = "ag_admin_v3";
let weatherState = { tmax: null, precip: null };

// СОС
let sosMessages = [];

document.getElementById("sosBtn").onclick = () => {
    document.getElementById("sosModal").style.display = "flex";
    renderSOS();
}

function closeSOS(){
    document.getElementById("sosModal").style.display="none";
}

function addSOS(){
    let txt = document.getElementById("sosInput").value;
    if(txt.trim()!==""){
        sosMessages.push(txt);
        document.getElementById("sosInput").value="";
        renderSOS();
    }
}

function removeSOS(i){
    sosMessages.splice(i,1);
    renderSOS();
}

function renderSOS(){
    let html = "";
    sosMessages.forEach((t,i)=>{
        html += `<div class="sos-item">${t} <button onclick="removeSOS(${i})">Удалено</button></div>`;
    })
    document.getElementById("sosList").innerHTML = html;

    // проверка — есть сообщения?
    const sosBtn = document.getElementById("sosBtn");
    if(sosMessages.length > 0){
        sosBtn.classList.add("blink");
    }else{
        sosBtn.classList.remove("blink");
    }
}

// карусель
let curSlide = 0;
const slides = document.querySelectorAll(".slider img");

function showSlide(i){
  slides.forEach(s=>s.classList.remove("active"));
  slides[i].classList.add("active");
}

// старт
showSlide(curSlide);

function nextSlide(){
  curSlide = (curSlide+1) % slides.length;
  showSlide(curSlide);
}

function prevSlide(){
  curSlide = (curSlide-1+slides.length) % slides.length;
  showSlide(curSlide);
}

setInterval(()=>nextSlide(),7500);


// --- default users ---
function ensureDefaults() {
  if (!localStorage.getItem(usersKey)) {
    const u = [
      {
        login: "director",
        pass: "pass",
        role: "director",
        email: "director@farm.test",
        plan: "universal",
      },
      {
        login: "depdir",
        pass: "pass",
        role: "depdir",
        email: "dep@farm.test",
        plan: "universal",
      },
      {
        login: "manager1",
        pass: "pass",
        role: "manager",
        email: "man1@farm.test",
        plan: "universal",
      },
      {
        login: "senior",
        pass: "pass",
        role: "senior",
        email: "senior@farm.test",
        plan: "crop",
      },
      {
        login: "worker",
        pass: "pass",
        role: "worker",
        email: "worker@farm.test",
        plan: "crop",
      },
    ];
    localStorage.setItem(usersKey, JSON.stringify(u));
  }
  if (!localStorage.getItem(tasksKey))
    localStorage.setItem(tasksKey, JSON.stringify([]));
  if (!localStorage.getItem(newsKey))
    localStorage.setItem(newsKey, JSON.stringify([]));
  if (!localStorage.getItem(chatKey))
    localStorage.setItem(chatKey, JSON.stringify([]));
  if (!localStorage.getItem(adminQueueKey))
    localStorage.setItem(adminQueueKey, JSON.stringify([]));
}
ensureDefaults();

// --- UI helpers ---
function openModal(html) {
  $("#modalContent").innerHTML = html;
  $("#modal").style.display = "block";
}
function closeModal() {
  $("#modal").style.display = "none";
}
$("#modalClose").addEventListener("click", closeModal);

// Landing: subscription choice
document.querySelectorAll(".choosePlan").forEach((b) =>
  b.addEventListener("click", (e) => {
    const plan = e.target.dataset.plan;
    openModal(`<h3>Заявка на подписку: ${plan}</h3>
    <label>Имя <input id='req_name'></label>
    <label>Email <input id='req_email'></label>
    <label>Телефон <input id='req_phone'></label>
    <label>Комментарий <textarea id='req_comment'></textarea></label>
    <div style='display:flex;gap:8px;margin-top:8px;justify-content:flex-end'><button id='reqSend' class='btn'>Отправить заявку</button></div>
  `);
    document.getElementById("reqSend").addEventListener("click", () => {
      const name = $("#req_name").value || "—";
      const email = $("#req_email").value || "—";
      const phone = $("#req_phone").value || "—";
      const comment = $("#req_comment").value || "";
      // open mailto as a simple real-email flow
      const subject = encodeURIComponent(
        `Заявка на подписку: ${plan} — ${name}`
      );
      const body = encodeURIComponent(
        `Имя: ${name}\nEmail: ${email}\nТелефон: ${phone}\nПлан: ${plan}\nКомментарий:\n${comment}`
      );
      window.location.href = `mailto:${demoEmail}?subject=${subject}&body=${body}`;
      // store request locally
      const reqs = JSON.parse(localStorage.getItem("ag_requests") || "[]");
      reqs.push({
        id: Date.now(),
        name,
        email,
        phone,
        plan,
        comment,
        date: new Date().toLocaleString(),
      });
      localStorage.setItem("ag_requests", JSON.stringify(reqs));
      closeModal();
      alert(
        "Откроется почтовый клиент для отправки письма. Заявка сохранена локально."
      );
    });
  })
);

// --- Modal helpers ---
function openModal(html) {
  $("#modalContent").innerHTML = html;
  $("#modal").style.display = "block";
}
function closeModal() {
  $("#modal").style.display = "none";
}
$("#modalClose").addEventListener("click", closeModal);

// --- Login / Register ---
$("#loginBtn").addEventListener("click", () => {
  openModal(`<h3>Авторизация</h3>
    <label>Логин <input id='li_login'></label>
    <label>Пароль <input id='li_pass' type='password'></label>
    <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:8px'>
      <button id='doLogin' class='btn'>Войти</button>
    </div>`);
  document.getElementById("doLogin").addEventListener("click", () => {
    const l = $("#li_login").value.trim();
    const p = $("#li_pass").value;
    const users = JSON.parse(localStorage.getItem(usersKey) || "[]");
    const u = users.find((x) => x.login === l && x.pass === p);
    if (!u) return alert("Неверный логин или пароль");
    currentUser = u;
    afterLogin();
    closeModal();
  });
  document.getElementById("toRegister").addEventListener("click", () => {
    showRegister();
  });
});

function showRegister() {
  openModal(`<h3>Регистрация</h3>
  <label>Логин <input id='reg_login'></label>
  <label>Пароль <input id='reg_pass' type='password'></label>
  <label>Email <input id='reg_email' type='email'></label>
  <label>Должность 
    <select id='reg_role'>
      <option value='worker'>Работник</option>
      <option value='senior'>Старший</option>
      <option value='manager'>Менеджер</option>
      <option value='depdir'>Зам. директора</option>
      <option value='director'>Директор</option>
    </select></label>
  <label>Подписка 
    <select id='reg_plan'>
      <option value='crop'>Урожайная</option>
      <option value='livestock'>Животноводческая</option>
      <option value='universal'>Универсальная</option>
    </select></label>
  <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:8px'>
    <button id='doReg' class='btn'>Зарегистрироваться</button>
  </div>`);
  document.getElementById("doReg").addEventListener("click", () => {
    const login = $("#reg_login").value.trim();
    const pass = $("#reg_pass").value;
    const email = $("#reg_email").value.trim();
    const role = $("#reg_role").value;
    const plan = $("#reg_plan").value;
    if (!login || !pass || !email)
      return alert("Заполните логин / пароль / email");
    const users = JSON.parse(localStorage.getItem(usersKey) || "[]");
    if (users.find((x) => x.login === login))
      return alert("Такой логин уже есть");
    users.push({ login, pass, email, role, plan });
    localStorage.setItem(usersKey, JSON.stringify(users));
    alert("Регистрация завершена. Авторизуйтесь.");
    closeModal();
  });
}

// --- After login ---
function afterLogin() {
  $("#userLabel").textContent =
    currentUser.login + " (" + currentUser.role + ")";
  $("#userPlan").textContent = currentUser.plan || "—";
  $("#loginBtn").style.display = "none";
  $("#appArea").style.display = "block";
  document.querySelector(".hero").style.display = "none";
  document.querySelector(".logo-div").style.display = "none";

  const isManagerPlus = ["director", "depdir", "manager"].includes(
    currentUser.role
  );
  $("#adminNavBtn").style.display = isManagerPlus ? "block" : "none";
  document.getElementById("adminView").style.display = isManagerPlus
    ? "block"
    : "none";

  document.getElementById("createTaskBtn").style.display = [
    "director",
    "depdir",
    "manager",
    "senior",
  ].includes(currentUser.role)
    ? "inline-block"
    : "none";

  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  document.getElementById("dashboardView").classList.remove("hidden");

  document.getElementById("modal").style.display = "none";
  bindNav();
  renderAll();
}

// --- Logout ---
$("#logoutBtn").addEventListener("click", () => {
  currentUser = null;
  $("#appArea").style.display = "none";
  $("#loginBtn").style.display = "inline-block";
  document.querySelector(".hero").style.display = "flex";
  document.querySelector(".logo-div").style.display = "flex";
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  alert("Вы вышли");
});

// --- Navigation ---
function bindNav() {
  document.querySelectorAll("#mainNav button[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#mainNav button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      showView(btn.dataset.view);
    });
  });
}

function showView(viewName) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  const el = document.getElementById(viewName + "View");
  if (el) el.classList.remove("hidden");
}

// --- Tasks ---
function getTasks() {
  return JSON.parse(localStorage.getItem(tasksKey) || "[]");
}
function saveTasks(ts) {
  localStorage.setItem(tasksKey, JSON.stringify(ts));
  renderTasks();
}
function renderTasks() {
  const list = getTasks();
  const wrap = $("#taskList");
  wrap.innerHTML = "";
  list.forEach((t) => {
    if (currentUser && currentUser.plan && currentUser.plan !== "universal") {
      if (
        currentUser.plan === "crop" &&
        t.domain === "livestock" &&
        !["director", "depdir", "manager"].includes(currentUser.role)
      )
        return;
      if (
        currentUser.plan === "livestock" &&
        t.domain === "crop" &&
        !["director", "depdir", "manager"].includes(currentUser.role)
      )
        return;
    }
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = `<div><strong>${t.title}</strong><div class='small'>${
      t.group
    } • ${t.desc || ""}</div></div>
    <div style='display:flex;gap:6px;align-items:center'>
      <button class='btn completeBtn' data-id='${t.id}'>${
      t.completed ? "Отменить" : "Выполнено"
    }</button>
      <button class='ghost attachBtn' data-id='${t.id}'>Фото</button>
    </div>`;
    wrap.appendChild(div);
  });
}

document.getElementById("createTaskBtn").addEventListener("click", () => {
  if (!currentUser) return alert("Войдите");
  if (!["director", "depdir", "manager", "senior"].includes(currentUser.role))
    return alert("Нет доступа");
  // open quick form in modal
  openModal(`<h3>Создать задачу</h3>
    <label>Название <input id='m_title'></label>
    <label>Группа <input id='m_group'></label>
    <label>Домен <select id='m_domain'><option value='crop'>crop</option><option value='livestock'>livestock</option></select></label>
    <label>Описание <textarea id='m_desc'></textarea></label>
    <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:8px'><button id='m_save' class='btn'>Сохранить</button></div>`);
  document.getElementById("m_save").addEventListener("click", () => {
    const title = $("#m_title").value.trim();
    const group = $("#m_group").value.trim();
    const domain = $("#m_domain").value;
    const desc = $("#m_desc").value.trim();
    if (!title) return alert("Введите название");
    const ts = getTasks();
    ts.push({
      id: Date.now(),
      title,
      group,
      desc,
      domain,
      completed: false,
      author: currentUser.login,
    });
    saveTasks(ts);
    closeModal();
  });
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("completeBtn")) {
    const id = +e.target.dataset.id;
    const ts = getTasks();
    const t = ts.find((x) => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    saveTasks(ts);
  }
});

// AI suggestions (simulated)
document.getElementById("genAiBtn").addEventListener("click", () => {
  if (!currentUser) return alert("Войдите");
  // generate 3 suggestions based on simple heuristics
  const suggestions = [
    {
      title: "Проверить влажность в поле A",
      group: "влажность",
      domain: "crop",
      desc: "Проверить датчики почвенной влажности и сделать фото",
    },
    {
      title: "Проверить запасы кормов",
      group: "корм",
      domain: "livestock",
      desc: "Оценить остатки кормов на складе, подготовить заявку",
    },
    {
      title: "Осмотр на наличие вредителей",
      group: "вредители",
      domain: "crop",
      desc: "Осмотреть поле B на признаки вредителей",
    },
  ];
  // push to adminQueue for approval by manager/director
  const q = JSON.parse(localStorage.getItem(adminQueueKey) || "[]");
  suggestions.forEach((s) =>
    q.push({
      id: Date.now() + Math.random(),
      ...s,
      suggestedBy: currentUser.login,
      date: new Date().toLocaleString(),
    })
  );
  localStorage.setItem(adminQueueKey, JSON.stringify(q));
  alert(
    "AI сформировал предложения. Менеджер должен подтвердить их в модуле Модерация."
  );
  renderAdminQueue();
});

// --- Фото прикрепление ---
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("attachBtn")) {
    const id = +e.target.dataset.id;
    const ts = getTasks();
    const task = ts.find((x) => x.id === id);
    if (!task) return;

    openModal(`<h3>Прикрепить фото</h3>
      <input type='file' id='photoInput' accept='image/*'>
      <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:8px'>
        <button id='uploadPhotoBtn' class='btn'>Отправить</button>
      </div>`);

    document.getElementById("uploadPhotoBtn").addEventListener("click", () => {
      const file = document.getElementById("photoInput").files[0];
      if (!file) return alert("Выберите фото");
      const reader = new FileReader();
      reader.onload = () => {
        const queue = JSON.parse(localStorage.getItem(adminQueueKey) || "[]");
        queue.push({
          id: Date.now(),
          type: "photo",
          taskId: task.id,
          photoData: reader.result,
          uploadedBy: currentUser.login,
          date: new Date().toLocaleString(),
        });
        localStorage.setItem(adminQueueKey, JSON.stringify(queue));
        closeModal();
        alert("Фото отправлено на модерацию");
        renderAdminQueue();
      };
      reader.readAsDataURL(file);
    });
  }
});

// --- Модерация ---
function renderAdminQueue() {
  const q = JSON.parse(localStorage.getItem(adminQueueKey) || "[]");
  const wrap = $("#adminQueue");
  if (!wrap) return;
  wrap.innerHTML = "";
  q.forEach((item) => {
    const el = document.createElement("div");
    el.className = "card";
    el.style.marginBottom = "8px";
    if (item.type === "photo") {
      el.innerHTML = `
        <div><strong>Фото для задачи #${item.taskId}</strong></div>
        <div class='small'>Загрузил: ${item.uploadedBy} • ${item.date}</div>
        <img src='${item.photoData}' style='max-width:100%;margin-top:6px;border-radius:8px'>
        <div style='display:flex;gap:8px;margin-top:8px;justify-content:flex-end'>
          <button class='btn approveAI' data-id='${item.id}'>Подтвердить</button>
          <button class='ghost rejectAI' data-id='${item.id}'>Отклонить</button>
        </div>`;
    } else {
      el.innerHTML = `<strong>${item.title}</strong>
        <div class='small'>${item.group} • предложил: ${item.suggestedBy} • ${item.date}</div>
        <div style='display:flex;gap:8px;margin-top:8px;justify-content:flex-end'>
          <button class='btn approveAI' data-id='${item.id}'>Подтвердить</button>
          <button class='ghost rejectAI' data-id='${item.id}'>Отклонить</button>
        </div>`;
    }
    wrap.appendChild(el);
  });
}

// --- Обработка кнопок модерации ---
document.addEventListener("click", (e) => {
  // Подтверждение элемента (AI-задача или фото)
  if (e.target.classList.contains("approveAI")) {
    if (!currentUser || !["director", "depdir", "manager"].includes(currentUser.role))
      return alert("Только менеджер и выше могут подтверждать.");

    const id = e.target.dataset.id;
    let queue = JSON.parse(localStorage.getItem(adminQueueKey) || "[]");
    const item = queue.find((x) => x.id == id);
    if (!item) return;

    // Если фото — просто помечаем как одобренное
    if (item.type === "photo") {
      alert(`Фото для задачи #${item.taskId} одобрено.`);
    } 
    // Если это AI-задача — добавляем её в общий список задач
    else {
      const ts = getTasks();
      ts.push({
        id: Date.now(),
        title: item.title,
        group: item.group,
        desc: item.desc,
        domain: item.domain,
        completed: false,
        author: item.suggestedBy || "AI",
      });
      localStorage.setItem(tasksKey, JSON.stringify(ts));
      alert("Задача одобрена и добавлена в список.");
    }

    // Удаляем элемент из очереди
    queue = queue.filter((x) => x.id != id);
    localStorage.setItem(adminQueueKey, JSON.stringify(queue));
    renderAdminQueue();
    renderTasks();
  }

  // Отклонение элемента
  if (e.target.classList.contains("rejectAI")) {
    if (!currentUser || !["director", "depdir", "manager"].includes(currentUser.role))
      return alert("Только менеджер и выше могут отклонять.");

    const id = e.target.dataset.id;
    let queue = JSON.parse(localStorage.getItem(adminQueueKey) || "[]");
    queue = queue.filter((x) => x.id != id);
    localStorage.setItem(adminQueueKey, JSON.stringify(queue));
    renderAdminQueue();
    alert("Элемент отклонён.");
  }
});


// news
$("#postNews").addEventListener("click", () => {
  const title = $("#newsInput").value.trim();
  if (!title) return alert("Введите заголовок");
  const arr = JSON.parse(localStorage.getItem(newsKey) || "[]");
  arr.unshift({
    id: Date.now(),
    title,
    author: currentUser ? currentUser.login : "Гость",
    date: new Date().toLocaleString(),
  });
  localStorage.setItem(newsKey, JSON.stringify(arr));
  renderNews();
  $("#newsInput").value = "";
});
function renderNews() {
  const arr = JSON.parse(localStorage.getItem(newsKey) || "[]");
  $("#newsWall").innerHTML = "";
  arr.forEach((n) => {
    const el = document.createElement("div");
    el.className = "news-item";
    el.innerHTML = `<strong>${n.title}</strong><div class='small'>${n.author} • ${n.date}</div>`;
    $("#newsWall").appendChild(el);
  });
}

// chat
$("#chatSend").addEventListener("click", () => {
  const t = $("#chatText").value.trim();
  if (!t) return;
  const arr = JSON.parse(localStorage.getItem(chatKey) || "[]");
  arr.push({
    id: Date.now(),
    from: currentUser ? currentUser.login : "anon",
    text: t,
    date: new Date().toLocaleTimeString(),
  });
  localStorage.setItem(chatKey, JSON.stringify(arr));
  renderChat();
  $("#chatText").value = "";
});
function renderChat() {
  const arr = JSON.parse(localStorage.getItem(chatKey) || "[]");
  const wrap = $("#chatMessages");
  wrap.innerHTML = "";
  arr.forEach((m) => {
    const d = document.createElement("div");
    d.innerHTML = `<strong>${m.from}</strong> <span class='small'>${m.date}</span><div>${m.text}</div>`;
    wrap.appendChild(d);
  });
}

// weather fetch and risk (reuse earlier simple rules for wheat in SKO)
$("#fetchWeather").addEventListener("click", async () => {
  const city = $("#cityWeather").value.trim() || "Petropavlovsk";
  $("#weatherRes").textContent = "Загрузка...";
  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}`
    ).then((r) => r.json());
    if (!geo.results || !geo.results.length) {
      $("#weatherRes").textContent = "Город не найден";
      return;
    }
    const top = geo.results[0];
    const lat = top.latitude,
      lon = top.longitude;
    const w = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&timezone=auto&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`
    ).then((r) => r.json());
    const today = w.daily;
    weatherState.tmax = today.temperature_2m_max[0];
    weatherState.precip = today.precipitation_sum[0];
    $("#tMax").textContent = weatherState.tmax + "°C";
    $("#rainSum").textContent = weatherState.precip + " мм"; // update risk
    calcRiskAndText();
    $(
      "#weatherRes"
    ).innerHTML = `<strong>${top.name}, ${top.country}</strong><div class='small'>Tmax: ${weatherState.tmax}°C, precip: ${weatherState.precip} мм</div>`;
  } catch (e) {
    console.error(e);
    $("#weatherRes").textContent = "Ошибка";
  }
});

function calcRiskAndText() {
  const t = weatherState.tmax;
  const r = weatherState.precip;
  if (t == null || r == null) {
    $("#riskScore").textContent = "--";
    $("#riskText").innerHTML = '<div class="small muted">Нет метеоданных</div>';
    return;
  }
  let risk = 0;
  if (t >= 30 && r <= 2) risk = 80;
  else if (t >= 25 && r >= 5) risk = 70;
  else if (r >= 15) risk = 60;
  else if (t <= 12 && r >= 5) risk = 50;
  else risk = 30;
  $("#riskScore").textContent = risk + "%";
  // detailed text for wheat (SKO)
  let html =
    '<div class="risk-text"><strong>Прогноз последствий (пшеница, СКО):</strong>';
  if (t >= 30 && r <= 2)
    html += `<div style='margin-top:6px'><em>Засуха</em><div class='small'>Высокая температура (${t}°C) и отсутствие осадков (${r} мм) — риск потери массы зерна 10–25%. Рекомендуется полив/орошение.</div></div>`;
  if (t >= 25 && r >= 5)
    html += `<div style='margin-top:6px'><em>Грибковые</em><div class='small'>Тёплая и влажная погода — риск фузариоза/альтернариоза. Рекомендуется фунгицидная обработка.</div></div>`;
  if (r >= 15)
    html += `<div style='margin-top:6px'><em>Интенсивные осадки</em><div class='small'>Вымывание азота, задержка уборки, ухудшение качества зерна.</div></div>`;
  if (t <= 12 && r >= 5)
    html += `<div style='margin-top:6px'><em>Переувлажнение</em><div class='small'>Низкие температуры и влага — риск корневых гнилей. Проверьте дренаж.</div></div>`;
  html += `<div style='margin-top:8px' class='small muted'>Исходные данные: Tmax=${t}°C, precip=${r} мм. Суммарный риск: ${risk}%.</div></div>`;
  $("#riskText").innerHTML = html;
}

// services request => mailto
$("#requestService").addEventListener("click", () => {
  if (!currentUser) return alert("Войдите");
  const subject = encodeURIComponent(
    "Запрос на установку датчиков от " + currentUser.login
  );
  const body = encodeURIComponent(
    "Пользователь: " +
      currentUser.login +
      "\nEmail: " +
      currentUser.email +
      "\nПодписка: " +
      (currentUser.plan || "—") +
      "\nПожелания: ..."
  );
  window.location.href = `mailto:${demoEmail}?subject=${subject}&body=${body}`;
});

// --- Остальные render функции ---
function renderAll() {
  renderTasks();
  renderNews();
  renderChat();
  renderAdminQueue();
}

function renderNews() {
  const arr = JSON.parse(localStorage.getItem(newsKey) || "[]");
  $("#newsWall").innerHTML = "";
  arr.forEach((n) => {
    const el = document.createElement("div");
    el.className = "news-item";
    el.innerHTML = `<strong>${n.title}</strong><div class='small'>${n.author} • ${n.date}</div>`;
    $("#newsWall").appendChild(el);
  });
}
function renderChat() {
  const arr = JSON.parse(localStorage.getItem(chatKey) || "[]");
  const wrap = $("#chatMessages");
  wrap.innerHTML = "";
  arr.forEach((m) => {
    const d = document.createElement("div");
    d.innerHTML = `<strong>${m.from}</strong> <span class='small'>${m.date}</span><div>${m.text}</div>`;
    wrap.appendChild(d);
  });
}

showView("dashboard");
