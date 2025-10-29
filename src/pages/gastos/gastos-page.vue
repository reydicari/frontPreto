<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h4 class="text-h5 q-ma-none">Gastos</h4>
        <div class="text-subtitle2 text-grey">Lista de gastos con animación y skeleton</div>
      </div>
      <q-btn label="Refrescar" color="primary" @click="loadData" />
    </div>

    <!-- Skeleton while loading -->
    <div v-if="loading">
      <div v-for="n in 4" :key="n" class="q-mb-md">
        <div class="skeleton-row">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="line short"></div>
            <div class="line long"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Animated list -->
    <transition-group name="list" tag="div" class="row q-col-gutter-md">
      <q-card v-for="g in gastos" :key="g.id" class="col-12 col-md-6 gasto-card">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-subtitle1">{{ g.concepto }}</div>
              <div class="text-caption">{{ g.fecha }} — {{ g.categoria }}</div>
            </div>
            <div class="col-auto text-h6">Bs. {{ g.monto }}</div>
          </div>
        </q-card-section>
      </q-card>
    </transition-group>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(true)
const gastos = ref([])

const mock = [
  { id: 1, concepto: 'Compra materiales', monto: 250, categoria: 'Materiales', fecha: '2025-10-01' },
  { id: 2, concepto: 'Pago alquiler', monto: 1200, categoria: 'Servicios', fecha: '2025-10-05' },
  { id: 3, concepto: 'Impresiones', monto: 80, categoria: 'Administrativo', fecha: '2025-10-09' }
]

const loadData = () => {
  loading.value = true
  gastos.value = []
  setTimeout(() => {
    gastos.value = [...mock]
    loading.value = false
  }, 700)
}

onMounted(() => loadData())
</script>

<style scoped>
.skeleton-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  background: #eee;
  border-radius: 6px
}

.skeleton-lines .line {
  height: 10px;
  background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
  margin-bottom: 8px;
  border-radius: 6px
}

.line.short {
  width: 90px
}

.line.long {
  width: 180px
}

/* transition-group list animation (stagger) */
.list-enter-active {
  transition: all 360ms cubic-bezier(.2, .8, .2, 1);
}

.list-leave-active {
  transition: opacity 160ms linear;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(.995);
}

.list-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.gasto-card {
  transition: transform .18s ease, box-shadow .18s ease;
}

.gasto-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, .06);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0
  }

  100% {
    background-position: 200% 0
  }
}
</style>
