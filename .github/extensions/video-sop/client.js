const search = document.querySelector("#search");
const steps = [...document.querySelectorAll(".step")];
const count = document.querySelector("#count");
const dialog = document.querySelector("#zoom");
const zoomImage = document.querySelector("#zoom-image");
function filterSteps() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const step of steps) {
        step.hidden = !step.textContent.toLocaleLowerCase().includes(query);
        if (!step.hidden) visible++;
    }
    count.textContent = `${visible} / ${steps.length} steps`;
    document.querySelector("#empty").hidden = visible !== 0;
}
search.addEventListener("input", filterSteps);
filterSteps();
document.querySelector("nav").addEventListener("click", event => {
    if (event.target.closest("a")) {
        search.value = "";
        filterSteps();
    }
});
document.addEventListener("click", event => {
    const link = event.target.closest("[data-zoom]");
    if (!link) return;
    event.preventDefault();
    const image = link.querySelector("img");
    zoomImage.src = image.src;
    zoomImage.alt = image.alt;
    document.querySelector("#zoom-caption").textContent = link.closest("figure").querySelector("figcaption").textContent;
    dialog.showModal();
});
document.querySelector("#close-zoom").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
    if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
});
