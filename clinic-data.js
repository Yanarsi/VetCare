const ClinicData = (() => {
  const keys = {
    users: "users",
    pets: "pets",
    appointments: "appointments",
    medicalRecords: "medicalRecords",
    reminders: "clinicReminders",
  };

  const today = () => new Date().toISOString().slice(0, 10);
  const nextId = () => Date.now() + Math.floor(Math.random() * 1000);

  const read = (key) => JSON.parse(AppStorage.getItem(key) || "[]");
  const write = (key, value) => AppStorage.setItem(key, JSON.stringify(value));

  const normalizeSpecialization = (value) => {
    const map = {
      therapist: "Терапевт",
      surgeon: "Хирург",
      dermatologist: "Дерматолог",
      ophthalmologist: "Офтальмолог",
      dentist: "Стоматолог",
      cardiologist: "Кардиолог",
      neurologist: "Невролог",
      other: "Ветеринар",
    };
    return map[value] || value || "Ветеринар";
  };

  const petTypeLabel = (type) => {
    const map = {
      cat: "Кошка",
      dog: "Собака",
      bird: "Птица",
      rodent: "Грызун",
      rabbit: "Кролик",
      fish: "Рыбка",
      other: "Питомец",
    };
    return map[type] || "Питомец";
  };

  const petIcon = (type) => {
    const map = {
      cat: "cat",
      dog: "dog",
      bird: "dove",
      rodent: "otter",
      rabbit: "paw",
      fish: "fish",
      other: "paw",
    };
    return map[type] || "paw";
  };

  function upsertByEmail(users, user) {
    const index = users.findIndex((item) => item.email === user.email);
    if (index === -1) users.push(user);
    else users[index] = { ...user, ...users[index], role: users[index].role || user.role };
  }

  function seed() {
    const now = new Date().toISOString();
    const users = read(keys.users);

    upsertByEmail(users, {
      id: 1,
      name: "Доктор Иванов",
      email: "vet@vetcare.ru",
      password: "vet123",
      role: "vet",
      phone: "+7 (999) 123-45-67",
      specialization: "Терапевт",
      createdAt: now,
    });
    upsertByEmail(users, {
      id: 2,
      name: "Мария Петрова",
      email: "client@vetcare.ru",
      password: "client123",
      role: "client",
      phone: "+7 (999) 765-43-21",
      createdAt: now,
    });
    upsertByEmail(users, {
      id: 3,
      name: "Администратор VetCare",
      email: "admin@vetcare.ru",
      password: "admin123",
      role: "admin",
      phone: "+7 (999) 000-00-00",
      createdAt: now,
    });
    write(keys.users, users);

    const pets = read(keys.pets);
    if (!pets.length) {
      pets.push({
        id: 101,
        name: "Барсик",
        type: "cat",
        breed: "Британская короткошерстная",
        age: 3,
        weight: 5.2,
        ownerId: 2,
        notes: "Спокойный, чувствителен к смене корма.",
        createdAt: now,
      });
      write(keys.pets, pets);
    }

    const appointments = read(keys.appointments);
    if (!appointments.length) {
      appointments.push({
        id: 201,
        petId: 101,
        vetId: 1,
        vetName: "Доктор Иванов",
        date: today(),
        time: "10:00",
        type: "checkup",
        reason: "Плановый осмотр",
        status: "confirmed",
        createdAt: now,
      });
      write(keys.appointments, appointments);
    }

    const records = read(keys.medicalRecords);
    if (!records.length) {
      records.push({
        id: 301,
        petId: 101,
        vetId: 1,
        vetName: "Доктор Иванов",
        date: today(),
        type: "checkup",
        diagnosis: "Клинически здоров. Нужен контроль веса.",
        symptoms: "Жалоб нет",
        treatment: "Плановое наблюдение",
        prescriptions: "Витаминный комплекс 30 дней",
        recommendations: "Повторный осмотр через 6 месяцев",
        createdAt: now,
      });
      write(keys.medicalRecords, records);
    }

    const reminders = read(keys.reminders);
    if (!reminders.length) {
      reminders.push({
        id: 401,
        petId: 101,
        vetId: 1,
        type: "vaccination",
        title: "Ежегодная вакцинация",
        date: today(),
        status: "planned",
        notes: "Комплексная вакцина",
        createdAt: now,
      });
      write(keys.reminders, reminders);
    }
  }

  function getUsers(role) {
    const users = read(keys.users);
    return role ? users.filter((user) => user.role === role) : users;
  }

  function saveUsers(users) {
    write(keys.users, users);
  }

  function getPets() {
    return read(keys.pets);
  }

  function savePets(pets) {
    write(keys.pets, pets);
  }

  function getAppointments() {
    return read(keys.appointments);
  }

  function saveAppointments(appointments) {
    write(keys.appointments, appointments);
  }

  function getRecords() {
    return read(keys.medicalRecords);
  }

  function saveRecords(records) {
    write(keys.medicalRecords, records);
  }

  function getReminders() {
    return read(keys.reminders);
  }

  function saveReminders(reminders) {
    write(keys.reminders, reminders);
  }

  function getPet(id) {
    return getPets().find((pet) => Number(pet.id) === Number(id));
  }

  function getOwner(pet) {
    return pet ? getUsers().find((user) => Number(user.id) === Number(pet.ownerId)) : null;
  }

  function getVet(id) {
    return getUsers("vet").find((user) => Number(user.id) === Number(id));
  }

  function petLabel(pet) {
    if (!pet) return "Питомец не найден";
    const type = petTypeLabel(pet.type);
    return `${pet.name} (${type}${pet.breed ? `, ${pet.breed}` : ""})`;
  }

  function appointmentType(value) {
    const map = {
      checkup: "Плановый осмотр",
      vaccination: "Вакцинация",
      consultation: "Консультация",
      surgery: "Операция",
      treatment: "Лечение",
    };
    return map[value] || "Приём";
  }

  function statusLabel(value) {
    const map = {
      pending: "Ожидает",
      confirmed: "Подтверждена",
      completed: "Завершена",
      cancelled: "Отменена",
      planned: "Запланировано",
    };
    return map[value] || value || "Ожидает";
  }

  seed();

  return {
    nextId,
    normalizeSpecialization,
    petTypeLabel,
    petIcon,
    appointmentType,
    statusLabel,
    petLabel,
    getUsers,
    saveUsers,
    getPets,
    savePets,
    getPet,
    getOwner,
    getVet,
    getAppointments,
    saveAppointments,
    getRecords,
    saveRecords,
    getReminders,
    saveReminders,
  };
})();
