<template>
  <q-page class="profile-page" :class="$q.dark.isActive ? 'dark-mode' : 'light-mode'">
    <!-- Header con datos del usuario -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <q-avatar size="80px" class="user-avatar">
            <q-icon name="person" size="48px" />
          </q-avatar>
          <div class="user-info">
            <div class="page-title">
              <q-icon name="account_circle" size="32px" class="title-icon" />
              {{ userData?.persona?.nombres }} {{ userData?.persona?.apellido_paterno }}
            </div>
            <div class="page-subtitle">@{{ userData?.usuario }}</div>
            <div class="user-roles">
              <q-chip v-for="rol in userData?.rols" :key="rol.id" size="sm" color="orange-7" text-color="white"
                icon="shield">
                {{ rol.nombre }}
              </q-chip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Datos Personales -->
    <q-card class="info-card q-mb-md">
      <div class="card-header">
        <q-icon name="badge" size="24px" class="q-mr-sm" />
        <span class="card-title">Datos Personales</span>
      </div>
      <q-card-section>
        <div class="info-grid">
          <div class="info-item">
            <q-icon name="fingerprint" size="20px" color="green-8" class="q-mr-xs" />
            <span class="info-label">CI:</span>
            <span class="info-value">{{ userData?.persona?.ci }}{{ userData?.persona?.complemento || '' }}</span>
          </div>
          <div class="info-item">
            <q-icon name="phone" size="20px" color="green-8" class="q-mr-xs" />
            <span class="info-label">Teléfono:</span>
            <span class="info-value">{{ userData?.persona?.telefono }}</span>
          </div>
          <div class="info-item">
            <q-icon name="cake" size="20px" color="orange-7" class="q-mr-xs" />
            <span class="info-label">F. Nacimiento:</span>
            <span class="info-value">{{ formatDate(userData?.persona?.fecha_nacimiento) }}</span>
          </div>
          <div class="info-item">
            <q-icon name="wc" size="20px" color="green-8" class="q-mr-xs" />
            <span class="info-label">Género:</span>
            <span class="info-value">{{ userData?.persona?.genero === 'M' ? 'Masculino' : 'Femenino' }}</span>
          </div>
          <div class="info-item">
            <q-icon name="category" size="20px" color="orange-7" class="q-mr-xs" />
            <span class="info-label">Categoría:</span>
            <span class="info-value">{{ userData?.persona?.categoria }}</span>
          </div>
          <div class="info-item">
            <q-icon name="event" size="20px" color="green-8" class="q-mr-xs" />
            <span class="info-label">Último ingreso:</span>
            <span class="info-value">{{ formatDateTime(userData?.ultimo_ingreso) }}</span>
          </div>
        </div>
        <div v-if="userData?.persona?.biografia" class="bio-section q-mt-md">
          <q-icon name="description" size="20px" color="orange-7" class="q-mr-xs" />
          <span class="info-label">Biografía:</span>
          <p class="bio-text">{{ userData?.persona?.biografia }}</p>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mis Evaluaciones -->
    <q-card class="evaluations-card q-mb-md">
      <div class="card-header">
        <q-icon name="star" size="24px" class="q-mr-sm" />
        <span class="card-title">Mis Evaluaciones</span>
        <q-chip size="sm" color="green-8" text-color="white">
          {{ evaluaciones.length }} evaluación(es)
        </q-chip>
      </div>
      <q-card-section>
        <div v-if="loadingEvaluaciones" class="text-center q-pa-md">
          <q-spinner color="green-8" size="40px" />
        </div>
        <div v-else-if="evaluaciones.length === 0" class="empty-state">
          <q-icon name="sentiment_satisfied" size="64px" color="grey-5" />
          <p class="text-grey-7">No tienes evaluaciones registradas</p>
        </div>
        <div v-else class="evaluations-grid">
          <q-card v-for="evaluacion in evaluaciones" :key="evaluacion.id" flat bordered class="evaluation-card">
            <q-card-section>
              <div class="eval-header">
                <span class="cualidad-name">{{ evaluacion.cualidad?.nombre }}</span>
                <q-rating v-model="evaluacion.valor" max="5" size="20px" color="orange-7" readonly icon="star" />
              </div>
              <div class="eval-date">
                <q-icon name="event" size="16px" class="q-mr-xs" />
                {{ formatDateShort(evaluacion.fecha) }}
                <q-icon name="access_time" size="16px" class="q-ml-md q-mr-xs" />
                {{ formatTime(evaluacion.fecha) }}
              </div>
              <div v-if="evaluacion.comentario" class="eval-comment">
                <q-icon name="comment" size="16px" color="green-8" class="q-mr-xs" />
                <span>{{ evaluacion.comentario }}</span>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mis Progresos -->
    <q-card class="progress-card">
      <div class="card-header">
        <q-icon name="trending_up" size="24px" class="q-mr-sm" />
        <span class="card-title">Mis Progresos</span>
        <!-- Input de búsqueda por ID solo para Administrador -->
        <div v-if="isAdmin" class="search-progress q-ml-auto">
          <q-input v-model.number="searchProgressId" label="Buscar por ID de Progreso" outlined dense
            @update:model-value="buscarProgreso" type="number">
            <template v-slot:prepend>
              <q-icon name="search" color="orange-7" />
            </template>
          </q-input>
        </div>
      </div>
      <q-card-section>
        <div v-if="loadingProgresos" class="text-center q-pa-md">
          <q-spinner color="green-8" size="40px" />
        </div>
        <div v-else-if="progresos.length === 0" class="empty-state">
          <q-icon name="show_chart" size="64px" color="grey-5" />
          <p class="text-grey-7">No tienes progresos registrados</p>
        </div>
        <div v-else>
          <!-- Gráfica tipo radar (tela de araña) -->
          <div ref="radarChart" class="radar-chart"></div>

          <!-- Lista de progresos -->
          <div class="progress-list q-mt-md">
            <q-card v-for="prog in progresos" :key="prog.id" flat bordered class="progress-item q-mb-sm">
              <q-card-section class="q-pa-md">
                <div class="progress-header">
                  <q-chip size="sm" color="orange-7" text-color="white" icon="tag">
                    ID: {{ prog.id }}
                  </q-chip>
                  <span class="cualidad-name">{{ prog.cualidad?.nombre }}</span>
                  <q-badge color="green-8" :label="`${prog.valor}/5`" />
                </div>
                <div class="progress-date">
                  <q-icon name="event" size="16px" class="q-mr-xs" />
                  {{ formatDateShort(prog.fecha) }}
                  <q-icon name="access_time" size="16px" class="q-ml-md q-mr-xs" />
                  {{ formatTime(prog.fecha) }}
                </div>
                <div v-if="prog.comentario" class="progress-comment q-mt-sm">
                  <q-icon name="comment" size="16px" color="orange-7" class="q-mr-xs" />
                  <span>{{ prog.comentario }}</span>
                </div>
                <div v-if="prog.usuario" class="progress-user q-mt-sm">
                  <q-icon name="person" size="16px" color="green-8" class="q-mr-xs" />
                  <span class="text-caption">
                    Registrado por: <strong>@{{ prog.usuario.usuario }}</strong>
                    ({{ prog.usuario.persona?.nombres }} {{ prog.usuario.persona?.apellido_paterno }} {{
                      prog.usuario.persona?.apellido_materno }})
                  </span>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { listarEvaluaciones } from 'src/stores/evaluacion-store'
import { listarProgreso } from 'src/stores/progreso-store'
import * as echarts from 'echarts'

const $q = useQuasar()

// Usuario actual
const userData = ref(null)
const evaluaciones = ref([])
const progresos = ref([])
const loadingEvaluaciones = ref(false)
const loadingProgresos = ref(false)
const radarChart = ref(null)
let chartInstance = null

// Búsqueda de progreso por ID (solo para admin)
const searchProgressId = ref(null)

// Computed para verificar si es administrador
const isAdmin = computed(() => {
  return userData.value?.rols?.some(rol => rol.id === 4 && rol.nombre === 'Administrador')
})

// Cargar datos del usuario
onMounted(async () => {
  const current = JSON.parse(sessionStorage.getItem('user'))
  console.log('usuario actual: ', current)
  userData.value = current

  if (current?.persona?.id) {
    await cargarEvaluaciones(current.persona.id)
    await cargarProgresos()
  }
})

// Cargar evaluaciones
const cargarEvaluaciones = async (idPersona) => {
  loadingEvaluaciones.value = true
  try {
    const res = await listarEvaluaciones({ id_persona: idPersona })
    evaluaciones.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (error) {
    console.error('Error cargando evaluaciones:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar evaluaciones' })
  } finally {
    loadingEvaluaciones.value = false
  }
}

// Cargar progresos
const cargarProgresos = async (params = {}) => {
  loadingProgresos.value = true
  try {
    const res = await listarProgreso(params)
    progresos.value = Array.isArray(res) ? res : (res?.data || [])
    await nextTick()
    renderRadarChart()
  } catch (error) {
    console.error('Error cargando progresos:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar progresos' })
  } finally {
    loadingProgresos.value = false
  }
}

// Buscar progreso por ID (solo admin)
const buscarProgreso = async () => {
  if (searchProgressId.value) {
    await cargarProgresos({ id: searchProgressId.value })
  } else {
    await cargarProgresos()
  }
}

// Renderizar gráfica radar
const renderRadarChart = () => {
  if (!radarChart.value || progresos.value.length === 0) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(radarChart.value)

  // Agrupar progresos por cualidad y obtener el último valor
  const cualidadesMap = new Map()
  progresos.value.forEach(prog => {
    const nombre = prog.cualidad?.nombre || 'Sin nombre'
    if (!cualidadesMap.has(nombre) || new Date(prog.fecha) > new Date(cualidadesMap.get(nombre).fecha)) {
      cualidadesMap.set(nombre, prog)
    }
  })

  const indicator = Array.from(cualidadesMap.keys()).map(nombre => ({
    name: nombre,
    max: 5
  }))

  const values = Array.from(cualidadesMap.values()).map(prog => prog.valor)

  const option = {
    title: {
      text: 'Evolución de Cualidades',
      left: 'center',
      textStyle: {
        color: '#2e7d32',
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const cualidad = params.name
        const valor = params.value
        return `${cualidad}: ${valor}/5`
      }
    },
    radar: {
      indicator: indicator,
      shape: 'polygon',
      splitNumber: 5,
      name: {
        textStyle: {
          color: '#558b2f',
          fontSize: 12,
          fontWeight: 'bold'
        }
      },
      splitLine: {
        lineStyle: {
          color: ['#c8e6c9', '#c8e6c9', '#c8e6c9', '#c8e6c9', '#c8e6c9']
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(200, 230, 201, 0.1)', 'rgba(200, 230, 201, 0.2)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#7cb342'
        }
      }
    },
    series: [{
      name: 'Progresos',
      type: 'radar',
      data: [{
        value: values,
        name: 'Mis Progresos',
        areaStyle: {
          color: 'rgba(255, 152, 0, 0.3)'
        },
        lineStyle: {
          color: '#ff9800',
          width: 2
        },
        itemStyle: {
          color: '#ff9800'
        }
      }]
    }]
  }

  chartInstance.setOption(option)

  // Redimensionar cuando cambie el tamaño de la ventana
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
}

// Formatear fecha completa
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Formatear fecha corta
const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Formatear hora
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split(' ')
  return parts.length > 1 ? parts[1] : ''
}

// Formatear fecha y hora
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const dateFormatted = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  const timeFormatted = dateStr.split(' ')[1] || ''
  return `${dateFormatted} ${timeFormatted}`
}
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

// Paleta de colores
$color-forest-dark: #1b5e20;
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-orange: #ff9800;
$color-orange-light: #ffb74d;
$color-orange-dark: #f57c00;
$pastel-mint: #c8e6c9;
$pastel-sage: #f1f8e9;
$pastel-orange: #ffe0b2;

// ===== PÁGINA PRINCIPAL =====
.profile-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%);
  min-height: 100vh;
  transition: all 0.3s ease;

  &.dark-mode {
    background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
  }
}

// ===== HEADER =====
.page-header {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 50%, $color-moss 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(27, 94, 32, 0.25);
  animation: slideInDown 0.6s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.user-avatar {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.4);
}

.user-info {
  flex: 1;
}

.page-title {
  color: white;
  font-size: 1.8em;
  font-weight: 800;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);

  .title-icon {
    animation: pulse 3s ease infinite;
  }
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1em;
  font-weight: 500;
  margin: 0 0 12px 0;
}

.user-roles {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

// ===== CARDS =====
.info-card,
.evaluations-card,
.progress-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border-color: $color-leaf;
  }
}

.card-header {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.card-title {
  font-size: 1.2em;
  font-weight: 700;
  flex: 1;
}

// ===== DATOS PERSONALES =====
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba($color-forest, 0.05);
  border-radius: 12px;
  border: 1px solid rgba($color-forest, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba($color-forest, 0.1);
    border-color: $color-leaf;
    transform: translateY(-2px);
  }
}

.info-label {
  font-weight: 600;
  color: $color-forest;
  min-width: 100px;
}

.info-value {
  font-weight: 500;
  color: $color-moss;
}

.bio-section {
  padding: 16px;
  background: rgba($color-orange, 0.05);
  border-radius: 12px;
  border: 1px solid rgba($color-orange, 0.2);
}

.bio-text {
  margin: 8px 0 0 28px;
  color: $color-moss;
  line-height: 1.6;
}

// ===== EVALUACIONES =====
.evaluations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.evaluation-card {
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.15);
  transition: all 0.3s ease;

  &:hover {
    border-color: $color-orange;
    box-shadow: 0 4px 12px rgba($color-orange, 0.2);
    transform: translateY(-4px);
  }
}

.eval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cualidad-name {
  font-weight: 700;
  font-size: 1.05em;
  color: $color-forest;
}

.eval-date,
.progress-date {
  display: flex;
  align-items: center;
  font-size: 0.85em;
  color: $color-moss;
  margin-top: 8px;
}

.eval-comment,
.progress-comment {
  margin-top: 12px;
  padding: 12px;
  background: rgba($color-orange, 0.1);
  border-radius: 8px;
  border-left: 3px solid $color-orange;
  font-size: 0.9em;
  color: $color-moss;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

// ===== PROGRESOS =====
.search-progress {
  min-width: 250px;
}

.radar-chart {
  width: 100%;
  height: 400px;
  margin: 20px 0;
}

.progress-list {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: $pastel-sage;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-orange;
    border-radius: 4px;

    &:hover {
      background: $color-orange-dark;
    }
  }
}

.progress-item {
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.15);
  transition: all 0.3s ease;

  &:hover {
    border-color: $color-leaf;
    box-shadow: 0 4px 12px rgba($color-forest, 0.15);
    transform: translateX(4px);
  }
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.progress-user {
  padding: 8px 12px;
  background: rgba($color-forest, 0.05);
  border-radius: 8px;
  border-left: 3px solid $color-leaf;
}

// ===== EMPTY STATE =====
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

// ===== ANIMACIONES =====
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

// ===== RESPONSIVO =====
@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .page-header {
    padding: 20px;
    margin-bottom: 20px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.4em;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .evaluations-grid {
    grid-template-columns: 1fr;
  }

  .radar-chart {
    height: 300px;
  }

  .search-progress {
    min-width: 100%;
    margin-top: 12px;
  }

  .card-header {
    flex-wrap: wrap;
  }
}

// ===== MODO OSCURO =====
:deep(.body--dark) {
  .profile-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
  }

  .info-card,
  .evaluations-card,
  .progress-card {
    background: #2a2a2a;
    color: #e0e0e0;
  }

  .info-item {
    background: rgba($color-forest, 0.15);
    border-color: rgba($color-forest, 0.3);
  }

  .info-label {
    color: $color-leaf;
  }

  .info-value {
    color: #e0e0e0;
  }

  .evaluation-card,
  .progress-item {
    background: #333;
    border-color: rgba($color-forest, 0.3);
  }

  .cualidad-name {
    color: $color-leaf;
  }
}
</style>
