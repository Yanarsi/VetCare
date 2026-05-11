document.addEventListener("DOMContentLoaded", () => {
  const testIcon = document.createElement("i");
  testIcon.className = "fa-solid fa-paw";
  testIcon.style.position = "absolute";
  testIcon.style.left = "-9999px";
  document.body.appendChild(testIcon);
  requestAnimationFrame(() => {
    const iconContent = window.getComputedStyle(testIcon, "::before").content;
    if (!iconContent || iconContent === "none" || iconContent === "normal") {
      document.body.classList.add("icons-fallback");
    }
    testIcon.remove();
  });

  document.querySelectorAll(".footer__content").forEach((footer) => {
    if (footer.querySelector(".footer__contacts")) return;
    const contacts = document.createElement("div");
    contacts.className = "footer__contacts";
    contacts.innerHTML = `
      <span><i class="fa-solid fa-phone"></i> +7 (999) 555-12-34</span>
      <span><i class="fa-solid fa-envelope"></i> hello@vetcare.ru</span>
      <span><i class="fa-solid fa-location-dot"></i> Москва, ул. Лапок, 12</span>
    `;
    const copyright = footer.querySelector(".footer__copyright");
    footer.insertBefore(contacts, copyright || null);
  });

  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileMenuClose = document.querySelector(".mobile-menu__close");
  const body = document.body;

  if (mobileMenuToggle && (!mobileMenu || !mobileMenuClose)) {
    mobileMenuToggle.style.display = "none";
  }

  if (mobileMenuToggle && mobileMenu && mobileMenuClose) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenu.classList.add("active");
      body.style.overflow = "hidden";
    });

    mobileMenuClose.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      body.style.overflow = "";
    });

    // Close mobile menu when clicking on a link
    const mobileMenuLinks = document.querySelectorAll(".mobile-menu__link");
    mobileMenuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        body.style.overflow = "";
      });
    });
  }

  // Tabs functionality
  const tabButtons = document.querySelectorAll(".tabs__btn");
  const tabPanes = document.querySelectorAll(".tabs__pane");

  if (tabButtons.length && tabPanes.length) {
    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const tabName = this.getAttribute("data-tab");

        // Remove active class from all buttons and panes
        tabButtons.forEach((btn) => btn.classList.remove("tabs__btn--active"));
        tabPanes.forEach((pane) => pane.classList.remove("tabs__pane--active"));

        // Add active class to current button and pane
        this.classList.add("tabs__btn--active");
        document
          .querySelector(`[data-tab-content="${tabName}"]`)
          .classList.add("tabs__pane--active");
      });
    });
  }

  // Toast notification
  const toast = document.getElementById("toast");
  const toastClose = document.querySelector(".toast__close");

  if (toast && toastClose) {
    toastClose.addEventListener("click", () => {
      toast.classList.remove("active");
    });
  }

  // Show toast on form submission (for demo purposes)
  const demoForms = document.querySelectorAll("form");
  demoForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (toast) {
        toast.classList.add("active");
        setTimeout(() => {
          toast.classList.remove("active");
        }, 5000);
      }
    });
  });
});
