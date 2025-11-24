<template>
  <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <div class="q-mb-md">
      <h2 class="text-h4 q-ma-none page-title">Reporte de Entrenamientos</h2>
    </div>

    <!-- Barra de filtros (copiado de Entrenamientos-Page) -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar entrenamientos..." class="col-md-4">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <q-expansion-item v-model="filtersExpanded" label="Filtros avanzados" class="q-mt-sm">
          <div class="row q-col-gutter-md q-pt-md">
            <q-select v-model="filterDiscipline" emit-value map-options :options="disciplineOptions" option-value="id"
              option-label="nombre" label="Disciplina" outlined dense clearable class="col-md-3 col-sm-6 col-xs-12" />

            <q-select v-model="filterPaquete" emit-value map-options :options="paqueteOptions" option-value="id"
              option-label="nombre" label="Paquete" outlined dense clearable class="col-md-3 col-sm-6 col-xs-12" />

            <q-select v-model="filterUbicacion" emit-value map-options :options="ubicacionesOptions" option-value="id"
              option-label="nombre" label="Ubicación" outlined dense clearable class="col-md-3 col-sm-6 col-xs-12" />

            <q-select v-model="filterStatus" :options="statusOptions" emit-value option-value="value"
              option-label="label" label="Estado" outlined dense clearable class="col-md-3 col-sm-6 col-xs-12" />

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

    <!-- Tabla de entrenamientos (solo lista y filtros) -->
    <q-card>
      <q-table :rows="filteredTrainings" :columns="columns" row-key="id" :loading="loading" @row-click="onRowClick">

        <template v-slot:body-cell-index="props">
          <q-td :props="props">{{ props.rowIndex + 1 }}</q-td>
        </template>

        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.row.estado)" :label="getStatusLabel(props.row.estado)" />
          </q-td>
        </template>

        <template v-slot:body-cell-fecha_fin="props">
          <q-td :props="props">
            <span v-if="props.row.fecha_fin">{{ formatDate(props.row.fecha_fin) }}</span>
            <q-badge v-else color="info" label="Indefinido" />
          </q-td>
        </template>

        <template v-slot:body-cell-paquete="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-xs">
              <q-icon :name="props.row.paquete?.disciplina?.icono || 'sports'" />
              <span>{{ props.row.paquete?.nombre || 'Sin paquete' }}</span>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-ubicacion="props">
          <q-td :props="props">{{ props.row.ubicacion?.nombre || 'Sin ubicación' }}</q-td>
        </template>

        <!-- Acciones reducidas: Generar PDF / Excel usando el id del entrenamiento -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense color="orange" icon="picture_as_pdf" label="Generar PDF" class="q-mr-sm"
              @click.stop="generarReporteFor(props.row)" />
            <q-btn dense color="secondary" icon="file_download" label="Generar Excel"
              @click.stop="generarReporteExcelFor(props.row)" />
          </q-td>
        </template>

      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { reporteAsistenciasEntrenamiento, reporteAsistenciasEntrenamientoExcel } from 'src/stores/reportes.js'
import { listarEntrenamientos } from 'src/stores/entrenamientos-store.js'
import { listarPaquetes } from 'stores/paquete-store.js'
import { listarUbicaciones } from 'stores/ubicacion-store.js'
import { listarDisciplinas } from 'stores/disciplina-store.js'

const $q = useQuasar()

// Estado
const trainings = ref([])
const loading = ref(false)

// filtros
const searchTerm = ref('')
const filtersExpanded = ref(false)
const filterDiscipline = ref(null)
const filterStatus = ref(null)
const filterDateFrom = ref(null)
const filterDateTo = ref(null)
const filterPaquete = ref(null)
const filterUbicacion = ref(null)

const paqueteOptions = ref([])
const ubicacionesOptions = ref([])
const disciplineOptions = ref([])

const columns = [
  { name: 'index', label: '#', field: (row, index) => index + 1, align: 'center', sortable: false },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'fecha_inicio', label: 'Fecha Inicio', field: 'fecha_inicio', align: 'left', sortable: true },
  { name: 'fecha_fin', label: 'Fecha Fin', field: 'fecha_fin', align: 'left' },
  { name: 'paquete', label: 'Paquete', field: 'paquete', align: 'left' },
  { name: 'ubicacion', label: 'Ubicación', field: 'ubicacion', align: 'left' },
  { name: 'actions', label: 'Acciones', align: 'center' }
]

// Paginación mínimo (puede ser usado por q-table si se desea)
const pagination = ref({ sortBy: 'nombre', descending: false, page: 1, rowsPerPage: 10, rowsNumber: 0 })

const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('es-ES', options)
}

const getStatusColor = (status) => {
  const colors = { '-1': 'orange', 0: 'grey', 1: 'positive', 2: 'warning' }
  return colors[status] || 'grey'
}

const getStatusLabel = (status) => {
  const labels = { '-1': 'Suspendido', 0: 'Terminado', 1: 'En marcha', 2: 'Sin comenzar' }
  return labels[status] || 'Desconocido'
}

const normalizeTrainings = () => {
  if (!Array.isArray(trainings.value)) return
  trainings.value = trainings.value.map(t => {
    const copy = { ...t }
    if (copy.paquete && (typeof copy.paquete === 'number' || typeof copy.paquete === 'string')) {
      copy.paquete = paqueteOptions.value.find(p => String(p.id) === String(copy.paquete)) || null
    }
    if (copy.ubicacion && (typeof copy.ubicacion === 'number' || typeof copy.ubicacion === 'string')) {
      copy.ubicacion = ubicacionesOptions.value.find(u => String(u.id) === String(copy.ubicacion)) || null
    }
    if (copy.paquete && copy.paquete.disciplina && (typeof copy.paquete.disciplina === 'number' || typeof copy.paquete.disciplina === 'string')) {
      copy.paquete.disciplina = disciplineOptions.value.find(d => String(d.id) === String(copy.paquete.disciplina)) || { id: copy.paquete.disciplina }
    }
    return copy
  })
}

const fetchTrainings = async () => {
  loading.value = true
  try {
    const resp = await listarEntrenamientos()
    trainings.value = Array.isArray(resp) ? resp : (resp?.data || [])
    // ensure options loaded
    pagination.value.rowsNumber = trainings.value.length
    normalizeTrainings()
  } catch (err) {
    console.error('Error cargando entrenamientos', err)
    $q.notify({ type: 'negative', message: 'Error cargando entrenamientos' })
  } finally { loading.value = false }
}

const filteredTrainings = computed(() => {
  let result = trainings.value || []
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(training => {
      const nombre = String(training.nombre || '').toLowerCase()
      const observ = String(training.observacion || '').toLowerCase()
      const paqueteNombre = String(training.paquete?.nombre || '').toLowerCase()
      const disciplinaNombre = String(training.paquete?.disciplina?.nombre || '').toLowerCase()
      const ubicacionNombre = String(training.ubicacion?.nombre || '').toLowerCase()
      return (nombre.includes(term) || observ.includes(term) || paqueteNombre.includes(term) || disciplinaNombre.includes(term) || ubicacionNombre.includes(term))
    })
  }
  if (filterDiscipline.value) result = result.filter(t => t.paquete?.disciplina?.id === filterDiscipline.value)
  if (filterPaquete.value) result = result.filter(t => t.paquete?.id === filterPaquete.value)
  if (filterUbicacion.value) result = result.filter(t => t.ubicacion?.id === filterUbicacion.value)
  if (filterStatus.value !== null && filterStatus.value !== undefined) result = result.filter(t => t.estado === filterStatus.value)
  if (filterDateFrom.value) result = result.filter(t => t.fecha_inicio && new Date(t.fecha_inicio) >= new Date(filterDateFrom.value))
  if (filterDateTo.value) result = result.filter(t => t.fecha_inicio && new Date(t.fecha_inicio) <= new Date(filterDateTo.value))
  return result
})

const onRowClick = () => {
  // no-op for report page
}

const clearFilters = () => {
  searchTerm.value = ''
  filterDiscipline.value = null
  filterPaquete.value = null
  filterUbicacion.value = null
  filterStatus.value = null
  filterDateFrom.value = null
  filterDateTo.value = null
}

onMounted(async () => {
  try {
    const d = await listarDisciplinas()
    disciplineOptions.value = Array.isArray(d) ? d : (d?.data || [])
  } catch (e) { console.warn('No se pudieron cargar disciplinas', e) }
  try {
    const p = await listarPaquetes()
    paqueteOptions.value = Array.isArray(p) ? p : (p?.data || [])
  } catch (e) { console.warn('No se pudieron cargar paquetes', e) }
  try {
    const u = await listarUbicaciones()
    ubicacionesOptions.value = Array.isArray(u) ? u : (u?.data || [])
  } catch (e) { console.warn('No se pudieron cargar ubicaciones', e) }

  await fetchTrainings()
})

async function generarReporteFor(training) {
  if (!training || !training.id) return
  const params = { desde: filterDateFrom.value, hasta: filterDateTo.value, id_entrenamiento: training.id, id_persona: null, search: searchTerm.value }
  await reporteAsistenciasEntrenamiento(params)
}

async function generarReporteExcelFor(training) {
  if (!training || !training.id) return
  const params = { desde: filterDateFrom.value, hasta: filterDateTo.value, id_entrenamiento: training.id, id_persona: null, search: searchTerm.value }
  await reporteAsistenciasEntrenamientoExcel(params)
}
</script>
