class AuthService {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.ensureDefaultUsers();
    this.normalizeStoredBrand();

    // Проверяем, авторизован ли пользователь
    const savedUser = AppStorage.getItem("currentUser");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.updateUI();
    }
  }

  normalizeStoredBrand() {
    const replaceBrand = (value) =>
      typeof value === "string"
        ? value
            .replaceAll("PetPalace", "VetCare")
            .replaceAll("VetCate+", "VetCare")
            .replaceAll("VetCate", "VetCare")
            .replaceAll("VetCare+", "VetCare")
            .replaceAll("petpalace.ru", "vetcare.ru")
            .replaceAll("vetcate.ru", "vetcare.ru")
        : value;
    const normalizeObject = (item) => {
      if (!item || typeof item !== "object") return item;
      return Object.fromEntries(
        Object.entries(item).map(([key, value]) => [key, replaceBrand(value)]),
      );
    };

    const users = this.getUsers().map(normalizeObject);
    AppStorage.setItem("users", JSON.stringify(users));

    const savedUser = AppStorage.getItem("currentUser");
    if (savedUser) {
      AppStorage.setItem("currentUser", JSON.stringify(normalizeObject(JSON.parse(savedUser))));
    }
  }

  ensureDefaultUsers() {
    const users = this.getUsers();
    const defaults = [
      {
        id: 1,
        name: "Доктор Иванов",
        email: "vet@vetcare.ru",
        password: "vet123",
        role: "vet",
        phone: "+7 (999) 123-45-67",
        specialization: "Терапевт",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Мария Петрова",
        email: "client@vetcare.ru",
        password: "client123",
        role: "client",
        phone: "+7 (999) 765-43-21",
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Администратор VetCare",
        email: "admin@vetcare.ru",
        password: "admin123",
        role: "admin",
        phone: "+7 (999) 000-00-00",
        createdAt: new Date().toISOString(),
      },
    ];

    defaults.forEach((user) => {
      if (!users.some((existing) => existing.email === user.email)) {
        users.push(user);
      }
    });

    AppStorage.setItem("users", JSON.stringify(users));
  }

  login(email, password, role) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        const user = users.find(
          (u) => u.email === email && u.password === password && u.role === role
        );

        if (user) {
          this.currentUser = user;
          AppStorage.setItem("currentUser", JSON.stringify(user));
          this.updateUI();
          resolve(user);
        } else {
          reject("Неверные email, пароль или роль");
        }
      }, 1000);
    });
  }

  register(userData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();

        if (users.find((u) => u.email === userData.email)) {
          reject("Пользователь с таким email уже существует");
          return;
        }

        const newUser = {
          id: Date.now(),
          ...userData,
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        AppStorage.setItem("users", JSON.stringify(users));

        this.currentUser = newUser;
        AppStorage.setItem("currentUser", JSON.stringify(newUser));
        this.updateUI();

        resolve(newUser);
      }, 1000);
    });
  }

  logout() {
    this.currentUser = null;
    AppStorage.removeItem("currentUser");
    this.updateUI();
    window.location.href = "index.html";
  }

  getUsers() {
    return JSON.parse(AppStorage.getItem("users") || "[]");
  }

  getCurrentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  getDashboardUrl(role = this.currentUser?.role) {
    if (role === "vet") return "vet-dashboard.html";
    if (role === "admin") return "admin-dashboard.html";
    return "client-dashboard.html";
  }

  isPublicShellPage() {
    return ["index.html", "login.html", "register.html"].includes(
      this.getCurrentPage(),
    );
  }

  updateUI() {
    const headerButtons = document.querySelector(".header__buttons");
    const userMenu = document.querySelector(".user-menu");

    if (this.isPublicShellPage()) {
      if (headerButtons) headerButtons.style.display = "flex";
      if (userMenu) userMenu.style.display = "none";
      this.checkAccess();
      return;
    }

    if (this.currentUser) {
      if (headerButtons) headerButtons.style.display = "none";
      if (userMenu) {
        userMenu.style.display = "flex";
        const userName = userMenu.querySelector(".user-name");
        if (userName) {
          userName.textContent = this.currentUser.name;
        }
      }
    } else {
      if (headerButtons) headerButtons.style.display = "flex";
      if (userMenu) userMenu.style.display = "none";
    }

    this.updateNavigation();
    this.checkAccess();
  }

  updateNavigation() {
    if (!this.currentUser) return;

    const nav = document.querySelector(".nav__list");
    if (!nav) return;

    const page = window.location.pathname.split("/").pop() || "index.html";
    const linksByRole = {
      vet: [
        ["vet-dashboard.html", "Панель врача"],
        ["vet-patients.html", "Пациенты"],
        ["vet-schedule.html", "Расписание"],
        ["vet-records.html", "Медкарты"],
      ],
      admin: [
        ["admin-dashboard.html", "Админ панель"],
        ["vet-patients.html", "Пациенты"],
        ["vet-schedule.html", "Расписание"],
        ["vet-records.html", "Медкарты"],
      ],
      client: [
        ["client-dashboard.html", "Главная"],
        ["client-pets.html", "Мои питомцы"],
        ["client-appointments.html", "Записи"],
        ["client-medical.html", "Медкарты"],
        ["calendar.html", "Календарь"],
        ["pet-assistant.html", "Помощник"],
      ],
    };
    const links = linksByRole[this.currentUser.role] || linksByRole.client;
    nav.innerHTML = links
      .map(
        ([href, text]) =>
          `<li class="nav__item"><a href="${href}" class="nav__link ${page === href ? "nav__link--active" : ""}">${text}</a></li>`,
      )
      .join("");
  }

  checkAccess() {
    const currentPage = this.getCurrentPage();

    if (!this.currentUser) {
      // Если не авторизован, разрешаем только публичные страницы
      const publicPages = [
        "index.html",
        "login.html",
        "register.html",
      ];
      if (!publicPages.includes(currentPage) && currentPage !== "") {
        window.location.href = "login.html";
      }
      return;
    }

    if (["login.html", "register.html"].includes(currentPage)) {
      window.location.href = this.getDashboardUrl();
      return;
    }

    // Проверяем доступ по ролям
    if (this.currentUser.role === "vet") {
      const clientPages = [
        "client-dashboard.html",
        "client-pets.html",
        "client-appointments.html",
        "client-medical.html",
        "admin-dashboard.html",
        "pet-assistant.html",
        "diet.html",
        "calculator.html",
      ];
      if (clientPages.includes(currentPage)) {
        window.location.href = "vet-dashboard.html";
      }
    } else if (this.currentUser.role === "client") {
      const vetPages = [
        "vet-dashboard.html",
        "vet-patients.html",
        "vet-schedule.html",
        "vet-records.html",
        "admin-dashboard.html",
      ];
      if (vetPages.includes(currentPage)) {
        window.location.href = "client-dashboard.html";
      }
    } else if (this.currentUser.role === "admin") {
      const clientPages = [
        "client-dashboard.html",
        "client-pets.html",
        "client-appointments.html",
        "client-medical.html",
      ];
      if (clientPages.includes(currentPage)) {
        window.location.href = "admin-dashboard.html";
      }
    }
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  isVet() {
    return this.currentUser && this.currentUser.role === "vet";
  }

  isClient() {
    return this.currentUser && this.currentUser.role === "client";
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === "admin";
  }
}

const authService = new AuthService();

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const role = document.querySelector('input[name="role"]:checked').value;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Вход...";
      submitBtn.disabled = true;

      authService
        .login(email, password, role)
        .then((user) => {
          if (user.role === "vet") {
            window.location.href = "vet-dashboard.html";
          } else if (user.role === "admin") {
            window.location.href = "admin-dashboard.html";
          } else {
            window.location.href = "client-dashboard.html";
          }
        })
        .catch((error) => {
          alert(error);
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        role: document.querySelector('input[name="role"]:checked').value,
        phone: document.getElementById("phone").value,
      };

      if (formData.role === "vet") {
        formData.specialization =
          document.getElementById("specialization").value;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Регистрация...";
      submitBtn.disabled = true;

      authService
        .register(formData)
        .then((user) => {
          if (user.role === "vet") {
            window.location.href = "vet-dashboard.html";
          } else if (user.role === "admin") {
            window.location.href = "admin-dashboard.html";
          } else {
            window.location.href = "client-dashboard.html";
          }
        })
        .catch((error) => {
          alert(error);
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });

    // Показываем/скрываем поле специализации для ветеринаров
    const roleInputs = registerForm.querySelectorAll('input[name="role"]');
    const specializationField = document.getElementById("specializationField");

    if (specializationField) {
      roleInputs.forEach((input) => {
        input.addEventListener("change", function () {
          if (this.value === "vet") {
            specializationField.style.display = "block";
          } else {
            specializationField.style.display = "none";
          }
        });
      });
    }
  }

  [logoutBtn, document.getElementById("mobileLogoutBtn")].forEach((button) => {
    if (button) {
      button.addEventListener("click", function () {
        authService.logout();
      });
    }
  });
});
