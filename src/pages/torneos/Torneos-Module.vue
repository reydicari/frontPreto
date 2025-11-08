<template>
  <q-page padding>
    <q-card>
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6">Torneos</div>
        <div class="text-subtitle2">Gestiona torneos, fases y partidos — datos en memoria</div>
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
              <q-badge :color="badgeColorEstado(props.row.estado)">{{ estadoLabel(props.row.estado) }}</q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-ubicacion="props">
            <q-td :props="props">
              <q-badge :color="badgeColor('ubicacion')" class="q-ml-sm" outline>
                {{ props.row.ubicacion?.nombre || '—' }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-acciones="props">
            <q-td :props="props">
              <q-btn dense flat icon="visibility" color="primary" @click.stop="openDetails(props.row)" title="Ver" />
              <q-btn dense flat icon="edit" color="secondary" @click.stop="onEdit(props.row)" title="Editar" />
              <q-btn dense flat icon="delete" color="negative" @click.stop="onDelete(props.row)" title="Eliminar" />
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
        @save="onBorradoresSaved" @cancel="showBorradoresDialog = false" />
    </q-dialog>

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
import TorneoDialog from './TorneoDialog.vue'
import BorradoresDialog from './BorradoresDialog.vue'
import { listarTorneos, listarTiposTorneo } from 'src/stores/torneo-store'
import { listarUbicaciones } from 'src/stores/ubicacion-store'

const $q = useQuasar()

const torneos = ref([])
const tiposTorneo = ref([])
const ubicaciones = ref([])
const loading = ref(false)
const filters = reactive({ search: '', id_tipo_torneo: null, id_ubicacion: null, fecha_inicio_desde: null, fecha_inicio_hasta: null })
const pagination = reactive({ page: 1, rowsPerPage: 10 })

const columns = [
  { name: 'nro', label: 'Nro', field: 'nro', sortable: false },
  { name: 'nombre', label: 'Nombre', field: 'nombre', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', sortable: true },
  { name: 'ubicacion', label: 'Ubicación', field: row => row.ubicacion?.nombre || '-', sortable: true },
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

onMounted(async () => {
  loading.value = true
  try {
    const [tList, tipos, ubics] = await Promise.all([
      listarTorneos().catch(() => []),
      listarTiposTorneo().catch(() => []),
      listarUbicaciones().catch(() => [])
    ])
    torneos.value = Array.isArray(tList) ? tList : (tList?.data || [])
    tiposTorneo.value = Array.isArray(tipos) ? tipos : (tipos?.data || [])
    ubicaciones.value = Array.isArray(ubics) ? ubics : (ubics?.data || [])
    console.log('torneos rescatados: ', torneos.value);

  } catch (err) {
    console.error('Error cargando datos de torneos', err)
    $q.notify({ type: 'negative', message: 'Error al cargar datos de torneos' })
  } finally {
    loading.value = false
  }
})

const badgeColor = (key) => {
  if (!key) return 'grey'
  const name = String(key).toLowerCase()
  if (name.includes('elimin')) return 'red'
  if (name.includes('liga')) return 'teal'
  if (name.includes('final') || name.includes('semif')) return 'amber'
  if (name === 'ubicacion') return 'indigo'
  return 'primary'
}

const badgeColorEstado = (estado) => {
  switch (Number(estado)) {
    case -1: return 'negative' // anulado
    case 0: return 'grey' // terminado
    case 1: return 'positive' // en marcha
    case 2: return 'info' // sin comenzar
    default: return 'primary'
  }
}

const estadoLabel = (estado) => {
  console.log('estado: ', estado);

  if (Number(estado) == -1) return 'Anulado'
  if (Number(estado) == 0) return 'Terminado'
  if (Number(estado) == 1) return 'En marcha'
  if (Number(estado) == 2) return 'Sin comenzar'
  return 'Desconocido'
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
    // filtro por fecha_inicio rango
    if (filters.fecha_inicio_desde) {
      const desde = new Date(filters.fecha_inicio_desde)
      if (!t.fecha_inicio || new Date(t.fecha_inicio) < desde) return false
    }
    if (filters.fecha_inicio_hasta) {
      const hasta = new Date(filters.fecha_inicio_hasta)
      if (!t.fecha_inicio || new Date(t.fecha_inicio) > hasta) return false
    }
    return true
  })
})

const rowsWithNro = computed(() => {
  const start = Math.max(0, (pagination.page - 1) * pagination.rowsPerPage)
  return filteredTorneos.value.map((r, idx) => ({ ...r, nro: start + idx + 1, estado: estadoFromDates(r) }))
})

function clearFilters() {
  filters.search = ''
  filters.id_tipo_torneo = null
  filters.id_ubicacion = null
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
  editingTorneo.value = JSON.parse(JSON.stringify(row))
  showTorneoDialog.value = true
}

function onSaveTorneo(payload) {
  if (payload.id) {
    const idx = torneos.value.findIndex(t => t.id === payload.id)
    if (idx !== -1) torneos.value.splice(idx, 1, payload)
    $q.notify({ type: 'positive', message: 'Torneo actualizado' })
  } else {
    // generar id simple
    const newId = Math.max(0, ...torneos.value.map(t => t.id)) + 1
    payload.id = newId
    torneos.value.unshift(payload)
    $q.notify({ type: 'positive', message: 'Torneo creado' })
  }
  showTorneoDialog.value = false
}

function onBorradoresSaved(payload) {
  // payload: { nuevos, desechados }
  console.log('Borradores dialog returned:', payload)
  $q.notify({ type: 'positive', message: 'Borradores procesados (ver consola)' })
  showBorradoresDialog.value = false
}

function onDelete(row) {
  $q.dialog({ title: 'Eliminar', message: `¿Eliminar torneo "${row.nombre}"?`, cancel: true, persistent: true }).onOk(() => {
    const idx = torneos.value.findIndex(t => t.id === row.id)
    if (idx !== -1) torneos.value.splice(idx, 1)
    if (selectedTorneo.value && selectedTorneo.value.id === row.id) {
      selectedTorneo.value = null
      drawer.value = false
    }
    $q.notify({ type: 'info', message: 'Torneo eliminado' })
  })
}

function openDetails(row) {
  // q-table @row-click sometimes sends (evt,row) or just row
  const item = row && row.row ? row.row : row
  selectedTorneo.value = item
  drawer.value = true
}

function dateRange(t) { return `${t.fecha_inicio} → ${t.fecha_fin}` }

function teamName(p, side) {
  if (!p) return '-'
  if (side === 'local') return p.equipo_local?.nombre || `#${p.id_equipo_local || p.id_equipo_local}` || '-'
  return p.equipo_visitante?.nombre || `#${p.id_equipo_visitante || p.id_equipo_visitante}` || '-'
}
</script>

<style scoped>
.q-table tbody td {
  vertical-align: middle;
}
</style>
