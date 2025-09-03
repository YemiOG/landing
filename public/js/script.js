// Theme Toggle Functionality
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Stats Counter Animation
function initStatsCounter() {
  const statNumbers = document.querySelectorAll(".stat-number");

  const animateNumber = (element, target, suffix = "") => {
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current) + suffix;
    }, 16);
  };

  // Intersection Observer for stats animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.target);
        const suffix = entry.target.dataset.target.includes(".")
          ? "%"
          : entry.target.dataset.target === "24"
          ? "/7"
          : "+";
        animateNumber(entry.target, target, suffix);
        observer.unobserve(entry.target);
      }
    });
  });

  statNumbers.forEach((stat) => observer.observe(stat));
}

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem("theme") || "light";
body.setAttribute("data-theme", currentTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    body.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}

// Initialize stats counter animation
initStatsCounter();

// Email Form Functionality
const emailForm = document.getElementById("emailForm");
const newsletterForm = document.getElementById("newsletterForm");
const successModal = document.getElementById("successModal");
const modalClose = document.getElementById("modalClose");
const sibForm = document.getElementById("sib-form");
const sibTarget = document.getElementById("sibTarget");

function showSuccessModal() {
  if (successModal) successModal.style.display = "block";
}

function hideSuccessModal() {
  if (successModal) successModal.style.display = "none";
}

function handleFormSubmit(event) {
  event.preventDefault();

  // Get email value
  const emailInput = event.target.querySelector('input[type="email"]');
  const email = emailInput.value;

  if (!email || !email.includes("@")) {
    alert("Please enter a valid email address.");
    return;
  }

  // Placeholder for API / Google Sheets integration
  console.log("Email submitted:", email);

  // Show success modal
  showSuccessModal();

  // Reset form
  emailInput.value = "";
}

if (emailForm) emailForm.addEventListener("submit", handleFormSubmit);
if (newsletterForm) newsletterForm.addEventListener("submit", handleFormSubmit);

// Brevo form: submit to hidden iframe and show success on response
if (sibForm && sibTarget) {
  sibForm.addEventListener("submit", () => {
    // allow native submit; target is iframe to avoid navigation
    // optionally disable button to prevent double submission
    const submitBtn = sibForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
  });

  sibTarget.addEventListener("load", () => {
    // Brevo returns a success page into the iframe; treat load as success
    showSuccessModal();
    // reset form and re-enable button
    sibForm.reset();
    const submitBtn = sibForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;
  });
}

// Modal close functionality
if (modalClose) modalClose.addEventListener("click", hideSuccessModal);
if (successModal) {
  successModal.addEventListener("click", (e) => {
    if (e.target === successModal) {
      hideSuccessModal();
    }
  });
}

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add animation classes when elements come into view
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      entry.target.style.transition = "all 0.6s ease-out";
    }
  });
}, observerOptions);

// Observe all feature and procurement cards for animation
document
  .querySelectorAll(".feature-card, .procurement-item")
  .forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    observer.observe(card);
  });
