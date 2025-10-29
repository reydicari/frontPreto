<!-- src/pages/Dashboard.vue -->
<template>
  <q-page class="main-content q-pa-md">

    <!-- Encabezado -->
    <div class="header q-mb-md">
      <h4 class="q-ma-none">Resumen General</h4>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="row q-gutter-md">
      <div class="col-12 col-sm-3" v-for="card in summaryCards" :key="card.title">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-icon :name="card.icon" size="2rem" class="q-mb-sm" :class="card.color" />
            <div class="text-subtitle2">{{ card.title }}</div>
            <div class="text-h5 q-mt-xs">{{ card.value }}</div>

            <div class="row justify-center items-center q-mt-xs">
              <q-icon :name="card.trend.up ? 'arrow_upward' : 'arrow_downward'" size="1.3rem"
                :class="card.trend.up ? 'text-positive' : 'text-negative'" />
              <span class="q-ml-xs" :class="card.trend.up ? 'text-positive' : 'text-negative'">
                {{ card.trend.text }}
              </span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Gráficos + mini–cards -->
    <div class="row q-mt-xs q-gutter-lg">
      <!-- Gráfico 1 -->
      <div class="col-12 col-md-11">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1">INSCRIPCIONES ÚLTIMOS 6 MESES</div>
          </q-card-section>
          <q-card-section class="bg-secondary-light q-pa-lg flex flex-center">
            <div style="height: 300px;" class="full-width q-pa-none">
              <InscripcionesChart class="full-width q-pa-none" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Mini–cards -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1">ENTRENAMIENTOS DEL MES</div>
          </q-card-section>

          <q-separator />
          <div v-for="t in trainings" :key="t.sport">
            <q-card-section class="row no-wrap items-center">
              <div class="col">
                <div class="text-body1">{{ t.sport }}</div>
                <div class="text-caption text-grey">{{ t.sessions }} sesiones</div>
              </div>
              <q-badge :color="t.increase > 0 ? 'secondary' : 'negative'" align="top">
                {{ t.increase > 0 ? `+${t.increase}%` : `${t.increase}%` }}
              </q-badge>
            </q-card-section>
            <q-separator />
          </div>
        </q-card>
      </div>
      <div class="col-12 col-md-6 ">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1">DISTRIBUCIÓN DE ESTUDIANTES POR DEPORTE</div>
          </q-card-section>
          <q-card-section class="bg-secondary-light q-pa-lg flex flex-center">
            <q-icon name="pie_chart" size="3rem" class="text-secondary" />
            <div class="q-ml-md">Aquí iría tu gráfico circular</div>
          </q-card-section>
        </q-card>
      </div>
    </div>



  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import InscripcionesChart from "components/graficas/InscripcionesChart.vue";
const nro = 0
/* Datos de ejemplo para las tarjetas principales */
const summaryCards = ref([
  {
    icon: 'people',
    title: 'ESTUDIANTES',
    value: nro === 0 ? 279 : 1,
    color: 'text-primary',
    trend: { up: true, text: '12% vs mes anterior' }
  },
  {
    icon: 'person',
    title: 'ENTRENADORES',
    value: 15,
    color: 'text-primary',
    trend: { up: true, text: '2 nuevos' }
  },
  {
    icon: 'warning',
    title: 'INSCRIPCIONES POR VENCER',
    value: 32,
    color: 'text-primary',
    trend: { up: false, text: '5 esta semana' }
  },
  {
    icon: 'payments',
    title: 'PAGOS DEL MES',
    value: '$ 12 450',
    color: 'text-primary',
    trend: { up: true, text: '8% vs mes anterior' }
  },
  {
    icon: 'payments',
    title: 'ENTREAMIENTOS ESTE MES',
    value: 7,
    color: 'text-primary',
    trend: { up: true, text: '3% vs mes anterior' }
  }
])

/* Datos para mini–cards */
const trainings = ref([
  { sport: 'Fútbol', sessions: 15, increase: 5 },
  { sport: 'Natación', sessions: 12, increase: 8 },
  { sport: 'Baloncesto', sessions: 8, increase: 3 },
  { sport: 'Tenis', sessions: 6, increase: 2 }
])


</script>

<style scoped>
.main-content {
  min-height: 100%;
}

.header h4 {
  font-weight: 500;
}

.card-dashboard .q-card-section {
  padding: 1rem;
}

.bg-secondary-light {
  background-color: var(--q-secondary-light);
}

.q-card {
  transition: transform 0.3s;
}

.q-card:hover {
  transform: translateY(-5px);
}
</style>
