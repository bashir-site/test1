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

function onBookClick(doctor) {
  alert(`Вы записались к врачу: ${doctor.name}`);
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
