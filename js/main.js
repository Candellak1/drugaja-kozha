"use strict";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function illustration(image) {
  const img = element("img");
  img.src = "./img/" + image + ".svg";
  img.alt = "";
  img.width = 200;
  img.height = 200;
  img.loading = "lazy";
  return img;
}

const catalog = document.querySelector("#catalog-items");
for (const category of worksData.categories) {
  const pattern = element("details", "pattern");
  const summary = element("summary");
  const label = element("div");
  label.append(element("h3", "", category.title), element("p", "", category.examples));
  const toggle = element("span", "pattern-toggle");
  toggle.setAttribute("aria-hidden", "true");
  summary.append(label, illustration(category.image), toggle);
  const list = element("ul");
  category.items.forEach((item, index) => {
    const listItem = element("li", "", item);
    listItem.style.setProperty("--index", index);
    list.append(listItem);
  });
  pattern.append(summary, list);
  catalog.append(pattern);
}

const leatherColors = [
  { name: "красный", value: "#a6333b" },
  { name: "чёрный", value: "#171314" },
  { name: "коричневый", value: "#7c503c" },
  { name: "серый", value: "#85807b" },
  { name: "молочный", value: "#e4cfb1" },
];
const threadColors = [
  { name: "красный", value: "#de5b51" },
  { name: "чёрный", value: "#161111" },
  { name: "белый", value: "#fff4df" },
];
const palettes = [
  { name: "scarf", title: "Платочек", colors: leatherColors, initial: 0 },
  { name: "flowers", title: "Цветочки", colors: leatherColors, initial: 4 },
  { name: "thread", title: "Нить", colors: threadColors, initial: 0 },
];
const chosen = {};
const swatches = document.querySelector("#swatches");
const doll = document.querySelector(".doll-art");
const colorSummary = document.querySelector("#color-summary");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motion = {
  scarf: [{ opacity: .66 }, { opacity: 1 }],
  flowers: [{ transform: "scale(.72)" }, { transform: "scale(1.09)", offset: .67 }, { transform: "scale(1)" }],
  thread: [{ clipPath: "inset(0 100% 100% 0)" }, { clipPath: "inset(0)" }],
};
const currentAnimations = {};
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    Object.values(currentAnimations).forEach((animation) => animation.cancel());
  }
});

function colorText() {
  return "Платочек: " + chosen.scarf.name + "; цветочки: " + chosen.flowers.name + "; цвет нити: " + chosen.thread.name + ".";
}

function refreshDoll(palette, animate) {
  doll.style.setProperty("--" + palette.name, chosen[palette.name].value);
  colorSummary.textContent = colorText();
  if (animate && !reducedMotion.matches) {
    currentAnimations[palette.name]?.cancel();
    currentAnimations[palette.name] = doll.querySelector(".doll-" + palette.name)
      .animate(motion[palette.name], { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
  }
}

for (const palette of palettes) {
  chosen[palette.name] = palette.colors[palette.initial];
  const group = element("fieldset", "swatch-group");
  group.append(element("legend", "", palette.title));
  const row = element("div", "swatch-row");

  palette.colors.forEach((color, index) => {
    const label = element("label", "swatch");
    const input = element("input");
    input.type = "radio";
    input.name = palette.name;
    input.value = color.value;
    input.checked = index === palette.initial;
    input.setAttribute("aria-label", color.name);
    label.title = color.name;
    label.style.setProperty("--swatch", color.value);
    label.append(input, element("span", "swatch-color"));
    row.append(label);
    input.addEventListener("change", () => {
      chosen[palette.name] = color;
      refreshDoll(palette, true);
    });
  });
  group.append(row);
  swatches.append(group);
}
palettes.forEach((palette) => refreshDoll(palette, false));
document.querySelector("#builder-panel").hidden = false;

const rail = document.querySelector("#work-rail");
for (const album of worksData.albums) {
  const work = element("li", "work-sheet");
  const link = element("a", "work-link");
  link.href = album.url || worksData.communityUrl;
  const art = element("div", "work-illustration");
  const drawing = illustration(album.image);
  const photo = element("img");
  photo.hidden = true;
  photo.alt = album.title;
  photo.loading = "lazy";
  if (album.photo) {
    photo.addEventListener("load", () => {
      drawing.hidden = true;
      photo.hidden = false;
    }, { once: true });
    photo.src = "./img/" + album.photo;
  }
  art.append(drawing, photo);
  link.append(art, element("h3", "", album.title), element("span", "work-label", "Смотреть в ВКонтакте"));
  work.append(link);
  rail.append(work);
}

const previousWork = document.querySelector("#rail-prev");
const nextWork = document.querySelector("#rail-next");

function updateRailControls() {
  previousWork.disabled = rail.scrollLeft <= 2;
  nextWork.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
}

function moveRail(direction) {
  const offset = rail.children[1].offsetLeft - rail.children[0].offsetLeft;
  rail.scrollBy({ left: offset * direction, behavior: reducedMotion.matches ? "instant" : "smooth" });
}

previousWork.addEventListener("click", () => moveRail(-1));
nextWork.addEventListener("click", () => moveRail(1));
rail.addEventListener("scroll", updateRailControls, { passive: true });
new ResizeObserver(updateRailControls).observe(rail);
document.querySelector("#rail-controls").hidden = false;
updateRailControls();

const form = document.querySelector("#order-form");
const customerName = document.querySelector("#customer-name");
const itemType = document.querySelector("#item-type");
const idea = document.querySelector("#idea");
const ideaStatus = document.querySelector("#idea-status");
const contact = document.querySelector("#contact");
const phone = document.querySelector("#phone");
const phoneField = document.querySelector("#phone-field");
const result = document.querySelector("#order-result");
let sequence = 0;
let insertedColors = "";

function showForm() {
  form.hidden = false;
  result.hidden = true;
}

document.querySelector("#use-colors").addEventListener("click", (event) => {
  event.preventDefault();
  showForm();
  itemType.value = "Аксессуар";
  const text = colorText();
  const previous = [insertedColors, "\n"].join("");
  const oldIdea = insertedColors && idea.value.startsWith(previous)
    ? idea.value.slice(previous.length)
    : idea.value === insertedColors ? "" : idea.value;
  const combinedIdea = [text, oldIdea].filter(Boolean).join("\n");
  if (combinedIdea.length <= idea.maxLength) {
    idea.value = combinedIdea;
    insertedColors = text;
    idea.setCustomValidity("");
    ideaStatus.textContent = "";
  } else {
    ideaStatus.textContent = "Сократите описание, чтобы добавить цвета. " + text;
  }
  history.replaceState(null, "", "#order");
  document.querySelector("#order").scrollIntoView();
  idea.focus({ preventScroll: true });
});

function phoneDigits(value) {
  let digits = value.replace(/\D/g, "");
  const hasPrefix = /^\+7/.test(value.trimStart()) || (digits.length >= 11 && /^[78]/.test(digits));
  if (hasPrefix) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

function formatPhone(digits) {
  if (!digits) return "";
  let value = "+7 (" + digits.slice(0, 3);
  if (digits.length > 3) value += ") " + digits.slice(3, 6);
  if (digits.length > 6) value += "-" + digits.slice(6, 8);
  if (digits.length > 8) value += "-" + digits.slice(8, 10);
  return value;
}

phone.addEventListener("input", () => {
  const cursor = phone.selectionStart;
  const original = phone.value;
  const digits = phoneDigits(original);
  const digitsBeforeCursor = phoneDigits(original.slice(0, cursor)).length;
  phone.value = formatPhone(digits);
  if (cursor < original.length && digitsBeforeCursor > 0) {
    let seen = 0;
    for (let index = 3; index < phone.value.length; index++) {
      if (/\d/.test(phone.value[index]) && ++seen === digitsBeforeCursor) {
        phone.setSelectionRange(index + 1, index + 1);
        break;
      }
    }
  }
  phone.setCustomValidity(digits.length === 10 || !digits ? "" : "Введите 10 цифр после +7.");
});
contact.addEventListener("change", () => {
  const byPhone = contact.value === "phone";
  phoneField.hidden = !byPhone;
  phone.disabled = !byPhone;
  phone.required = byPhone;
});
idea.addEventListener("input", () => {
  idea.setCustomValidity("");
  ideaStatus.textContent = "";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!idea.value.trim()) {
    idea.setCustomValidity("Опишите, какое изделие или сочетание цветов хотите.");
    idea.reportValidity();
    return;
  }
  sequence += 1;
  const heading = element("h3", "", "Демо-заявка № " + String(sequence).padStart(3, "0"));
  const details = element("dl");
  const entries = [
    ["Имя", customerName.value.trim()],
    ["Что хочу", itemType.value],
    ["Идея и цвета", idea.value.trim()],
    ["Связь", contact.value === "phone" ? "Телефон, оканчивается на " + phone.value.slice(-2) : "ВКонтакте"],
  ];
  for (const [label, value] of entries) {
    details.append(element("dt", "", label), element("dd", "", value));
  }
  const edit = element("button", "plain-button", "Вернуться к форме");
  edit.type = "button";
  edit.addEventListener("click", () => {
    showForm();
    idea.focus({ preventScroll: true });
    form.scrollIntoView({ block: "nearest" });
  });
  result.replaceChildren(heading, details, element("p", "", "Демо: в рабочей версии заявка приходит мастеру во ВКонтакте."), edit);
  form.hidden = true;
  result.hidden = false;
  result.focus();
});
document.querySelector("#order-sheet").hidden = false;

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("cut-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: .2 });
  observer.observe(catalog);
  observer.observe(document.querySelector(".footer-inner"));
}
