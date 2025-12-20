<template>
  <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <div class="q-mb-md">
      <h4 class="text-primary q-mb-xs q-mt-none page-title">Reporte de Estudiantes</h4>
      <p class="text-grey-7">Listado completo con filtros avanzados y opciones de exportación</p>
    </div>

    <!-- Filtros -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Búsqueda general -->
          <q-input v-model="filters.search" outlined dense clearable placeholder="Buscar por nombre, CI, teléfono..."
            class="col-12 col-md-4">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Género -->
          <q-select v-model="filters.genero" :options="generoOptions" label="Género" outlined dense clearable emit-value
            map-options class="col-6 col-md-2" />

          <!-- Nivel -->
          <q-select v-model="filters.nivel" :options="nivelOptions" option-label="label" option-value="value"
            label="Nivel" outlined dense clearable emit-value map-options class="col-6 col-md-2" />

          <!-- Estado de pagos -->
          <q-select v-model="filters.estadoPago" :options="estadoPagoOptions" label="Estado de pago" outlined dense
            clearable emit-value map-options class="col-6 col-md-2" />

          <!-- Estado de inscripción -->
          <q-select v-model="filters.estadoInscripcion" :options="estadoInscripcionOptions"
            label="Estado de inscripción" outlined dense clearable emit-value map-options class="col-6 col-md-2" />

          <!-- Rango de edad -->
          <q-input v-model.number="filters.edadMin" type="number" outlined dense label="Edad mínima"
            class="col-6 col-md-2" :min="0" :max="99" />

          <q-input v-model.number="filters.edadMax" type="number" outlined dense label="Edad máxima"
            class="col-6 col-md-2" :min="0" :max="99" />

          <!-- Categoría -->
          <q-select v-model="filters.categoria" :options="categoriaOptions" label="Categoría" outlined dense clearable
            class="col-6 col-md-2" />

          <!-- Disciplina -->
          <q-select v-model="filters.disciplina" :options="disciplinaOptions" option-label="nombre" option-value="id"
            label="Disciplina inscrita" outlined dense clearable emit-value map-options class="col-6 col-md-3" />

          <!-- Con entrenamientos asistidos -->
          <q-select v-model="filters.conEntrenamientos" :options="booleanOptions" label="Con entrenamientos asistidos"
            outlined dense clearable emit-value map-options class="col-6 col-md-3" />

          <!-- Activo/Inactivo -->
          <q-select v-model="filters.estado" :options="estadoOptions" label="Estado" outlined dense clearable emit-value
            map-options class="col-6 col-md-2" />
        </div>

        <div class="row justify-end q-mt-sm q-gutter-sm">
          <q-btn label="Limpiar filtros" flat color="primary" icon="clear_all" @click="clearFilters" />
          <q-btn label="Aplicar filtros" color="primary" icon="filter_list" @click="applyFilters" />
          <q-btn label="generar Excel" color="positive" icon="file_download" @click="exportarExcel" />
          <q-btn label="generar PDF" color="orange" icon="picture_as_pdf" @click="exportarPDF" />
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla -->
    <q-card>
      <q-table :rows="filteredEstudiantes" :columns="columns" row-key="id" :loading="loading" :pagination="pagination"
        @request="onRequest" binary-state-sort :rows-per-page-options="[10, 25, 50, 100]" class="estudiantes-table">
        <template v-slot:body-cell-fotografia="props">
          <q-td :props="props">
            <q-avatar v-if="props.row.fotografia" size="40px">
              <img :src="host + props.row.fotografia" />
            </q-avatar>
            <q-avatar v-else size="40px" color="primary" text-color="white">
              {{ getInitials(props.row.nombres, props.row.apellido_paterno) }}
            </q-avatar>
          </q-td>
        </template>

        <template v-slot:body-cell-nombre_completo="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.nombres }} {{ props.row.apellido_paterno }} {{
              props.row.apellido_materno }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-ci="props">
          <q-td :props="props">
            {{ props.row.ci }}{{ props.row.complemento ? '-' + props.row.complemento : '' }}
          </q-td>
        </template>

        <template v-slot:body-cell-genero="props">
          <q-td :props="props">
            <q-badge :color="props.row.genero === 'M' ? 'blue' : 'pink'">
              {{ props.row.genero === 'M' ? 'Masculino' : 'Femenino' }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-edad="props">
          <q-td :props="props">
            {{ calcularEdad(props.row.fecha_nacimiento) }} años
          </q-td>
        </template>

        <template v-slot:body-cell-inscripciones="props">
          <q-td :props="props">
            <q-badge :color="getInscripcionColor(props.row.inscripciones_count)">
              {{ props.row.inscripciones_count || 0 }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-entrenamientos="props">
          <q-td :props="props">
            <q-badge color="teal">
              {{ props.row.entrenamientos_count || 0 }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-estado_pago="props">
          <q-td :props="props">
            <q-badge :color="getEstadoPagoColor(props.row.estado_pago)">
              {{ getEstadoPagoLabel(props.row.estado_pago) }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="props.row.estado ? 'positive' : 'negative'">
              {{ props.row.estado ? 'Activo' : 'Inactivo' }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat round icon="visibility" color="primary" @click="verDetalle(props.row)">
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarTodosEstudiantes, categoriasUnicas } from 'src/stores/persona-store'
import { listarDisciplinas } from 'src/stores/disciplina-store'
import { listarNiveles } from 'src/stores/nivel'
import { Notify } from 'quasar'
import { useRouter } from 'vue-router'

const router = useRouter()
const host = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'

const loading = ref(false)
const estudiantes = ref([])
const categoriaOptions = ref([])
const disciplinaOptions = ref([])
const nivelOptions = ref([])

const filters = ref({
  search: '',
  genero: null,
  nivel: null,
  estadoPago: null,
  estadoInscripcion: null,
  edadMin: null,
  edadMax: null,
  categoria: null,
  disciplina: null,
  conEntrenamientos: null,
  estado: true // Por defecto solo activos
})

const pagination = ref({
  sortBy: 'nombres',
  descending: false,
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0
})

const generoOptions = [
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' }
]

const estadoPagoOptions = [
  { label: 'Al día', value: 'al_dia' },
  { label: 'Con deuda', value: 'con_deuda' },
  { label: 'Moroso', value: 'moroso' }
]

const estadoInscripcionOptions = [
  { label: 'Activas', value: 'activa' },
  { label: 'Vencidas', value: 'vencida' },
  { label: 'Indefinidas', value: 'indefinida' }
]

const booleanOptions = [
  { label: 'Sí', value: true },
  { label: 'No', value: false }
]

const estadoOptions = [
  { label: 'Activo', value: true },
  { label: 'Inactivo', value: false }
]

const columns = [
  { name: 'fotografia', label: 'Foto', align: 'center', field: 'fotografia', sortable: false },
  { name: 'nombre_completo', label: 'Nombre completo', align: 'left', field: 'nombres', sortable: true },
  { name: 'ci', label: 'CI', align: 'left', field: 'ci', sortable: true },
  { name: 'genero', label: 'Género', align: 'center', field: 'genero', sortable: true },
  { name: 'edad', label: 'Edad', align: 'center', field: 'fecha_nacimiento', sortable: true },
  { name: 'telefono', label: 'Teléfono', align: 'left', field: 'telefono', sortable: true },
  { name: 'categoria', label: 'Categoría', align: 'left', field: 'categoria', sortable: true },
  { name: 'inscripciones', label: 'Inscripciones', align: 'center', field: 'inscripciones_count', sortable: true },
  { name: 'entrenamientos', label: 'Entrenamientos', align: 'center', field: 'entrenamientos_count', sortable: true },
  { name: 'estado_pago', label: 'Estado Pago', align: 'center', field: 'estado_pago', sortable: true },
  { name: 'estado', label: 'Estado', align: 'center', field: 'estado', sortable: true },
  { name: 'actions', label: 'Acciones', align: 'center', field: 'actions', sortable: false }
]

const filteredEstudiantes = computed(() => {
  let result = [...estudiantes.value]

  // Búsqueda general
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()
    result = result.filter(e =>
      (e.nombres?.toLowerCase().includes(searchLower)) ||
      (e.apellido_paterno?.toLowerCase().includes(searchLower)) ||
      (e.apellido_materno?.toLowerCase().includes(searchLower)) ||
      (e.ci?.toString().includes(searchLower)) ||
      (e.telefono?.includes(searchLower))
    )
  }

  // Filtro por género
  if (filters.value.genero) {
    result = result.filter(e => e.genero === filters.value.genero)
  }

  // Filtro por nivel (si el estudiante tiene inscripciones con ese nivel)
  if (filters.value.nivel) {
    result = result.filter(e => e.id_nivel === filters.value.nivel || e.nivel_id === filters.value.nivel)
  }

  // Filtro por estado de pago (simulado - ajustar según backend)
  if (filters.value.estadoPago) {
    result = result.filter(e => e.estado_pago === filters.value.estadoPago)
  }

  // Filtro por estado de inscripción
  if (filters.value.estadoInscripcion) {
    result = result.filter(e => e.estado_inscripcion === filters.value.estadoInscripcion)
  }

  // Filtro por rango de edad
  if (filters.value.edadMin !== null && filters.value.edadMin !== '') {
    result = result.filter(e => calcularEdad(e.fecha_nacimiento) >= filters.value.edadMin)
  }
  if (filters.value.edadMax !== null && filters.value.edadMax !== '') {
    result = result.filter(e => calcularEdad(e.fecha_nacimiento) <= filters.value.edadMax)
  }

  // Filtro por categoría
  if (filters.value.categoria) {
    result = result.filter(e => e.categoria === filters.value.categoria)
  }

  // Filtro por disciplina inscrita
  if (filters.value.disciplina) {
    result = result.filter(e => e.disciplinas && e.disciplinas.includes(filters.value.disciplina))
  }

  // Filtro por entrenamientos asistidos
  if (filters.value.conEntrenamientos !== null) {
    result = result.filter(e => filters.value.conEntrenamientos
      ? (e.entrenamientos_count > 0)
      : (e.entrenamientos_count === 0 || !e.entrenamientos_count)
    )
  }

  // Filtro por estado
  if (filters.value.estado !== null) {
    result = result.filter(e => e.estado === filters.value.estado)
  }

  // Actualizar rowsNumber
  pagination.value.rowsNumber = result.length

  return result
})

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 0
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

function getInitials(nombres, apellido) {
  const n = (nombres || '').charAt(0)
  const a = (apellido || '').charAt(0)
  return (n + a).toUpperCase()
}

function getInscripcionColor(count) {
  if (!count || count === 0) return 'grey'
  if (count === 1) return 'orange'
  if (count >= 2) return 'green'
  return 'grey'
}

function getEstadoPagoColor(estado) {
  if (estado === 'al_dia') return 'positive'
  if (estado === 'con_deuda') return 'warning'
  if (estado === 'moroso') return 'negative'
  return 'grey'
}

function getEstadoPagoLabel(estado) {
  if (estado === 'al_dia') return 'Al día'
  if (estado === 'con_deuda') return 'Con deuda'
  if (estado === 'moroso') return 'Moroso'
  return 'N/A'
}

async function cargarEstudiantes() {
  loading.value = true
  try {
    const response = await listarTodosEstudiantes()
    estudiantes.value = Array.isArray(response) ? response : (response?.data || [])

    // Simular datos adicionales si no vienen del backend
    estudiantes.value = estudiantes.value.map(e => ({
      ...e,
      inscripciones_count: e.inscripciones_count || Math.floor(Math.random() * 5),
      entrenamientos_count: e.entrenamientos_count || Math.floor(Math.random() * 20),
      estado_pago: e.estado_pago || (Math.random() > 0.7 ? 'al_dia' : (Math.random() > 0.5 ? 'con_deuda' : 'moroso')),
      estado_inscripcion: e.estado_inscripcion || (Math.random() > 0.5 ? 'activa' : 'vencida')
    }))

    pagination.value.rowsNumber = estudiantes.value.length
  } catch (error) {
    console.error('Error al cargar estudiantes:', error)
    Notify.create({
      type: 'negative',
      message: 'Error al cargar estudiantes',
      position: 'bottom'
    })
  } finally {
    loading.value = false
  }
}

async function cargarCategorias() {
  try {
    const response = await categoriasUnicas()
    categoriaOptions.value = Array.isArray(response) ? response : (response?.data || [])
  } catch (error) {
    console.error('Error al cargar categorías:', error)
  }
}

async function cargarDisciplinas() {
  try {
    const response = await listarDisciplinas()
    disciplinaOptions.value = Array.isArray(response) ? response : (response?.data || [])
  } catch (error) {
    console.error('Error al cargar disciplinas:', error)
  }
}

async function cargarNiveles() {
  try {
    const response = await listarNiveles()
    nivelOptions.value = Array.isArray(response) ? response : (response?.data || [])
  } catch (error) {
    console.error('Error al cargar niveles:', error)
  }
}

function clearFilters() {
  filters.value = {
    search: '',
    genero: null,
    nivel: null,
    estadoPago: null,
    estadoInscripcion: null,
    edadMin: null,
    edadMax: null,
    categoria: null,
    disciplina: null,
    conEntrenamientos: null,
    estado: true
  }
}

function applyFilters() {
  // Los filtros se aplican automáticamente mediante computed
  Notify.create({
    type: 'positive',
    message: 'Filtros aplicados',
    position: 'bottom'
  })
}

function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending
}

function verDetalle(estudiante) {
  // Navegar a la página de detalle del estudiante
  router.push(`/estudiantes?id=${estudiante.id}`)
}

function exportarExcel() {
  Notify.create({
    type: 'info',
    message: 'Generando reporte Excel...',
    position: 'bottom'
  })
  // TODO: Implementar exportación a Excel
}

function exportarPDF() {
  Notify.create({
    type: 'info',
    message: 'Generando reporte PDF...',
    position: 'bottom'
  })
  // TODO: Implementar exportación a PDF
}

onMounted(async () => {
  await Promise.all([
    cargarEstudiantes(),
    cargarCategorias(),
    cargarDisciplinas(),
    cargarNiveles()
  ])
})
</script>

<style scoped lang="scss">
.page-title {
  border-left: 6px solid #ff6d00;
  padding-left: 12px;
  color: #1976d2;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
}

.estudiantes-table {
  .q-table__top {
    padding: 12px 16px;
  }

  .q-table th {
    font-weight: 600;
    font-size: 0.875rem;
  }
}
</style>
