<template>
  <q-page class="q-pa-md page-container" :class="$q.dark.isActive ? '' : 'bg-gradient'">

    <!-- Encabezado -->
    <div class="page-header q-mb-lg">
      <div class="header-content">
        <div class="header-title">
          <q-icon name="dashboard" size="42px" class="q-mr-sm" />
          <h2 class="page-title">Panel de Control</h2>
        </div>
        <p class="header-subtitle">Resumen general de actividades y estadísticas</p>
      </div>
    </div>

    <!-- Tarjetas de estadísticas -->
    <div class="stats-container q-mb-lg">
      <div v-for="(card, index) in summaryCards" :key="card.title" class="stat-card" :class="card.class"
        :style="{ animationDelay: (index * 100) + 'ms' }">
        <div class="stat-icon">
          <q-icon :name="card.icon" size="36px" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ card.value }}</div>
          <div class="stat-label">{{ card.title }}</div>
        </div>
        <div class="stat-trend" v-if="card.trend">
          <q-icon :name="card.trend.up ? 'trending_up' : 'trending_down'" size="18px"
            :class="card.trend.up ? 'text-positive' : 'text-negative'" />
          <span :class="card.trend.up ? 'text-positive' : 'text-negative'">
            {{ card.trend.text }}
          </span>
        </div>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="row q-col-gutter-md">
      <!-- Gráfico de Inscripciones -->
      <div class="col-12 col-md-7">
        <q-card class="chart-card">
          <q-card-section class="chart-header">
            <div class="row items-center">
              <q-icon name="insert_chart" size="28px" class="q-mr-sm text-forest" />
              <span class="chart-title">Inscripciones Últimos 6 Meses</span>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="chart-body">
            <InscripcionesChart :data="datosInscripciones" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Gráfico de Distribución por Disciplina -->
      <div class="col-12 col-md-5">
        <q-card class="chart-card">
          <q-card-section class="chart-header">
            <div class="row items-center">
              <q-icon name="pie_chart" size="28px" class="q-mr-sm text-forest" />
              <span class="chart-title">Estudiantes por Disciplina</span>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="chart-body">
            <Disciplinas :data="datosDisciplinas" />
          </q-card-section>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import InscripcionesChart from 'components/graficas/InscripcionesChart.vue'
import Disciplinas from 'components/graficas/Disciplinas.vue'
import { obtenerEstadisticasDashboard } from 'src/stores/authentication/auth-store.js'

const $q = useQuasar()

// Datos de las tarjetas principales
const summaryCards = ref([
  {
    icon: 'groups',
    title: 'Total Estudiantes',
    value: '0',
    class: 'stat-card-total',
    trend: { up: true, text: '+12%' }
  },
  {
    icon: 'sports',
    title: 'Entrenadores',
    value: '0',
    class: 'stat-card-active',
    trend: { up: true, text: '+2' }
  },
  {
    icon: 'event',
    title: 'Inscripciones Activas',
    value: '0',
    class: 'stat-card-inactive',
    trend: { up: false, text: '-5%' }
  },
  {
    icon: 'fitness_center',
    title: 'Entrenamientos del Mes',
    value: '0',
    class: 'stat-card-roles',
    trend: { up: true, text: '+8%' }
  },
  {
    icon: 'payments',
    title: 'Ingresos del Mes',
    value: 'Bs 0',
    class: 'stat-card-recent',
    trend: { up: true, text: '+15%' }
  }
])

// Datos para las gráficas
const datosInscripciones = ref({ meses: [], valores: [] })
const datosDisciplinas = ref([])

// Cargar estadísticas del dashboard
const cargarEstadisticas = async () => {
  try {
    const datos = await obtenerEstadisticasDashboard()

    // Actualizar las tarjetas con los datos del backend
    if (datos.estadisticas) {
      const stats = datos.estadisticas

      summaryCards.value[0].value = stats.totalEstudiantes || '0'
      summaryCards.value[0].trend.text = stats.estudiantesTrend || '+0%'
      summaryCards.value[0].trend.up = !stats.estudiantesTrend?.includes('-')

      summaryCards.value[1].value = stats.totalEntrenadores || '0'
      summaryCards.value[1].trend.text = stats.entrenadoresTrend || '+0'
      summaryCards.value[1].trend.up = !stats.entrenadoresTrend?.includes('-')

      summaryCards.value[2].value = stats.inscripcionesActivas || '0'
      summaryCards.value[2].trend.text = stats.inscripcionesTrend || '0%'
      summaryCards.value[2].trend.up = !stats.inscripcionesTrend?.includes('-')

      summaryCards.value[3].value = stats.entrenamientosDelMes || '0'
      summaryCards.value[3].trend.text = stats.entrenamientosTrend || '+0%'
      summaryCards.value[3].trend.up = !stats.entrenamientosTrend?.includes('-')

      summaryCards.value[4].value = `Bs ${stats.ingresosDelMes || '0'}`
      summaryCards.value[4].trend.text = stats.ingresosTrend || '+0%'
      summaryCards.value[4].trend.up = !stats.ingresosTrend?.includes('-')
    }

    // Actualizar datos de inscripciones
    if (datos.inscripciones) {
      datosInscripciones.value = datos.inscripciones
    }

    // Actualizar datos de disciplinas
    if (datos.disciplinas) {
      datosDisciplinas.value = datos.disciplinas
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar las estadísticas del dashboard',
      position: 'top'
    })
  }
}

onMounted(() => {
  cargarEstadisticas()
})
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

/* ===== PALETA DE COLORES VERDE BOSQUE ===== */
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-sage: #8bc34a;
$color-bark: #5d4037;
$color-wood: #795548;
$color-earth: #8d6e63;
$color-clay: #a1887f;
$color-sand: #bcaaa4;

$pastel-mint: #c8e6c9;
$pastel-lime: #dcedc8;
$pastel-sage: #f1f8e9;
$pastel-sand: #efebe9;
$pastel-clay: #d7ccc8;

/* ===== ANIMACIONES ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ===== FONDO ===== */
.bg-gradient {
  background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 50%, #efebe9 100%);
}

.page-container {
  animation: fadeIn 0.6s ease;
  min-height: calc(100vh - 100px);
}

/* ===== HEADER ===== */
.page-header {
  animation: slideDown 0.6s ease;
}

.header-content {
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 50%, $color-bark 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title {
  font-size: 2.5em;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
}

.header-subtitle {
  color: #5d4037;
  font-size: 1.1em;
  margin: 8px 0 0 0;
  font-weight: 500;
}

/* ===== TARJETAS DE ESTADÍSTICAS ===== */
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: scaleIn 0.5s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

.stat-card-total {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
}

.stat-card-active {
  background: linear-gradient(135deg, $color-leaf 0%, $color-sage 100%);
  color: white;
}

.stat-card-inactive {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
}

.stat-card-roles {
  background: linear-gradient(135deg, $color-moss 0%, $color-lime 100%);
  color: white;
}

.stat-card-recent {
  background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%);
  color: white;
}

.stat-icon {
  opacity: 0.95;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.stat-number {
  font-size: 2.5em;
  font-weight: 800;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.85em;
  opacity: 0.95;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  font-weight: 600;
  opacity: 0.9;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

/* ===== TARJETAS DE GRÁFICOS ===== */
.chart-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: fadeIn 0.6s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }
}

.chart-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-lime 100%);
  padding: 20px;
}

.text-forest {
  color: $color-forest;
}

.chart-title {
  font-size: 1.2em;
  font-weight: 700;
  color: $color-forest;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-body {
  padding: 24px;
  min-height: 300px;
  background: white;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .stats-container {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .page-title {
    font-size: 2em;
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-title {
    font-size: 1.8em;
  }

  .header-subtitle {
    font-size: 1em;
  }

  .stat-number {
    font-size: 2em;
  }
}

@media (max-width: 599px) {
  .stats-container {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.5em;
  }

  .stat-card {
    padding: 20px;
  }

  .chart-body {
    padding: 16px;
    min-height: 250px;
  }
}

/* ===== DARK MODE ===== */
.body--dark {
  .page-container {
    background: $grey-9;
  }

  .chart-card {
    background: $grey-8;
    border: 1px solid rgba(124, 179, 66, 0.2);
  }

  .chart-header {
    background: linear-gradient(135deg, rgba(85, 139, 47, 0.2) 0%, rgba(124, 179, 66, 0.15) 100%);
  }

  .chart-title {
    color: $color-lime;
  }

  .chart-body {
    background: $grey-8;
  }

  .text-forest {
    color: $color-lime;
  }
}
</style>
