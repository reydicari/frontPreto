<template>
  <q-page class="q-pa-md inscripciones-page" :class="$q.dark.isActive ? '' : 'bg-grey-3'">
    <!-- Encabezado mejorado con animación -->
    <div class="row items-center justify-between q-mb-lg header-section">
      <div>
        <h2 class="text-h4 q-ma-none page-title animated-title">
          <q-icon name="school" size="38px" class="q-mr-sm" />
          Gestión de Inscripciones
        </h2>
        <p class="text-grey-7 q-mt-xs q-mb-none">Administra y monitorea todas las inscripciones de estudiantes</p>
      </div>
      <q-btn color="primary" icon="add_circle" label="Nueva Inscripción" size="md" unelevated
        class="btn-nueva-inscripcion" @click="openDialog()">
        <q-tooltip>Registrar nueva inscripción</q-tooltip>
      </q-btn>
    </div>

    <!-- Panel de estadísticas con diseño atractivo -->
    <div class="row q-col-gutter-md q-mb-lg stats-section">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card stat-card-total">
          <q-card-section class="text-center">
            <q-icon name="groups" size="48px" class="stat-icon" />
            <div class="stat-number">{{ filteredInscripciones.length }}</div>
            <div class="stat-label">Total Inscripciones</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card stat-card-activas">
          <q-card-section class="text-center">
            <q-icon name="trending_up" size="48px" class="stat-icon" />
            <div class="stat-number">{{ inscripcionesActivas }}</div>
            <div class="stat-label">En Marcha</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card stat-card-warning">
          <q-card-section class="text-center">
            <q-icon name="schedule" size="48px" class="stat-icon" />
            <div class="stat-number">{{ inscripcionesPorComenzar }}</div>
            <div class="stat-label">Sin Comenzar</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card stat-card-alert">
          <q-card-section class="text-center">
            <q-icon name="warning_amber" size="48px" class="stat-icon" />
            <div class="stat-number">{{ inscripcionesPorVencer }}</div>
            <div class="stat-label">Por Vencer</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filtros mejorados con mejor organización -->
    <q-card class="q-mb-md filters-card">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <q-icon name="filter_list" size="24px" class="q-mr-sm text-primary" />
          <span class="text-h6 text-weight-medium">Filtros de Búsqueda</span>
          <q-space />
          <q-btn flat dense icon="refresh" color="primary" @click="resetFilters" size="sm">
            <q-tooltip>Limpiar todos los filtros</q-tooltip>
          </q-btn>
        </div>

        <div class="row q-col-gutter-md">
          <!-- Búsqueda general -->
          <div class="col-12 col-md-6 col-lg-4">
            <q-input v-model="searchTerm" outlined dense placeholder="Buscar estudiante, teléfono, paquete..."
              clearable>
              <template v-slot:prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>

          <!-- Estado -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-select v-model="filterEstado" :options="estadoOptions" label="Estado" outlined dense clearable emit-value
              map-options>
              <template v-slot:prepend>
                <q-icon name="flag" />
              </template>
            </q-select>
          </div>

          <!-- Disciplina -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-select v-model="filterDisciplina" :options="disciplinasOptions" label="Disciplina" option-label="nombre"
              option-value="id" emit-value map-options outlined dense clearable>
              <template v-slot:prepend>
                <q-icon name="sports" />
              </template>
            </q-select>
          </div>

          <!-- Nivel -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-select v-model="filterNivel" :options="nivelOptions" label="Nivel" option-label="nombre_nivel"
              option-value="id" emit-value map-options outlined dense clearable>
              <template v-slot:prepend>
                <q-icon name="military_tech" />
              </template>
            </q-select>
          </div>

          <!-- Vencimiento -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-select v-model="filterVencimiento" :options="vencimientoOptions" label="Vencimiento" option-label="label"
              option-value="value" emit-value map-options outlined dense clearable>
              <template v-slot:prepend>
                <q-icon name="event" />
              </template>
            </q-select>
          </div>

          <!-- Género -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-select v-model="filterGenero" :options="generoOptions" label="Género" outlined dense clearable emit-value
              map-options>
              <template v-slot:prepend>
                <q-icon name="wc" />
              </template>
            </q-select>
          </div>

          <!-- Rango de edad -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-input v-model.number="filterEdadMin" type="number" outlined dense label="Edad mínima" :min="0" :max="99">
              <template v-slot:prepend>
                <q-icon name="cake" />
              </template>
            </q-input>
          </div>

          <div class="col-6 col-md-3 col-lg-2">
            <q-input v-model.number="filterEdadMax" type="number" outlined dense label="Edad máxima" :min="0" :max="99">
              <template v-slot:prepend>
                <q-icon name="cake" />
              </template>
            </q-input>
          </div>

          <!-- Rango de fechas de inicio -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-input dense outlined v-model="filterFechaInicioDesde" label="Inicio desde" readonly clearable>
              <template v-slot:prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date v-model="filterFechaInicioDesde" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Cerrar" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-6 col-md-3 col-lg-2">
            <q-input dense outlined v-model="filterFechaInicioHasta" label="Inicio hasta" readonly clearable>
              <template v-slot:prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date v-model="filterFechaInicioHasta" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Cerrar" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Con pagos registrados -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-select v-model="filterConPagos" :options="pagosOptions" label="Pagos" outlined dense clearable emit-value
              map-options>
              <template v-slot:prepend>
                <q-icon name="payments" />
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla de inscripciones mejorada -->
    <q-card class="table-card">
      <q-card-section class="q-pa-none">
        <q-table :rows="filteredInscripciones" :columns="columns" row-key="id" :loading="loading"
          :pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 25, 50, 100]" flat
          class="inscripciones-table">
          <template v-slot:loading>
            <q-inner-loading showing color="primary" />
          </template>

          <!-- Columna número mejorada -->
          <template v-slot:body-cell-no="props">
            <q-td :props="props">
              <div class="row-number-simple">
                {{filteredInscripciones.findIndex(r => r.id === props.row.id) + 1}}
              </div>
            </q-td>
          </template>

          <!-- Columna estudiante con avatar -->
          <template v-slot:body-cell-estudiante="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-avatar size="40px" color="primary" text-color="white" class="q-mr-sm">
                  <img v-if="props.row.persona?.fotografia" :src="host + props.row.persona.fotografia" />
                  <span v-else>{{ getInitials(props.row.persona) }}</span>
                </q-avatar>
                <div>
                  <div class="text-weight-medium">
                    {{ props.row.persona?.nombres }} {{ props.row.persona?.apellido_paterno }}
                  </div>
                  <div class="text-caption text-grey-7">
                    <q-icon name="phone" size="14px" class="q-mr-xs" />
                    {{ props.row.persona?.telefono || 'Sin teléfono' }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Columna paquete mejorada -->
          <template v-slot:body-cell-paquete="props">
            <q-td :props="props">
              <div class="paquete-cell">
                <q-icon name="inventory_2" size="18px" class="q-mr-xs text-purple" />
                <span class="text-weight-medium">{{ props.row.paquete?.nombre || '—' }}</span>
              </div>
            </q-td>
          </template>

          <!-- Columna disciplina con icono mejorado -->
          <template v-slot:body-cell-disciplina="props">
            <q-td :props="props">
              <q-chip size="md" :icon="getDisciplinaIcon(props.row)" color="green-2" text-color="green-9"
                class="disciplina-chip">
                {{ props.row.paquete?.disciplina?.nombre || props.row.disciplina?.nombre || '—' }}
              </q-chip>
            </q-td>
          </template>

          <!-- Columna nivel mejorada -->
          <template v-slot:body-cell-nivel="props">
            <q-td :props="props">
              <q-badge color="teal-7" class="nivel-badge">
                {{ props.row.nivel?.nombre_nivel || '—' }}
              </q-badge>
            </q-td>
          </template>

          <!-- Columna fechas mejorada -->
          <template v-slot:body-cell-fecha_inicio="props">
            <q-td :props="props">
              <div class="fecha-cell">
                <q-icon name="event" size="16px" class="q-mr-xs text-primary" />
                {{ formatDate(props.row.fecha_inicio) }}
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-fecha_fin="props">
            <q-td :props="props">
              <div class="fecha-cell">
                <q-icon name="event_available" size="16px" class="q-mr-xs"
                  :class="estaPorVencer(props.row, 'pv30') ? 'text-orange' : 'text-grey-6'" />
                <span :class="estaPorVencer(props.row, 'pv30') ? 'text-orange text-weight-bold' : ''">
                  {{ props.row.fecha_fin ? formatDate(props.row.fecha_fin) : 'Indefinida' }}
                </span>
              </div>
            </q-td>
          </template>

          <!-- Columna estado mejorada con animación -->
          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <q-badge :color="estadoColor(props.row.estado)" class="estado-badge animated-badge">
                <q-icon :name="estadoIcon(props.row.estado)" size="14px" class="q-mr-xs" />
                {{ estadoLabel(props.row.estado) }}
              </q-badge>
              <div v-if="estaPorVencer(props.row, 'pv30') && props.row.fecha_fin" class="q-mt-xs">
                <q-chip dense size="sm" color="orange-2" text-color="orange-9" icon="warning">
                  Vence en {{ diasParaVencer(props.row) }} días
                </q-chip>
              </div>
            </q-td>
          </template>

          <!-- Columna acciones mejorada -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="row no-wrap q-gutter-xs">
                <q-btn icon="visibility" color="info" flat dense round size="sm" @click="showDialog(props.row)">
                  <q-tooltip>Ver detalles</q-tooltip>
                </q-btn>
                <q-btn icon="edit" color="primary" flat dense round size="sm" @click="showDialog(props.row)">
                  <q-tooltip>Editar inscripción</q-tooltip>
                </q-btn>
                <q-btn v-if="props.row.pagos?.length > 0" icon="receipt_long" color="secondary" flat dense round
                  size="sm" @click="verPagos(props.row)">
                  <q-badge color="red" floating>{{ props.row.pagos.length }}</q-badge>
                  <q-tooltip>Ver pagos ({{ props.row.pagos.length }})</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Diálogo de inscripción -->
    <nueva-inscripcion-dialog v-model="dialogVisible" :current-inscripcion="currentInscripcion" :edit-mode="editMode"
      @saved="handleSaved" />

    <!-- Diálogo de pagos -->
    <PagosDialog v-model="pagosDialogVisible" :inscripcion="selectedInscripcion" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PagosDialog from './PagosDialog.vue'

import { listar } from 'src/stores/inscripcion-store'
import NuevaInscripcionDialog from "pages/inscripciones/NuevaInscripcionDialog.vue";
import { listarDisciplinas } from 'src/stores/disciplina-store.js'

const host = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'

// Estado principal
const loading = ref(false)
const inscripciones = ref([])
const searchTerm = ref('')
const filterEstado = ref(null)
const filterDisciplina = ref(null)
const filterVencimiento = ref(null)
const filterGenero = ref(null)
const filterEdadMin = ref(null)
const filterEdadMax = ref(null)
const filterFechaInicioDesde = ref(null)
const filterFechaInicioHasta = ref(null)
const filterConPagos = ref(null)
const disciplinasOptions = ref([])
const filterNivel = ref(null)
const nivelOptions = ref([])
// Configuración de tabla mejorada
const columns = [
  {
    name: 'no',
    label: '#',
    field: () => '',
    align: 'center',
    style: 'width: 50px'
  },
  {
    name: 'estudiante',
    label: 'Estudiante',
    field: row => row.persona?.nombres + ' ' + row.persona?.apellido_paterno,
    align: 'left',
    sortable: true
  },
  {
    name: 'paquete',
    label: 'Paquete',
    field: row => row.paquete?.nombre || '',
    align: 'left',
    sortable: true
  },
  {
    name: 'disciplina',
    label: 'Disciplina',
    field: row => row.paquete?.disciplina?.nombre || '',
    align: 'left',
    sortable: true
  },
  {
    name: 'nivel',
    label: 'Nivel',
    field: row => row.nivel?.nombre_nivel || '—',
    align: 'center',
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
    name: 'fecha_fin',
    label: 'Fecha Fin',
    field: 'fecha_fin',
    align: 'left',
    sortable: true
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'center',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Acciones',
    align: 'center',
    style: 'width: 150px'
  }
]

const pagination = ref({
  sortBy: 'fecha_inicio',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

// Opciones para filtros mejoradas
const estadoOptions = [
  { label: 'Terminada', value: 0 },
  { label: 'En marcha', value: 1 },
  { label: 'Sin comenzar', value: 2 }
]

const vencimientoOptions = [
  { label: 'Por vencer (15 días)', value: 'pv15' },
  { label: 'Por vencer (30 días)', value: 'pv30' },
  { label: 'Vencidas', value: 'vencidas' },
  { label: 'Indefinidas', value: 'indefinidas' }
]

const generoOptions = [
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' }
]

const pagosOptions = [
  { label: 'Con pagos', value: true },
  { label: 'Sin pagos', value: false }
]

// Cargar datos iniciales (con manejo de errores)
onMounted(async () => {
  try {
    loading.value = true
    await loadInscripciones()

    // Cargar opciones de disciplinas desde store
    try {
      const disciplinas = await listarDisciplinas()
      disciplinasOptions.value = Array.isArray(disciplinas) ? disciplinas : (disciplinas?.data || [])
    } catch (error) {
      console.warn('Error al cargar disciplinas:', error)
      disciplinasOptions.value = []
    }

    // Construir lista única de niveles a partir de inscripciones
    try {
      const niveles = []
      const seen = new Set()
      for (const ins of inscripciones.value || []) {
        const n = ins.nivel
        if (n && n.id && !seen.has(n.id)) {
          seen.add(n.id)
          niveles.push({ id: n.id, nombre_nivel: n.nombre_nivel })
        }
      }
      nivelOptions.value = niveles
    } catch (error) {
      console.warn('Error al procesar niveles:', error)
      nivelOptions.value = []
    }
  } catch (error) {
    console.error('Error en onMounted:', error)
  } finally {
    loading.value = false
  }
})

const loadInscripciones = async () => {
  try {
    const data = await listar()
    inscripciones.value = Array.isArray(data) ? data : (data?.data || [])
    console.log('inscripciones cargadas:', inscripciones.value.length)
    return inscripciones.value
  } catch (error) {
    console.error('Error al cargar inscripciones:', error)
    inscripciones.value = []
    return []
  }
}
// Abrir diálogo (nuevo o edición)
function openDialog(inscripcion = null) {
  try {
    editMode.value = inscripcion !== null
    currentInscripcion.value = inscripcion ? { ...inscripcion } : null
    dialogVisible.value = true
  } catch (error) {
    console.error('Error al abrir diálogo:', error)
  }
}

// Manejar guardado exitoso
async function handleSaved() {
  try {
    dialogVisible.value = false
    loading.value = true
    await loadInscripciones()
  } catch (error) {
    console.error('Error al recargar inscripciones:', error)
  } finally {
    loading.value = false
  }
}

// Estadísticas computadas (safe con valores por defecto)
const inscripcionesActivas = computed(() => {
  try {
    return (inscripciones.value || []).filter(i => i.estado === 1).length
  } catch {
    return 0
  }
})

const inscripcionesPorComenzar = computed(() => {
  try {
    return (inscripciones.value || []).filter(i => i.estado === 2).length
  } catch {
    return 0
  }
})

const inscripcionesPorVencer = computed(() => {
  try {
    return (inscripciones.value || []).filter(i => {
      try {
        return estaPorVencer(i, 'pv30')
      } catch {
        return false
      }
    }).length
  } catch {
    return 0
  }
})

// Filtrado local (mantiene lógica original + filtros opcionales)
const filteredInscripciones = computed(() => {
  let result = inscripciones.value || []

  // Filtro por vencimiento (original)
  if (filterVencimiento.value !== null) {
    try {
      result = result.filter(ins => estaPorVencer(ins, filterVencimiento.value))
    } catch (error) {
      console.warn('Error en filtro vencimiento:', error)
    }
  }

  // Filtro por estado (original)
  if (filterEstado.value !== null) {
    result = result.filter(ins => ins.estado === filterEstado.value)
  }

  // Filtro por disciplina (original)
  if (filterDisciplina.value) {
    result = result.filter(ins => (ins.paquete?.disciplina?.id || ins.disciplina?.id) === filterDisciplina.value)
  }

  // Filtro por nivel (original)
  if (filterNivel.value) {
    result = result.filter(ins => ins.nivel && ins.nivel.id === filterNivel.value)
  }

  // Filtro por género (nuevo - opcional)
  if (filterGenero.value) {
    try {
      result = result.filter(ins => ins.persona?.genero === filterGenero.value)
    } catch (error) {
      console.warn('Error en filtro género:', error)
    }
  }

  // Filtro por rango de edad (nuevo - opcional)
  if (filterEdadMin.value !== null && filterEdadMin.value !== '') {
    try {
      result = result.filter(ins => {
        const edad = calcularEdad(ins.persona?.fecha_nacimiento)
        return edad >= filterEdadMin.value
      })
    } catch (error) {
      console.warn('Error en filtro edad mínima:', error)
    }
  }
  if (filterEdadMax.value !== null && filterEdadMax.value !== '') {
    try {
      result = result.filter(ins => {
        const edad = calcularEdad(ins.persona?.fecha_nacimiento)
        return edad <= filterEdadMax.value
      })
    } catch (error) {
      console.warn('Error en filtro edad máxima:', error)
    }
  }

  // Filtro por rango de fechas de inicio (nuevo - opcional)
  if (filterFechaInicioDesde.value) {
    try {
      result = result.filter(ins => ins.fecha_inicio && ins.fecha_inicio >= filterFechaInicioDesde.value)
    } catch (error) {
      console.warn('Error en filtro fecha desde:', error)
    }
  }
  if (filterFechaInicioHasta.value) {
    try {
      result = result.filter(ins => ins.fecha_inicio && ins.fecha_inicio <= filterFechaInicioHasta.value)
    } catch (error) {
      console.warn('Error en filtro fecha hasta:', error)
    }
  }

  // Filtro por pagos (nuevo - opcional)
  if (filterConPagos.value !== null) {
    try {
      result = result.filter(ins => filterConPagos.value
        ? (ins.pagos && ins.pagos.length > 0)
        : (!ins.pagos || ins.pagos.length === 0)
      )
    } catch (error) {
      console.warn('Error en filtro pagos:', error)
    }
  }

  // Filtro por término de búsqueda (original)
  const term = (searchTerm.value || '').toString().trim().toLowerCase()
  if (term) {
    result = result.filter(ins => {
      const nombres = (ins.persona?.nombres || '') + ' ' + (ins.persona?.apellido_paterno || '') + ' ' + (ins.persona?.apellido_materno || '')
      const telefono = ins.persona?.telefono || ''
      const paquete = ins.paquete?.nombre || ''
      const disciplina = ins.paquete?.disciplina?.nombre || ins.disciplina?.nombre || ''
      const nivel = ins.nivel?.nombre_nivel || ''
      return (`${nombres} ${telefono} ${paquete} ${disciplina} ${nivel}`).toLowerCase().includes(term)
    })
  }

  return result
})

// Lógica de vencimiento
function estaPorVencer(inscripcion, mode) {
  // Modes: 'pv15' | 'pv30' | 'vencidas' | 'indefinidas'
  if (!mode) return false

  // Indefinidas = no tienen fecha_fin
  if (mode === 'indefinidas') {
    return !inscripcion.fecha_fin
  }

  // Para los demás modos necesitamos fecha_fin
  if (!inscripcion.fecha_fin) return false

  const hoy = new Date()
  const fechaFin = new Date(inscripcion.fecha_fin)
  const diffDays = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24))

  if (mode === 'vencidas') {
    return diffDays < 0
  }

  if (mode === 'pv15') {
    return inscripcion.estado === 1 && diffDays > 0 && diffDays <= 15
  }

  if (mode === 'pv30') {
    return inscripcion.estado === 1 && diffDays > 0 && diffDays <= 30
  }

  return false
}

function diasParaVencer(inscripcion) {
  const hoy = new Date()
  const fechaFin = new Date(inscripcion.fecha_fin)
  return Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24))
}

// Calcular edad (con manejo de errores)
function calcularEdad(fechaNacimiento) {
  try {
    if (!fechaNacimiento) return 0
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    if (isNaN(nacimiento.getTime())) return 0
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad >= 0 ? edad : 0
  } catch {
    return 0
  }
}

// Obtener iniciales (con validación)
function getInitials(persona) {
  try {
    if (!persona) return '?'
    const n = (persona.nombres || '').charAt(0).toUpperCase()
    const a = (persona.apellido_paterno || '').charAt(0).toUpperCase()
    return n && a ? (n + a) : (n || a || '?')
  } catch {
    return '?'
  }
}

// Obtener icono de disciplina (con fallback)
function getDisciplinaIcon(row) {
  try {
    const icono = row.paquete?.disciplina?.icono
    if (!icono) return 'sports'
    if (String(icono).includes('/')) return 'sports'
    return icono
  } catch {
    return 'sports'
  }
}

// Formato de fecha: dd Mes(Abreviado en español) aaaa -> e.g. 05 Nov 2025
function formatDate(dateInput) {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d)) return String(dateInput)
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const mon = months[d.getMonth()] || ''
  const year = d.getFullYear()
  return `${day} ${mon} ${year}`
}

// Utilidades para mostrar etiqueta, color e icono según estado (0/1/2)
function estadoLabel(e) {
  if (e === 0) return 'Terminada'
  if (e === 1) return 'En marcha'
  if (e === 2) return 'Sin comenzar'
  return String(e ?? '')
}

function estadoColor(e) {
  if (e === 0) return 'grey-7'
  if (e === 1) return 'positive'
  if (e === 2) return 'warning'
  return 'dark'
}

function estadoIcon(e) {
  if (e === 0) return 'check_circle'
  if (e === 1) return 'play_circle'
  if (e === 2) return 'schedule'
  return 'help'
}

// Gestión de diálogo
const dialogVisible = ref(false)
const editMode = ref(false)
const step = ref('estudiante')
const inscripcionIndefinida = ref(false)
const registrarPago = ref(false)

const currentInscripcion = ref({
  id: null,
  id_persona: null,
  id_diciplina: null,
  fecha_inicio: '',
  fecha_fin: '',
  estado: 1
})

const nuevoPago = ref({
  monto: 0,
  meses_cubiertos: 1,
  metodo: 'Efectivo',
  observaciones: ''
})

const currentEstudiante = ref(null)
const currentDisciplina = ref(null)

function showDialog(inscripcion) {
  editMode.value = !!inscripcion

  if (inscripcion) {
    currentInscripcion.value = { ...inscripcion }
    currentEstudiante.value = inscripcion.persona
    currentDisciplina.value = inscripcion.disciplina
    inscripcionIndefinida.value = !inscripcion.fecha_fin
  } else {
    resetCurrentInscripcion()
  }

  step.value = 'estudiante'
  dialogVisible.value = true
}

function resetCurrentInscripcion() {
  currentInscripcion.value = {
    id: null,
    id_persona: null,
    id_diciplina: null,
    fecha_inicio: '',
    fecha_fin: '',
    estado: 1
  }
  nuevoPago.value = {
    monto: 0,
    meses_cubiertos: 1,
    metodo: 'Efectivo',
    observaciones: ''
  }
  currentEstudiante.value = null
  currentDisciplina.value = null
  inscripcionIndefinida.value = false
  registrarPago.value = false
}


// Diálogo de pagos
const pagosDialogVisible = ref(false)
const selectedInscripcion = ref(null)

function verPagos(inscripcion) {
  selectedInscripcion.value = inscripcion
  pagosDialogVisible.value = true
}

// Resetear filtros (con validación)
function resetFilters() {
  try {
    searchTerm.value = ''
    filterEstado.value = null
    filterDisciplina.value = null
    filterVencimiento.value = null
    filterNivel.value = null
    filterGenero.value = null
    filterEdadMin.value = null
    filterEdadMax.value = null
    filterFechaInicioDesde.value = null
    filterFechaInicioHasta.value = null
    filterConPagos.value = null
  } catch (error) {
    console.error('Error al resetear filtros:', error)
  }
}

// Manejo de paginación
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending
}

</script>
<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

// Animaciones
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// Página principal
.inscripciones-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

// Encabezado
.header-section {
  animation: fadeInUp 0.6s ease-out;
}

.page-title {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.2em;
  font-weight: 900;
  line-height: 1.2;
  display: flex;
  align-items: center;

  .q-icon {
    -webkit-text-fill-color: #2e7d32;
  }
}

.animated-title {
  animation: slideInRight 0.8s ease-out;
}

.btn-nueva-inscripcion {
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 14px 0 rgba(27, 94, 32, 0.39);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px 0 rgba(27, 94, 32, 0.5);
  }
}

// Tarjetas de estadísticas
.stats-section {
  animation: fadeInUp 0.8s ease-out 0.2s backwards;
}

.stat-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  }

  .stat-icon {
    margin-bottom: 8px;
    opacity: 0.9;
  }

  .stat-number {
    font-size: 2.5rem;
    font-weight: 900;
    line-height: 1;
    margin: 8px 0;
  }

  .stat-label {
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.8;
  }
}

.stat-card-total {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
  color: white;
}

.stat-card-activas {
  background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%);
  color: white;
}

.stat-card-warning {
  background: linear-gradient(135deg, #558b2f 0%, #7cb342 100%);
  color: white;
}

.stat-card-alert {
  background: linear-gradient(135deg, #ef6c00 0%, #f57c00 100%);
  color: white;
}

// Tarjeta de filtros
.filters-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: fadeInUp 1s ease-out 0.4s backwards;
  border: none;
}

// Tarjeta de tabla
.table-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: fadeInUp 1.2s ease-out 0.6s backwards;
  border: none;
  overflow: hidden;
}

// Tabla mejorada
.inscripciones-table {
  :deep(.q-table__top) {
    padding: 16px;
    background: linear-gradient(135deg, #1b5e2015 0%, #2e7d3215 100%);
  }

  :deep(.q-table thead tr) {
    background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
  }

  :deep(.q-table thead th) {
    color: white;
    font-weight: 700;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 14px 12px;
  }

  :deep(.q-table tbody tr) {
    transition: all 0.2s ease;

    &:hover {
      background-color: #e8f5e9;
      transform: scale(1.01);
      box-shadow: 0 2px 8px rgba(27, 94, 32, 0.15);
    }
  }

  :deep(.q-table tbody td) {
    padding: 12px;
    vertical-align: middle;
  }
}

// Componentes específicos
.row-number-simple {
  color: #2e7d32;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
}

.paquete-cell {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.disciplina-chip {
  font-weight: 600;
  border-radius: 12px;
  padding: 6px 12px;
  min-width: 120px;
  justify-content: center;
}

.nivel-badge {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 10px;
  min-width: 100px;
  display: inline-block;
  text-align: center;
}

.fecha-cell {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.estado-badge {
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 120px;
  display: inline-block;
  text-align: center;
}

.animated-badge {
  animation: pulse 2s ease-in-out infinite;
}

// Responsividad
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stat-number {
    font-size: 2rem !important;
  }

  .stat-label {
    font-size: 0.75rem !important;
  }
}
</style>
