
(function () {
  function safeOpenAuth(role, mode) {
    if (typeof window.openAuthModal === "function") {
      window.openAuthModal(role, mode);
      return;
    }
    console.error("openAuthModal is not loaded yet.");
    alert("Login system is still loading. Please try again in a moment.");
  }

  window.openLandingAuth = safeOpenAuth;

  document.addEventListener("DOMContentLoaded", function () {
    const navbar = document.getElementById("lp-navbar");
    const menuBtn = document.getElementById("lp-menu-btn");
    const navLinks = document.getElementById("lp-nav-links");

    window.addEventListener("scroll", function () {
      if (!navbar) return;
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    });

    menuBtn?.addEventListener("click", function () {
      navLinks?.classList.toggle("open");
    });

    navLinks?.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
      });
    });

    const previewButtons = document.querySelectorAll("[data-preview]");
    const previewScreens = {
      student: document.getElementById("student-preview"),
      teacher: document.getElementById("teacher-preview"),
      parent: document.getElementById("parent-preview")
    };

    previewButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.dataset.preview;
        previewButtons.forEach(function (btn) { btn.classList.remove("active"); });
        button.classList.add("active");
        Object.values(previewScreens).forEach(function (screen) {
          screen?.classList.remove("active");
        });
        previewScreens[key]?.classList.add("active");
      });
    });

    let previewIndex = 0;
    const previewKeys = ["student", "teacher", "parent"];
    setInterval(function () {
      previewIndex = (previewIndex + 1) % previewKeys.length;
      document.querySelector(`[data-preview="${previewKeys[previewIndex]}"]`)?.click();
    }, 5200);

    const roleButtons = document.querySelectorAll("[data-role-tab]");
    const rolePanels = {
      admin: document.getElementById("role-admin"),
      teacher: document.getElementById("role-teacher"),
      parent: document.getElementById("role-parent"),
      student: document.getElementById("role-student")
    };

    roleButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const role = button.dataset.roleTab;
        roleButtons.forEach(function (btn) { btn.classList.remove("active"); });
        button.classList.add("active");
        Object.values(rolePanels).forEach(function (panel) {
          panel?.classList.remove("active");
        });
        rolePanels[role]?.classList.add("active");
      });
    });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".lp-reveal").forEach(function (element) {
      observer.observe(element);
    });

    // Hidden Super Admin access: click Shule AI logo 5 times within 1.5 seconds.
    const superTrigger = document.getElementById("super-admin-trigger");
    const secretToast = document.getElementById("lp-secret-toast");
    let clickCount = 0;
    let timer = null;

    superTrigger?.addEventListener("click", function (event) {
      event.preventDefault();

      clickCount += 1;
      clearTimeout(timer);

      if (clickCount >= 5) {
        clickCount = 0;
        secretToast?.classList.add("show");

        setTimeout(function () {
          secretToast?.classList.remove("show");
          safeOpenAuth("superadmin", "signin");
        }, 550);
        return;
      }

      timer = setTimeout(function () {
        clickCount = 0;
      }, 1500);
    });

    // Make inline buttons safer if auth JS loads after landing JS.
    document.querySelectorAll("[onclick*='openAuthModal']").forEach(function (button) {
      const raw = button.getAttribute("onclick") || "";
      const match = raw.match(/openAuthModal\('([^']+)','([^']+)'\)/);
      if (!match) return;
      const role = match[1];
      const mode = match[2];
      button.removeAttribute("onclick");
      button.addEventListener("click", function () {
        safeOpenAuth(role, mode);
      });
    });

    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons();
    }
  });
})();
