<template>
  <div class="landscape">
    <div class="sky"></div>
    <div class="mountain mountain1"></div>
    <div class="mountain mountain2"></div>
    <div class="mountain mountain3"></div>
    <div class="ground"></div>
    <div class="tree left"></div>
    <div class="tree right"></div>
  </div>
</template>

<script setup>
// No necesitas lógica
</script>

<style scoped>
.landscape {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* Cielo degradado */
.sky {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, #1e3c3b, #3b7d73);
  z-index: 1;
}

/* Montañas con formas más realistas */
.mountain {
  position: absolute;
  width: 120%;
  left: -10%;
  bottom: 0;
  z-index: 2;
}

.mountain1 {
  height: 55%;
  background: #1f2f29;
  clip-path: polygon(
    0% 100%,
    10% 80%,
    20% 85%,
    30% 60%,
    40% 75%,
    50% 50%,
    60% 70%,
    70% 55%,
    80% 65%,
    90% 40%,
    100% 60%,
    100% 100%
  );
}

.mountain2 {
  height: 60%;
  background: #223931;
  clip-path: polygon(
    0% 100%,
    10% 70%,
    20% 80%,
    30% 55%,
    40% 70%,
    50% 45%,
    60% 65%,
    70% 50%,
    80% 60%,
    90% 35%,
    100% 50%,
    100% 100%
  );
  opacity: 0.6;
}

.mountain3 {
  height: 65%;
  background: #2e4b3f;
  clip-path: polygon(
    0% 100%,
    10% 60%,
    20% 75%,
    30% 50%,
    40% 65%,
    50% 40%,
    60% 60%,
    70% 45%,
    80% 55%,
    90% 30%,
    100% 45%,
    100% 100%
  );
  opacity: 0.4;
}

/* Suelo */
.ground {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 15%;
  background: #16251f;
  z-index: 3;
}

/* Siluetas de pinos en los extremos */
.tree {
  position: absolute;
  bottom: 15%;
  width: 60px;
  height: 120px;
  background: transparent;
  z-index: 4;
}

/* Pino con triángulos */
.tree::before,
.tree::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: #16251f;
}

/* Triángulo superior */
.tree::before {
  bottom: 40px;
  width: 0;
  height: 0;
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-bottom: 40px solid #16251f;
}

/* Triángulo inferior */
.tree::after {
  bottom: 0;
  width: 0;
  height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-bottom: 50px solid #16251f;
}

.tree.left {
  left: 20px;
}

.tree.right {
  right: 20px;
}
</style>
