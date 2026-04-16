// ==============================
// ELEMENTS
// ==============================
const menuToggle = document.getElementById("menuToggle");
const topnav = document.getElementById("topnav");
const currentSection = document.getElementById("currentSection");
const reveals = document.querySelectorAll(".reveal");
const panels = document.querySelectorAll(".panel");

// Notes
const notesTextarea = document.getElementById("presentationNotes");
const saveNotesBtn = document.getElementById("saveNotesBtn");
const clearNotesBtn = document.getElementById("clearNotesBtn");
const notesStatus = document.getElementById("notesStatus");

// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const closeBtn = document.querySelector(".lightbox-close");

// Settings
const NOTES_STORAGE_KEY = "coral_presentation_notes";
const TOTAL_PAGES = 26;

// ==============================
// MOBILE MENU
// ==============================
function initMenu() {
  if (!menuToggle || !topnav) return;

  menuToggle.addEventListener("click", () => {
    topnav.classList.toggle("is-open");
  });

  const navLinks = topnav.querySelectorAll("a");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      topnav.classList.remove("is-open");
    });
  });
}

// ==============================
// REVEAL ON SCROLL
// ==============================
function initRevealObserver() {
  if (!reveals.length) return;

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    {
      threshold: 0.12,
    }
  );

  reveals.forEach((item) => revealObserver.observe(item));
}

// ==============================
// SECTION COUNTER
// ==============================
function initSectionObserver() {
  if (!panels.length || !currentSection) return;

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = entry.target.getAttribute("data-index");
          if (index) {
            currentSection.textContent = String(index).padStart(2, "0");
          }
        }
      });
    },
    {
      threshold: 0.45,
    }
  );

  panels.forEach((panel) => sectionObserver.observe(panel));
}

// ==============================
// KEYBOARD NAVIGATION
// ==============================
function initKeyboardNavigation() {
  document.addEventListener("keydown", (event) => {
    const activeIndex = Number(currentSection?.textContent || 1);

    // إذا اللايت بوكس مفتوح، نخلي الأسهم للصورة مو للصفحات
    if (lightbox && lightbox.classList.contains("active")) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevImage();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      }

      return;
    }

    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      const next = document.querySelector(
        `#page-${Math.min(activeIndex + 1, TOTAL_PAGES)}`
      );
      next?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      const prev = document.querySelector(
        `#page-${Math.max(activeIndex - 1, 1)}`
      );
      prev?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (event.key === "Home") {
      event.preventDefault();
      document
        .querySelector("#page-1")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (event.key === "End") {
      event.preventDefault();
      document
        .querySelector(`#page-${TOTAL_PAGES}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

// ==============================
// NOTES
// ==============================
function updateNotesStatus(message) {
  if (notesStatus) {
    notesStatus.textContent = message;
  }
}

function saveNotes() {
  if (!notesTextarea) return;

  try {
    localStorage.setItem(NOTES_STORAGE_KEY, notesTextarea.value);
    const now = new Date();
    updateNotesStatus(`تم الحفظ: ${now.toLocaleString("ar-IQ")}`);
  } catch (error) {
    updateNotesStatus("تعذر حفظ الملاحظات");
    console.error("Save notes error:", error);
  }
}

function loadNotes() {
  if (!notesTextarea) return;

  try {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    if (saved !== null) {
      notesTextarea.value = saved;
      updateNotesStatus("تم تحميل الملاحظات المحفوظة");
    } else {
      updateNotesStatus("لا توجد ملاحظات محفوظة بعد");
    }
  } catch (error) {
    updateNotesStatus("تعذر تحميل الملاحظات");
    console.error("Load notes error:", error);
  }
}

function clearNotes() {
  if (!notesTextarea) return;

  notesTextarea.value = "";

  try {
    localStorage.removeItem(NOTES_STORAGE_KEY);
    updateNotesStatus("تم مسح جميع الملاحظات");
  } catch (error) {
    updateNotesStatus("تعذر مسح الملاحظات");
    console.error("Clear notes error:", error);
  }
}

function initNotes() {
  if (!notesTextarea) return;

  loadNotes();

  let saveTimer;

  notesTextarea.addEventListener("input", () => {
    updateNotesStatus("جاري حفظ التعديلات...");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNotes, 500);
  });

  if (saveNotesBtn) {
    saveNotesBtn.addEventListener("click", saveNotes);
  }

  if (clearNotesBtn) {
    clearNotesBtn.addEventListener("click", clearNotes);
  }
}

// ==============================
// LIGHTBOX / IMAGE VIEWER
// ==============================
let galleryImages = [];
let currentImageIndex = 0;

function collectGalleryImages() {
  // يجمع كل الصور داخل جميع الـ grids
  galleryImages = Array.from(
    document.querySelectorAll(".image-grid img")
  ).filter((img) => img.getAttribute("src"));
}

function openLightbox(index) {
  if (!lightbox || !lightboxImg || !galleryImages.length) return;

  currentImageIndex = index;
  updateLightboxImage();
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox) return;

  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

function updateLightboxImage() {
  if (!lightboxImg || !galleryImages.length) return;

  const activeImage = galleryImages[currentImageIndex];
  lightboxImg.src = activeImage.src;
  lightboxImg.alt = activeImage.alt || "Image preview";
}

function showNextImage() {
  if (!galleryImages.length) return;
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  updateLightboxImage();
}

function showPrevImage() {
  if (!galleryImages.length) return;
  currentImageIndex =
    (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  updateLightboxImage();
}

function initLightbox() {
  collectGalleryImages();

  if (!galleryImages.length || !lightbox || !lightboxImg) return;

  galleryImages.forEach((img, index) => {
    img.style.cursor = "pointer";

    img.addEventListener("click", () => {
      openLightbox(index);
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", showNextImage);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", showPrevImage);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initRevealObserver();
  initSectionObserver();
  initKeyboardNavigation();
  initNotes();
  initLightbox();
});