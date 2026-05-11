document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendMessage");
  const chatMessages = document.getElementById("chatMessages");
  const petCard = document.getElementById("assistantPetCard");
  const healthProcedures = document.getElementById("healthProcedures");
  const weightSummary = document.getElementById("weightSummary");

  if (!chatInput || !sendButton || !chatMessages) return;

  const state = {
    pets: [],
    selectedPetId: null,
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  initAssistantData();
  sendButton.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") sendMessage();
  });

  function initAssistantData() {
    if (!authService.isAuthenticated() || !authService.isClient()) return;

    state.pets = ClinicData.getPets().filter(
      (pet) => Number(pet.ownerId) === Number(authService.currentUser.id),
    );
    state.selectedPetId = state.pets[0]?.id || null;

    renderPetCard();
    renderHealth();
  }

  function selectedPet() {
    return state.pets.find((pet) => Number(pet.id) === Number(state.selectedPetId));
  }

  function renderPetCard() {
    if (!petCard) return;

    if (!state.pets.length) {
      petCard.innerHTML = `
        <h2 class="pet-profile-card__title">Профиль питомца</h2>
        <div class="empty-state">Добавьте питомца, чтобы помощник использовал его данные.</div>
        <a href="client-pets.html" class="btn btn--primary btn--full">Добавить питомца</a>
      `;
      return;
    }

    const pet = selectedPet();
    const options = state.pets
      .map(
        (item) =>
          `<option value="${item.id}" ${Number(item.id) === Number(pet.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`,
      )
      .join("");

    petCard.innerHTML = `
      <h2 class="pet-profile-card__title">Профиль питомца</h2>
      <div class="form-group">
        <label for="assistantPetSelect" class="form-label">Питомец</label>
        <select id="assistantPetSelect" class="form-select">${options}</select>
      </div>
      <div class="pet-profile-card__info">
        <div class="pet-profile-card__avatar">
          <i class="fa-solid fa-${ClinicData.petIcon(pet.type)}"></i>
        </div>
        <div class="pet-profile-card__details">
          <h3 class="pet-profile-card__name">${escapeHtml(pet.name)}</h3>
          <p class="pet-profile-card__meta">${ClinicData.petTypeLabel(pet.type)}, ${pet.age || "?"} лет</p>
        </div>
      </div>
      <div class="pet-profile-card__data">
        <div class="pet-profile-card__row">
          <span class="pet-profile-card__label">Вид / порода:</span>
          <span class="pet-profile-card__value">${escapeHtml(pet.breed || "Не указана")}</span>
        </div>
        <div class="pet-profile-card__row">
          <span class="pet-profile-card__label">Вес:</span>
          <span class="pet-profile-card__value">${pet.weight ? `${pet.weight} кг` : "Не указан"}</span>
        </div>
        <div class="pet-profile-card__row">
          <span class="pet-profile-card__label">Особенности:</span>
          <span class="pet-profile-card__value">${escapeHtml(pet.notes || "Не указаны")}</span>
        </div>
      </div>
      <a href="client-pets.html" class="btn btn--outline btn--full">Редактировать профиль</a>
    `;

    document.getElementById("assistantPetSelect").addEventListener("change", (event) => {
      state.selectedPetId = Number(event.target.value);
      renderPetCard();
      renderHealth();
    });
  }

  function renderHealth() {
    const pet = selectedPet();
    if (!pet) {
      if (healthProcedures) {
        healthProcedures.innerHTML = '<div class="empty-state">Нет выбранного питомца</div>';
      }
      if (weightSummary) {
        weightSummary.innerHTML = '<p class="weight-chart__placeholder">Добавьте питомца, чтобы видеть вес.</p>';
      }
      return;
    }

    const reminders = ClinicData.getReminders()
      .filter((item) => Number(item.petId) === Number(pet.id))
      .map((item) => ({ ...item, title: item.title || ClinicData.appointmentType(item.type) }));
    const appointments = ClinicData.getAppointments()
      .filter((item) => Number(item.petId) === Number(pet.id) && item.status !== "completed")
      .map((item) => ({ ...item, title: ClinicData.appointmentType(item.type) }));
    const events = [...appointments, ...reminders].sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );

    if (healthProcedures) {
      healthProcedures.innerHTML = events.length
        ? events
            .map(
              (item) => `
                <div class="health-procedure">
                  <div class="health-procedure__icon"><i class="fa-solid fa-calendar-check"></i></div>
                  <div class="health-procedure__content">
                    <h4 class="health-procedure__title">${escapeHtml(item.title)}</h4>
                    <p class="health-procedure__date">${escapeHtml(item.date || "Дата не указана")} ${escapeHtml(item.time || "")}</p>
                  </div>
                  <span class="status-badge status-pending">${ClinicData.statusLabel(item.status)}</span>
                </div>`,
            )
            .join("")
        : '<div class="empty-state">Ближайших процедур пока нет</div>';
    }

    if (weightSummary) {
      const weight = Number(pet.weight) || 0;
      const dailyFood = weight ? Math.round(weight * 35) : null;
      weightSummary.innerHTML = `
        <div class="weight-summary">
          <div class="weight-summary__item">
            <span class="weight-summary__label">Текущий вес</span>
            <strong>${weight ? `${weight} кг` : "Не указан"}</strong>
          </div>
          <div class="weight-summary__item">
            <span class="weight-summary__label">Ориентир по корму</span>
            <strong>${dailyFood ? `${dailyFood} г/день` : "Укажите вес"}</strong>
          </div>
          <p class="weight-summary__note">Это ориентировочный расчёт. Медицинские диеты и коррекцию веса лучше согласовать с врачом.</p>
        </div>
      `;
    }
  }

  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage("user", message);
    chatInput.value = "";
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      addMessage("assistant", generateResponse(message));
    }, 800);
  }

  function addMessage(role, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat__message chat__message--${role}`;

    if (role === "assistant") {
      messageDiv.innerHTML = `
        <div class="chat__avatar">
          <img src="ассистент.png" alt="Ассистент" class="chat__avatar-img">
        </div>
        <div class="chat__bubble">
          <div class="chat__sender">VetCare Ассистент</div>
          <div class="chat__text">${content}</div>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `<div class="chat__bubble"><div class="chat__text">${escapeHtml(content)}</div></div>`;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat__message chat__message--assistant typing-indicator";
    typingDiv.innerHTML = `
      <div class="chat__avatar">
        <img src="ассистент.png" alt="Ассистент" class="chat__avatar-img">
      </div>
      <div class="chat__bubble">
        <div class="chat__sender">VetCare Ассистент</div>
        <div class="chat__text"><span class="typing-dots"><span>.</span><span>.</span><span>.</span></span></div>
      </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const typingIndicator = document.querySelector(".typing-indicator");
    if (typingIndicator) typingIndicator.remove();
  }

  function generateResponse(rawMessage) {
    const message = rawMessage.toLowerCase();
    const pet = selectedPet();

    if (!pet) {
      return 'Сначала добавьте питомца в разделе "Мои питомцы", и я смогу отвечать с учетом его данных.';
    }

    const records = ClinicData.getRecords()
      .filter((record) => Number(record.petId) === Number(pet.id))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const appointments = ClinicData.getAppointments()
      .filter((item) => Number(item.petId) === Number(pet.id) && item.status !== "completed")
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    const lastRecord = records[0];
    const nextAppointment = appointments[0];

    if (message.includes("прививк") || message.includes("вакцин")) {
      const vaccination = records.find((record) => record.type === "vaccination");
      return vaccination
        ? `По медкарте ${escapeHtml(pet.name)} последняя запись о вакцинации: ${escapeHtml(vaccination.date)}. Подробности можно посмотреть в медкарте.`
        : `В медкарте ${escapeHtml(pet.name)} пока нет записи о вакцинации. Лучше записаться к врачу или попросить врача добавить данные после осмотра.`;
    }

    if (message.includes("запис") || message.includes("приём") || message.includes("прием")) {
      return nextAppointment
        ? `Ближайшая запись для ${escapeHtml(pet.name)}: ${escapeHtml(nextAppointment.date)} ${escapeHtml(nextAppointment.time)} - ${ClinicData.appointmentType(nextAppointment.type)}.`
        : `У ${escapeHtml(pet.name)} пока нет будущих записей. Можно создать запись в разделе "Записи".`;
    }

    if (message.includes("диагноз") || message.includes("болезн") || message.includes("медкарт")) {
      return lastRecord
        ? `Последняя запись в медкарте ${escapeHtml(pet.name)} от ${escapeHtml(lastRecord.date)}: ${escapeHtml(lastRecord.diagnosis || "диагноз не указан")}.`
        : `В медкарте ${escapeHtml(pet.name)} пока нет записей. После приема врач сможет добавить диагноз, назначения и рекомендации.`;
    }

    if (message.includes("назначен") || message.includes("лечен")) {
      return lastRecord && lastRecord.prescriptions
        ? `Текущие назначения из последней записи: ${escapeHtml(lastRecord.prescriptions)}.`
        : `Для ${escapeHtml(pet.name)} пока нет сохраненных назначений.`;
    }

    if (message.includes("вес") || message.includes("диет") || message.includes("корм") || message.includes("питан")) {
      const weight = Number(pet.weight) || 0;
      const dailyFood = weight ? Math.round(weight * 35) : null;
      return dailyFood
        ? `${escapeHtml(pet.name)} весит ${weight} кг. Ориентировочная суточная порция: около ${dailyFood} г, но точная норма зависит от корма, возраста и состояния здоровья.`
        : `У ${escapeHtml(pet.name)} не указан вес. Добавьте вес в профиле питомца, и расчет станет полезнее.`;
    }

    return `Я вижу профиль ${escapeHtml(pet.name)}: ${ClinicData.petTypeLabel(pet.type).toLowerCase()}, ${pet.age || "возраст не указан"} лет, вес ${pet.weight || "не указан"} кг. Могу подсказать по записям, медкарте, весу, питанию или вакцинациям.`;
  }

  const style = document.createElement("style");
  style.textContent = `
    .typing-dots span {
      animation: typingDot 1.4s infinite;
      animation-fill-mode: both;
      font-size: 1.5rem;
      line-height: 0;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingDot {
      0% { opacity: 0.2; }
      20% { opacity: 1; }
      100% { opacity: 0.2; }
    }
  `;
  document.head.appendChild(style);
});
