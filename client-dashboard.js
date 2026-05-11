document.addEventListener("DOMContentLoaded", () => {
  if (!authService.isAuthenticated() || !authService.isClient()) {
    window.location.href = "login.html";
    return;
  }

  // Обновляем имя пользователя в интерфейсе
  const userNameElements = document.querySelectorAll(".user-name");
  userNameElements.forEach((el) => {
    if (el) el.textContent = authService.currentUser.name;
  });
  const pageTitle = document.querySelector(".page-title");
  if (pageTitle) {
    pageTitle.textContent = `Добро пожаловать, ${authService.currentUser.name.split(" ")[0]}!`;
  }

  loadAndDisplayData();
});

function loadAndDisplayData() {
  // Получаем питомцев текущего владельца
  const allPets = JSON.parse(AppStorage.getItem("pets") || "[]");
  const myPets = allPets.filter(
    (pet) => pet.ownerId == authService.currentUser.id,
  );

  // Получаем мероприятия (записи на приём)
  const allAppointments = JSON.parse(
    AppStorage.getItem("appointments") || "[]",
  );
  const myAppointments = allAppointments.filter((apt) => {
    const pet = allPets.find((p) => p.id == apt.petId);
    return pet && pet.ownerId == authService.currentUser.id;
  });

  // Получаем медзаписи
  const allRecords = JSON.parse(AppStorage.getItem("medicalRecords") || "[]");
  const myRecords = allRecords.filter((record) => {
    const pet = allPets.find((p) => p.id == record.petId);
    return pet && pet.ownerId == authService.currentUser.id;
  });

  // Отображаем питомцев
  renderPets(myPets);

  // Отображаем мероприятия
  renderEvents(myAppointments, allPets);

  // Отображаем последние медзаписи
  renderMedicalRecords(myRecords.slice(0, 3));
}

function renderPets(pets) {
  const petsGrid = document.querySelector(".pets-grid");
  if (!petsGrid) return;

  if (pets.length === 0) {
    petsGrid.innerHTML = `<div class="empty-state">У вас пока нет питомцев. Нажмите "Добавить питомца"</div>`;
  } else {
    petsGrid.innerHTML = pets
      .map(
        (pet) => `
      <div class="pet-card">
        <div class="pet-avatar"><i class="fa-solid fa-${ClinicData.petIcon(pet.type)}"></i></div>
        <h3>${pet.name}</h3>
        <p>${ClinicData.petTypeLabel(pet.type)}, ${pet.age || "?"} лет</p>
        <p class="pet-breed">${pet.breed || "Вид или порода не указаны"}</p>
        <div class="pet-actions">
          <a href="client-pets.html?id=${pet.id}" class="btn btn--outline btn--sm">Профиль</a>
          <a href="client-medical.html?pet=${pet.id}" class="btn btn--primary btn--sm">Медкарта</a>
        </div>
      </div>
    `,
      )
      .join("");
  }

  // Добавляем карточку "Добавить питомца"
  petsGrid.innerHTML += `
    <div class="pet-card">
      <div class="pet-avatar"><i class="fa-solid fa-plus"></i></div>
      <h3>Добавить питомца</h3>
      <p>Создать новый профиль</p>
      <a href="client-pets.html?action=add" class="btn btn--primary btn--sm">Добавить</a>
    </div>
  `;
}

function renderEvents(appointments, allPets) {
  const eventsGrid = document.querySelector(".events-grid");
  if (!eventsGrid) return;

  if (appointments.length === 0) {
    eventsGrid.innerHTML = `<div class="empty-state">Нет предстоящих мероприятий</div>`;
    return;
  }

  eventsGrid.innerHTML = appointments
    .map((apt) => {
      const pet = allPets.find((p) => p.id == apt.petId);
      return `
      <div class="event-card">
        <div class="event-icon"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="event-content">
          <h3>${apt.type === "vaccination" ? "Вакцинация" : "Приём"}</h3>
          <p>${pet ? pet.name : "Питомец"} - ${apt.date || "Дата не указана"} ${apt.time || ""}</p>
          <p class="event-detail">${apt.description || "Нет описания"}</p>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderMedicalRecords(records) {
  const recordsContainer = document.querySelector(".medical-records-preview");
  if (!recordsContainer) return;

  if (records.length === 0) {
    recordsContainer.innerHTML = `<div class="empty-state">Нет медицинских записей</div>`;
    return;
  }

  recordsContainer.innerHTML = records
    .map(
      (record) => `
    <div class="medical-record">
      <div class="record-header">
        <h4>${record.type === "checkup" ? "Плановый осмотр" : "Запись"}</h4>
        <span class="record-date">${record.date || "Дата не указана"}</span>
      </div>
      <div class="record-content">
        <p><strong>Врач:</strong> ${record.vetName || "Не указан"}</p>
        <p><strong>Диагноз:</strong> ${record.diagnosis || "Нет данных"}</p>
        <p><strong>Назначения:</strong> ${record.prescriptions || "Нет назначений"}</p>
      </div>
    </div>
  `,
    )
    .join("");
}

// Функция для добавления тестового питомца (если нет ни одного)
function addTestPetIfEmpty() {
  const allPets = JSON.parse(AppStorage.getItem("pets") || "[]");
  const myPets = allPets.filter(
    (pet) => pet.ownerId == authService.currentUser.id,
  );

  if (myPets.length === 0 && authService.currentUser.role === "client") {
    const testPet = {
      id: Date.now(),
      name: "Барсик",
      type: "cat",
      breed: "Британская короткошерстная",
      age: 3,
      weight: 5.2,
      ownerId: authService.currentUser.id,
      createdAt: new Date().toISOString(),
    };
    const pets = JSON.parse(AppStorage.getItem("pets") || "[]");
    pets.push(testPet);
    AppStorage.setItem("pets", JSON.stringify(pets));
    console.log("Добавлен тестовый питомец");
  }
}
