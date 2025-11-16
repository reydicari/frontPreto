<template>
  <q-page padding :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <q-card>
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6 page-title">Torneos</div>
        <q-space />
        <q-btn color="primary" label="Agregar torneo" icon="add" @click="onAdd" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md q-row-wrap items-center">
          <div class="col-12 col-sm-6 col-md-3">
            <q-input dense v-model="filters.search" label="Buscar por nombre" clearable />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select dense v-model="filters.id_tipo_torneo" :options="tipoOptions" label="Tipo" emit-value map-options
              clearable />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select dense v-model="filters.id_ubicacion" :options="ubicacionOptions" label="Ubicación" emit-value
              map-options clearable />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select dense v-model="filters.id_nivel" :options="nivelOptions" label="Nivel" emit-value map-options
              clearable />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select dense multiple use-chips chip-color="primary" v-model="filters.estados" :options="estadoOptions"
              label="Estado" emit-value map-options clearable />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-input dense v-model="filters.fecha_inicio_desde" label="Desde (inicio)" type="date" />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-input dense v-model="filters.fecha_inicio_hasta" label="Hasta (inicio)" type="date" />
          </div>

          <div class="col-12 col-sm-6 col-md-3 row items-center">
            <q-btn flat icon="filter_list" label="Limpiar" @click="clearFilters" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table :rows="rowsWithNro" :columns="columns" row-key="id" v-model:pagination="pagination" flat dense
          wrap-cells @row-click="openDetails">
          <template v-slot:body-cell-nombre="props">
            <q-td :props="props">
              <div class="row items-center">
                <q-badge :color="badgeColor(props.row.tipo_torneo?.nombre || 'Desconocido')" class="q-mr-sm" outline>
                  {{ props.row.tipo_torneo?.nombre || '—' }}
                </q-badge>
                <div>
                  <div class="text-weight-medium">{{ props.row.nombre }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <div class="row items-center">
                <q-badge :color="badgeColorEstado(props.row, estadoFromDates(props.row))" class="q-mr-sm">
                  <template v-if="isSpecialGolden(props.row, estadoFromDates(props.row))">
                    <q-icon name="star" size="14px" class="q-mr-xs" />
                  </template>
                  {{ estadoLabel(props.row, estadoFromDates(props.row)) }}
                </q-badge>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-ubicacion="props">
            <q-td :props="props">
              <div>
                <!-- Botón compacto para ubicación: visible pero no grande -->
                <q-btn size="sm" dense rounded outline color="indigo" class="q-ml-sm"
                  @click.stop="goToUbicacion(props.row.ubicacion?.id)" :label="props.row.ubicacion?.nombre || '—'"
                  title="Ver ubicación" />
                <q-tooltip anchor="top middle" self="bottom middle">Ver ubicación</q-tooltip>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-fecha_inicio="props">
            <q-td :props="props">
              {{ formatDate(props.row.fecha_inicio) }}
            </q-td>
          </template>

          <template v-slot:body-cell-fecha_fin="props">
            <q-td :props="props">
              {{ formatDate(props.row.fecha_fin) }}
            </q-td>
          </template>

          <template v-slot:body-cell-nivel="props">
            <q-td :props="props">
              {{ props.row.nivel?.nombre_nivel || props.row.nivel?.nombre || '—' }}
            </q-td>
          </template>

          <template v-slot:body-cell-acciones="props">
            <q-td :props="props">
              <q-btn dense flat icon="edit" color="secondary" @click.stop="onEdit(props.row)" title="Editar" />
              <q-btn v-if="props.row.estado != 0" dense flat icon="pause_circle" color="negative"
                @click.stop="onDelete(props.row)" title="Suspender" />
              <q-btn dense flat icon="groups" color="teal" @click.stop="openBorradores(props.row)" title="Borradores" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Dialog para crear/editar torneo -->
    <q-dialog v-model="showTorneoDialog" persistent>
      <torneo-dialog :initial="editingTorneo" @save="onSaveTorneo" @cancel="showTorneoDialog = false" />
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
import SeguimientoTorneoDialog from './SeguimientoTorneoDialog.vue'
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
const filters = reactive({ search: '', id_tipo_torneo: null, id_ubicacion: null, id_nivel: null, fecha_inicio_desde: null, fecha_inicio_hasta: null })
const pagination = reactive({ page: 1, rowsPerPage: 10 })

const columns = [
  { name: 'nro', label: 'Nro', field: 'nro', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre', sortable: true },
  { name: 'estado', label: 'Estado', field: row => estadoFromDates(row), sortable: true },
  { name: 'ubicacion', label: 'Ubicación', field: row => row.ubicacion?.nombre || '-', sortable: true },
  { name: 'nivel', label: 'Nivel', field: row => row.nivel?.nombre_nivel || (row.nivel?.nombre) || '-', sortable: true },
  { name: 'fecha_inicio', label: 'Inicio', field: 'fecha_inicio', sortable: true },
  { name: 'fecha_fin', label: 'Fin', field: 'fecha_fin', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones' }
]

const selectedTorneo = ref(null)
const drawer = ref(false)
const showTorneoDialog = ref(false)
const editingTorneo = ref(null)
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
  { label: 'Suspendido', value: 'suspendido', color: 'negative' },
  { label: 'Terminado', value: 0, color: 'grey' },
  { label: 'En marcha', value: 1, color: 'positive' },
  { label: 'Sin comenzar', value: 2, color: 'info' }
]

// por defecto mostrar estados activos (En marcha y Sin comenzar)
filters.estados = [1, 2]

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

// Determina color de badge para la columna Estado.
// Reglas especiales:
// - si row.estado === 0 -> 'Suspendido' (rojo)
// - si computedEstado === 1 (En marcha) y row.estado === 2 -> dorado (amber) con icono
const badgeColorEstado = (row, computedEstado) => {
  if (row && typeof row.estado !== 'undefined' && Number(row.estado) === 0) return 'negative'
  if (computedEstado === 1 && row && Number(row.estado) === 2) return 'amber'
  switch (Number(computedEstado)) {
    case -1: return 'negative' // anulado
    case 0: return 'grey' // terminado
    case 1: return 'positive' // en marcha
    case 2: return 'info' // sin comenzar
    default: return 'primary'
  }
}

const estadoLabel = (row, computedEstado) => {
  if (row && typeof row.estado !== 'undefined' && Number(row.estado) === 0) return 'Suspendido'
  if (Number(computedEstado) == -1) return 'Anulado'
  if (Number(computedEstado) == 0) return 'Terminado'
  if (Number(computedEstado) == 1) return 'En marcha'
  if (Number(computedEstado) == 2) return 'Sin comenzar'
  return 'Desconocido'
}

const isSpecialGolden = (row, computedEstado) => {
  return computedEstado === 1 && row && Number(row.estado) === 2
}

function estadoFromDates(t) {
  // Reglas solicitadas:
  // si estado == -1 respetar (anulado)
  if (typeof t.estado !== 'undefined' && Number(t.estado) === -1) return -1
  const hoy = new Date()
  const start = t.fecha_inicio ? new Date(t.fecha_inicio) : null
  const end = t.fecha_fin ? new Date(t.fecha_fin) : null
  // ffin <= hoy => terminado (0)
  if (end && end <= hoy) return 0
  // finicio <= hoy => en marcha (1)
  if (start && start <= hoy) return 1
  // finicio > hoy => sin comenzar (2)
  if (start && start > hoy) return 2
  return 2
}

const filteredTorneos = computed(() => {
  return torneos.value.filter(t => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!t.nombre.toLowerCase().includes(q)) return false
    }
    if (filters.id_tipo_torneo && t.id_tipo_torneo !== filters.id_tipo_torneo) return false
    if (filters.id_ubicacion && t.id_ubicacion !== filters.id_ubicacion) return false
    if (filters.id_nivel && t.id_nivel !== filters.id_nivel) return false
    // filtro por fecha_inicio rango
    if (filters.fecha_inicio_desde) {
      const desde = new Date(filters.fecha_inicio_desde)
      if (!t.fecha_inicio || new Date(t.fecha_inicio) < desde) return false
    }
    if (filters.fecha_inicio_hasta) {
      const hasta = new Date(filters.fecha_inicio_hasta)
      if (!t.fecha_inicio || new Date(t.fecha_inicio) > hasta) return false
    }
    // filtro por estado(s)
    if (filters.estados && Array.isArray(filters.estados) && filters.estados.length) {
      const selections = filters.estados

      // regla especial: los torneos con atributo estado === 0 solo deben aparecer si se seleccionó 'suspendido'
      if (typeof t.estado !== 'undefined' && Number(t.estado) === 0 && !selections.includes('suspendido')) {
        return false
      }

      let allowed = false

      // si se seleccionó 'suspendido', incluimos torneos cuyo atributo estado === 0
      if (selections.includes('suspendido')) {
        if (Number(t.estado) === 0) allowed = true
      }

      // las demás selecciones (numéricas) se comparan con la estado calculada por fechas
      const numericSelections = selections.filter(s => s !== 'suspendido').map(Number).filter(n => !isNaN(n))
      if (numericSelections.length) {
        const est = estadoFromDates(t)
        if (numericSelections.includes(est)) allowed = true
      }

      if (!allowed) return false
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
  showTorneoDialog.value = true
}

function openBorradores(row) {
  activeTorneoForBorradores.value = row.id
  showBorradoresDialog.value = true
}

function onEdit(row) {
  console.log(row);

  editingTorneo.value = JSON.parse(JSON.stringify(row))
  showTorneoDialog.value = true
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
  showSeguimiento.value = true
  $q.notify({ type: 'positive', message: 'Torneo iniciado — mostrando seguimiento' })
}

// Suspender/Anular torneo con motivo: abrir diálogo modal personalizado
const showSuspendDialog = ref(false)
const suspendReason = ref('')
const suspendTarget = ref(null)
const currentUserName = ref('')
const showStartConfirm = ref(false)
const startResponseMessage = ref(null)
const showSeguimiento = ref(false)

function openSeguimiento() {
  showSeguimiento.value = true
  showStartConfirm.value = false
}

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

function openDetails(evtOrRow, maybeRow) {
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

  // Sólo abrir el diálogo de seguimiento cuando el torneo tenga estado === 2.
  if (typeof item.estado !== 'undefined' && Number(item.estado) === 2) {
    showSeguimiento.value = true
    return
  }

  // si no está iniciado, notificar al usuario
  $q.notify({ type: 'warning', message: 'El torneo aún no fue iniciado' })
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

.page-title {
  border-left: 6px solid $orange-8;
  padding-left: 12px;
  color: $secondary;
  font-size: 2.2em;
  font-weight: 800;
  line-height: 1.2;
}

.q-table tbody td {
  vertical-align: middle;
}

/* Centrar los encabezados de la q-table dentro de este componente */
::v-deep .q-table thead th {
  text-align: center;
}
</style>
