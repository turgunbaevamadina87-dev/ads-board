const API_BASE = "https://inai-col1.fishrungames.com";
const ADS_URL = `${API_BASE}/ads`;

const adsList = document.getElementById("adsList");
const listMessage = document.getElementById("listMessage");
const totalBadge = document.getElementById("totalBadge");
const refreshBtn = document.getElementById("refreshBtn");

const form = document.getElementById("adForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");
const imageInput = document.getElementById("image");
const preview = document.getElementById("preview");

/* ---------- Вспомогательные функции ---------- */

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = "message" + (type ? ` message--${type}` : "");
}

function formatPrice(price) {
  return Number(price).toLocaleString("ru-RU") + " сом";
}

function getImageUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : API_BASE + path;
}

/* ---------- Отрисовка объявлений ---------- */

function createAdCard(ad) {
  const card = document.createElement("article");
  card.className = "ad";

  const imageUrl = getImageUrl(ad.image_url);
  let media;
  if (imageUrl) {
    media = document.createElement("img");
    media.className = "ad__image";
    media.src = imageUrl;
    media.alt = ad.title;
    media.loading = "lazy";
  } else {
    media = document.createElement("div");
    media.className = "ad__placeholder";
    media.textContent = "🖼️";
  }

  const body = document.createElement("div");
  body.className = "ad__body";

  const title = document.createElement("h3");
  title.className = "ad__title";
  title.textContent = ad.title;          // textContent защищает от XSS

  const desc = document.createElement("p");
  desc.className = "ad__desc";
  desc.textContent = ad.description;

  const price = document.createElement("div");
  price.className = "ad__price";
  price.textContent = formatPrice(ad.price);

  body.append(title, desc, price);
  card.append(media, body);
  return card;
}

function renderAds(items) {
  adsList.innerHTML = "";
  items.forEach((ad) => adsList.appendChild(createAdCard(ad)));
}

/* ---------- GET: загрузка списка ---------- */

async function loadAds() {
  showMessage(listMessage, "Загрузка...", "");
  try {
    const response = await fetch(ADS_URL);
    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

    const data = await response.json();
    const items = data.items || [];

    // новые объявления сверху
    renderAds([...items].reverse());
    totalBadge.textContent = data.total ?? items.length;
    showMessage(listMessage, items.length ? "" : "Пока нет объявлений", "");
  } catch (err) {
    showMessage(listMessage, "Не удалось загрузить объявления: " + err.message, "error");
  }
}

/* ---------- POST: отправка объявления ---------- */

async function sendAd(event) {
  event.preventDefault();

  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const price = form.price.value;
  const image = imageInput.files[0];

  if (!title || !description || price === "" || !image) {
    showMessage(formMessage, "Заполните все поля и выберите изображение", "error");
    return;
  }
  if (Number(price) < 0) {
    showMessage(formMessage, "Цена не может быть отрицательной", "error");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("image", image);

  submitBtn.disabled = true;
  showMessage(formMessage, "Отправка...", "");

  try {
    // Content-Type НЕ указываем — браузер сам добавит multipart/form-data с boundary
    const response = await fetch(ADS_URL, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

    await response.json();
    showMessage(formMessage, "Объявление опубликовано ✅", "success");
    form.reset();
    preview.hidden = true;
    loadAds();
  } catch (err) {
    showMessage(formMessage, "Не удалось отправить: " + err.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
}

/* ---------- Превью картинки ---------- */

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  } else {
    preview.hidden = true;
  }
});

/* ---------- Запуск ---------- */

form.addEventListener("submit", sendAd);
refreshBtn.addEventListener("click", loadAds);
document.addEventListener("DOMContentLoaded", loadAds);
