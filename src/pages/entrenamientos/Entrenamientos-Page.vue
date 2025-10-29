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
        <!-- Columna de estado -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.row.estado)" :label="getStatusLabel(props.row.estado)" />
          </q-td>
        </template>

        <!-- Columna de días -->
        <template v-slot:body-cell-dias="props">
          <q-td :props="props">
            <q-chip v-for="dia in props.row.dias.split(',')" :key="dia" size="sm" color="primary" text-color="white">
              {{ dia }}
            </q-chip>
          </q-td>
        </template>

        <!-- Columna de acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn icon="edit" color="primary" flat dense @click="editTraining(props.row)" />
            <q-btn icon="delete" color="negative" flat dense @click="confirmDeleteTraining(props.row)" />
            <q-btn icon="visibility" color="info" flat dense @click="viewTrainingDetails(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Diálogo para crear/editar entrenamiento (componente separado) -->
    <NuevoEntrenamientoDialog v-model:modelValue="trainingDialog" :training="editMode ? currentTraining : {}"
      :paquetes="paqueteOptions" :ubicaciones="ubicacionesOptions" @save="onDialogSave"
      @cancel="() => trainingDialog = false" />

    <!-- Diálogo de detalles -->
    <q-dialog v-model="detailsDialog">
      <TrainingDetails :training="selectedTraining" @completed="onDetailsCompleted" />
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import TrainingDetails from './Detalle-entrenamiento.vue'
import NuevoEntrenamientoDialog from './NuevoEntrenamientoDialog.vue'
import { listarDisciplinas } from "stores/disciplina-store.js";
import { listarEntrenamientos } from "stores/entrenamientos-store.js";
import { listar } from "stores/persona-store.js";
// 3. callback que recibe el payload del hijo
async function onDetailsCompleted() {
  detailsDialog.value = false    // cierro diálogo
  // El hijo devolvió datos si fuera necesario; actualizaciones se gestionan aquí.
}

// Mock data - en una aplicación real esto vendría de una API
const mockTrainings = []

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
const step = ref('first')
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
    label: 'ID',
    field: 'index',
    align: 'left',
    sortable: true
  },
  {
    name: 'nombre',
    label: 'Nombre',
    field: 'nombre',
    align: 'left',
    sortable: true
  },
  {
    name: 'disciplina',
    label: 'Disciplina',
    field: 'disciplina',
    align: 'left',
    sortable: true
  },
  {
    name: 'dias',
    label: 'Días',
    field: 'dias',
    align: 'left'
  },
  {
    name: 'horario',
    label: 'Horario',
    field: row => `${row.hora_inicio} (${row.horas}h)`,
    align: 'left',
    sortable: true
  },
  {
    name: 'fecha_inicio',
    label: 'Fecha Inicio',
    field: 'fecha_inicio',
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

// Obtener entrenamientos (simulando llamada API)
const fetchTrainings = () => {
  loading.value = true
  // Simulando retraso de red
  setTimeout(() => {
    trainings.value = mockTrainings
    pagination.value.rowsNumber = mockTrainings.length
    loading.value = false
  }, 500)
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
    disciplina: '',
    dias: [],
    estado: 1,
    hora_inicio: '16:00',
    horas: 2,
    fecha_inicio: '',
    fecha_fin: '',
    observacion: '',
    duracion_meses: 3,
    entrenadores: []
  }
  step.value = 'first'
  trainingDialog.value = true
}

// Editar entrenamiento
const editTraining = (training) => {
  editMode.value = true
  currentTraining.value = {
    ...training,
    dias: training.dias.split(','),
    // En una app real, los entrenadores podrían venir como objetos completos
    entrenadores: training.entrenadores || []
  }
  step.value = 'first'
  trainingDialog.value = true
}

// Handler cuando el dialogo emite save
const onDialogSave = (payload) => {
  // adapt payload and reuse saveTraining behavior
  currentTraining.value = { ...payload }
  // mimic saveTraining logic
  const trainingData = {
    ...currentTraining.value,
    dias: Array.isArray(currentTraining.value.dias) ? currentTraining.value.dias.join(',') : (currentTraining.value.dias || ''),
    entrenadores: (currentTraining.value.entrenadores || []).map(c => c.id || c)
  }

  if (editMode.value) {
    const index = trainings.value.findIndex(t => t.id === trainingData.id)
    if (index !== -1) trainings.value[index] = trainingData
    $q.notify({ type: 'positive', message: 'Entrenamiento actualizado correctamente' })
  } else {
    const newId = trainings.value.length ? Math.max(...trainings.value.map(t => t.id || 0)) + 1 : 1
    trainings.value.push({ ...trainingData, id: newId, estado: 1 })
    $q.notify({ type: 'positive', message: 'Entrenamiento creado correctamente' })
  }
  trainingDialog.value = false
}

// stepper/coach helpers moved to dialog component

// Confirmar eliminación de entrenamiento
const confirmDeleteTraining = (training) => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de que quieres eliminar el entrenamiento "${training.nombre}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    trainings.value = trainings.value.filter(t => t.id !== training.id)
    $q.notify({
      type: 'positive',
      message: 'Entrenamiento eliminado correctamente'
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

// Obtener color para el estado
const getStatusColor = (status) => {
  const colors = {
    0: 'negative', // Inactivo
    1: 'positive', // Activo
    2: 'info'      // Completado
  }
  return colors[status] || 'grey'
}

// Obtener texto para el estado
const getStatusLabel = (status) => {
  const labels = {
    0: 'Inactivo',
    1: 'Activo',
    2: 'Completado'
  }
  return labels[status] || 'Desconocido'
}

// Cargar datos iniciales
onMounted(async () => {
  mockTrainings.value = await listarEntrenamientos()
  mockCoaches.value = await listarDisciplinas()
  const entrenadores = await listar('entrenador')
  entrenadores.value = entrenadores
  disciplineOptions.value = mockCoaches.value
  console.log('entrenamientos: ', mockTrainings.value)
  console.log('entrenadores: ', entrenadores.value)

  fetchTrainings()
})


</script>

<style scoped>
/* Estilos personalizados si son necesarios */
</style>
