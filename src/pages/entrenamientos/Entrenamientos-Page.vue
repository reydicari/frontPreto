<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <h2 class="text-h4 q-ma-none">Gestión de Entrenamientos</h2>
    </div>

    <!-- Barra de herramientas -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <!-- Botón para agregar entrenamiento -->
          <q-btn color="primary" icon="add" label="Nuevo Entrenamiento" @click="showTrainingDialog" />

          <!-- Buscador -->
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar entrenamientos..." class="col-md-4">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Filtros avanzados -->
        <q-expansion-item v-model="filtersExpanded" label="Filtros avanzados" class="q-mt-sm">
          <div class="row q-col-gutter-md q-pt-md">
            <q-select v-model="filterDiscipline" :options="disciplineOptions" option-value="id" option-label="nombre"
              label="Disciplina" outlined dense clearable class="col-md-3 col-sm-6 col-xs-12" />
            <q-select v-model="filterStatus" :options="statusOptions" label="Estado" outlined dense clearable
              class="col-md-3 col-sm-6 col-xs-12" />
            <q-input v-model="filterDateFrom" label="Fecha inicio desde" type="date" outlined dense
              class="col-md-3 col-sm-6 col-xs-12" />
            <q-input v-model="filterDateTo" label="Fecha inicio hasta" type="date" outlined dense
              class="col-md-3 col-sm-6 col-xs-12" />
          </div>
          <div class="row justify-end q-mt-sm">
            <q-btn label="Limpiar filtros" flat color="primary" @click="clearFilters" />
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>

    <!-- Tabla de entrenamientos -->
    <q-card>
      <q-table :rows="filteredTrainings" :columns="columns" row-key="id" :loading="loading" :pagination="pagination"
        :rows-per-page-options="[5, 10, 20, 50]">

        <!-- Columna de índice -->
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.rowIndex + 1 }}
          </q-td>
        </template>

        <!-- Columna de estado -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.row.estado)" :label="getStatusLabel(props.row.estado)" />
          </q-td>
        </template>

        <!-- Columna de fecha fin -->
        <template v-slot:body-cell-fecha_fin="props">
          <q-td :props="props">
            <span v-if="props.row.fecha_fin">{{ formatDate(props.row.fecha_fin) }}</span>
            <q-badge v-else color="info" label="Indefinido" />
          </q-td>
        </template>

        <!-- Columna de paquete -->
        <template v-slot:body-cell-paquete="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-xs">
              <q-icon :name="props.row.paquete?.disciplina?.icono || 'sports'" />
              <span>{{ props.row.paquete?.nombre || 'Sin paquete' }}</span>
            </div>
          </q-td>
        </template>

        <!-- Columna de ubicación -->
        <template v-slot:body-cell-ubicacion="props">
          <q-td :props="props">
            {{ props.row.ubicacion?.nombre || 'Sin ubicación' }}
          </q-td>
        </template>

        <!-- Columna de acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn icon="edit" color="primary" flat dense @click="editTraining(props.row)"
              :disable="props.row.estado === -1">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn icon="pause" color="warning" flat dense @click="suspendTraining(props.row)"
              v-if="props.row.estado === 1">
              <q-tooltip>Suspender</q-tooltip>
            </q-btn>
            <q-btn icon="play_arrow" color="positive" flat dense @click="resumeTraining(props.row)"
              v-if="props.row.estado === -1">
              <q-tooltip>Reanudar</q-tooltip>
            </q-btn>
            <q-btn icon="visibility" color="info" flat dense @click="viewTrainingDetails(props.row)">
              <q-tooltip>Ver detalles</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Diálogo para crear/editar entrenamiento (componente separado) -->
    <NuevoEntrenamientoDialog v-model:modelValue="trainingDialog" :training="editMode ? currentTraining : {}"
      :edit-mode="editMode" :paquetes="paqueteOptions" :ubicaciones="ubicacionesOptions" @save="onDialogSave"
      @cancel="() => trainingDialog = false" />

    <!-- Diálogo de detalles -->
    <q-dialog v-model="detailsDialog">
      <DetalleEntrenamiento :training="selectedTraining" />
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import DetalleEntrenamiento from './Detalle-entrenamiento.vue'
import NuevoEntrenamientoDialog from './NuevoEntrenamientoDialog.vue'
import { listarDisciplinas } from "stores/disciplina-store.js";
import { crearEntrenamiento, listarEntrenamientos } from "stores/entrenamientos-store.js";

// Mock data para coaches (se carga dinámicamente)
const mockCoaches = []
const $q = useQuasar()

// Paquetes / ubicaciones demo (en la app real vendrían de la API)
const paqueteOptions = ref([
  { id: 1, nombre: 'Paquete A', max_estudiantes: 20, edad_minima: 6, edad_maxima: 12, horarios: [{ id: 1, dia: 1, hora_inicio: '08:00', hora_fin: '10:00' }] },
  { id: 2, nombre: 'Paquete B', max_estudiantes: 15, edad_minima: 10, edad_maxima: 16, horarios: [] }
])
const ubicacionesOptions = ref([
  { id: 1, nombre: 'Cancha Principal' },
  { id: 2, nombre: 'Gimnasio' }
])

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
  { label: 'Activo', value: 1 },
  { label: 'Inactivo', value: 0 },
  { label: 'Completado', value: 2 }
]
// days options are handled inside the dialog component

// Columnas de la tabla
const columns = [
  {
    name: 'index',
    label: '#',
    field: (row, index) => index + 1,
    align: 'center',
    sortable: false
  },
  {
    name: 'nombre',
    label: 'Nombre',
    field: 'nombre',
    align: 'left',
    sortable: true
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'center'
  },
  {
    name: 'fecha_inicio',
    label: 'Fecha Inicio',
    field: 'fecha_inicio',
    align: 'left',
    sortable: true,
    format: val => formatDate(val)
  },
  {
    name: 'fecha_fin',
    label: 'Fecha Fin',
    field: 'fecha_fin',
    align: 'left'
  },
  {
    name: 'paquete',
    label: 'Paquete',
    field: 'paquete',
    align: 'left'
  },
  {
    name: 'ubicacion',
    label: 'Ubicación',
    field: 'ubicacion',
    align: 'left'
  },
  {
    name: 'actions',
    label: 'Acciones',
    align: 'center'
  }
]

// Paginación
const pagination = ref({
  sortBy: 'nombre',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

// Obtener entrenamientos desde el store
const fetchTrainings = async () => {
  loading.value = true
  try {
    const response = await listarEntrenamientos()
    trainings.value = Array.isArray(response) ? response : (response?.data || [])
    pagination.value.rowsNumber = trainings.value.length
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

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('es-ES', options)
}

// Filtrar entrenamientos
const filteredTrainings = computed(() => {
  let result = trainings.value

  // Filtro de búsqueda general
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(
      training =>
        training.nombre.toLowerCase().includes(term) ||
        training.disciplina.toLowerCase().includes(term) ||
        training.observacion?.toLowerCase().includes(term)
    )
  }

  // Filtro por disciplina
  if (filterDiscipline.value) {
    result = result.filter(training => training.disciplina === filterDiscipline.value)
  }

  // Filtro por estado
  if (filterStatus.value !== null) {
    result = result.filter(training => training.estado === filterStatus.value)
  }

  // Filtro por fecha
  if (filterDateFrom.value) {
    result = result.filter(
      training => new Date(training.fecha_inicio) >= new Date(filterDateFrom.value)
    )
  }

  if (filterDateTo.value) {
    result = result.filter(
      training => new Date(training.fecha_inicio) <= new Date(filterDateTo.value)
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
  console.log(currentTraining.value);

  // mimic saveTraining logic
  const trainingData = {
    ...currentTraining.value,
    entrenadores: (currentTraining.value.entrenadores || []).map(c => c.id || c)
  }

  if (editMode.value) {
    const index = trainings.value.findIndex(t => t.id === trainingData.id)
    if (index !== -1) trainings.value[index] = trainingData
    $q.notify({ type: 'positive', message: 'Entrenamiento actualizado correctamente' })
  } else {
    await crearEntrenamiento(trainingData)
    fetchTrainings()
  }
  trainingDialog.value = false
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
  mockCoaches.value = await listarDisciplinas()
  disciplineOptions.value = mockCoaches.value

  // Cargar entrenamientos directamente en trainings
  fetchTrainings()
})


</script>

<style scoped>
/* Estilos personalizados si son necesarios */
</style>
