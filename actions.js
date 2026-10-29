let clics = 0;

const contador = document.getElementById("contador");
const incrementar = document.getElementById("incrementar");
const reiniciar = document.getElementById("reiniciar");
const nombreEvento = document.getElementById("nombre-evento");
const tituloEvento = document.getElementById("titulo-evento");

incrementar.addEventListener("click", () => {
  clics += 1;
  contador.textContent = clics;
});

reiniciar.addEventListener("click", () => {
  clics = 0;
  contador.textContent = clics;
});

nombreEvento.addEventListener("input", () => {
  tituloEvento.textContent = nombreEvento.value.trim() || "Nuestros eventos";
});