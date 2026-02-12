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
            <div class="stat-number">{{ totalInscripciones }}</div>
            <div class="stat-label">Total Inscripciones</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card stat-card-warning">
          <q-card-section class="text-center">
            <q-icon name="warning_amber" size="48px" class="stat-icon" />
            <div class="stat-number">{{ porVencer }}</div>
            <div class="stat-label">Por vencer en 7 dias</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card stat-card-alert">
          <q-card-section class="text-center">
            <q-icon name="event_busy" size="48px" class="stat-icon" />
            <div class="stat-number">{{ vencidas }}</div>
            <div class="stat-label">Vencidas</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card stat-card-activas">
          <q-card-section class="text-center">
            <q-icon name="fiber_new" size="48px" class="stat-icon" />
            <div class="stat-number">{{ nuevasEsteMes }}</div>
            <div class="stat-label">Nuevas este Mes</div>
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
          <!-- Búsqueda de persona -->
          <div class="col-12 col-md-6 col-lg-4">
            <q-select v-model="selectedPersona" :options="personasOptions" label="Nombre, ci o telefono" outlined dense
              clearable use-input input-debounce="0" @filter="filterPersonasFn" option-label="nombres" emit-value
              map-options>
              <template v-slot:prepend>
                <q-icon name="person_search" color="primary" />
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white">
                      <img v-if="scope.opt.fotografia" :src="host + scope.opt.fotografia" />
                      <span v-else>{{ getInitials(scope.opt) }}</span>
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nombres }} {{ scope.opt.apellido_paterno }}</q-item-label>
                    <q-item-label caption>CI: {{ scope.opt.ci || 'Sin CI' }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:selected-item="scope">
                <div class="row items-center no-wrap" style="width: 100%">
                  <q-avatar size="24px" color="primary" text-color="white" class="q-mr-sm">
                    <img v-if="scope.opt.fotografia" :src="host + scope.opt.fotografia" />
                    <span v-else style="font-size: 10px">{{ getInitials(scope.opt) }}</span>
                  </q-avatar>
                  <span>{{ scope.opt.nombres }} {{ scope.opt.apellido_paterno }}</span>
                </div>
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ searchPersona ? 'No se encontraron personas' : 'Escribe para buscar' }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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

          <!-- Paquete -->
          <div class="col-6 col-md-3 col-lg-3">
            <q-select v-model="filterPaquete" :options="paqueteOptions" label="Paquete" option-label="nombre"
              option-value="id" emit-value map-options outlined dense clearable use-input input-debounce="300"
              @filter="filterPaquetesFn">
              <template v-slot:prepend>
                <q-icon name="inventory_2" />
              </template>
            </q-select>
          </div>

          <!-- Vencimiento (Fecha Fin) -->
          <div class="col-6 col-md-3 col-lg-2">
            <FiltroFechaRango label="Vencimientos" :allow-indefinida="true"
              @update:model-value="filterFechaFin = $event" />
          </div>

          <!-- Fecha Inicio -->
          <div class="col-6 col-md-3 col-lg-2">
            <FiltroFechaRango label="Inicios" @update:model-value="filterFechaInicio = $event" />
          </div>

          <!-- Pagos -->
          <div class="col-6 col-md-3 col-lg-2">
            <q-select v-model="filterPagos" :options="pagosOptions" label="Pagos" outlined dense clearable emit-value
              map-options>
              <template v-slot:prepend>
                <q-icon name="payments" />
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla de inscripciones con virtual scroll -->
    <q-card class="table-card">
      <q-card-section class="q-pa-none">
        <q-table :rows="inscripciones" :columns="columns" row-key="id" :loading="loading" flat
          class="inscripciones-table" virtual-scroll :rows-per-page-options="[0]" :virtual-scroll-item-size="48"
          :virtual-scroll-sticky-size-start="48" @virtual-scroll="onVirtualScroll">
          <template v-slot:loading>
            <q-inner-loading showing color="primary" />
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" @click="verDetalles(props.row)" class="cursor-pointer">
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'no'">
                  <div class="row-number-simple">{{ props.rowIndex + 1 }}</div>
                </template>
                <template v-else-if="col.name === 'estudiante'">
                  <div class="row items-center">
                    <q-avatar size="36px" color="teal-7" text-color="white" class="q-mr-sm">
                      <img v-if="props.row.persona?.fotografia" :src="`${host}${props.row.persona.fotografia}`" />
                      <span v-else>{{ getInitials(props.row.persona) }}</span>
                    </q-avatar>
                    <div>
                      <div class="text-weight-medium">{{ col.value }}</div>
                      <div class="text-caption text-grey-7">CI: {{ props.row.persona?.ci || '—' }}</div>
                    </div>
                  </div>
                </template>
                <template v-else-if="col.name === 'paquete'">
                  <div class="paquete-cell">
                    <q-icon name="inventory_2" size="18px" class="q-mr-xs text-teal-7" />
                    <span>{{ col.value }}</span>
                  </div>
                </template>
                <template v-else-if="col.name === 'disciplina'">
                  <q-chip :icon="getDisciplinaIcon(props.row)" color="teal-7" text-color="white" dense
                    class="disciplina-chip">
                    {{ col.value }}
                  </q-chip>
                </template>
                <template v-else-if="col.name === 'nivel'">
                  <q-badge color="deep-orange-6" class="nivel-badge">{{ col.value }}</q-badge>
                </template>
                <template v-else-if="col.name === 'fecha_inicio'">
                  <div class="fecha-cell">
                    <q-icon name="event_available" size="16px" class="q-mr-xs text-teal-7" />
                    {{ formatDate(col.value) }}
                  </div>
                </template>
                <template v-else-if="col.name === 'fecha_fin'">
                  <div class="fecha-cell">
                    <q-icon name="event_busy" size="16px" class="q-mr-xs text-orange-7" />
                    {{ formatDate(col.value) || 'Indefinida' }}
                  </div>
                </template>
                <template v-else-if="col.name === 'estado'">
                  <q-badge :color="estadoColor(props.row)" :icon="estadoIcon(props.row)"
                    class="estado-badge animated-badge">
                    {{ estadoLabel(props.row) }}
                  </q-badge>
                </template>
                <template v-else-if="col.name === 'actions'">
                  <div class="row items-center justify-center q-gutter-xs" @click.stop>
                    <q-btn size="sm" flat dense round icon="payments" color="teal-7" @click.stop="verPagos(props.row)">
                      <q-tooltip>Ver pagos</q-tooltip>
                    </q-btn>
                    <q-btn v-if="puedeRenovar(props.row)" size="sm" flat dense round icon="refresh" color="primary"
                      @click.stop="renovarInscripcion(props.row)">
                      <q-tooltip>Renovar inscripción</q-tooltip>
                    </q-btn>
                    <q-btn v-if="props.row.estado === 1 && !isFechaFinVencida(props.row)" size="sm" flat dense round
                      icon="block" color="negative" @click.stop="openSuspenderDialog(props.row)">
                      <q-tooltip>Suspender inscripción</q-tooltip>
                    </q-btn>
                  </div>
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Diálogo de inscripción -->
    <nueva-inscripcion-dialog v-model="dialogVisible" :current-inscripcion="currentInscripcion" :edit-mode="editMode"
      :renew-mode="renewMode" @saved="handleSaved" />

    <!-- Diálogo de detalles -->
    <detalle-inscripcion-dialog v-model="detalleDialogVisible" :inscripcion="selectedInscripcionDetalle" />

    <!-- Diálogo de pagos -->
    <PagosInscripcionDialog v-model="pagosDialogVisible" :inscripcion="selectedInscripcion" />

    <!-- Diálogo de suspensión -->
    <q-dialog v-model="suspenderDialog" :maximized="$q.screen.lt.sm">
      <q-card class="suspend-dialog">
        <q-card-section class="suspend-dialog__header">
          <div class="text-h6">Suspender inscripción</div>
          <div class="text-caption">Indica el motivo de la suspensión</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input v-model="suspensionReason" outlined autogrow type="textarea" label="Razón"
            :disable="suspenderLoading" />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancelar" color="grey-7" @click="suspenderDialog = false" />
          <q-btn unelevated label="Confirmar" color="negative" :loading="suspenderLoading"
            :disable="!suspensionReason.trim()" @click="confirmarSuspension" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import PagosInscripcionDialog from './PagosInscripcionDialog.vue'
import DetalleInscripcionDialog from './DetalleInscripcionDialog.vue'

import { listar, suspensderInscripcion } from 'src/stores/inscripcion-store'
import NuevaInscripcionDialog from "pages/inscripciones/NuevaInscripcionDialog.vue";
import { listarDisciplinas } from 'src/stores/disciplina-store.js'
import { listarNiveles } from 'src/stores/nivel.js'
import { listarPaquetes } from 'src/stores/paquete-store.js'
import { todasPersonas as listarPersonas } from 'src/stores/persona-store.js'
import FiltroFechaRango from 'src/components/FiltroFechaRango.vue'
import { useDebounceFn } from '@vueuse/core'

const $q = useQuasar()
const host = process.env.API_URL + '/uploads/' || 'http://localhost:3000'

// Estado principal
const loading = ref(false)
const inscripciones = ref([])
const totalInscripciones = ref(0)
const porVencer = ref(0)
const vencidas = ref(0)
const nuevasEsteMes = ref(0)

// Filtros
const selectedPersona = ref(null)
const searchPersona = ref('')
const filterEstado = ref(null)
const filterDisciplina = ref(null)
const filterNivel = ref(null)
const filterFechaFin = ref('vacio')
const filterFechaInicio = ref('vacio')
const filterPaquete = ref(null)
const filterPagos = ref(null)

// Opciones
const personasOptions = ref([])
const disciplinasOptions = ref([])
const nivelOptions = ref([])
const paqueteOptions = ref([])

// Paginación para virtual scroll
const page = ref(1)
const limit = ref(12)
const hasMoreData = ref(true)
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

// Opciones para filtros mejoradas
const estadoOptions = [
  { label: 'Todos', value: null },
  { label: 'Activas', value: 1 },
  { label: 'Suspendidas', value: 0 }
]

const pagosOptions = [
  { label: 'Al Día', value: 1 },
  { label: 'Debidas', value: 2 }
]

// Cargar datos iniciales
onMounted(async () => {
  try {
    loading.value = true

    // Cargar opciones
    await Promise.all([
      loadDisciplinas(),
      loadNiveles(),
      loadPaquetes(),
      loadInscripciones()
    ])
  } catch (error) {
    console.error('Error en onMounted:', error)
  } finally {
    loading.value = false
  }
})

// Cargar disciplinas
const loadDisciplinas = async () => {
  try {
    const res = await listarDisciplinas()
    disciplinasOptions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (error) {
    console.error('Error al cargar disciplinas:', error)
    disciplinasOptions.value = []
  }
}

// Cargar niveles
const loadNiveles = async () => {
  try {
    const res = await listarNiveles()
    nivelOptions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (error) {
    console.error('Error al cargar niveles:', error)
    nivelOptions.value = []
  }
}

// Cargar paquetes
const loadPaquetes = async () => {
  try {
    const res = await listarPaquetes()
    paqueteOptions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (error) {
    console.error('Error al cargar paquetes:', error)
    paqueteOptions.value = []
  }
}

// Cargar inscripciones con params
const loadInscripciones = async (append = false) => {
  try {
    loading.value = true

    const params = {
      id_persona: selectedPersona.value?.id || undefined,
      estado: filterEstado.value !== null ? filterEstado.value : undefined,
      id_disciplina: filterDisciplina.value || undefined,
      id_nivel: filterNivel.value || undefined,
      fecha_fin: filterFechaFin.value || undefined,
      fecha_inicio: filterFechaInicio.value || undefined,
      id_paquete: filterPaquete.value || undefined,
      pagos: filterPagos.value || undefined,
      page: page.value,
      limit: limit.value
    }

    // Eliminar undefined
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k])

    const res = await listar(params)

    // Extraer datos del backend
    const data = res?.data || res
    totalInscripciones.value = data?.totalInscripciones || 0
    porVencer.value = data?.porVencer || 0
    vencidas.value = data?.vencidas || 0
    nuevasEsteMes.value = data?.nuevasEsteMes || 0

    const newInscripciones = data?.lista || []

    if (append) {
      inscripciones.value.push(...newInscripciones)
    } else {
      inscripciones.value = newInscripciones
    }

    hasMoreData.value = newInscripciones.length === limit.value
  } catch (error) {
    console.error('Error al cargar inscripciones:', error)
    inscripciones.value = []
  } finally {
    loading.value = false
  }
}

// Filtrar personas con búsqueda
const filterPersonasFn = (val, update) => {
  searchPersona.value = val

  if (val === '') {
    update(() => {
      personasOptions.value = []
    })
    return
  }

  update(() => {
    debouncedLoadPersonas()
  })
}

// Cargar personas con debounce
const debouncedLoadPersonas = useDebounceFn(async () => {
  if (!searchPersona.value) {
    personasOptions.value = []
    return
  }

  try {
    const res = await listarPersonas({ search: searchPersona.value })
    personasOptions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (error) {
    console.error('Error filtrando personas:', error)
    personasOptions.value = []
  }
}, 500)

// Filtrar paquetes con búsqueda
const filterPaquetesFn = (val, update) => {
  if (val === '') {
    update(async () => {
      try {
        const res = await listarPaquetes()
        paqueteOptions.value = Array.isArray(res) ? res : (res?.data || [])
      } catch (error) {
        console.error('Error cargando paquetes:', error)
      }
    })
    return
  }

  update(async () => {
    try {
      const res = await listarPaquetes({ search: val })
      paqueteOptions.value = Array.isArray(res) ? res : (res?.data || [])
    } catch (error) {
      console.error('Error filtrando paquetes:', error)
    }
  })
}

// Virtual scroll load
const onVirtualScroll = async ({ index }) => {

  const lastIndex = inscripciones.value.length - 1
  if (index >= lastIndex - 10) {
    page.value++
    await loadInscripciones(true)
  }
}

// Abrir diálogo (nuevo o edición)
function openDialog(inscripcion = null) {
  try {
    editMode.value = inscripcion !== null
    renewMode.value = false
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
    await reloadInscripcionesFirstPage()
  } catch (error) {
    console.error('Error al recargar inscripciones:', error)
  } finally {
    loading.value = false
  }
}

const reloadInscripcionesFirstPage = async () => {
  page.value = 1
  hasMoreData.value = true
  await loadInscripciones()
}

// Watch para filtros
watch([selectedPersona, filterEstado, filterDisciplina, filterNivel, filterFechaFin, filterFechaInicio, filterPaquete, filterPagos], () => {
  page.value = 1
  hasMoreData.value = true
  loadInscripciones()
})

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

// Parsear fecha como local sin cambios de zona horaria
// Convierte "2025-02-27" a Date en hora local (no UTC) para evitar desfase de días
function parseDateLocal(dateInput) {
  if (!dateInput) return null

  // Si ya es un objeto Date, normalizarlo
  if (dateInput instanceof Date) {
    const d = new Date(dateInput)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Si es string, extraer año-mes-día y crear fecha local
  const str = String(dateInput)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const [, year, month, day] = match
    // Crear fecha local (mes es 0-indexed en JS)
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (isNaN(d)) return null
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Fallback: intentar parsear normalmente
  const d = new Date(dateInput)
  if (isNaN(d)) return null
  d.setHours(0, 0, 0, 0)
  return d
}

// Formato de fecha: dd Mes(Abreviado en español) aaaa -> e.g. 27 Feb 2025
function formatDate(dateInput) {
  if (!dateInput) return ''
  const d = parseDateLocal(dateInput)
  if (!d) return String(dateInput)

  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const mon = months[d.getMonth()] || ''
  const year = d.getFullYear()
  return `${day} ${mon} ${year}`
}

// Normalizar fecha para comparaciones (medianoche local)
const normalizeDate = (dateInput) => {
  return parseDateLocal(dateInput)
}

const getInscripcionStatus = (row) => {
  if (!row) return { label: 'Desconocido', color: 'grey', icon: 'help' }

  if (row.estado === 0) {
    return { label: 'Suspendida', color: 'negative', icon: 'block' }
  }

  if (row.estado === 1) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fin = normalizeDate(row.fecha_fin)

    if (!fin) {
      return { label: 'En marcha', color: 'positive', icon: 'play_circle' }
    }

    const diffDays = Math.floor((fin - hoy) / 86400000)

    if (diffDays < 0) {
      return { label: 'Vencida', color: 'grey-7', icon: 'event_busy' }
    }

    if (diffDays <= 7) {
      return { label: 'Por vencer', color: 'warning', icon: 'warning_amber' }
    }

    return { label: 'En marcha', color: 'positive', icon: 'play_circle' }
  }

  return { label: 'Desconocido', color: 'grey', icon: 'help' }
}

function estadoLabel(row) {
  return getInscripcionStatus(row).label
}

function estadoColor(row) {
  return getInscripcionStatus(row).color
}

function estadoIcon(row) {
  return getInscripcionStatus(row).icon
}

// Gestión de diálogo
const dialogVisible = ref(false)
const editMode = ref(false)
const renewMode = ref(false)
// const step = ref('estudiante')
// const inscripcionIndefinida = ref(false)
// const registrarPago = ref(false)

const currentInscripcion = ref({
  id: null,
  id_persona: null,
  id_diciplina: null,
  fecha_inicio: '',
  fecha_fin: '',
  estado: 1
})

// const nuevoPago = ref({
//   monto: 0,
//   meses_cubiertos: 1,
//   metodo: 'Efectivo',
//   observaciones: ''
// })

// const currentEstudiante = ref(null)
// const currentDisciplina = ref(null)

// Diálogo de detalles
const detalleDialogVisible = ref(false)
const selectedInscripcionDetalle = ref(null)

// Ver detalles de inscripción
function verDetalles(inscripcion) {
  selectedInscripcionDetalle.value = inscripcion
  detalleDialogVisible.value = true
}

// function showDialog(inscripcion) {
//   editMode.value = !!inscripcion

//   if (inscripcion) {
//     currentInscripcion.value = { ...inscripcion }
//     currentEstudiante.value = inscripcion.persona
//     currentDisciplina.value = inscripcion.disciplina
//     inscripcionIndefinida.value = !inscripcion.fecha_fin
//   } else {
//     resetCurrentInscripcion()
//   }

//   step.value = 'estudiante'
//   dialogVisible.value = true
// }

// function resetCurrentInscripcion() {
//   currentInscripcion.value = {
//     id: null,
//     id_persona: null,
//     id_diciplina: null,
//     fecha_inicio: '',
//     fecha_fin: '',
//     estado: 1
//   }
//   nuevoPago.value = {
//     monto: 0,
//     meses_cubiertos: 1,
//     metodo: 'Efectivo',
//     observaciones: ''
//   }
//   currentEstudiante.value = null
//   currentDisciplina.value = null
//   inscripcionIndefinida.value = false
//   registrarPago.value = false
// }


// Diálogo de pagos
const pagosDialogVisible = ref(false)
const selectedInscripcion = ref(null)

const suspenderDialog = ref(false)
const suspensionReason = ref('')
const inscripcionToSuspend = ref(null)
const suspenderLoading = ref(false)

function verPagos(inscripcion) {
  selectedInscripcion.value = inscripcion
  pagosDialogVisible.value = true
}

const isFechaFinVencida = (row) => {
  const fin = normalizeDate(row?.fecha_fin)
  if (!fin) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return fin < hoy
}

const openSuspenderDialog = (row) => {
  if (!row || row.estado !== 1) return

  if (isFechaFinVencida(row)) {
    $q.notify({ type: 'warning', message: 'No puedes suspender inscripciones terminadas.' })
    return
  }

  inscripcionToSuspend.value = row
  suspensionReason.value = ''
  suspenderDialog.value = true
}

const confirmarSuspension = async () => {
  if (!inscripcionToSuspend.value || !suspensionReason.value.trim()) return

  suspenderLoading.value = true
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    const suspension = {
      id_inscripcion: inscripcionToSuspend.value.id,
      razon_anulacion: suspensionReason.value.trim(),
      id_usuario_suspende: current?.id || current?.usuario?.id || current?.persona?.id
    }

    await suspensderInscripcion(suspension)
    suspenderDialog.value = false
    await reloadInscripcionesFirstPage()
  } catch (error) {
    console.error('Error al suspender inscripción:', error)
    $q.notify({ type: 'negative', message: 'Error al suspender la inscripción' })
  } finally {
    suspenderLoading.value = false
  }
}

// Verificar si una inscripción puede ser renovada
// Solo suspendidas o terminadas (fecha_fin < hoy)
const puedeRenovar = (row) => {
  if (!row) return false

  // Suspendidas siempre pueden renovarse
  if (row.estado === 0) return true

  // Activas solo si están vencidas (fecha_fin < hoy)
  if (row.estado === 1) {
    return isFechaFinVencida(row)
  }

  return false
}

// Renovar inscripción
const renovarInscripcion = (row) => {
  if (!puedeRenovar(row)) return

  // Abrir el diálogo en modo renovación
  editMode.value = false
  renewMode.value = true
  currentInscripcion.value = {
    ...row,
    fecha_inicio: new Date().toISOString().split('T')[0], // Nueva fecha de inicio
    fecha_fin: '', // Limpiar fecha fin para que se recalcule
    meses_duracion: 1 // Duración por defecto
  }
  dialogVisible.value = true
}

// Resetear filtros
function resetFilters() {
  try {
    selectedPersona.value = null
    searchPersona.value = ''
    filterEstado.value = null
    filterDisciplina.value = null
    filterNivel.value = null
    filterFechaFin.value = null
    filterFechaInicio.value = null
    filterPaquete.value = null
    filterPagos.value = null
    page.value = 1
    hasMoreData.value = true
    loadInscripciones()
  } catch (error) {
    console.error('Error al resetear filtros:', error)
  }
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
    transition: background-color 0.2s ease;
    cursor: pointer;

    &:hover {
      background-color: #e8f5e9;
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

.suspend-dialog {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
}

.suspend-dialog__header {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
  color: white;
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

// Utilidades
.cursor-pointer {
  cursor: pointer;
}
</style>
