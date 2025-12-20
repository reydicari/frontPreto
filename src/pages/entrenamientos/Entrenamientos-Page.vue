<template>
  <q-page class="q-pa-md page-container" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header con estadísticas -->
    <div class="page-header q-mb-lg">
      <div class="header-content">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-sm-auto">
            <div class="header-title">
              <q-icon name="fitness_center" size="42px" class="q-mr-sm" />
              <h2 class="page-title">Gestión de Entrenamientos</h2>
            </div>
            <p class="header-subtitle">Administra programas y sesiones de entrenamiento</p>
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn class="btn-add-header" icon="add_circle" label="Nuevo Entrenamiento" @click="showTrainingDialog"
              unelevated no-caps />
          </div>
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="stats-container row q-gutter-md q-mt-md">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <q-icon name="fitness_center" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ trainings.length }}</div>
            <div class="stat-label">Total Entrenamientos</div>
          </div>
        </div>

        <div class="stat-card stat-card-active">
          <div class="stat-icon">
            <q-icon name="play_circle" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.enMarcha }}</div>
            <div class="stat-label">En Marcha</div>
          </div>
        </div>

        <div class="stat-card stat-card-pending">
          <div class="stat-icon">
            <q-icon name="schedule" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.sinComenzar }}</div>
            <div class="stat-label">Sin Comenzar</div>
          </div>
        </div>

        <div class="stat-card stat-card-suspended">
          <div class="stat-icon">
            <q-icon name="pause_circle" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.suspendidos }}</div>
            <div class="stat-label">Suspendidos</div>
          </div>
        </div>

        <div class="stat-card stat-card-finished">
          <div class="stat-icon">
            <q-icon name="check_circle" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.terminados }}</div>
            <div class="stat-label">Terminados</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de herramientas -->
    <q-card class="q-mb-md toolbar-card">
      <q-card-section>
        <div class="row items-center q-col-gutter-sm">
          <!-- Buscador -->
          <q-input v-model="searchTerm" clearable outlined dense placeholder="Buscar por nombre, paquete, ubicación..."
            class="col-12 search-input">
            <template v-slot:prepend>
              <q-icon name="search" class="text-brown-7" />
            </template>
          </q-input>
        </div>

        <!-- Filtros avanzados -->
        <q-expansion-item v-model="filtersExpanded" class="q-mt-md filters-expansion" icon="filter_list">
          <template v-slot:header>
            <div class="filters-header">
              <q-icon name="tune" size="24px" class="q-mr-sm" />
              <span class="filters-title">Filtros Avanzados</span>
              <q-badge v-if="activeFiltersCount > 0" color="brown-7" class="q-ml-sm">
                {{ activeFiltersCount }}
              </q-badge>
            </div>
          </template>

          <div class="filters-body q-pt-md">
            <div class="row q-col-gutter-md">
              <q-select v-model="filterDiscipline" emit-value map-options :options="disciplineOptions" option-value="id"
                option-label="nombre" label="Disciplina" outlined dense clearable class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="sports" color="green-7" />
                </template>
              </q-select>

              <q-select v-model="filterPaquete" emit-value map-options :options="paqueteOptions" option-value="id"
                option-label="nombre" label="Paquete" outlined dense clearable class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="inventory_2" color="brown-7" />
                </template>
              </q-select>

              <q-select v-model="filterUbicacion" emit-value map-options :options="ubicacionesOptions" option-value="id"
                option-label="nombre" label="Ubicación" outlined dense clearable class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="location_on" color="orange-7" />
                </template>
              </q-select>

              <q-select v-model="filterStatus" :options="statusOptions" emit-value option-value="value"
                option-label="label" label="Estado" outlined dense clearable class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="assignment" color="blue-7" />
                </template>
              </q-select>

              <q-input v-model="filterDateFrom" label="Fecha inicio desde" type="date" outlined dense
                class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="event" color="green-7" />
                </template>
              </q-input>

              <q-input v-model="filterDateTo" label="Fecha inicio hasta" type="date" outlined dense
                class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="event" color="green-7" />
                </template>
              </q-input>
            </div>
            <div class="row justify-end q-mt-md">
              <q-btn label="Limpiar filtros" flat icon="clear_all" @click="clearFilters" class="btn-clear-filters" />
            </div>
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>

    <!-- Cards de entrenamientos (responsivo) -->
    <div class="trainings-grid">
      <q-card v-for="training in filteredTrainings" :key="training.id" class="training-card"
        @click="viewTrainingDetails(training)">
        <q-card-section class="card-header">
          <div class="training-icon-container">
            <q-avatar size="64px" class="training-avatar">
              <q-icon :name="training.paquete?.disciplina?.icono || 'fitness_center'" size="32px" />
            </q-avatar>
          </div>

          <div class="training-info">
            <div class="training-name">{{ training.nombre }}</div>
            <div class="training-discipline">
              <q-icon name="sports" size="16px" />
              <span>{{ training.paquete?.disciplina?.nombre || 'Sin disciplina' }}</span>
            </div>
            <div class="training-package">
              <q-icon name="inventory_2" size="16px" />
              <span>{{ training.paquete?.nombre || 'Sin paquete' }}</span>
            </div>
          </div>

          <div class="training-status">
            <q-badge :color="getStatusColor(training.estado)" :label="getStatusLabel(training.estado)"
              class="status-badge" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="card-body">
          <div class="info-row">
            <q-icon name="event" size="18px" class="info-icon text-green-7" />
            <span class="info-label">Inicio:</span>
            <span class="info-value">{{ formatDate(training.fecha_inicio) }}</span>
          </div>

          <div class="info-row">
            <q-icon name="event_available" size="18px" class="info-icon text-brown-7" />
            <span class="info-label">Fin:</span>
            <span class="info-value">{{ training.fecha_fin ? formatDate(training.fecha_fin) : 'Indefinido' }}</span>
          </div>

          <div class="info-row">
            <q-icon name="location_on" size="18px" class="info-icon text-orange-7" />
            <span class="info-label">Ubicación:</span>
            <q-btn v-if="training.ubicacion" size="sm" dense rounded outline color="orange" class="ubicacion-btn"
              :label="training.ubicacion.nombre" @click.stop="goToUbicacion(training.ubicacion.id)">
              <q-tooltip>Ver en mapa</q-tooltip>
            </q-btn>
            <span v-else class="info-value">Sin ubicación</span>
          </div>

          <div v-if="training.entrenadores && training.entrenadores.length > 0" class="info-row">
            <q-icon name="person" size="18px" class="info-icon text-blue-7" />
            <span class="info-label">Entrenadores:</span>
            <span class="info-value">{{ training.entrenadores.length }}</span>
          </div>

          <div v-if="training.observacion" class="info-row info-observation">
            <q-icon name="note" size="18px" class="info-icon text-grey-7" />
            <span class="info-label">Nota:</span>
            <span class="info-value observation-text">{{ training.observacion }}</span>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions class="card-actions">
          <q-btn class="btn-action btn-edit" round icon="edit" @click.stop="editTraining(training)"
            :disable="training.estado === -1">
            <q-tooltip>Editar</q-tooltip>
          </q-btn>

          <q-btn v-if="training.estado === 1" class="btn-action btn-suspend" round icon="pause"
            @click.stop="suspendTraining(training)">
            <q-tooltip>Suspender</q-tooltip>
          </q-btn>

          <q-btn v-if="training.estado === -1" class="btn-action btn-resume" round icon="play_arrow"
            @click.stop="resumeTraining(training)">
            <q-tooltip>Reanudar</q-tooltip>
          </q-btn>

          <q-btn class="btn-action btn-view" round icon="visibility" @click.stop="viewTrainingDetails(training)">
            <q-tooltip>Ver detalles</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>

      <div v-if="filteredTrainings.length === 0" class="col-12 text-center q-pa-xl">
        <q-icon name="fitness_center" size="64px" color="grey-5" />
        <p class="text-grey-7 q-mt-md">No se encontraron entrenamientos</p>
      </div>
    </div>

    <!-- Diálogo para crear/editar entrenamiento (componente separado) -->
    <NuevoEntrenamientoDialog v-model:modelValue="trainingDialog" :training="editMode ? currentTraining : {}"
      :edit-mode="editMode" :paquetes="paqueteOptions" :ubicaciones="ubicacionesOptions" @save="onDialogSave"
      @cancel="() => trainingDialog = false" />

    <!-- Diálogo de detalles -->
    <q-dialog v-model="detailsDialog" :maximized="$q.screen.lt.md">
      <DetalleEntrenamiento :training="selectedTraining" />
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import DetalleEntrenamiento from './Detalle-entrenamiento.vue'
import NuevoEntrenamientoDialog from './NuevoEntrenamientoDialog.vue'
import { listarDisciplinas } from "stores/disciplina-store.js";
import { crearEntrenamiento, listarEntrenamientos, modificarEntrenamiento } from "stores/entrenamientos-store.js";
import { listar, listarTodosEstudiantes } from 'stores/persona-store.js'
import { listarPaquetes } from "stores/paquete-store.js";
import { listarUbicaciones } from "stores/ubicacion-store.js";

// Mock data para coaches (se carga dinámicamente)
const mockCoaches = ref([])
const coachesList = ref([])
const $q = useQuasar()
const router = useRouter()

// Función para navegar a ubicaciones con focus
const goToUbicacion = (id) => {
  if (!id) return
  router.push({ path: '/ubicaciones', query: { focus: id } })
}

// Paquetes / ubicaciones demo (en la app real vendrían de la API)
const paqueteOptions = ref([])
const ubicacionesOptions = ref([])

// Estado del componente
const trainings = ref([])
const loading = ref(false)
const searchTerm = ref('')
const filtersExpanded = ref(false)
const filterDiscipline = ref(null)
const filterStatus = ref(null)
const filterDateFrom = ref(null)
const filterDateTo = ref(null)
const trainingDialog = ref(false)
const detailsDialog = ref(false)
const editMode = ref(false)
// helper for coach search removed (handled inside dialog)
const selectedTraining = ref(null)

// Estadísticas computadas
const estadisticas = computed(() => ({
  enMarcha: trainings.value.filter(t => t.estado === 1).length,
  sinComenzar: trainings.value.filter(t => t.estado === 2).length,
  suspendidos: trainings.value.filter(t => t.estado === -1).length,
  terminados: trainings.value.filter(t => t.estado === 0).length
}))

// Contador de filtros activos
const activeFiltersCount = computed(() => {
  let count = 0
  if (filterDiscipline.value) count++
  if (filterPaquete.value) count++
  if (filterUbicacion.value) count++
  if (filterStatus.value !== null && filterStatus.value !== undefined) count++
  if (filterDateFrom.value) count++
  if (filterDateTo.value) count++
  return count
})

// Datos del entrenamiento actual
const currentTraining = ref({
  id: null,
  nombre: '',
  id_disciplina: null,
  dias: [],
  estado: 1,
  hora_inicio: '16:00',
  horas: 2,
  fecha_inicio: '',
  fecha_fin: '',
  observacion: '',
  duracion_meses: 3,
  entrenadores: []
})
// firstStepForm handled inside dialog component

// step logic handled in dialog
// Opciones para filtros y selects
const disciplineOptions = ref([])
const statusOptions = [
  { label: 'Suspendido', value: -1 },
  { label: 'Terminado', value: 0 },
  { label: 'En marcha', value: 1 },
  { label: 'Sin comenzar', value: 2 }
]

// Filtros adicionales
const filterPaquete = ref(null)
const filterUbicacion = ref(null)
// days options are handled inside the dialog component

// Obtener entrenamientos desde el store
const fetchTrainings = async () => {
  loading.value = true
  try {
    const response = await listarEntrenamientos()
    trainings.value = Array.isArray(response) ? response : (response?.data || [])
    console.log("Entrenamientos ", trainings.value);

    // Normalizar entrenamientos (mapear ids a objetos de paquete/ubicacion si es necesario)
    normalizeTrainings()
  } catch (error) {
    console.error('Error cargando entrenamientos:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los entrenamientos',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// Normalizar trainings: si paquete/ubicacion vienen como ids, reemplazarlos
const normalizeTrainings = () => {
  if (!Array.isArray(trainings.value)) return
  trainings.value = trainings.value.map(t => {
    const copy = { ...t }

    // Paquete puede venir como id o como objeto
    if (copy.paquete && (typeof copy.paquete === 'number' || typeof copy.paquete === 'string')) {
      copy.paquete = paqueteOptions.value.find(p => String(p.id) === String(copy.paquete)) || null
    }

    // Si paquete existe y su disciplina es id, mapearlo
    if (copy.paquete && copy.paquete.disciplina && (typeof copy.paquete.disciplina === 'number' || typeof copy.paquete.disciplina === 'string')) {
      copy.paquete.disciplina = disciplineOptions.value.find(d => String(d.id) === String(copy.paquete.disciplina)) || { id: copy.paquete.disciplina }
    }

    // Ubicación puede venir como id o como objeto
    if (copy.ubicacion && (typeof copy.ubicacion === 'number' || typeof copy.ubicacion === 'string')) {
      copy.ubicacion = ubicacionesOptions.value.find(u => String(u.id) === String(copy.ubicacion)) || null
    }

    // Entrenadores: puede venir como ids o como objetos. Mapear a objetos si tenemos la lista de coaches
    if (Array.isArray(copy.entrenadores)) {
      const mapped = copy.entrenadores.map(e => {
        if (e && typeof e === 'object') return e
        // buscar en coachesList
        const found = coachesList.value.find(c => String(c.id) === String(e))
        return found || (typeof e === 'object' ? e : { id: e })
      })
      copy.entrenadores = mapped
    } else {
      copy.entrenadores = []
    }

    return copy
  })
}

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('es-ES', options)
}

// Filtrar entrenamientos
const filteredTrainings = computed(() => {
  let result = trainings.value || []

  // Filtro de búsqueda general: nombre, paquete, disciplina, ubicacion, observación
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(training => {
      const nombre = String(training.nombre || '').toLowerCase()
      const observ = String(training.observacion || '').toLowerCase()
      const paqueteNombre = String(training.paquete?.nombre || '').toLowerCase()
      const disciplinaNombre = String(training.paquete?.disciplina?.nombre || '').toLowerCase()
      const ubicacionNombre = String(training.ubicacion?.nombre || '').toLowerCase()

      return (
        nombre.includes(term) ||
        observ.includes(term) ||
        paqueteNombre.includes(term) ||
        disciplinaNombre.includes(term) ||
        ubicacionNombre.includes(term)
      )
    })
  }

  // Filtro por disciplina (por id de disciplina)
  if (filterDiscipline.value) {
    result = result.filter(t => t.paquete?.disciplina?.id === filterDiscipline.value)
  }

  // Filtro por paquete
  if (filterPaquete.value) {
    result = result.filter(t => t.paquete?.id === filterPaquete.value)
  }

  // Filtro por ubicación
  if (filterUbicacion.value) {
    result = result.filter(t => t.ubicacion?.id === filterUbicacion.value)
  }

  // Filtro por estado
  if (filterStatus.value !== null && filterStatus.value !== undefined) {
    result = result.filter(training => training.estado === filterStatus.value)
  }

  // Filtro por fecha de inicio
  if (filterDateFrom.value) {
    result = result.filter(
      training => training.fecha_inicio && new Date(training.fecha_inicio) >= new Date(filterDateFrom.value)
    )
  }

  if (filterDateTo.value) {
    result = result.filter(
      training => training.fecha_inicio && new Date(training.fecha_inicio) <= new Date(filterDateTo.value)
    )
  }

  return result
})
// entrenadores handled inside dialog/component

// Mostrar diálogo para crear entrenamiento
const showTrainingDialog = () => {
  editMode.value = false
  currentTraining.value = {
    id: null,
    nombre: '',
    estado: 2, // Sin comenzar por defecto
    fecha_inicio: '',
    fecha_fin: '',
    observacion: '',
    dias: [],
    entrenadores: [],
    id_paquete: null,
    id_ubicacion: null,
    id_disciplina: null
  }
  trainingDialog.value = true
}

// Editar entrenamiento
const editTraining = (training) => {
  editMode.value = true
  currentTraining.value = {
    ...training,
    // Adaptar los datos si vienen en formato diferente
    dias: Array.isArray(training.dias) ? training.dias : (training.dias ? training.dias.split(',') : []),
    entrenadores: training.entrenadores || [],
    // Asegurar que tenemos los campos necesarios para el formulario
    id_paquete: training.paquete?.id || null,
    id_ubicacion: training.ubicacion?.id || null,
    id_disciplina: training.paquete?.disciplina?.id || null
  }
  trainingDialog.value = true
}

// Handler cuando el dialogo emite save
const onDialogSave = async (payload) => {
  // adapt payload and reuse saveTraining behavior
  currentTraining.value = { ...payload }

  // mimic saveTraining logic
  const trainingData = {
    ...currentTraining.value,
    // Prefer full objects if the dialog provided them (entrenadores_obj),
    // otherwise store ids. For local list we keep objects when available.
    entrenadores: Array.isArray(payload?.entrenadores_obj) && payload.entrenadores_obj.length
      ? payload.entrenadores_obj
      : (currentTraining.value.entrenadores || []).map(c => (c && c.id) ? c : c)
  }
  console.log(trainingData);

  if (editMode.value) {
    console.log('modificando');
    await modificarEntrenamiento(trainingData)
  } else {
    console.log('creando');

    await crearEntrenamiento(trainingData)
  }
  trainingDialog.value = false
  fetchTrainings()

}

// stepper/coach helpers moved to dialog component

// Suspender entrenamiento
const suspendTraining = (training) => {
  $q.dialog({
    title: 'Confirmar suspensión',
    message: `¿Estás seguro de que quieres suspender el entrenamiento "${training.nombre}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    // Aquí harías la llamada a la API para suspender
    const index = trainings.value.findIndex(t => t.id === training.id)
    if (index !== -1) {
      trainings.value[index].estado = -1
      // Aquí también podrías agregar usuario_cancela si es necesario
    }
    $q.notify({
      type: 'positive',
      message: 'Entrenamiento suspendido correctamente'
    })
  })
}

// Reanudar entrenamiento
const resumeTraining = (training) => {
  $q.dialog({
    title: 'Confirmar reanudación',
    message: `¿Estás seguro de que quieres reanudar el entrenamiento "${training.nombre}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    // Aquí harías la llamada a la API para reanudar
    const index = trainings.value.findIndex(t => t.id === training.id)
    if (index !== -1) {
      trainings.value[index].estado = 1
    }
    $q.notify({
      type: 'positive',
      message: 'Entrenamiento reanudado correctamente'
    })
  })
}

// Ver detalles del entrenamiento
const viewTrainingDetails = (training) => {
  console.log('entrenamiento para details: ', training)
  selectedTraining.value = training
  detailsDialog.value = true
}

// Limpiar filtros
const clearFilters = () => {
  searchTerm.value = ''
  filterDiscipline.value = null
  filterPaquete.value = null
  filterUbicacion.value = null
  filterStatus.value = null
  filterDateFrom.value = null
  filterDateTo.value = null
}

// formatDate is not used in this page; details component handles formatting

// Obtener color para el estado (-1: suspendido, 0: terminado, 1: en marcha, 2: sin comenzar)
const getStatusColor = (status) => {
  const colors = {
    '-1': 'orange',   // Suspendido
    0: 'grey',        // Terminado
    1: 'positive',    // En marcha
    2: 'warning'      // Sin comenzar
  }
  return colors[status] || 'grey'
}

// Obtener texto para el estado
const getStatusLabel = (status) => {
  const labels = {
    '-1': 'Suspendido',
    0: 'Terminado',
    1: 'En marcha',
    2: 'Sin comenzar'
  }
  return labels[status] || 'Desconocido'
}

// Cargar datos iniciales
onMounted(async () => {
  // Cargar disciplinas para filtros
  const xd = await listarTodosEstudiantes()
  console.log('SOLO ESTUDIANTES: ', xd);

  mockCoaches.value = await listarDisciplinas()
  disciplineOptions.value = mockCoaches.value
  // Cargar paquetes y ubicaciones para filtros
  try {
    const paquetesResp = await listarPaquetes()
    paqueteOptions.value = Array.isArray(paquetesResp) ? paquetesResp : (paquetesResp?.data || [])
  } catch (e) {
    console.warn('No se pudieron cargar paquetes:', e)
  }

  try {
    const ubicResp = await listarUbicaciones()
    ubicacionesOptions.value = Array.isArray(ubicResp) ? ubicResp : (ubicResp?.data || [])
  } catch (e) {
    console.warn('No se pudieron cargar ubicaciones:', e)
  }

  // Cargar lista de entrenadores para normalizar entrenadores por id -> objeto
  try {
    const entrenadoresResp = await listar({ tipo_persona: 'entrenador' })
    coachesList.value = Array.isArray(entrenadoresResp) ? entrenadoresResp : (entrenadoresResp?.data || [])
  } catch (e) {
    console.warn('No se pudieron cargar entrenadores:', e)
  }

  // Cargar entrenamientos directamente en trainings
  fetchTrainings()
})


</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

/* Paleta de colores verde-marrón tierra/naturaleza */
$color-forest: #2e7d32; // Verde bosque
$color-moss: #558b2f; // Verde musgo
$color-leaf: #7cb342; // Verde hoja
$color-lime: #9ccc65; // Verde lima
$color-sage: #8bc34a; // Verde salvia
$color-bark: #5d4037; // Marrón corteza
$color-wood: #795548; // Marrón madera
$color-earth: #8d6e63; // Marrón tierra
$color-clay: #a1887f; // Arcilla
$color-sand: #bcaaa4; // Arena

$pastel-mint: #c8e6c9; // Menta pastel
$pastel-lime: #dcedc8; // Lima pastel
$pastel-sage: #f1f8e9; // Salvia pastel
$pastel-sand: #efebe9; // Arena pastel
$pastel-clay: #d7ccc8; // Arcilla pastel

/* Fondo degradado tierra */
.page-container {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-lime 50%, $pastel-sand 100%);
  min-height: 100vh;
}

/* Header */
.page-header {
  animation: fadeIn 0.5s ease-in;
}

.header-content {
  padding: 24px;
  border-radius: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  color: $color-forest;

  .q-icon {
    color: $color-moss;
  }
}

.page-title {
  color: $color-forest;
  font-size: 2.2em;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  display: inline-block;
}

.header-subtitle {
  color: $color-wood;
  margin: 8px 0 0 54px;
  font-size: 1em;
  font-weight: 400;
}

.btn-add-header {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  font-size: 1em;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

/* Estadísticas */
.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.stat-card-total {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  border-left-color: $color-leaf;
}

.stat-card-active {
  background: linear-gradient(135deg, $color-leaf 0%, $color-lime 100%);
  border-left-color: $color-sage;
}

.stat-card-pending {
  background: linear-gradient(135deg, $color-lime 0%, $color-sage 100%);
  border-left-color: $color-lime;
}

.stat-card-suspended {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  border-left-color: $color-bark;
}

.stat-card-finished {
  background: linear-gradient(135deg, $color-earth 0%, $color-clay 100%);
  border-left-color: $color-sand;
}

.stat-icon {
  .q-icon {
    font-size: 36px;
    color: white;
    opacity: 0.9;
  }
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2em;
  font-weight: 700;
  color: white;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Toolbar */
.toolbar-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid $color-forest;
  overflow: hidden;
}

.search-input {
  :deep(.q-field__control) {
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      border-color: $color-moss;
      box-shadow: 0 0 0 1px $pastel-mint;
    }
  }

  :deep(.q-field--focused .q-field__control) {
    border-color: $color-forest;
    box-shadow: 0 0 0 2px $pastel-lime;
  }
}

/* Filtros */
.filters-expansion {
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
  border-radius: 12px;
  overflow: hidden;
  color: white;

  :deep(.q-item__section--avatar) {
    color: white;
  }

  :deep(.q-expansion-item__container) {
    border-radius: 12px;
  }
}

.filters-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.05em;
}

.filters-title {
  color: white;
}

.filters-body {
  background: white;
  padding: 16px;
  border-radius: 0 0 12px 12px;
}

.btn-clear-filters {
  color: $color-forest;
  font-weight: 600;

  &:hover {
    background: $pastel-mint;
  }
}

/* Grid de entrenamientos */
.trainings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  animation: fadeIn 0.6s ease-in;
}

/* Cards de entrenamientos */
.training-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  background: white;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    border-color: $color-moss;
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 100%);
}

.training-icon-container {
  flex-shrink: 0;
}

.training-avatar {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .q-icon {
    color: white;
  }
}

.training-info {
  flex: 1;
  min-width: 0;
}

.training-name {
  font-size: 1.2em;
  font-weight: 700;
  color: $color-forest;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.training-discipline {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $color-moss;
  font-size: 0.9em;
  margin-bottom: 4px;

  .q-icon {
    color: $color-leaf;
  }
}

.training-package {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $color-wood;
  font-size: 0.9em;

  .q-icon {
    color: $color-bark;
  }
}

.training-status {
  flex-shrink: 0;
}

.status-badge {
  font-weight: 600;
  padding: 6px 12px;
  font-size: 0.85em;
}

.card-body {
  padding: 16px 20px;
  background: white;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid $pastel-lime;

  &:last-child {
    border-bottom: none;
  }
}

.info-row.info-observation {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.info-icon {
  flex-shrink: 0;
}

.info-label {
  font-weight: 600;
  color: #6b7280;
  min-width: 80px;
  font-size: 0.85em;
}

.info-value {
  color: #374151;
  font-size: 0.95em;
  flex: 1;
}

.ubicacion-btn {
  min-width: 130px;
  max-width: 200px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
  }
}

.observation-text {
  font-size: 0.9em;
  font-style: italic;
  color: #6b7280;
  padding-left: 26px;
  word-wrap: break-word;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, white 0%, $pastel-sage 100%);
  border-top: 1px solid $pastel-lime;
}

.btn-action {
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.btn-edit {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;

  &:hover {
    box-shadow: 0 4px 12px rgba(85, 139, 47, 0.3);
  }
}

.btn-suspend {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;

  &:hover {
    box-shadow: 0 4px 12px rgba(121, 85, 72, 0.3);
  }
}

.btn-resume {
  background: linear-gradient(135deg, $color-leaf 0%, $color-lime 100%);
  color: white;

  &:hover {
    box-shadow: 0 4px 12px rgba(124, 179, 66, 0.3);
  }
}

.btn-view {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;

  &:hover {
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
  }
}

/* Animaciones */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 1023px) {
  .stats-container {
    .stat-card {
      min-width: calc(50% - 8px);
    }
  }

  .trainings-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 959px) {
  .page-title {
    font-size: 1.8em;
  }

  .header-subtitle {
    margin-left: 0;
    margin-top: 8px;
  }

  .btn-add-header {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .page-container {
    padding: 12px !important;
  }

  .header-content {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5em;
  }

  .header-subtitle {
    font-size: 0.9em;
  }

  .stats-container {
    .stat-card {
      min-width: 100%;
      padding: 16px;
    }

    .stat-number {
      font-size: 1.8em;
    }

    .stat-icon .q-icon {
      font-size: 28px;
    }
  }

  .trainings-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .training-card {
    .card-header {
      padding: 16px;
    }

    .training-avatar {
      width: 52px;
      height: 52px;

      .q-icon {
        font-size: 24px;
      }
    }

    .training-name {
      font-size: 1.1em;
    }

    .card-actions {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>
