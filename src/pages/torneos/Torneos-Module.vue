<template>
  <q-page class="q-pa-md page-container" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header con estadísticas -->
    <div class="page-header q-mb-lg">
      <div class="header-content">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-sm-auto">
            <div class="header-title">
              <q-icon name="emoji_events" size="42px" class="q-mr-sm" />
              <h2 class="page-title q-ma-none">Gestión de Torneos</h2>
            </div>
            <p class="header-subtitle">Administra torneos y competiciones deportivas</p>
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn class="btn-add-header" icon="add_circle" label="Agregar Torneo" @click="onAdd" unelevated no-caps />
          </div>
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="stats-container row q-gutter-md q-mt-md">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <q-icon name="emoji_events" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ torneos.length }}</div>
            <div class="stat-label">Total Torneos</div>
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
            <q-icon name="block" size="36px" />
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
          <q-input v-model="filters.search" clearable outlined dense placeholder="Buscar por nombre de torneo..."
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
              <div class="col-12 col-sm-6 col-md-3">
                <q-select v-model="filters.id_tipo_torneo" :options="tipoOptions" label="Tipo" emit-value map-options
                  clearable outlined dense>
                  <template v-slot:prepend>
                    <q-icon name="category" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-select v-model="filters.id_ubicacion" :options="ubicacionOptions" label="Ubicación" emit-value
                  map-options clearable outlined dense>
                  <template v-slot:prepend>
                    <q-icon name="place" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-select v-model="filters.id_nivel" :options="nivelOptions" label="Nivel" emit-value map-options
                  clearable outlined dense>
                  <template v-slot:prepend>
                    <q-icon name="signal_cellular_alt" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-select multiple use-chips chip-color="brown-7" v-model="filters.estados" :options="estadoOptions"
                  label="Estado" emit-value map-options clearable outlined dense>
                  <template v-slot:prepend>
                    <q-icon name="flag" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-input v-model="filters.fecha_inicio_desde" label="Desde (inicio)" type="date" outlined dense>
                  <template v-slot:prepend>
                    <q-icon name="event" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-input v-model="filters.fecha_inicio_hasta" label="Hasta (inicio)" type="date" outlined dense>
                  <template v-slot:prepend>
                    <q-icon name="event" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6 col-md-3 row items-center">
                <q-btn flat icon="close" label="Limpiar Filtros" @click="clearFilters" class="clear-filters-btn" />
              </div>
            </div>
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>

    <!-- Grid de tarjetas de torneos -->
    <div class="torneos-grid">
      <q-card v-for="torneo in rowsWithNro" :key="torneo.id" class="torneo-card"
        :class="{ 'torneo-ganador': torneo.estado === 3 }" @click="openDetails($event, torneo)">
        <q-card-section class="card-header" :class="{ 'header-ganador': torneo.estado === 3 }">
          <div class="row items-start justify-between">
            <div class="col">
              <div class="row items-center q-mb-xs">
                <div class="avatar-wrapper" :class="{ 'avatar-ganador': torneo.estado === 3 }">
                  <q-avatar size="46px" class="card-avatar" :class="{ 'avatar-dorado': torneo.estado === 3 }">
                    <q-icon name="emoji_events" size="28px" />
                  </q-avatar>
                  <div v-if="torneo.estado === 3" class="golden-shine"></div>
                </div>
                <div class="q-ml-sm">
                  <div class="card-title" :class="{ 'title-ganador': torneo.estado === 3 }">
                    {{ torneo.nombre }}
                    <q-icon v-if="torneo.estado === 3" name="military_tech" size="18px" class="ganador-icon q-ml-xs" />
                  </div>
                  <q-badge :color="badgeColor(torneo.tipo_torneo?.nombre || 'Desconocido')" outline class="tipo-badge">
                    <q-icon name="category" size="14px" class="q-mr-xs" />
                    {{ torneo.tipo_torneo?.nombre || 'Sin tipo' }}
                  </q-badge>
                </div>
              </div>
            </div>
            <div class="col-auto">
              <q-badge :color="badgeColorEstado(torneo)" class="estado-badge"
                :class="{ 'badge-ganador': torneo.estado === 3 }">
                <q-icon v-if="isSpecialGolden(torneo)" name="military_tech" size="14px" class="q-mr-xs" />
                {{ estadoLabel(torneo) }}
              </q-badge>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="card-body">
          <div class="info-row">
            <q-icon name="place" class="info-icon" />
            <span class="info-label">Ubicación:</span>
            <q-btn size="sm" dense rounded outline color="orange" class="ubicacion-btn"
              @click.stop="goToUbicacion(torneo.ubicacion?.id)" :label="torneo.ubicacion?.nombre || '—'" />
          </div>

          <div class="info-row">
            <q-icon name="signal_cellular_alt" class="info-icon" />
            <span class="info-label">Nivel:</span>
            <span class="info-value">{{ torneo.nivel?.nombre_nivel || torneo.nivel?.nombre || '—' }}</span>
          </div>

          <div class="info-row">
            <q-icon name="event" class="info-icon" />
            <span class="info-label">Inicio:</span>
            <span class="info-value">{{ formatDate(torneo.fecha_inicio) }}</span>
          </div>

          <div class="info-row">
            <q-icon name="event_available" class="info-icon" />
            <span class="info-label">Fin:</span>
            <span class="info-value">{{ formatDate(torneo.fecha_fin) }}</span>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="card-actions">
          <q-btn flat dense icon="visibility" label="Ver" class="action-btn" />
          <q-btn v-if="torneo.estado != 2 && torneo.estado != 3 && torneo.estado != 0" flat dense icon="edit"
            color="brown-7" @click.stop="onEdit(torneo)" title="Editar" />
          <q-btn v-if="torneo.estado != 0 && torneo.estado != 3" flat dense icon="pause_circle" color="negative"
            @click.stop="onDelete(torneo)" title="Suspender" />
          <q-btn v-if="torneo.estado == 0 || torneo.estado == 3" flat dense icon="event_repeat" color="purple-7"
            @click.stop="onReschedule(torneo)" title="Reprogramar">
            <q-tooltip>Reprogramar torneo</q-tooltip>
          </q-btn>
          <q-btn flat dense icon="groups" color="orange" @click.stop="openBorradores(torneo)" title="Borradores" />
        </q-card-actions>
      </q-card>
    </div>

    <!-- Dialog para crear/editar torneo -->
    <q-dialog v-model="showTorneoDialog" persistent>
      <torneo-dialog :initial="editingTorneo" :is-rescheduling="isRescheduling" @save="onSaveTorneo"
        @cancel="showTorneoDialog = false" />
    </q-dialog>

    <!-- Dialog de borradores -->
    <q-dialog v-model="showBorradoresDialog" persistent>
      <borradores-dialog v-if="activeTorneoForBorradores" :torneo-id="activeTorneoForBorradores"
        @save="onBorradoresSaved" @cancel="showBorradoresDialog = false" @started="onBorradoresStarted" />
    </q-dialog>

    <!-- Dialog para suspender / anular torneo con motivo -->
    <q-dialog v-model="showSuspendDialog" persistent>
      <q-card style="min-width: 420px; max-width: 560px;">
        <q-toolbar class="bg-red-10 text-white">
          <q-toolbar-title>
            <q-icon name="block" class="q-mr-sm" /> Confirmar suspensión
          </q-toolbar-title>
        </q-toolbar>

        <q-card-section>
          <div class="text-subtitle2">¿Desea suspender el torneo <strong>{{ suspendTarget?.nombre }}</strong>?</div>
          <div class="q-mt-md">
            <q-input outlined dense type="text" v-model="suspendReason" label="Motivo de suspensión" counter
              maxlength="50"
              :rules="[val => !!val && val.trim().length >= 5 || 'Mínimo 5 caracteres', val => (val || '').trim().length <= 50 || 'Máximo 50 caracteres']" />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="secondary" @click="cancelSuspend" />
          <q-btn label="Confirmar suspensión" color="negative" @click="confirmSuspend" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog de confirmación y respuesta para iniciar torneo -->
    <q-dialog v-model="showStartConfirm" persistent>
      <q-card style="min-width: 420px; max-width: 560px;">
        <q-card-section class="q-pa-md text-center">
          <div v-if="startResponseMessage" class="text-body1">{{ startResponseMessage }}</div>
          <div v-else class="text-subtitle2">¿Desea comenzar el torneo <strong>{{ suspendTarget?.nombre }}</strong>?
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="secondary" @click="showStartConfirm = false" />
          <q-btn v-if="suspendTarget && Number(suspendTarget.estado) === 2" unelevated color="primary"
            label="Seguir torneo" @click="openSeguimiento" />
          <q-btn v-else unelevated color="positive" label="Comenzar" @click="doStartTournament" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <seguimiento-torneo-dialog v-model="showSeguimiento" :torneo="selectedTorneo" />
    <!-- Descomentar componente arriba para usar dialog en vez de page -->

    <!-- Drawer de detalles a la derecha -->
    <q-drawer v-model="drawer" side="right" overlay width="520">
      <q-toolbar class="bg-grey-2">
        <q-toolbar-title>Detalles del torneo</q-toolbar-title>
        <q-btn dense flat icon="close" @click="drawer = false" />
      </q-toolbar>

      <div v-if="selectedTorneo" class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div class="text-h6">{{ selectedTorneo.nombre }}</div>
            <div class="text-caption">{{ dateRange(selectedTorneo) }}</div>
          </div>

          <div class="col-12">
            <q-badge :color="badgeColor(selectedTorneo.tipo_torneo?.nombre)" class="q-mr-sm" outline>{{
              selectedTorneo.tipo_torneo?.nombre }}</q-badge>
            <q-badge color="info" outline>{{ selectedTorneo.ubicacion?.nombre }}</q-badge>
          </div>

          <div class="col-12">
            <q-separator />
            <div class="text-subtitle2 q-mt-sm">Fases</div>
            <div v-if="selectedTorneo.tipo_torneo?.fases?.length">
              <q-expansion-item v-for="fase in selectedTorneo.tipo_torneo.fases" :key="fase.id" :label="fase.nombre">
                <div v-if="(fase.partidos || []).length">
                  <q-list bordered padding>
                    <q-item v-for="p in fase.partidos" :key="p.id">
                      <q-item-section>
                        <div class="row items-center">
                          <q-badge color="primary" class="q-mr-sm">{{ teamName(p, 'local') }}</q-badge>
                          <span class="text-caption">vs</span>
                          <q-badge color="secondary" class="q-ml-sm">{{ teamName(p, 'visitante') }}</q-badge>
                          <div class="q-ml-sm text-caption">ronda: {{ p.ronda || '-' }}</div>
                        </div>
                      </q-item-section>
                      <q-item-section side class="row items-center">
                        <div class="text-caption">{{ p.goles_local ?? 0 }} - {{ p.goles_visitante ?? 0 }}</div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
                <div v-else class="text-caption q-pa-sm">No hay partidos en esta fase.</div>
              </q-expansion-item>
            </div>
            <div v-else class="text-caption q-pa-sm">Este tipo de torneo no contiene fases.</div>
          </div>
        </div>
      </div>
      <div v-else class="q-pa-md">Selecciona un torneo para ver detalles</div>
    </q-drawer>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import TorneoDialog from './TorneoDialog.vue'
import BorradoresDialog from './BorradoresDialog.vue'
// import SeguimientoTorneoDialog from './SeguimientoTorneoDialog.vue' // Descomentar para usar dialog en vez de page
import { listarTorneos, listarTiposTorneo, crearTorneo, modificarTorneo, comenzarTorneo, suspenderTorneo } from 'src/stores/torneo-store'
import { listarUbicaciones } from 'src/stores/ubicacion-store'
import { listarNiveles } from 'src/stores/nivel'
import { actualizarBorradores } from 'src/stores/borrador-store'

const $q = useQuasar()
const router = useRouter()

const torneos = ref([])
const tiposTorneo = ref([])
const ubicaciones = ref([])
const loading = ref(false)
const filters = reactive({ search: '', id_tipo_torneo: null, id_ubicacion: null, id_nivel: null, fecha_inicio_desde: null, fecha_inicio_hasta: null, estados: [2] })
const pagination = reactive({ page: 1, rowsPerPage: 10 })

const selectedTorneo = ref(null)
const drawer = ref(false)
const showSeguimiento = ref(false)
const showTorneoDialog = ref(false)
const editingTorneo = ref(null)
const isRescheduling = ref(false)
const showBorradoresDialog = ref(false)
const activeTorneoForBorradores = ref(null)

const tipoOptions = computed(() => {
  return tiposTorneo.value.map(t => ({ label: t.nombre, value: t.id }))
})

const ubicacionOptions = computed(() => {
  return ubicaciones.value.map(u => ({ label: u.nombre, value: u.id }))
})

const nivelOptions = computed(() => {
  return niveles.value.map(n => ({ label: n.nombre_nivel || n.nombre || 'N/A', value: n.id }))
})

const niveles = ref([])
const estadoOptions = [
  { label: 'Suspendido', value: 0, color: 'negative' },
  { label: 'Sin comenzar', value: 1, color: 'info' },
  { label: 'Comenzado', value: 2, color: 'positive' },
  { label: 'Finalizado', value: 3, color: 'grey' }
]

// por defecto mostrar estados activos (Comenzado)
filters.estados = [2]

// Expansión de filtros
const filtersExpanded = ref(false)

// Contador de filtros activos
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.id_tipo_torneo) count++
  if (filters.id_ubicacion) count++
  if (filters.id_nivel) count++
  if (filters.estados && filters.estados.length > 0) count++
  if (filters.fecha_inicio_desde) count++
  if (filters.fecha_inicio_hasta) count++
  return count
})

// Estadísticas calculadas
const estadisticas = computed(() => {
  const filtered = filteredTorneos.value
  return {
    suspendidos: filtered.filter(t => Number(t.estado) === 0).length,
    sinComenzar: filtered.filter(t => Number(t.estado) === 1).length,
    comenzados: filtered.filter(t => Number(t.estado) === 2).length,
    finalizados: filtered.filter(t => Number(t.estado) === 3).length
  }
})

onMounted(async () => {
  loading.value = true
  await loadTorneos()
})
const loadTorneos = async () => {
  try {
    const [tList, tipos, ubics, nivelesList] = await Promise.all([
      listarTorneos().catch(() => []),
      listarTiposTorneo().catch(() => []),
      listarUbicaciones().catch(() => []),
      listarNiveles().catch(() => [])
    ])
    torneos.value = Array.isArray(tList) ? tList : (tList?.data || [])
    tiposTorneo.value = Array.isArray(tipos) ? tipos : (tipos?.data || [])
    ubicaciones.value = Array.isArray(ubics) ? ubics : (ubics?.data || [])
    niveles.value = Array.isArray(nivelesList) ? nivelesList : (nivelesList?.data || [])
    console.log(torneos.value);

  } catch (err) {
    console.error('Error cargando datos de torneos', err)
    $q.notify({ type: 'negative', message: 'Error al cargar datos de torneos' })
  } finally {
    loading.value = false
  }
}
const badgeColor = (key) => {
  if (!key) return 'grey'
  const name = String(key).toLowerCase()
  if (name.includes('elimin')) return 'red'
  if (name.includes('liga')) return 'teal'
  if (name.includes('final') || name.includes('semif')) return 'amber'
  if (name === 'ubicacion') return 'indigo'
  return 'primary'
}

// Determina color de badge para la columna Estado basado en torneo.estado directamente
const badgeColorEstado = (row) => {
  const estado = Number(row?.estado)
  switch (estado) {
    case 0: return 'negative' // Suspendido
    case 1: return 'info' // Sin comenzar
    case 2: return 'positive' // Comenzado
    case 3: return 'grey' // Finalizado
    default: return 'primary'
  }
}

const estadoLabel = (row) => {
  const estado = Number(row?.estado)

  switch (estado) {
    case 0: return 'Suspendido'
    case 1: return 'Sin comenzar'
    case 2: return 'Comenzado'
    case 3: return 'Finalizado'
    default: return 'Desconocido'
  }
}

const isSpecialGolden = (row) => {
  return Number(row?.estado) === 3 // Finalizado
}

const filteredTorneos = computed(() => {
  return torneos.value.filter(t => {
    // Filtro por búsqueda
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!t.nombre.toLowerCase().includes(q)) return false
    }
    // Filtros por campos
    if (filters.id_tipo_torneo && t.id_tipo_torneo !== filters.id_tipo_torneo) return false
    if (filters.id_ubicacion && t.id_ubicacion !== filters.id_ubicacion) return false
    if (filters.id_nivel && t.id_nivel !== filters.id_nivel) return false

    // Filtro por fecha_inicio (rango)
    if (filters.fecha_inicio_desde) {
      const desde = new Date(filters.fecha_inicio_desde)
      if (!t.fecha_inicio || new Date(t.fecha_inicio) < desde) return false
    }
    if (filters.fecha_inicio_hasta) {
      const hasta = new Date(filters.fecha_inicio_hasta)
      if (!t.fecha_inicio || new Date(t.fecha_inicio) > hasta) return false
    }

    // FILTRO DE ESTADO - ES LO ÚNICO QUE AFECTA AL FILTRADO POR ESTADO
    // Valores posibles: 0 (Suspendido), 1 (Sin comenzar), 2 (Comenzado), 3 (Finalizado)
    // El estado se compara DIRECTAMENTE sin ninguna transformación
    if (filters.estados && Array.isArray(filters.estados) && filters.estados.length) {
      const estadoActual = Number(t.estado)
      if (!filters.estados.includes(estadoActual)) return false
    }

    return true
  })
})

const rowsWithNro = computed(() => {
  const start = Math.max(0, (pagination.page - 1) * pagination.rowsPerPage)
  return filteredTorneos.value.map((r, idx) => ({ ...r, nro: start + idx + 1 }))
})

function clearFilters() {
  filters.search = ''
  filters.id_tipo_torneo = null
  filters.id_ubicacion = null
  filters.id_nivel = null
  filters.estados = [1, 2]
  filters.fecha_inicio_desde = null
  filters.fecha_inicio_hasta = null
}

function onAdd() {
  editingTorneo.value = null
  isRescheduling.value = false
  showTorneoDialog.value = true
}

function openBorradores(row) {
  activeTorneoForBorradores.value = row.id
  showBorradoresDialog.value = true
}

function onEdit(row) {
  console.log(row);

  editingTorneo.value = JSON.parse(JSON.stringify(row))
  isRescheduling.value = false
  showTorneoDialog.value = true
}

function onReschedule(row) {
  // Abrir el diálogo de edición para permitir reprogramar el torneo
  editingTorneo.value = JSON.parse(JSON.stringify(row))
  isRescheduling.value = true
  showTorneoDialog.value = true
  $q.notify({
    type: 'info',
    message: 'Puede modificar las fechas y configuración para reprogramar el torneo',
    position: 'top'
  })
}

const onSaveTorneo = async (payload) => {
  if (payload.id) {
    await modificarTorneo(payload)
  } else {
    await crearTorneo(payload)
  }
  showTorneoDialog.value = false
  await loadTorneos()
}

const onBorradoresSaved = async (payload) => {
  await actualizarBorradores(payload)
  showBorradoresDialog.value = false
  await loadTorneos()
}

async function onBorradoresStarted(evt) {
  // evt may contain { torneoId }
  showBorradoresDialog.value = false
  await loadTorneos()
  // seleccionar el torneo que inició
  const id = evt?.torneoId || (selectedTorneo.value && selectedTorneo.value.id)
  if (id) {
    // intentar encontrar en la lista recargada
    const found = torneos.value.find(t => String(t.id) === String(id))
    if (found) selectedTorneo.value = found
  }

  router.push({ path: `/torneos/seguimiento/${id}` }) // Comentar para usar dialog
  // showSeguimiento.value = true // Descomentar para usar dialog en vez de page
  $q.notify({ type: 'positive', message: 'Torneo iniciado — mostrando seguimiento' })
}

// Suspender/Anular torneo con motivo: abrir diálogo modal personalizado
const showSuspendDialog = ref(false)
const suspendReason = ref('')
const suspendTarget = ref(null)
const currentUserName = ref('')
const showStartConfirm = ref(false)
const startResponseMessage = ref(null)
// const showSeguimiento = ref(false) // Descomentar para usar dialog en vez de page

onMounted(() => {
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    currentUserName.value = current ? (current.persona?.nombres || current.usuario || '') : ''
  } catch (err) { console.warn(err); currentUserName.value = '' }
})


function onDelete(row) {
  // abrir diálogo de suspensión, no eliminar directamente
  suspendTarget.value = row
  suspendReason.value = ''
  showSuspendDialog.value = true
}

const confirmSuspend = async () => {
  if (!suspendTarget.value) return
  // validar motivo
  const reason = (suspendReason.value || '').trim()
  if (reason.length < 5 || reason.length > 50) {
    $q.notify({ type: 'negative', message: 'indique el motivo' })
    return
  }
  await suspenderTorneo({
    torneoId: suspendTarget.value.id,
    estadoActual: suspendTarget.value.estado,
    motivoSuspension: reason,
    usuarioQueSuspende: currentUserName.value
  })
  showSuspendDialog.value = false
}

function cancelSuspend() {
  showSuspendDialog.value = false
  suspendReason.value = ''
  suspendTarget.value = null
}

// (openStartConfirm removed; showStartConfirm is toggled where needed)

async function doStartTournament() {
  if (!suspendTarget.value) return
  try {
    const res = await comenzarTorneo(suspendTarget.value.id)
    // si la respuesta trae mensaje, mostrarlo en el dialog; si no, cerrar y recargar
    if (res && res.mensaje) {
      startResponseMessage.value = res.mensaje
    } else {
      showStartConfirm.value = false
      await loadTorneos()
      $q.notify({ type: 'positive', message: 'Torneo iniciado' })
    }
  } catch (err) {
    console.error('Error al iniciar torneo', err)
    $q.notify({ type: 'negative', message: 'Error al iniciar torneo' })
    showStartConfirm.value = false
  }
}

async function openDetails(evtOrRow, maybeRow) {
  // q-table @row-click puede pasar (evt, row) o solo (row).
  let item = null

  if (maybeRow) {
    // llamado como (evt, row)
    item = maybeRow
  } else if (evtOrRow) {
    // puede ser (row) o el evento
    if (evtOrRow.row) item = evtOrRow.row
    else if (typeof evtOrRow.id !== 'undefined') item = evtOrRow
  }

  if (!item) {
    $q.notify({ type: 'warning', message: 'Registro inválido o fila no disponible' })
    return
  }

  selectedTorneo.value = item

  // Si el estado es 2 (en marcha) o 3 (con ganador), navegar a la página de seguimiento
  if (typeof item.estado !== 'undefined' && (Number(item.estado) === 2 || Number(item.estado) === 3)) {
    showSeguimiento.value = false// Asegurar que esté cerrado
    router.push({ path: `/torneos/seguimiento/${item.id}` }) // Comentar para usar dialog
    // showSeguimiento.value = true // Descomentar para usar dialog en vez de page
    return
  }

  // Si el estado NO es 2 ni 3, abrir BorradoresDialog
  activeTorneoForBorradores.value = item.id
  showBorradoresDialog.value = true
}



function goToUbicacion(id) {
  if (!id) {
    $q.notify({ type: 'warning', message: 'Ubicación no disponible' })
    return
  }
  // navegar al módulo de ubicaciones y pasar query param 'focus' para centrar
  router.push({ path: '/ubicaciones', query: { focus: id } })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  // esperar formato 'aaaa-mm-dd' (posible también con hora), tomamos la parte date
  const part = String(dateStr).split('T')[0]
  const parts = part.split('-')
  if (parts.length < 3) return dateStr
  const [yyyy, mm, dd] = parts
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const mi = parseInt(mm, 10) - 1
  const mon = monthNames[mi] || mm
  return `${dd} ${mon} ${yyyy}`
}

function dateRange(t) {
  if (!t) return ''
  return `${formatDate(t.fecha_inicio)} → ${formatDate(t.fecha_fin)}`
}

function teamName(p, side) {
  if (!p) return '-'
  if (side === 'local') return p.equipo_local?.nombre || `#${p.id_equipo_local || p.id_equipo_local}` || '-'
  return p.equipo_visitante?.nombre || `#${p.id_equipo_visitante || p.id_equipo_visitante}` || '-'
}
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

// Variables de color (Paleta Verde-Naranja-Marrón)
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
$color-orange: #ff6f00;
$color-orange-light: #ff8f00;
$color-orange-accent: #ffa726;

// Tonos pastel
$pastel-mint: #c8e6c9;
$pastel-lime: #dcedc8;
$pastel-sage: #f1f8e9;
$pastel-sand: #efebe9;
$pastel-clay: #d7ccc8;

.page-container {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  padding: 10px;
  border-radius: 16px;
  margin-bottom: 0px;
}

.header-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  .q-icon {
    color: $color-moss;
  }
}

.page-title {
  color: $color-forest;
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  color: $color-wood;
  font-size: 1rem;
  margin: 0;
  margin-left: 58px;
  opacity: 0.9;
}

.btn-add-header {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(85, 139, 47, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(85, 139, 47, 0.4);
  }

  .q-icon {
    font-size: 1.4em;
  }
}

// Estadísticas
.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.stat-card {
  flex: 1 1 auto;
  min-width: 200px;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.stat-card-total {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
}

.stat-card-active {
  background: linear-gradient(135deg, $color-leaf 0%, $color-lime 100%);
  color: white;
}

.stat-card-pending {
  background: linear-gradient(135deg, $color-sage 0%, $pastel-lime 100%);
  color: $color-forest;
}

.stat-card-suspended {
  background: linear-gradient(135deg, $color-bark 0%, $color-earth 100%);
  color: white;
}

.stat-card-finished {
  background: linear-gradient(135deg, $color-wood 0%, $color-clay 100%);
  color: white;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.95;
  font-weight: 500;
}

// Barra de herramientas
.toolbar-card {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-input {
  .q-field__control {
    border-radius: 12px;
  }
}

.filters-expansion {
  border: 2px solid $pastel-lime;
  border-radius: 12px;
  overflow: hidden;

  .q-expansion-item__container {
    border: none;
  }
}

.filters-header {
  display: flex;
  align-items: center;
  color: $color-forest;
  font-weight: 600;
  font-size: 1rem;

  .q-icon {
    color: $color-moss;
  }
}

.filters-title {
  color: $color-forest;
  font-weight: 600;
}

.filters-body {
  background: $pastel-sage;
  padding: 16px;
  border-radius: 0 0 12px 12px;
}

.clear-filters-btn {
  color: $color-wood;
  font-weight: 600;

  &:hover {
    background: rgba(93, 64, 55, 0.1);
  }
}

// Grid de torneos
.torneos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 24px;
}

.torneo-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: $color-leaf;
  }
}

.card-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-lime 100%);
  padding: 20px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.card-avatar {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(85, 139, 47, 0.3);
  transition: all 0.4s ease;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: $color-forest;
  margin-bottom: 6px;
  line-height: 1.3;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.tipo-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}

.estado-badge {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

// Estilos para torneos con ganador (estado === 3)
.torneo-ganador {
  border: 2px solid #ffd700 !important;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15) !important;

  &:hover {
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.2) !important;
  }
}

.header-ganador {
  background: linear-gradient(135deg, #fff9e6 0%, #fffacd 50%, #fff9e6 100%) !important;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.2) 50%, transparent 70%);
    animation: shine 3s infinite;
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.avatar-ganador {
  position: relative;
  animation: pulse-golden 2s infinite;
}

@keyframes pulse-golden {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.avatar-dorado {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%) !important;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 4px 16px rgba(255, 215, 0, 0.5) !important;
  animation: glow-golden 2s infinite;
}

@keyframes glow-golden {

  0%,
  100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 4px 16px rgba(255, 215, 0, 0.5);
  }

  50% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 6px 24px rgba(255, 215, 0, 0.7);
  }
}

.golden-shine {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  animation: expand-shine 2s infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes expand-shine {
  0% {
    width: 80px;
    height: 80px;
    opacity: 0.8;
  }

  50% {
    width: 100px;
    height: 100px;
    opacity: 0.4;
  }

  100% {
    width: 80px;
    height: 80px;
    opacity: 0.8;
  }
}

.title-ganador {
  color: #d4af37 !important;
  text-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);
  font-weight: 800;
}

.ganador-icon {
  color: #ffd700;
  animation: rotate-medal 3s infinite;
  filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5));
}

@keyframes rotate-medal {

  0%,
  100% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(-10deg);
  }

  75% {
    transform: rotate(10deg);
  }
}

.badge-ganador {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%) !important;
  color: #8b6914 !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5) !important;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.info-icon {
  color: $color-orange;
  font-size: 1.25rem;
  margin-right: 12px;
  min-width: 24px;
}

.info-label {
  font-weight: 600;
  color: $color-wood;
  margin-right: 8px;
  min-width: 80px;
}

.info-value {
  color: $color-earth;
  font-weight: 500;
}

.ubicacion-btn {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 111, 0, 0.4);
  }
}

.card-actions {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  gap: 8px;
}

.action-btn {
  color: $color-forest;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(46, 125, 50, 0.1);
  }
}

// Responsive
@media (max-width: 1400px) {
  .torneos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1023px) {
  .torneos-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-container {
    .stat-card {
      min-width: calc(50% - 8px);
    }
  }
}

@media (max-width: 959px) {
  .page-title {
    font-size: 1.8rem;
  }

  .stat-number {
    font-size: 1.75rem;
  }
}

@media (max-width: 599px) {
  .torneos-grid {
    grid-template-columns: 1fr;
  }

  .stats-container {
    .stat-card {
      min-width: 100%;
    }
  }

  .page-title {
    font-size: 1.5rem;
  }

  .header-subtitle {
    margin-left: 0;
    margin-top: 8px;
  }

  .header-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-add-header {
    width: 100%;
    justify-content: center;
  }
}
</style>
