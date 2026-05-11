function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function requireRole(roles) {
  if (!authService.isAuthenticated() || !roles.includes(authService.currentUser.role)) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function fillVetSelect(select, selectedId) {
  if (!select) return;
  const vets = ClinicData.getUsers("vet");
  select.innerHTML = '<option value="">Выберите врача</option>';
  vets.forEach((vet) => {
    const option = document.createElement("option");
    option.value = vet.id;
    option.textContent = `${vet.name} (${ClinicData.normalizeSpecialization(vet.specialization)})`;
    if (Number(selectedId) === Number(vet.id)) option.selected = true;
    select.appendChild(option);
  });
}

function fillPetSelect(select, pets, selectedId) {
  if (!select) return;
  select.innerHTML = '<option value="">Выберите питомца</option>';
  pets.forEach((pet) => {
    const option = document.createElement("option");
    option.value = pet.id;
    option.textContent = ClinicData.petLabel(pet);
    if (Number(selectedId) === Number(pet.id)) option.selected = true;
    select.appendChild(option);
  });
}

function renderStatus(status) {
  const className =
    status === "completed" ? "status-completed" : status === "confirmed" ? "status-confirmed" : "status-pending";
  return `<span class="status-badge ${className}">${ClinicData.statusLabel(status)}</span>`;
}

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function isPastDateTime(date, time = "23:59") {
  if (!date) return true;
  return new Date(`${date}T${time || "23:59"}`) < new Date();
}

function setDateLimit(id, limits = {}) {
  const input = document.getElementById(id);
  if (!input) return;
  if (limits.min) input.min = limits.min;
  if (limits.max) input.max = limits.max;
}

function showValidation(message) {
  alert(message);
  return false;
}

function initClientPetsPage() {
  if (!requireRole(["client"])) return;

  const form = document.getElementById("petForm");
  const title = document.getElementById("petFormTitle");
  const list = document.getElementById("clientPetsList");
  const cancel = document.getElementById("cancelPetEdit");
  const petTypeSelect = document.getElementById("petType");
  const breedInput = document.getElementById("breed");
  const breedLabel = document.getElementById("breedLabel");
  let editId = null;

  const breedHints = {
    cat: ["Порода", "Например, британская короткошерстная"],
    dog: ["Порода", "Например, шпиц, корги, лабрадор"],
    bird: ["Вид / порода", "Например, волнистый попугай, корелла"],
    rodent: ["Вид / порода", "Например, хомяк, морская свинка"],
    rabbit: ["Порода", "Например, декоративный кролик"],
    fish: ["Вид", "Например, гуппи, петушок"],
    other: ["Вид / порода", "Укажите вид питомца"],
  };

  function updateBreedField() {
    const [label, placeholder] = breedHints[petTypeSelect.value] || [
      "Порода / вид",
      "Например, британская, шпиц, волнистый попугай",
    ];
    if (breedLabel) breedLabel.textContent = label;
    if (breedInput) breedInput.placeholder = placeholder;
  }

  function resetForm() {
    editId = null;
    title.textContent = "Добавить питомца";
    form.reset();
    updateBreedField();
    cancel.style.display = "none";
  }

  function render() {
    const pets = ClinicData.getPets().filter((pet) => Number(pet.ownerId) === Number(authService.currentUser.id));
    if (!pets.length) {
      list.innerHTML = '<div class="empty-state">Питомцы пока не добавлены</div>';
      return;
    }
    list.innerHTML = pets
      .map(
        (pet) => `
          <div class="pet-card">
            <div class="pet-avatar"><i class="fa-solid fa-${ClinicData.petIcon(pet.type)}"></i></div>
            <h3>${escapeHtml(pet.name)}</h3>
            <p>${ClinicData.petTypeLabel(pet.type)}, ${pet.age || "?"} лет</p>
            <p class="pet-breed">${escapeHtml(pet.breed || "Вид или порода не указаны")}</p>
            <div class="pet-actions">
              <button class="btn btn--outline btn--sm" data-edit-pet="${pet.id}">Изменить</button>
              <a href="client-medical.html?pet=${pet.id}" class="btn btn--primary btn--sm">Медкарта</a>
              <button class="btn btn--outline btn--sm" data-delete-pet="${pet.id}">Удалить</button>
            </div>
          </div>`,
      )
      .join("");
  }

  list.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-pet]");
    const deleteButton = event.target.closest("[data-delete-pet]");

    if (deleteButton) {
      const pet = ClinicData.getPet(deleteButton.dataset.deletePet);
      if (!pet || Number(pet.ownerId) !== Number(authService.currentUser.id)) return;
      const ok = window.confirm(
        `Удалить питомца "${pet.name}" вместе с его записями, медкартой и напоминаниями?`,
      );
      if (!ok) return;

      ClinicData.savePets(
        ClinicData.getPets().filter((item) => Number(item.id) !== Number(pet.id)),
      );
      ClinicData.saveAppointments(
        ClinicData.getAppointments().filter((item) => Number(item.petId) !== Number(pet.id)),
      );
      ClinicData.saveRecords(
        ClinicData.getRecords().filter((item) => Number(item.petId) !== Number(pet.id)),
      );
      ClinicData.saveReminders(
        ClinicData.getReminders().filter((item) => Number(item.petId) !== Number(pet.id)),
      );
      if (Number(editId) === Number(pet.id)) resetForm();
      render();
      return;
    }

    if (!editButton) return;
    const pet = ClinicData.getPet(editButton.dataset.editPet);
    if (!pet || Number(pet.ownerId) !== Number(authService.currentUser.id)) return;
    editId = pet.id;
    title.textContent = `Редактировать: ${pet.name}`;
    document.getElementById("petName").value = pet.name || "";
    document.getElementById("petType").value = pet.type || "";
    updateBreedField();
    document.getElementById("breed").value = pet.breed || "";
    document.getElementById("age").value = pet.age || "";
    document.getElementById("weight").value = pet.weight || "";
    document.getElementById("notes").value = pet.notes || "";
    cancel.style.display = "inline-flex";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  cancel.addEventListener("click", resetForm);
  petTypeSelect.addEventListener("change", updateBreedField);
  updateBreedField();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const pets = ClinicData.getPets();
    const data = {
      name: document.getElementById("petName").value.trim(),
      type: document.getElementById("petType").value,
      breed: document.getElementById("breed").value.trim(),
      age: Number(document.getElementById("age").value) || 0,
      weight: Number(document.getElementById("weight").value) || 0,
      notes: document.getElementById("notes").value.trim(),
      ownerId: authService.currentUser.id,
    };

    if (editId) {
      const index = pets.findIndex((pet) => Number(pet.id) === Number(editId));
      pets[index] = { ...pets[index], ...data, updatedAt: new Date().toISOString() };
    } else {
      pets.push({ id: ClinicData.nextId(), ...data, createdAt: new Date().toISOString() });
    }
    ClinicData.savePets(pets);
    resetForm();
    render();
  });

  render();
}

function initClientAppointmentsPage() {
  if (!requireRole(["client"])) return;
  const today = todayValue();

  const allPets = ClinicData.getPets();
  const myPets = allPets.filter((pet) => Number(pet.ownerId) === Number(authService.currentUser.id));
  fillPetSelect(document.getElementById("petSelect"), myPets);
  fillVetSelect(document.getElementById("vetSelect"));
  setDateLimit("appointmentDate", { min: today });

  const form = document.getElementById("appointmentForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const date = document.getElementById("appointmentDate").value;
    const time = document.getElementById("appointmentTime").value;
    if (!myPets.length) {
      showValidation("Сначала добавьте питомца.");
      return;
    }
    if (isPastDateTime(date, time)) {
      showValidation("Нельзя создать запись на прошедшую дату или время.");
      return;
    }
    const vet = ClinicData.getVet(document.getElementById("vetSelect").value);
    const appointments = ClinicData.getAppointments();
    appointments.push({
      id: ClinicData.nextId(),
      petId: Number(document.getElementById("petSelect").value),
      vetId: vet ? vet.id : null,
      vetName: vet ? vet.name : "",
      date,
      time,
      type: document.getElementById("appointmentType").value,
      reason: document.getElementById("appointmentReason").value.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    ClinicData.saveAppointments(appointments);
    form.reset();
    fillPetSelect(document.getElementById("petSelect"), myPets);
    fillVetSelect(document.getElementById("vetSelect"));
    renderClientAppointments();
    const notice = document.getElementById("appointmentNotice");
    if (notice) {
      notice.innerHTML =
        'Запись создана. <a href="client-dashboard.html">Вернуться в кабинет</a>';
      notice.style.display = "block";
    }
  });

  renderClientAppointments();
}

function renderClientAppointments() {
  const pets = ClinicData.getPets();
  const container = document.getElementById("upcomingAppointments");
  const appointments = ClinicData.getAppointments()
    .filter((apt) => {
      const pet = pets.find((item) => Number(item.id) === Number(apt.petId));
      return pet && Number(pet.ownerId) === Number(authService.currentUser.id);
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (!appointments.length) {
    container.innerHTML = '<div class="empty-state">Нет предстоящих записей</div>';
    return;
  }

  container.innerHTML = appointments
    .map((apt) => {
      const pet = pets.find((item) => Number(item.id) === Number(apt.petId));
      return `
        <div class="event-card">
          <div class="event-icon"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="event-content">
            <h3>${ClinicData.appointmentType(apt.type)}</h3>
            <p>${escapeHtml(pet ? pet.name : "Питомец")} - ${escapeHtml(apt.date)} ${escapeHtml(apt.time)}</p>
            <p>Врач: ${escapeHtml(apt.vetName || "Не назначен")}</p>
            ${renderStatus(apt.status)}
          </div>
        </div>`;
    })
    .join("");
}

function initClientMedicalPage() {
  if (!requireRole(["client"])) return;

  const params = new URLSearchParams(window.location.search);
  const petId = Number(params.get("pet"));
  const pets = ClinicData.getPets().filter((pet) => Number(pet.ownerId) === Number(authService.currentUser.id));
  const allowedPetIds = pets.map((pet) => Number(pet.id));
  const records = ClinicData.getRecords()
    .filter((record) => (petId ? Number(record.petId) === petId : allowedPetIds.includes(Number(record.petId))))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const header = document.getElementById("petNameDisplay");
  const pet = petId ? ClinicData.getPet(petId) : null;
  header.textContent = pet ? ClinicData.petLabel(pet) : "Все медицинские записи ваших питомцев";

  const container = document.getElementById("recordsList");
  if (!records.length) {
    container.innerHTML = '<div class="empty-state">Нет медицинских записей</div>';
    return;
  }
  container.innerHTML = records.map(renderRecord).join("");
}

function renderRecord(record) {
  const pet = ClinicData.getPet(record.petId);
  return `
    <div class="medical-record">
      <div class="record-header">
        <h4>${ClinicData.appointmentType(record.type)}</h4>
        <span class="record-date">${escapeHtml(record.date || "Дата не указана")}</span>
      </div>
      <div class="record-content">
        <p><strong>Питомец:</strong> ${escapeHtml(pet ? pet.name : "Не указан")}</p>
        <p><strong>Врач:</strong> ${escapeHtml(record.vetName || "Не указан")}</p>
        <p><strong>Симптомы:</strong> ${escapeHtml(record.symptoms || "Нет данных")}</p>
        <p><strong>Диагноз:</strong> ${escapeHtml(record.diagnosis || "Нет данных")}</p>
        <p><strong>Лечение:</strong> ${escapeHtml(record.treatment || "Нет данных")}</p>
        <p><strong>Назначения:</strong> ${escapeHtml(record.prescriptions || "Нет назначений")}</p>
        <p><strong>Рекомендации:</strong> ${escapeHtml(record.recommendations || "Нет рекомендаций")}</p>
      </div>
    </div>`;
}

function initVetPatientsPage() {
  if (!requireRole(["vet", "admin"])) return;
  const list = document.getElementById("patientsList");
  const users = ClinicData.getUsers();
  const records = ClinicData.getRecords();
  const appointments = ClinicData.getAppointments();
  const pets = ClinicData.getPets();

  if (!pets.length) {
    list.innerHTML = '<div class="empty-state">Пациенты пока не добавлены</div>';
    return;
  }

  list.innerHTML = pets
    .map((pet) => {
      const owner = users.find((user) => Number(user.id) === Number(pet.ownerId));
      const lastRecord = records.filter((record) => Number(record.petId) === Number(pet.id)).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
      const nextAppointment = appointments.find((apt) => Number(apt.petId) === Number(pet.id) && apt.status !== "completed");
      return `
        <div class="patient-card patient-card--wide">
          <div class="patient-avatar"><i class="fa-solid fa-${ClinicData.petIcon(pet.type)}"></i></div>
          <h3>${escapeHtml(pet.name)}</h3>
          <p>${ClinicData.petTypeLabel(pet.type)}, ${pet.age || "?"} лет, ${pet.weight || "?"} кг</p>
          <p class="patient-owner">Владелец: ${escapeHtml(owner ? owner.name : "Неизвестно")}</p>
          <p>${escapeHtml(owner ? owner.phone : "Телефон не указан")}</p>
          <p>Последняя запись: ${escapeHtml(lastRecord ? lastRecord.date : "нет")}</p>
          <p>Ближайший приём: ${escapeHtml(nextAppointment ? `${nextAppointment.date} ${nextAppointment.time}` : "не запланирован")}</p>
          <div class="pet-actions">
            <a href="vet-records.html?pet=${pet.id}" class="btn btn--primary btn--sm">Медкарта</a>
            <a href="vet-schedule.html?pet=${pet.id}" class="btn btn--outline btn--sm">Записать</a>
          </div>
        </div>`;
    })
    .join("");
}

function initVetSchedulePage() {
  if (!requireRole(["vet", "admin"])) return;
  const today = todayValue();
  const params = new URLSearchParams(window.location.search);
  const pets = ClinicData.getPets();
  fillPetSelect(document.getElementById("schedulePet"), pets, params.get("pet"));
  if (authService.currentUser.role === "admin") fillVetSelect(document.getElementById("scheduleVet"));
  setDateLimit("scheduleDate", { min: today });

  const vetField = document.getElementById("scheduleVetGroup");
  const vetSelect = document.getElementById("scheduleVet");
  if (vetField) vetField.style.display = authService.currentUser.role === "admin" ? "block" : "none";
  if (vetSelect) vetSelect.required = authService.currentUser.role === "admin";

  document.getElementById("scheduleForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const date = document.getElementById("scheduleDate").value;
    const time = document.getElementById("scheduleTime").value;
    if (isPastDateTime(date, time)) {
      showValidation("Нельзя добавить запись на прошедшую дату или время.");
      return;
    }
    const vet = authService.currentUser.role === "admin" ? ClinicData.getVet(document.getElementById("scheduleVet").value) : authService.currentUser;
    if (!vet) {
      alert("Выберите врача");
      return;
    }
    const appointments = ClinicData.getAppointments();
    appointments.push({
      id: ClinicData.nextId(),
      petId: Number(document.getElementById("schedulePet").value),
      vetId: vet.id,
      vetName: vet.name,
      date,
      time,
      type: document.getElementById("scheduleType").value,
      reason: document.getElementById("scheduleReason").value.trim(),
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
    ClinicData.saveAppointments(appointments);
    event.target.reset();
    fillPetSelect(document.getElementById("schedulePet"), pets);
    renderVetSchedule();
  });

  renderVetSchedule();
}

function renderVetSchedule() {
  const pets = ClinicData.getPets();
  const users = ClinicData.getUsers();
  const isAdmin = authService.currentUser.role === "admin";
  const rows = ClinicData.getAppointments()
    .filter((apt) => isAdmin || Number(apt.vetId) === Number(authService.currentUser.id) || !apt.vetId)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const tbody = document.getElementById("scheduleTableBody");
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7">Записей пока нет</td></tr>';
    return;
  }
  tbody.innerHTML = rows
    .map((apt) => {
      const pet = pets.find((item) => Number(item.id) === Number(apt.petId));
      const owner = pet ? users.find((user) => Number(user.id) === Number(pet.ownerId)) : null;
      const actions = [];
      if (apt.status === "pending") {
        actions.push(
          `<button class="btn btn--primary btn--sm" data-confirm-appointment="${apt.id}">Подтвердить</button>`,
        );
      }
      if (apt.status !== "completed" && apt.status !== "cancelled") {
        actions.push(
          `<button class="btn btn--outline btn--sm" data-complete-appointment="${apt.id}">Завершить</button>`,
        );
      }
      return `
        <tr>
          <td>${escapeHtml(apt.date)} ${escapeHtml(apt.time)}</td>
          <td>${escapeHtml(pet ? pet.name : "Питомец")}</td>
          <td>${escapeHtml(owner ? owner.name : "Не указан")}</td>
          <td>${escapeHtml(apt.vetName || "Не назначен")}</td>
          <td>${ClinicData.appointmentType(apt.type)}</td>
          <td>${renderStatus(apt.status)}</td>
          <td><div class="table-actions">${actions.join("")}</div></td>
        </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-confirm-appointment]").forEach((button) => {
    button.addEventListener("click", () => {
      const appointments = ClinicData.getAppointments();
      const item = appointments.find((apt) => Number(apt.id) === Number(button.dataset.confirmAppointment));
      if (item) item.status = "confirmed";
      ClinicData.saveAppointments(appointments);
      renderVetSchedule();
    });
  });

  tbody.querySelectorAll("[data-complete-appointment]").forEach((button) => {
    button.addEventListener("click", () => {
      const appointments = ClinicData.getAppointments();
      const item = appointments.find((apt) => Number(apt.id) === Number(button.dataset.completeAppointment));
      if (item) item.status = "completed";
      ClinicData.saveAppointments(appointments);
      renderVetSchedule();
    });
  });
}

function initVetRecordsPage() {
  if (!requireRole(["vet", "admin"])) return;
  const today = todayValue();
  const params = new URLSearchParams(window.location.search);
  const pets = ClinicData.getPets();
  fillPetSelect(document.getElementById("recordPet"), pets, params.get("pet"));
  setDateLimit("recordDate", { max: today });
  setDateLimit("reminderDate", { min: today });

  document.getElementById("recordForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const recordDate = document.getElementById("recordDate").value;
    const reminderDate = document.getElementById("reminderDate").value;
    const reminderTitle = document.getElementById("reminderTitle").value.trim();
    if (recordDate > today) {
      showValidation("Дата медзаписи не может быть в будущем.");
      return;
    }
    if ((reminderDate && !reminderTitle) || (!reminderDate && reminderTitle)) {
      showValidation("Для напоминания укажите и название, и дату.");
      return;
    }
    if (reminderDate && reminderDate < today) {
      showValidation("Напоминание нельзя поставить на прошедшую дату.");
      return;
    }
    const records = ClinicData.getRecords();
    records.push({
      id: ClinicData.nextId(),
      petId: Number(document.getElementById("recordPet").value),
      vetId: authService.currentUser.role === "vet" ? authService.currentUser.id : null,
      vetName: authService.currentUser.role === "vet" ? authService.currentUser.name : "Администратор",
      date: recordDate,
      type: document.getElementById("recordType").value,
      symptoms: document.getElementById("symptoms").value.trim(),
      diagnosis: document.getElementById("diagnosis").value.trim(),
      treatment: document.getElementById("treatment").value.trim(),
      prescriptions: document.getElementById("prescriptions").value.trim(),
      recommendations: document.getElementById("recommendations").value.trim(),
      createdAt: new Date().toISOString(),
    });
    ClinicData.saveRecords(records);

    if (reminderDate && reminderTitle) {
      const reminders = ClinicData.getReminders();
      reminders.push({
        id: ClinicData.nextId(),
        petId: Number(document.getElementById("recordPet").value),
        vetId: authService.currentUser.id,
        type: document.getElementById("recordType").value,
        title: reminderTitle,
        date: reminderDate,
        status: "planned",
        notes: document.getElementById("recommendations").value.trim(),
        createdAt: new Date().toISOString(),
      });
      ClinicData.saveReminders(reminders);
    }

    event.target.reset();
    fillPetSelect(document.getElementById("recordPet"), pets);
    renderVetRecords();
  });

  renderVetRecords();
}

function renderVetRecords() {
  const container = document.getElementById("recordsList");
  const records = ClinicData.getRecords().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  container.innerHTML = records.length ? records.map(renderRecord).join("") : '<div class="empty-state">Медицинских записей пока нет</div>';
}

function initAdminDashboardPage() {
  if (!requireRole(["admin"])) return;
  const users = ClinicData.getUsers();
  const pets = ClinicData.getPets();
  const appointments = ClinicData.getAppointments();
  const records = ClinicData.getRecords();
  const stats = [users.length, pets.length, appointments.length, records.length];
  document.querySelectorAll(".stat-card h3").forEach((item, index) => {
    item.textContent = stats[index] || 0;
  });

  document.getElementById("adminUsers").innerHTML = users
    .map(
      (user) => `
        <tr>
          <td>${escapeHtml(user.name)}</td>
          <td>${escapeHtml(user.email)}</td>
          <td>${escapeHtml(user.phone || "-")}</td>
          <td>${escapeHtml(user.role)}</td>
        </tr>`,
    )
    .join("");

  renderVetSchedule();
}

function initCalendarPage() {
  if (!requireRole(["client", "vet", "admin"])) return;
  const pets = ClinicData.getPets();
  const appointments = ClinicData.getAppointments();
  const reminders = ClinicData.getReminders();
  const isClient = authService.currentUser.role === "client";
  const visiblePetIds = isClient
    ? pets.filter((pet) => Number(pet.ownerId) === Number(authService.currentUser.id)).map((pet) => Number(pet.id))
    : pets.map((pet) => Number(pet.id));
  const events = [
    ...appointments.map((item) => ({ ...item, source: "appointment", title: ClinicData.appointmentType(item.type) })),
    ...reminders.map((item) => ({ ...item, source: "reminder" })),
  ]
    .filter((item) => visiblePetIds.includes(Number(item.petId)))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const container = document.getElementById("calendarEvents");
  if (!events.length) {
    container.innerHTML = '<div class="empty-state">Событий пока нет</div>';
    return;
  }
  const grouped = events.reduce((acc, item) => {
    const key = item.date || "Без даты";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
  container.innerHTML = Object.entries(grouped)
    .map(([date, items]) => {
      const rows = items
        .map((item) => {
          const pet = ClinicData.getPet(item.petId);
          return `
            <div class="calendar-row">
              <div class="calendar-row__time">${escapeHtml(item.time || "Весь день")}</div>
              <div class="calendar-row__body">
                <h3>${escapeHtml(item.title || ClinicData.appointmentType(item.type))}</h3>
                <p>${escapeHtml(pet ? pet.name : "Питомец")} ${item.vetName ? `- ${escapeHtml(item.vetName)}` : ""}</p>
              </div>
              ${renderStatus(item.status)}
            </div>`;
        })
        .join("");
      return `
        <div class="calendar-day">
          <div class="calendar-day__date">${escapeHtml(date)}</div>
          <div class="calendar-day__items">${rows}</div>
        </div>`;
    })
    .join("");
}

function initDietPage() {
  if (!requireRole(["client"])) return;
  const pets = ClinicData.getPets().filter((pet) => Number(pet.ownerId) === Number(authService.currentUser.id));
  fillPetSelect(document.getElementById("dietPet"), pets);
  document.getElementById("dietForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const pet = ClinicData.getPet(document.getElementById("dietPet").value);
    const activity = document.getElementById("activityLevel").value;
    const goal = document.getElementById("dietGoal").value;
    const base = pet && pet.weight ? Math.round(pet.weight * 35) : 180;
    const coefficient = activity === "high" ? 1.25 : activity === "low" ? 0.85 : 1;
    const goalCoefficient = goal === "loss" ? 0.85 : goal === "gain" ? 1.15 : 1;
    const grams = Math.max(40, Math.round(base * coefficient * goalCoefficient));
    document.getElementById("dietResult").innerHTML = `
      <div class="medical-record">
        <div class="record-header"><h4>${escapeHtml(pet ? pet.name : "Питомец")}</h4><span class="record-date">Рекомендация</span></div>
        <div class="record-content">
          <p><strong>Суточная порция:</strong> около ${grams} г готового корма.</p>
          <p><strong>Режим:</strong> разделить на 2-3 кормления и корректировать по состоянию, возрасту и назначениям врача.</p>
          <p><strong>Важно:</strong> при хронических заболеваниях рацион должен подтвердить ветеринар.</p>
        </div>
      </div>`;
  });
}
