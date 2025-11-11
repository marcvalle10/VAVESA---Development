/* ========= Config ========= */
// Fecha/hora de apertura (Ajusta a tu evento)
const OPENING_DATE = new Date("2025-11-30T18:00:00-07:00"); // Hermosillo (UTC-7 aprox)

/* ========= Música ========= */
const audio = document.getElementById("bgm");
const btnPlay = document.getElementById("btnPlay");

// Protección por si faltan los elementos en el DOM
if (audio && btnPlay) {
    // Ajustes recomendados
    audio.volume = 0.25; // volumen cómodo
    audio.loop = true; // repetir
    audio.preload = "auto"; // precarga

    let playing = false;

    // Actualiza el texto del botón según estado
    const syncPlayButton = () => {
        btnPlay.textContent = playing ? "⏸️ Pausar música" : "▶️ Reproducir música";
    };
    syncPlayButton();

    // Toggle Play/Pause desde el botón
    btnPlay.addEventListener("click", async() => {
        try {
            if (!playing) {
                await audio.play(); // algunos navegadores requieren interacción previa
                playing = true;
            } else {
                audio.pause();
                playing = false;
            }
            syncPlayButton();
        } catch (e) {
            console.warn("El navegador bloqueó la reproducción hasta interacción del usuario.", e);
        }
    });

    // “Kickstart”: al primer gesto del usuario en cualquier parte, intenta reproducir
    const kickstart = async() => {
        if (!playing) {
            try {
                await audio.play();
                playing = true;
                syncPlayButton();
            } catch (_) { /* ignorar si falla */ }
        }
        window.removeEventListener("click", kickstart);
        window.removeEventListener("keydown", kickstart);
    };
    window.addEventListener("click", kickstart, { once: true });
    window.addEventListener("keydown", kickstart, { once: true });

    // Pausar cuando la pestaña no está visible (buena práctica)
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && !audio.paused) {
            audio.pause();
        } else if (!document.hidden && playing) {
            audio.play().catch(() => {});
        }
    });

    // Si el audio ya está listo, habilita el botón correctamente
    audio.addEventListener("canplay", syncPlayButton);
}

/* ========= Botón Ubicación (pequeña animación) ========= */
const btnUbicacion = document.getElementById("btnUbicacion");
if (btnUbicacion) {
    btnUbicacion.addEventListener("click", () => {
        btnUbicacion.classList.add("active");
        setTimeout(() => btnUbicacion.classList.remove("active"), 350);
    });
}

/* ========= Countdown ========= */
const $d = (id) => document.getElementById(id);

function updateCountdown() {
    const now = new Date().getTime();
    const t = OPENING_DATE.getTime() - now;

    if (t <= 0) {
        ["days", "hours", "minutes", "seconds"].forEach(id => $d(id).textContent = "00");
        return;
    }
    const days = Math.floor(t / (1000 * 60 * 60 * 24));
    const hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((t % (1000 * 60)) / 1000);

    $d("days").textContent = String(days).padStart(2, "0");
    $d("hours").textContent = String(hours).padStart(2, "0");
    $d("minutes").textContent = String(minutes).padStart(2, "0");
    $d("seconds").textContent = String(seconds).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ========= Validación de formulario + Toast + Confeti ========= */
const form = document.getElementById("rsvpForm");
const toastEl = document.getElementById("toastOk");
const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 3500 }) : null;

if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            e.stopPropagation();
        } else {
            // Toma los campos sin usar ?. para evitar el error del parser
            const nombreEl = form.querySelector('[name="nombre"]');
            const personasEl = form.querySelector('[name="personas"]');

            const nombre = (nombreEl && nombreEl.value ? nombreEl.value.trim() : "") || "¡Gracias!";
            const personas = (personasEl && personasEl.value) || "1";

            const toastBody = document.querySelector("#toastOk .toast-body");
            if (toastBody) {
                toastBody.textContent =
                    `✅ ${nombre}, registro para ${personas} persona(s) recibido. ¡Te esperamos en la apertura de VAVESA!`;
            }
            if (toast) toast.show();
            shootConfetti(); // 🎉
            form.reset();
        }
        form.classList.add("was-validated");
    });
}



/* ========= Confeti sencillo en Canvas (sin librerías) ========= */
const canvas = document.getElementById("confetti");
const ctx = canvas ? canvas.getContext("2d") : null;
let confettiPieces = [];
let confettiTimer;

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function makeConfettiPiece() {
    const colors = ["#0E3A5B", "#7D8F2E", "#F39C12", "#ffffff"];
    return {
        x: Math.random() * canvas.width,
        y: -10,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        vy: 2 + Math.random() * 3,
        vx: -1 + Math.random() * 2,
        r: Math.random() * 360,
        vr: -6 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)]
    };
}

function drawConfetti() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiPieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        if (p.y > canvas.height + 20) p.y = -10;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
    });
}


function shootConfetti() {
    if (!canvas) return;
    confettiPieces = Array.from({ length: 180 }, makeConfettiPiece);
    clearInterval(confettiTimer);
    confettiTimer = setInterval(drawConfetti, 1000 / 60);
    // detener después de unos segundos
    setTimeout(() => {
        clearInterval(confettiTimer);
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 3500);
}

/* ---------- Scroll suave para anchors ---------- */
document.querySelectorAll('a.nav-link[href^="#"], a[href^="#rsvp"]').forEach(a => {
    a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

/* ---------- Activo de menú por sección visible ---------- */
const sections = [...document.querySelectorAll("section[id]")];
const links = new Map(
    [...document.querySelectorAll(".navbar .nav-link")]
    .map(l => [l.getAttribute("href"), l])
);

const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
        if (en.isIntersecting) {
            const id = "#" + en.target.id;
            links.forEach(l => l.classList.remove("active"));
            if (links.get(id)) links.get(id).classList.add("active");
        }
    });
}, { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 });

sections.forEach(s => io.observe(s));

// Sombra/cambio al hacer scroll
const nav = document.querySelector(".navbar");

function syncNavShadow() {
    if (!nav) return;
    if (window.scrollY > 6) nav.classList.add("nav-scrolled");
    else nav.classList.remove("nav-scrolled");
}
window.addEventListener("scroll", syncNavShadow, { passive: true });
syncNavShadow();