function getPatientName() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery =
    params.get("fio") ||
    params.get("full_name") ||
    params.get("fullName") ||
    params.get("name");

  if (fromQuery && fromQuery.trim()) {
    return fromQuery.trim();
  }

  const webAppUser = window.WebApp?.initDataUnsafe?.user;
  if (webAppUser) {
    const firstName = String(webAppUser.first_name || "").trim();
    const lastName = String(webAppUser.last_name || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      return fullName;
    }
  }

  const fromMaxUser = window.MAX?.user?.fullName || window.MAX?.user?.name;
  if (fromMaxUser && String(fromMaxUser).trim()) {
    return String(fromMaxUser).trim();
  }

  return "Гость";
}

function renderPatientName() {
  const patientNameNode = document.getElementById("patient-name");
  patientNameNode.textContent = getPatientName();
}

const SLOT_STEP_MIN = 30;
const WORKDAY_START_H = 9;
const WORKDAY_END_H = 18;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTimeLabel(h, m) {
  return `${pad2(h)}:${pad2(m)}`;
}

/** Слоты: каждый 30 минут от 9:00 до последнего начала 17:30 (окончание 18:00). */
function buildHalfHourSlots() {
  const slots = [];
  let minutes = WORKDAY_START_H * 60;
  const endMinutes = WORKDAY_END_H * 60;

  while (minutes + SLOT_STEP_MIN <= endMinutes) {
    const startH = Math.floor(minutes / 60);
    const startM = minutes % 60;
    const endTotal = minutes + SLOT_STEP_MIN;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const label = `${formatTimeLabel(startH, startM)}–${formatTimeLabel(endH, endM)}`;
    slots.push({ label, value: label });
    minutes += SLOT_STEP_MIN;
  }
  return slots;
}

function getModalElements() {
  return {
    modal: document.getElementById("booking-modal"),
    title: document.getElementById("booking-modal-title"),
    subtitle: document.getElementById("booking-modal-subtitle"),
    slots: document.getElementById("booking-slots"),
    confirm: document.getElementById("booking-confirm"),
  };
}

function closeBookingModal() {
  const { modal, confirm } = getModalElements();
  if (!modal) return;
  modal.hidden = true;
  modal.classList.remove("modal--open");
  document.body.style.overflow = "";
  if (confirm) {
    confirm.hidden = true;
    confirm.textContent = "";
  }
}

function openBookingModal(doctor) {
  const { modal, title, subtitle, slots, confirm } = getModalElements();
  if (!modal || !title || !subtitle || !slots) return;

  title.textContent = doctor.name;
  const subtitleParts = [doctor.speciality, doctor.experience].filter(Boolean);
  subtitle.textContent = subtitleParts.join(" · ");

  slots.replaceChildren();
  if (confirm) {
    confirm.hidden = true;
    confirm.textContent = "";
  }

  const slotList = buildHalfHourSlots();
  slotList.forEach((slot) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.textContent = slot.label;
    btn.addEventListener("click", () => {
      if (confirm) {
        confirm.hidden = false;
        confirm.textContent = `Вы выбрали время ${slot.label} у врача ${doctor.name}. Мы свяжемся для подтверждения.`;
      }
    });
    slots.appendChild(btn);
  });

  modal.hidden = false;
  modal.classList.add("modal--open");
  document.body.style.overflow = "hidden";
}

function onBookClick(doctor) {
  openBookingModal(doctor);
}

function initBookingModal() {
  const { modal } = getModalElements();
  if (!modal) return;

  modal.addEventListener("click", (e) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.dataset.modalClose !== undefined) {
      closeBookingModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("modal--open")) {
      closeBookingModal();
    }
  });
}

function renderDoctors(doctors) {
  const list = document.getElementById("doctors-list");
  const template = document.getElementById("doctor-card-template");

  doctors.forEach((doctor) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const photo = card.querySelector(".doctor-photo");
    photo.src = doctor.photo;
    photo.alt = `Фото врача ${doctor.name}`;
    photo.style.objectPosition = doctor.photoPosition || "center";
    card.querySelector(".doctor-name").textContent = doctor.name;
    card.querySelector(".doctor-speciality").textContent = doctor.speciality;
    card.querySelector(".doctor-experience").textContent = doctor.experience;
    card.querySelector(".book-btn").addEventListener("click", () => onBookClick(doctor));
    list.appendChild(card);
  });
}

async function loadDoctors() {
  const response = await fetch("./doctors.json");
  if (!response.ok) {
    throw new Error("Не удалось загрузить список врачей.");
  }

  return response.json();
}

async function init() {
  initBookingModal();
  renderPatientName();

  try {
    const doctors = await loadDoctors();
    renderDoctors(doctors);
  } catch (error) {
    const list = document.getElementById("doctors-list");
    list.textContent = error.message;
  }
}

init();
