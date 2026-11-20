/* =========================================================
   FIREBASE: pega aquí la configuración de tu proyecto
   ========================================================= */
const firebaseConfig = {
  apiKey: "PEGA_AQUI",
  authDomain: "PEGA_AQUI",
  projectId: "PEGA_AQUI",
  storageBucket: "PEGA_AQUI",
  messagingSenderId: "PEGA_AQUI",
  appId: "PEGA_AQUI"
};

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (err) {
  console.error("Firebase no se pudo iniciar:", err);
}

/* =========================================================
   CONTADOR REGRESIVO
   Cambia la fecha aquí si hace falta.
   ========================================================= */
var countDownDate = new Date("Nov 28, 2026 00:00:01").getTime();
var temporizador = setInterval(function () {
  var caja = document.getElementById("contador");
  if (!caja) { clearInterval(temporizador); return; }

  var distance = countDownDate - new Date().getTime();
  if (distance < 0) {
    clearInterval(temporizador);
    caja.innerHTML = '<p class="contador-fin">¡Hoy es el cumpleaños de Yanis! 🎉</p>';
    return;
  }

  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
  set("dias", Math.floor(distance / 86400000));
  set("horas", pad(Math.floor((distance % 86400000) / 3600000)));
  set("minutos", pad(Math.floor((distance % 3600000) / 60000)));
  set("segundos", pad(Math.floor((distance % 60000) / 1000)));
}, 1000);

/* =========================================================
   LISTA DE REGALOS DE YANIS

   CÓMO PONER LA PORTADA DE UN LIBRO (ejemplo)
   -----------------------------------------------------
   1. Guarda la imagen en la carpeta "img" (jpg, png o webp).
   2. Escribe su ruta en el campo "foto":
        foto: "img/mi-libro.jpg"
      También sirve un enlace de internet:
        foto: "https://sitio.com/portada.jpg"
   3. Solo los libros muestran foto. En Ropa y Accesorios
      el campo "foto" se ignora.
   Tip: usa imágenes verticales (600 x 800 px) y de menos
   de 200 KB. Nombres en minúsculas, sin espacios ni tildes.
   ========================================================= */
const REGALOS = [
  /* ---- Libros ---- */
  { id: 1, nombre: "La sociedad de los poetas muertos", categoria: "Libros", prioridad: "top",
    foto: "poetas.jpg", notas: "" },
  { id: 2, nombre: "El segundo sexo", categoria: "Libros", prioridad: "medio",
    foto: "segundo.webp", notas: "" },
  { id: 3, nombre: "Persépolis", categoria: "Libros", prioridad: "medio",
    foto: "persepolis.webp", notas: "" },
  { id: 4, nombre: "La sociedad del cansancio", categoria: "Libros", prioridad: "medio",
    foto: "9788425451447.png", notas: "" },

  /* ---- Ropa ---- */
  { id: 5, nombre: "Shorts para el gym", categoria: "Ropa", prioridad: "medio", notas: "Para entrenar." },
  { id: 6, nombre: "Camisetas para el gym", categoria: "Ropa", prioridad: "medio", notas: "Para entrenar." },
  { id: 7, nombre: "Tops deportivos", categoria: "Ropa", prioridad: "medio", notas: "Para entrenar." },
  { id: 8, nombre: "Camiseta del Bucaramanga", categoria: "Ropa", prioridad: "medio", notas: "Color negro o verde." },
  { id: 9, nombre: "Pañoletas de sedita", categoria: "Ropa", prioridad: "medio", notas: "De sedita." },
  { id: 10, nombre: "Camibuzo para caminatas", categoria: "Ropa", prioridad: "medio", notas: "Para salir a caminar." },

  /* ---- Accesorios ---- */
  { id: 11, nombre: "Anillos", categoria: "Accesorios", prioridad: "medio", notas: "" },
  { id: 12, nombre: "Cadenitas delgadísimas", categoria: "Accesorios", prioridad: "medio", notas: "Doradas y plateadas." },
  { id: 13, nombre: "Reloj plateado delgado", categoria: "Accesorios", prioridad: "medio", notas: "Plateado, delgado y sencillo." },
  { id: 14, nombre: "Shokers", categoria: "Accesorios", prioridad: "medio", notas: "" }
];

const CATEGORIAS = ["Libros", "Ropa", "Accesorios", "Experiencias"];

const EXPERIENCIAS = {
  viaje:     { titulo: "Viaje",            label: "¿Qué viaje?",           ph: "Ej: Fin de semana en Barichara" },
  evento:    { titulo: "Evento cultural",  label: "¿Qué evento?",          ph: "Ej: Concierto, teatro, museo…" },
  actividad: { titulo: "Actividad física", label: "¿Qué actividad?",       ph: "Ej: Clase de yoga, rafting…" },
  cocina:    { titulo: "Clase de cocina",  label: "¿Qué clase de cocina?", ph: "Ej: Pastas, repostería…" },
  otra:      { titulo: "Otra experiencia", label: "¿Cuál experiencia?",    ph: "Describe la experiencia" }
};

const PRIORIDADES = {
  top:   { titulo: "Lo que más quiero", sub: "Si dudas, empieza por aquí.",  sello: "Lo que más quiero" },
  medio: { titulo: "Me gustaría",       sub: "Me harían muy feliz también.", sello: "Me gustaría" }
};

const $ = (s) => document.querySelector(s);

/* ---------- Estado (se llena desde la base de datos) ---------- */
let reservas = {};        // { "1": "Camila", ... }
let experiencias = [];    // [{ id, tipo, detalle, nombre }, ...]
let filtroCategoria = "Todas";
let filtroEstado = "todos";
let regaloPendiente = null;

function escapar(t) {
  return String(t).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

/* ---------- Sección de experiencias (se crea sola si falta en el HTML) ---------- */
function asegurarSeccionExperiencias() {
  if ($("#seccionExperiencias")) return;
  const main = document.querySelector("main") || document.body;
  const sec = document.createElement("section");
  sec.className = "grupo grupo--exp";
  sec.id = "seccionExperiencias";
  sec.innerHTML = `
    <div class="grupo-cabecera">
      <h2>Experiencias</h2>
      <p>Para quienes prefieren regalar un momento.</p>
    </div>
    <form class="exp-form" id="formExperiencia" autocomplete="off">
      <div class="exp-campo">
        <label for="expTipo">Tipo de experiencia</label>
        <select id="expTipo" required>
          <option value="">Selecciona una opción…</option>
          <option value="viaje">Viaje</option>
          <option value="evento">Evento cultural</option>
          <option value="actividad">Actividad física</option>
          <option value="cocina">Clase de cocina</option>
          <option value="otra">Otra</option>
        </select>
      </div>
      <div class="exp-campo">
        <label for="expDetalle" id="expDetalleLabel">¿Cuál experiencia?</label>
        <input id="expDetalle" type="text" maxlength="100" placeholder="Primero elige el tipo" required>
      </div>
      <div class="exp-campo">
        <label for="expNombre">Tu nombre</label>
        <input id="expNombre" type="text" maxlength="40" placeholder="Ej: Camila" required>
      </div>
      <button type="submit" class="btn btn-agregar-experiencia">Reservar experiencia</button>
    </form>
    <div class="rejilla" id="listaExperiencias"></div>
    <p class="vacio vacio-exp" id="vacioExp">Aún nadie ha reservado una experiencia.</p>`;
  main.appendChild(sec);
}

/* ---------- Render ---------- */
function crearChipsCategoria() {
  const cont = $("#chipsCategoria");
  if (!cont) return;
  const cats = ["Todas", ...CATEGORIAS];
  cont.innerHTML = cats.map(c =>
    `<button type="button" class="chip ${c === filtroCategoria ? "activo" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
}

function tarjeta(r) {
  const reservado = Boolean(reservas[r.id]);
  const esLibro = r.categoria === "Libros";
  const selloClase = r.prioridad === "top" ? "top" : "";
  const sello = `<span class="sello ${selloClase}">${PRIORIDADES[r.prioridad].sello}</span>`;
  const selloInline = `<span class="sello sello--inline ${selloClase}">${PRIORIDADES[r.prioridad].sello}</span>`;

  // Solo los libros tienen foto
  const fotoLibro = esLibro ? `
      <div class="foto foto--libro">
        ${r.foto ? `<img src="${escapar(r.foto)}" alt="Portada de ${escapar(r.nombre)}" loading="lazy" onerror="this.remove()">` : ""}
        ${sello}
      </div>` : "";

  return `
    <article class="regalo ${reservado ? "reservado" : ""}">
      ${fotoLibro}
      <div class="cuerpo">
        ${esLibro ? "" : selloInline}
        <span class="cat">${r.categoria}</span>
        <h3>${escapar(r.nombre)}</h3>
        <p class="notas">${r.notas ? escapar(r.notas) : ""}</p>
        <span class="estado">${reservado ? "Reservado por " + escapar(reservas[r.id]) : "Disponible"}</span>
        ${reservado
          ? `<button type="button" class="btn btn-sec" data-accion="liberar" data-id="${r.id}">Liberar reserva</button>`
          : `<button type="button" class="btn" data-accion="reservar" data-id="${r.id}">Reservar este regalo</button>`
        }
      </div>
    </article>`;
}

function tarjetaExperiencia(e) {
  const info = EXPERIENCIAS[e.tipo] || EXPERIENCIAS.otra;
  return `
    <article class="regalo reservado exp-tarjeta">
      <div class="cuerpo">
        <span class="sello sello--inline exp">Experiencia</span>
        <span class="cat">${info.titulo}</span>
        <h3>${escapar(e.detalle)}</h3>
        <p class="notas"></p>
        <span class="estado">Reservada por ${escapar(e.nombre)}</span>
        <button type="button" class="btn btn-sec" data-accion="liberar-exp" data-id="${escapar(e.id)}">Liberar reserva</button>
      </div>
    </article>`;
}

function grupo(clase, titulo, sub, items) {
  if (!items.length) return "";
  return `
    <section class="grupo ${clase}">
      <div class="grupo-cabecera"><h2>${titulo}</h2><p>${sub}</p></div>
      <div class="rejilla">${items.map(tarjeta).join("")}</div>
    </section>`;
}

function renderExperiencias(objetosVisibles) {
  const seccion = $("#seccionExperiencias");
  if (!seccion) return;
  const mostrar = filtroCategoria === "Todas" || filtroCategoria === "Experiencias";
  seccion.hidden = !mostrar;

  // Las experiencias nacen reservadas: no aparecen en "Disponibles"
  const lista = filtroEstado === "disponible" ? [] : experiencias;
  const cont = $("#listaExperiencias");
  if (cont) cont.innerHTML = lista.map(tarjetaExperiencia).join("");
  const vacioExp = $("#vacioExp");
  if (vacioExp) vacioExp.hidden = lista.length > 0 || filtroEstado === "disponible";

  const vacio = $("#vacio");
  if (vacio) vacio.hidden = objetosVisibles > 0 || mostrar;
}

function actualizarProgreso() {
  const total = REGALOS.length;
  const hechos = REGALOS.filter(r => reservas[r.id]).length;
  const pct = total ? Math.round((hechos / total) * 100) : 0;
  const t = $("#progresoTexto"), p = $("#progresoPct"), b = $("#barraRelleno"), bar = $("#barra");
  if (t) t.textContent = `${hechos} de ${total} regalos reservados`;
  if (p) p.textContent = pct + "%";
  if (b) b.style.width = pct + "%";
  if (bar) bar.setAttribute("aria-valuenow", pct);
}

function render() {
  const visibles = REGALOS.filter(r => {
    const okCat = filtroCategoria === "Todas" || r.categoria === filtroCategoria;
    const estado = reservas[r.id] ? "reservado" : "disponible";
    const okEstado = filtroEstado === "todos" || filtroEstado === estado;
    return okCat && okEstado;
  });

  const lista = $("#lista");
  if (lista) {
    lista.innerHTML =
      grupo("grupo--top", PRIORIDADES.top.titulo, PRIORIDADES.top.sub, visibles.filter(r => r.prioridad === "top")) +
      grupo("", PRIORIDADES.medio.titulo, PRIORIDADES.medio.sub, visibles.filter(r => r.prioridad === "medio"));
  }

  renderExperiencias(visibles.length);
  crearChipsCategoria();
  actualizarProgreso();
}

function aviso(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("visible");
  clearTimeout(aviso.id);
  aviso.id = setTimeout(() => t.classList.remove("visible"), 2600);
}

/* =========================================================
   BASE DE DATOS (Firestore)
   ========================================================= */
function escucharBaseDeDatos() {
  if (!db) {
    aviso("No se pudo conectar con la base de datos");
    return;
  }

  // Reservas de regalos (tiempo real)
  db.collection("reservas").onSnapshot(snap => {
    reservas = {};
    snap.forEach(doc => { reservas[doc.id] = doc.data().nombre; });
    render();
  }, err => {
    console.error(err);
    aviso("Error al leer las reservas");
  });

  // Experiencias (tiempo real)
  db.collection("experiencias").orderBy("creado").onSnapshot(snap => {
    experiencias = [];
    snap.forEach(doc => experiencias.push({ id: doc.id, ...doc.data() }));
    render();
  }, err => {
    console.error(err);
    aviso("Error al leer las experiencias");
  });
}

async function reservarRegalo(regalo, nombre) {
  if (!db) { aviso("Sin conexión con la base de datos"); return; }
  const ref = db.collection("reservas").doc(String(regalo.id));
  try {
    // Transacción: si otra persona lo reservó justo antes, no se sobrescribe
    await db.runTransaction(async t => {
      const snap = await t.get(ref);
      if (snap.exists) throw new Error("ocupado");
      t.set(ref, { nombre });
    });
    aviso("¡Listo! Regalo reservado 💜");
  } catch (err) {
    if (err.message === "ocupado") aviso("Ese regalo ya lo reservó otra persona");
    else { console.error(err); aviso("No se pudo reservar, intenta de nuevo"); }
  }
}

async function liberarRegalo(id) {
  if (!db) return;
  try {
    await db.collection("reservas").doc(String(id)).delete();
    aviso("Reserva liberada");
  } catch (err) {
    console.error(err);
    aviso("No se pudo liberar, intenta de nuevo");
  }
}

async function guardarExperiencia(tipo, detalle, nombre) {
  if (!db) { aviso("Sin conexión con la base de datos"); return false; }
  try {
    await db.collection("experiencias").add({
      tipo, detalle, nombre,
      creado: firebase.firestore.FieldValue.serverTimestamp()
    });
    aviso("¡Experiencia reservada! 💜");
    return true;
  } catch (err) {
    console.error(err);
    aviso("No se pudo guardar, intenta de nuevo");
    return false;
  }
}

async function liberarExperiencia(id) {
  if (!db) return;
  try {
    await db.collection("experiencias").doc(id).delete();
    aviso("Reserva liberada");
  } catch (err) {
    console.error(err);
    aviso("No se pudo liberar, intenta de nuevo");
  }
}

/* ---------- Eventos (delegados en document) ---------- */
document.addEventListener("click", e => {
  /* Categorías */
  const cat = e.target.closest("[data-cat]");
  if (cat) {
    filtroCategoria = cat.dataset.cat;
    render();
    return;
  }

  /* Estado */
  const est = e.target.closest("[data-estado]");
  if (est) {
    filtroEstado = est.dataset.estado;
    document.querySelectorAll("#chipsEstado .chip").forEach(c =>
      c.classList.toggle("activo", c === est));
    render();
    return;
  }

  /* Cancelar diálogo */
  if (e.target.id === "cancelar") {
    $("#dialogo").close();
    return;
  }

  /* Reservar / liberar */
  const b = e.target.closest("[data-accion]");
  if (!b) return;

  if (b.dataset.accion === "reservar") {
    const regalo = REGALOS.find(r => r.id === Number(b.dataset.id));
    if (!regalo) return;
    regaloPendiente = regalo;
    $("#dialogoRegalo").textContent = regalo.nombre;
    $("#inputNombre").value = "";
    $("#dialogo").showModal();
    $("#inputNombre").focus();
  } else if (b.dataset.accion === "liberar") {
    if (confirm("¿Liberar la reserva de este regalo?")) liberarRegalo(b.dataset.id);
  } else if (b.dataset.accion === "liberar-exp") {
    if (confirm("¿Liberar la reserva de esta experiencia?")) liberarExperiencia(b.dataset.id);
  }
});

document.addEventListener("submit", async e => {
  /* Confirmar reserva de un regalo */
  if (e.target.id === "formReserva") {
    const nombre = $("#inputNombre").value.trim();
    const regalo = regaloPendiente;
    regaloPendiente = null;
    if (!nombre || !regalo) return;
    reservarRegalo(regalo, nombre);
  }

  /* Reservar una experiencia */
  if (e.target.id === "formExperiencia") {
    e.preventDefault();
    const form = e.target;
    const tipo = $("#expTipo").value;
    const detalle = $("#expDetalle").value.trim();
    const nombre = $("#expNombre").value.trim();
    if (!tipo || !detalle || !nombre) {
      aviso("Completa el tipo, la experiencia y tu nombre");
      return;
    }
    const ok = await guardarExperiencia(tipo, detalle, nombre);
    if (ok) {
      form.reset();
      $("#expDetalleLabel").textContent = "¿Cuál experiencia?";
      $("#expDetalle").placeholder = "Primero elige el tipo";
    }
  }
});

/* El campo cambia según el tipo elegido: "Viaje" → "¿Qué viaje?" */
document.addEventListener("change", e => {
  if (e.target.id !== "expTipo") return;
  const info = EXPERIENCIAS[e.target.value];
  $("#expDetalleLabel").textContent = info ? info.label : "¿Cuál experiencia?";
  $("#expDetalle").placeholder = info ? info.ph : "Primero elige el tipo";
  if (info) $("#expDetalle").focus();
});

/* ---------- Inicio ---------- */
function iniciar() {
  asegurarSeccionExperiencias();
  render();
  escucharBaseDeDatos();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}