document.addEventListener("DOMContentLoaded", () => {
  if (!authService.isAuthenticated() || !authService.isVet()) {
    window.location.href = "login.html";
    return;
  }

  const userNameElements = document.querySelectorAll(".user-name");
  userNameElements.forEach((el) => {
    if (el) el.textContent = authService.currentUser.name;
  });

  loadVetData();
});

function loadVetData() {
  const allPets = JSON.parse(AppStorage.getItem("pets") || "[]");
  const allAppointments = JSON.parse(
    AppStorage.getItem("appointments") || "[]",
  );
  const allRecords = JSON.parse(AppStorage.getItem("medicalRecords") || "[]");
  const allUsers = JSON.parse(AppStorage.getItem("users") || "[]");

  // Статистика
  const isAdmin = authService.currentUser.role === "admin";
  const vetAppointments = allAppointments.filter(
    (apt) => isAdmin || Number(apt.vetId) === Number(authService.currentUser.id) || !apt.vetId,
  );
  const totalPatients = allPets.length;
  const totalAppointments = vetAppointments.length;
  const totalVaccinations = allRecords.filter(
    (r) => r.type === "vaccination",
  ).length;
  const totalPrescriptions = allRecords.filter(
    (r) => r.prescriptions && r.prescriptions.length > 0,
  ).length;

  const pageDescription = document.querySelector(".page-description");
  if (pageDescription) {
    pageDescription.textContent = `Добро пожаловать, ${authService.currentUser.name}! Пациентов в базе: ${totalPatients}`;
  }

  document.querySelectorAll(".stat-card h3").forEach((el, idx) => {
    const values = [
      totalPatients,
      totalAppointments,
      totalVaccinations,
      totalPrescriptions,
    ];
    el.textContent = values[idx] ?? 0;
  });

  // Ближайшие приёмы (сегодня)
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = vetAppointments.filter((apt) => apt.date === today);

  const eventsGrid = document.querySelector(".events-grid");
  if (eventsGrid) {
    if (todayAppointments.length === 0) {
      eventsGrid.innerHTML = `<div class="empty-state">На сегодня записей нет</div>`;
    } else {
      eventsGrid.innerHTML = todayAppointments
        .map((apt) => {
          const pet = allPets.find((p) => p.id == apt.petId);
          const owner = allUsers.find(
            (u) => u.id == (pet ? pet.ownerId : null),
          );
          return `
          <div class="event-card">
            <div class="event-icon"><i class="fa-solid fa-stethoscope"></i></div>
            <div class="event-content">
              <h3>${apt.type === "vaccination" ? "Вакцинация" : "Приём"}</h3>
              <p>${pet ? pet.name : "Питомец"} - ${apt.time || ""}</p>
              <p class="event-owner">Владелец: ${owner ? owner.name : "Не указан"}</p>
            </div>
          </div>
        `;
        })
        .join("");
    }
  }

  // Недавние пациенты (последние 3)
  const recentPets = [...allPets].reverse().slice(0, 3);
  const patientsGrid = document.querySelector(".patients-grid");
  if (patientsGrid) {
    patientsGrid.innerHTML = recentPets
      .map((pet) => {
        const owner = allUsers.find((u) => u.id == pet.ownerId);
        return `
        <div class="patient-card">
          <div class="patient-avatar"><i class="fa-solid fa-${ClinicData.petIcon(pet.type)}"></i></div>
          <h3>${pet.name}</h3>
          <p>${ClinicData.petTypeLabel(pet.type)}, ${pet.age || "?"} лет</p>
          <p class="patient-owner">${owner ? owner.name : "Неизвестно"}</p>
          <div class="status-badge status-confirmed">Активен</div>
        </div>
      `;
      })
      .join("");
  }
}
