"use strict";

const themeButton = document.querySelector(".theme-toggle");
function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeButton.setAttribute("aria-pressed", String(isDark));
  themeButton.setAttribute("aria-label", isDark ? "切换到浅色模式" : "切换到深色模式");
}
try { setTheme(localStorage.getItem("song-kele-theme") || "light"); } catch { setTheme("light"); }
themeButton.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next);
  try { localStorage.setItem("song-kele-theme", next); } catch { /* 主题切换不依赖存储权限。 */ }
});

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-nav");
function closeMenu() { navigation.classList.remove("is-open"); menuButton.setAttribute("aria-expanded", "false"); }
menuButton.addEventListener("click", () => {
  const open = navigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(open));
});
navigation.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
document.addEventListener("click", (event) => { if (!event.target.closest(".header-inner")) closeMenu(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && navigation.classList.contains("is-open")) { closeMenu(); menuButton.focus(); } });

const notes = {
  learnflow: {kicker:"从自己的学习问题开始",title:"LearnFlow",question:["学过以后，","真的会了吗？"],steps:["诊断基础","独立输出","迁移复测"],footnote:"让学习留下可检验的掌握证据。",status:"已开源 · 持续迭代",label:"阅读 LearnFlow 项目案例"},
  content: {kicker:"把自己的观察讲出来",title:"内容工作流",question:["从一个想法，","到一条成片。"],steps:["选题脚本","拍摄制作","发布复盘"],footnote:"AI 辅助执行，自己保留表达和判断。",status:"个人实践 · 持续制作",label:"阅读自媒体制作案例"},
  teaching: {kicker:"先理解面前的学习者",title:"教学与表达",question:["复杂的知识，","怎样讲清楚？"],steps:["观察困难","结构讲解","具体反馈"],footnote:"把知识放进题目，也放进具体情境。",status:"教学经历 · 方法积累",label:"阅读教学实践案例"}
};
document.querySelectorAll("[data-note]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.note;
    const note = notes[key];
    document.querySelectorAll("[data-note]").forEach((item) => { const selected = item === button; item.classList.toggle("active", selected); item.setAttribute("aria-pressed", String(selected)); });
    document.querySelector("#note-kicker").textContent = note.kicker;
    document.querySelector("#note-title").textContent = note.title;
    const question = document.querySelector("#note-question");
    question.replaceChildren(document.createTextNode(note.question[0]), document.createElement("br"), document.createTextNode(note.question[1]));
    document.querySelectorAll("#note-flow > span").forEach((span, index) => { span.textContent = note.steps[index]; });
    document.querySelector("#note-footnote").textContent = note.footnote;
    document.querySelector("#note-status").textContent = note.status;
    const openButton = document.querySelector("#note-open");
    openButton.dataset.openCase = key;
    openButton.setAttribute("aria-label", note.label);
  });
});

const stepDescriptions = ["先用一个小任务了解基础，把时间花在真正需要学习的地方。", "试着用自己的语言解释，看看哪些内容还需要提示或补充。", "把知识放进新的例子和情境，检验能否真正运用。", "隔一段时间再检验，让即时理解和长期掌握都有记录。"];
document.querySelectorAll("[data-step]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-step]").forEach((item) => { const selected = item === button; item.classList.toggle("selected", selected); item.setAttribute("aria-pressed", String(selected)); });
    document.querySelector("#step-description").textContent = stepDescriptions[Number(button.dataset.step)];
  });
});

const dialogReturnStates = new WeakMap();
function openCase(key, updateUrl = true, scrollTarget = null) {
  const dialog = document.getElementById(`case-${key}`);
  if (!dialog) return;
  if (!dialog.open) {
    const currentTarget = document.getElementById(location.hash.slice(1));
    const fallback = key === "media" ? "#media" : "#projects";
    dialogReturnStates.set(dialog, {
      hash: currentTarget?.closest(".case-dialog") ? fallback : location.hash || fallback,
      scrollY: currentTarget?.closest(".case-dialog") ? null : window.scrollY,
      focus: document.activeElement
    });
  }
  if (updateUrl && location.hash !== `#${dialog.id}`) {
    history.pushState(null, "", `#${dialog.id}`);
  }
  if (!dialog.open) { dialog.showModal(); dialog.scrollTop = 0; }
  document.body.classList.add("dialog-open");
  if (scrollTarget && scrollTarget !== dialog) {
    requestAnimationFrame(() => scrollTarget.scrollIntoView({ block: "start" }));
  }
}
function syncCaseWithLocation() {
  const target = document.getElementById(location.hash.slice(1));
  const targetDialog = target?.closest(".case-dialog");
  document.querySelectorAll(".case-dialog[open]").forEach((dialog) => { if (dialog !== targetDialog) dialog.close(); });
  if (targetDialog) openCase(targetDialog.id.slice(5), false, target);
}
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open-case]");
  if (trigger) {
    openCase(trigger.dataset.openCase);
  }
  const closeButton = event.target.closest(".dialog-close, [data-close-dialog]");
  if (closeButton) closeButton.closest("dialog").close();
});
document.querySelectorAll(".case-dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (!document.querySelector(".case-dialog[open]")) document.body.classList.remove("dialog-open");
    const currentTarget = document.getElementById(location.hash.slice(1));
    if (currentTarget?.closest(".case-dialog") === dialog) {
      const state = dialogReturnStates.get(dialog);
      const fallback = dialog.id === "case-media" ? "#media" : "#projects";
      history.replaceState(null, "", state?.hash || fallback);
      const returnSection = document.querySelector(fallback);
      const returnY = state?.scrollY ?? (returnSection?.offsetTop ?? 0);
      requestAnimationFrame(() => {
        state?.focus?.focus({ preventScroll: true });
        window.scrollTo({ top: returnY, behavior: "instant" });
      });
    }
  });
});
window.addEventListener("popstate", syncCaseWithLocation);
window.addEventListener("hashchange", syncCaseWithLocation);
syncCaseWithLocation();
