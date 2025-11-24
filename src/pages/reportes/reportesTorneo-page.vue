<template>
  <q-page padding :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <q-card>
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6 page-title">Reportes — Torneos</div>
        <q-space />
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
          wrap-cells>

          <template v-slot:body-cell-nombre="props">
            <q-td :props="props">
              <div class="row items-center">
                <q-badge :color="badgeColor(props.row.tipo_torneo?.nombre || 'Desconocido')" class="q-mr-sm col-label"
                  outline>
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
              <q-badge :color="badgeColorEstado(props.row, estadoFromDates(props.row))">
                {{ estadoLabel(props.row, estadoFromDates(props.row)) }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-fecha_inicio="props">
            <q-td :props="props">{{ formatDate(props.row.fecha_inicio) }}</q-td>
          </template>

          <template v-slot:body-cell-fecha_fin="props">
            <q-td :props="props">{{ formatDate(props.row.fecha_fin) }}</q-td>
          </template>

          <template v-slot:body-cell-acciones="props">
            <q-td :props="props">
              <q-btn dense color="orange" icon="picture_as_pdf" label="Generar PDF" class="q-mr-sm"
                @click.stop="generarTorneoPDF(props.row)" />
              <q-btn dense color="secondary" icon="file_download" label="Generar Excel"
                @click.stop="generarTorneoExcel(props.row)" />
            </q-td>
          </template>

        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { listarTorneos, listarTiposTorneo } from 'src/stores/torneo-store'
import { listarUbicaciones } from 'src/stores/ubicacion-store'
import { listarNiveles } from 'src/stores/nivel'
import { reporteTorneoPDF, reporteTorneoExcel } from 'src/stores/reportes.js'

const $q = useQuasar()

const torneos = ref([])
const tiposTorneo = ref([])
const ubicaciones = ref([])
const niveles = ref([])
const loading = ref(false)

const filters = reactive({ search: '', id_tipo_torneo: null, id_ubicacion: null, id_nivel: null, fecha_inicio_desde: null, fecha_inicio_hasta: null })
const pagination = reactive({ page: 1, rowsPerPage: 10 })

const columns = [
  { name: 'nro', label: 'Nro', field: 'nro', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre', sortable: true },
  { name: 'estado', label: 'Estado', field: row => estadoFromDates(row), sortable: true },
  { name: 'fecha_inicio', label: 'Inicio', field: 'fecha_inicio', sortable: true },
  { name: 'fecha_fin', label: 'Fin', field: 'fecha_fin', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones' }
]

const tipoOptions = computed(() => tiposTorneo.value.map(t => ({ label: t.nombre, value: t.id })))
const ubicacionOptions = computed(() => ubicaciones.value.map(u => ({ label: u.nombre, value: u.id })))
const nivelOptions = computed(() => niveles.value.map(n => ({ label: n.nombre_nivel || n.nombre || 'N/A', value: n.id })))

const badgeColorEstado = (row, computedEstado) => {
  if (row && typeof row.estado !== 'undefined' && Number(row.estado) === 0) return 'negative'
  if (computedEstado === 1 && row && Number(row.estado) === 2) return 'amber'
  switch (Number(computedEstado)) {
    case -1: return 'negative'
    case 0: return 'grey'
    case 1: return 'positive'
    case 2: return 'info'
    default: return 'primary'
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

const estadoLabel = (row, computedEstado) => {
  if (row && typeof row.estado !== 'undefined' && Number(row.estado) === 0) return 'Suspendido'
  if (Number(computedEstado) == -1) return 'Anulado'
  if (Number(computedEstado) == 0) return 'Terminado'
  if (Number(computedEstado) == 1) return 'En marcha'
  if (Number(computedEstado) == 2) return 'Sin comenzar'
  return 'Desconocido'
}

function estadoFromDates(t) {
  if (typeof t.estado !== 'undefined' && Number(t.estado) === -1) return -1
  const hoy = new Date()
  const start = t.fecha_inicio ? new Date(t.fecha_inicio) : null
  const end = t.fecha_fin ? new Date(t.fecha_fin) : null
  if (end && end <= hoy) return 0
  if (start && start <= hoy) return 1
  if (start && start > hoy) return 2
  return 2
}

const rowsWithNro = computed(() => {
  const start = Math.max(0, (pagination.page - 1) * pagination.rowsPerPage)
  return filteredTorneos.value.map((r, idx) => ({ ...r, nro: start + idx + 1 }))
})

const filteredTorneos = computed(() => {
  return torneos.value.filter(t => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!String(t.nombre || '').toLowerCase().includes(q)) return false
    }
    if (filters.id_tipo_torneo && t.id_tipo_torneo !== filters.id_tipo_torneo) return false
    if (filters.id_ubicacion && t.id_ubicacion !== filters.id_ubicacion) return false
    if (filters.id_nivel && t.id_nivel !== filters.id_nivel) return false
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

function clearFilters() {
  filters.search = ''
  filters.id_tipo_torneo = null
  filters.id_ubicacion = null
  filters.id_nivel = null
  filters.fecha_inicio_desde = null
  filters.fecha_inicio_hasta = null
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const part = String(dateStr).split('T')[0]
  const parts = part.split('-')
  if (parts.length < 3) return dateStr
  const [yyyy, mm, dd] = parts
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const mi = parseInt(mm, 10) - 1
  const mon = monthNames[mi] || mm
  return `${dd} ${mon} ${yyyy}`
}

const fetchData = async () => {
  loading.value = true
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
  } catch (err) {
    console.error('Error cargando torneos para reportes', err)
    $q.notify({ type: 'negative', message: 'Error cargando datos' })
  } finally { loading.value = false }
}

onMounted(() => fetchData())

async function generarTorneoPDF(row) {
  if (!row || !row.id) return
  try {
    const body = { id_torneo: row.id }
    await reporteTorneoPDF(body)
    $q.notify({ type: 'positive', message: 'Reporte PDF solicitado' })
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error generando PDF' })
  }
}

async function generarTorneoExcel(row) {
  if (!row || !row.id) return
  try {
    const body = { id_torneo: row.id }
    await reporteTorneoExcel(body)
    $q.notify({ type: 'positive', message: 'Reporte Excel solicitado' })
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Error generando Excel' })
  }
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
  line-height: 1.2
}

/* Alineamiento y ancho de badge como en Torneos-Module.vue */
.col-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  max-width: 100px;
  width: 100px;
  padding: 4px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-label-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 130px;
  max-width: 130px;
  width: 130px;
}
</style>
