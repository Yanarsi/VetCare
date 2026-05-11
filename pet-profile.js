document.addEventListener("DOMContentLoaded", () => {
  const petProfileForm = document.getElementById("petProfileForm");

  if (!petProfileForm) return;

  const steps = petProfileForm.querySelectorAll(".pet-profile-form__step");
  const nextStep1 = document.getElementById("nextStep1");
  const nextStep2 = document.getElementById("nextStep2");
  const prevStep2 = document.getElementById("prevStep2");
  const prevStep3 = document.getElementById("prevStep3");

  // Initialize the form with the first step active
  steps[0].classList.add("active");

  // Next button for step 1
  if (nextStep1) {
    nextStep1.addEventListener("click", () => {
      // Validate step 1
      const petName = document.getElementById("petName").value;
      const petType = document.getElementById("petType").value;

      if (!petName) {
        showError("petName", "Пожалуйста, введите имя питомца");
        return;
      }

      if (!petType) {
        showError("petType", "Пожалуйста, выберите тип питомца");
        return;
      }

      // Move to step 2
      steps[0].classList.remove("active");
      steps[1].classList.add("active");
    });
  }

  // Previous button for step 2
  if (prevStep2) {
    prevStep2.addEventListener("click", () => {
      steps[1].classList.remove("active");
      steps[0].classList.add("active");
    });
  }

  // Next button for step 2
  if (nextStep2) {
    nextStep2.addEventListener("click", () => {
      // Validate step 2
      const age = document.getElementById("age").value;
      const weight = document.getElementById("weight").value;
      const gender = document.querySelector('input[name="gender"]:checked');

      if (!age) {
        showError("age", "Пожалуйста, выберите возраст питомца");
        return;
      }

      if (!weight) {
        showError("weight", "Пожалуйста, введите вес питомца");
        return;
      }

      if (!gender) {
        showError("gender", "Пожалуйста, выберите пол питомца");
        return;
      }

      // Move to step 3
      steps[1].classList.remove("active");
      steps[2].classList.add("active");
    });
  }

  // Previous button for step 3
  if (prevStep3) {
    prevStep3.addEventListener("click", () => {
      steps[2].classList.remove("active");
      steps[1].classList.add("active");
    });
  }

  // Form submission
  if (petProfileForm) {
    petProfileForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Collect all form data
      const formData = {
        petName: document.getElementById("petName").value,
        petType: document.getElementById("petType").value,
        breed: document.getElementById("breed").value,
        age: document.getElementById("age").value,
        weight: document.getElementById("weight").value,
        gender: document.querySelector('input[name="gender"]:checked')?.value,
        neutered: document.getElementById("neutered").checked,
        specialNeeds: Array.from(
          document.querySelectorAll('input[name="specialNeeds"]:checked')
        ).map((el) => el.value),
      };

      console.log("Pet Profile Data:", formData);

      // Show success message
      const toast = document.getElementById("toast");
      if (toast) {
        toast.classList.add("active");
        setTimeout(() => {
          toast.classList.remove("active");

          // Reset form and go back to step 1
          petProfileForm.reset();
          steps.forEach((step) => step.classList.remove("active"));
          steps[0].classList.add("active");
        }, 3000);
      }
    });
  }

  // Helper function to show validation errors
  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Add error class to the field
    field.classList.add("error");

    // Create error message element if it doesn't exist
    let errorElement = field.parentElement.querySelector(".error-message");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "error-message";
      field.parentElement.appendChild(errorElement);
    }

    errorElement.textContent = message;

    // Remove error after 3 seconds
    setTimeout(() => {
      field.classList.remove("error");
      errorElement.textContent = "";
    }, 3000);
  }
});
