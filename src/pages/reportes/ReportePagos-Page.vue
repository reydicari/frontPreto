<template>
  <q-page class="q-pa-md page-container">
    <!-- Header -->
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div class="header-title">
          <q-icon name="assessment" size="42px" class="q-mr-sm" />
          <div>
            <h2 class="page-title">Reporte de Pagos</h2>
          </div>
        </div>
        <div class="header-actions row q-gutter-sm">
          <q-btn unelevated color="orange-7" icon="picture_as_pdf" label="Generar PDF" @click="generarReporte"
            class="btn-action" />
          <q-btn unelevated color="primary" elevated icon="file_download" label="Excel" @click="generarReporteExcel"
            class="btn-action" />
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <q-card class="filter-card q-mb-md">
      <q-card-section class="filter-header">
        <q-icon name="filter_list" size="24px" class="q-mr-sm" />
        <span class="text-h6">Filtros de Búsqueda</span>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <!-- Badge de contador -->
          <!-- <div class="col-12">
            <q-badge color="orange-7" class="count-badge">
              {{ pagos.length }} registros encontrados
            </q-badge>
          </div>
           -->
          <!-- Filtro de Fechas -->
          <div class="col-12 col-md-3">
            <FiltroFechas @update:desde="filterDesde = $event" @update:hasta="filterHasta = $event" />
          </div>

          <!-- Persona -->
          <div class="col-12 col-md-3">
            <q-select dense outlined v-model="filterPersona" :options="personOptions" option-label="displayName"
              option-value="id" use-input input-debounce="200" emit-value map-options label="Persona (o General)"
              clearable @filter="filterPerson" class="filter-input">
              <template v-slot:prepend>
                <q-icon name="person" color="green-7" />
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">No se encontró</q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Usuario -->
          <div class="col-12 col-md-2">
            <q-select dense outlined v-model="filterUsuario" :options="usuarioOptions" option-label="username"
              option-value="id" use-input input-debounce="300" emit-value map-options label="Usuario" clearable
              @filter="filterUsuarioFunc" class="filter-input">
              <template v-slot:prepend>
                <q-icon name="account_circle" color="green-7" />
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">Escriba para buscar</q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Categoría -->
          <div class="col-12 col-md-2">
            <q-select dense outlined v-model="filterCategoria" :options="categoriaOptions" option-label="nombre"
              option-value="id" emit-value map-options label="Categoría" clearable class="filter-input">
              <template v-slot:prepend>
                <q-icon name="category" color="green-7" />
              </template>
            </q-select>
          </div>

          <!-- Estado -->
          <div class="col-12 col-md-2">
            <q-select dense outlined v-model="filterEstado" :options="estadoOptions" label="Estado" clearable
              class="filter-input">
              <template v-slot:prepend>
                <q-icon name="check_circle" color="green-7" />
              </template>
            </q-select>
          </div>

          <!-- Orden para reporte -->
          <div class="col-12 col-md-3">
            <q-select dense outlined v-model="filterOrden" :options="ordenOptions" label="Reporte ordenado" clearable
              class="filter-input">
              <template v-slot:prepend>
                <q-icon name="sort" color="green-7" />
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla -->
    <q-card class="table-card">
      <q-table :rows="pagos" :columns="columns" row-key="id" :loading="loading" flat
        :rows-per-page-options="[10, 25, 50, 100]" v-model:pagination="pagination" @request="onTableRequest"
        @row-click="(evt, row) => verPago(row)" class="modern-table">
        <template v-slot:body-cell-fecha="props">
          <q-td :props="props">
            <q-chip dense color="green-2" text-color="green-9" icon="event">
              {{ formatDate(props.row.fecha) }}
            </q-chip>
          </q-td>
        </template>
        <template v-slot:body-cell-persona="props">
          <q-td :props="props">
            <div class="row items-center">
              <q-icon name="person" size="18px" class="q-mr-xs text-green-7" />
              {{ personaLabel(props.row) }}
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-monto="props">
          <q-td :props="props">
            <span class="text-weight-medium">Bs. {{ Number(props.row.monto || 0).toFixed(2) }}</span>
          </q-td>
        </template>
        <template v-slot:body-cell-descuento="props">
          <q-td :props="props">
            <span v-if="props.row.descuento" class="text-weight-medium text-grey-7">
              Bs. {{ Number(props.row.descuento || 0).toFixed(2) }}
            </span>
            <span v-else class="text-grey-5">-</span>
          </q-td>
        </template>
        <template v-slot:body-cell-total="props">
          <q-td :props="props">
            <div class="row items-center no-wrap q-gutter-xs">
              <q-chip dense color="orange-2" text-color="orange-9" class="total-chip">
                Bs. {{ calcularTotal(props.row) }}
              </q-chip>
              <q-icon v-if="props.row.comprobante" name="image" color="green-7" size="18px">
                <q-tooltip>Tiene comprobante</q-tooltip>
              </q-icon>
            </div>
            <div v-if="props.row.estado === 2" class="text-caption text-orange-8 q-mt-xs">
              Saldo: Bs. {{ calcularTotal(props.row) }}
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="getEstadoColor(props.row.estado)" text-color="white">
              <q-icon :name="getEstadoIcon(props.row.estado)" size="14px" class="q-mr-xs" />
              {{ getEstadoLabel(props.row.estado) }}
            </q-badge>
          </q-td>
        </template>

      </q-table>
    </q-card>

    <!-- Diálogo de detalle -->
    <q-dialog v-model="detalleDialog" :maximized="$q.screen.lt.md">
      <q-card class="detail-dialog">
        <q-card-section class="dialog-header-detail">
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-icon name="receipt_long" size="28px" class="q-mr-sm" />
              <div>
                <div class="text-h6">Detalle del Pago</div>
                <div class="text-caption">Información completa del registro</div>
              </div>
            </div>
            <q-btn flat round dense icon="close" color="white" v-close-popup />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-lg" style="max-height: 70vh; overflow-y: auto;">
          <div class="row q-col-gutter-lg">
            <!-- Imagen del comprobante -->
            <div class="col-12 col-md-6">
              <div class="comprobante-container">
                <div v-if="selectedPago && selectedPago.comprobante" class="comprobante-preview">
                  <img :src="comprobanteUrl(selectedPago.comprobante)" alt="Comprobante" />
                </div>
                <div v-else class="comprobante-empty">
                  <q-icon name="image_not_supported" size="64px" class="text-grey-5" />
                  <div class="text-grey-6 q-mt-md">Sin comprobante</div>
                </div>
              </div>
            </div>
            <!-- Información del pago -->
            <div class="col-12 col-md-6">
              <q-list class="detail-list">
                <q-item class="detail-item">
                  <q-item-section avatar>
                    <q-avatar color="green-2" text-color="green-9" icon="description" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Detalle</q-item-label>
                    <q-item-label class="text-weight-medium">{{ selectedPago?.detalle || '-' }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item class="detail-item">
                  <q-item-section avatar>
                    <q-avatar color="orange-2" text-color="orange-9" icon="event" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Fecha</q-item-label>
                    <q-item-label class="text-weight-medium">{{ formatDate(selectedPago?.fecha) }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item class="detail-item">
                  <q-item-section avatar>
                    <q-avatar color="green-2" text-color="green-9" icon="person" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Persona</q-item-label>
                    <q-item-label class="text-weight-medium">{{ personaLabel(selectedPago || {}) }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item class="detail-item">
                  <q-item-section avatar>
                    <q-avatar color="orange-2" text-color="orange-9" icon="payments" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Monto</q-item-label>
                    <q-item-label class="text-weight-medium text-h6 text-orange-9">
                      Bs. {{ Number(selectedPago?.monto || 0).toFixed(2) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item class="detail-item" v-if="selectedPago?.descuento">
                  <q-item-section avatar>
                    <q-avatar color="grey-3" text-color="grey-8" icon="discount" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Descuento</q-item-label>
                    <q-item-label class="text-weight-medium">
                      Bs. {{ Number(selectedPago.descuento || 0).toFixed(2) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item class="detail-item">
                  <q-item-section avatar>
                    <q-avatar :color="getEstadoColor(selectedPago?.estado)" text-color="white"
                      :icon="getEstadoIcon(selectedPago?.estado)" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Estado</q-item-label>
                    <q-item-label class="text-weight-medium">{{ getEstadoLabel(selectedPago?.estado) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <!-- Pagos Derivados -->
              <div v-if="selectedPago?.pagosDerivados && selectedPago.pagosDerivados.length > 0"
                class="q-mt-lg derived-payments">
                <div class="text-subtitle1 text-weight-bold text-green-8 q-mb-sm">
                  <q-icon name="account_tree" size="20px" class="q-mr-xs" />
                  Pagos Derivados ({{ selectedPago.pagosDerivados.length }})
                </div>
                <q-separator class="q-mb-sm" />
                <q-card flat bordered v-for="(derivado, idx) in selectedPago.pagosDerivados" :key="idx"
                  class="derived-card q-mb-sm">
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center q-gutter-sm">
                      <div class="col-auto">
                        <q-chip dense color="orange-3" text-color="orange-9" icon="payments" size="sm">
                          Bs. {{ Number(derivado.monto || 0).toFixed(2) }}
                        </q-chip>
                      </div>
                      <div class="col">
                        <div class="text-caption text-grey-8">
                          <q-icon name="event" size="14px" class="q-mr-xs" />
                          {{ formatDateShort(derivado.fecha) }}
                        </div>
                        <div class="text-caption text-grey-7">
                          <q-icon name="person" size="14px" class="q-mr-xs" />
                          {{ derivado.usuario?.usuario || 'N/A' }}
                        </div>
                      </div>
                      <div class="col-auto">
                        <q-badge v-if="derivado.metodo" color="green-2" text-color="green-9" size="sm">
                          {{ derivado.metodo.nombre }}
                        </q-badge>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-7" icon="close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { listarPagos } from 'src/stores/pago_store.js'
import { reportePagosParams, reportePagosExcel } from 'src/stores/reportes.js'
import { todasPersonas } from 'src/stores/persona-store.js'
import { listarUsuarios } from 'src/stores/usuario-store.js'
import { listarCategorias } from 'src/stores/categoria-store.js'
import FiltroFechas from 'src/components/FiltroFechas.vue'

const $q = useQuasar()

const pagos = ref([])
const loading = ref(false)

// Filtros - Fechas controladas por FiltroFechas
const filterDesde = ref(null)
const filterHasta = ref(null)
const filterPersona = ref(null)
const filterUsuario = ref(null)
const filterEstado = ref(null)
const filterCategoria = ref(null)
const filterOrden = ref(null)

const detalleDialog = ref(false)
const selectedPago = ref(null)

const personOptions = ref([])
const allPersonOptions = ref([])
const usuarioOptions = ref([])
const categoriaOptions = ref([])
const filteredPersona = ref(null)

// Paginación
const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0
})

const estadoOptions = [
  { label: 'Anulado', value: 0 },
  { label: 'Pagado', value: 1 },
  { label: 'Deuda', value: 2 }
]

const ordenOptions = [
  { label: 'Sin orden', value: null },
  { label: 'Por categoría', value: 'categoria' },
  { label: 'Por usuario', value: 'usuario' },
  { label: 'Por método', value: 'metodo' },
  { label: 'Por persona', value: 'persona' }
]

const columns = [
  { name: 'fecha', label: 'Fecha', field: 'fecha', align: 'left' },
  { name: 'detalle', label: 'Detalle', field: 'detalle', align: 'left' },
  { name: 'persona', label: 'Persona', field: 'persona', align: 'left' },
  { name: 'monto', label: 'Monto', field: 'monto', align: 'right' },
  { name: 'descuento', label: 'Descuento', field: 'descuento', align: 'right' },
  { name: 'total', label: 'Total', field: 'total', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' }
]

// Watchers para recargar cuando cambien los filtros
watch([filterDesde, filterHasta, filterPersona, filterUsuario, filterEstado, filterCategoria, filterOrden], () => {
  loadPagos()
})

function personaLabel(row) {
  if (row && row.id_persona && row.persona) return `${row.persona.nombres} ${row.persona.apellido_paterno}`
  return 'General'
}

function filterPerson(val, update) {
  update(() => {
    if (!val || val.length < 3) {
      personOptions.value = []
      return
    }
    const needle = val.toLowerCase()
    personOptions.value = allPersonOptions.value.filter(p => (p.displayName || '').toLowerCase().includes(needle))
  })
}

watch(filterPersona, (id) => {
  if (!id) {
    filteredPersona.value = null
    return
  }
  const found = allPersonOptions.value.find(p => p.id === id)
  filteredPersona.value = found ? (found.raw || found) : null
})

async function filterUsuarioFunc(val, update) {
  if (!val || val.length < 1) {
    update(() => {
      usuarioOptions.value = []
    })
    return
  }

  try {
    const response = await listarUsuarios({ limit: 5, search: val })
    const usuarios = Array.isArray(response) ? response : (response?.data || [])
    const mapped = usuarios.map(u => {
      const usernameString = (u.usuario && u.usuario.usuario) ? u.usuario.usuario : (u.username || (u.usuario && String(u.usuario)) || String(u.id))
      return { id: u.id, username: usernameString, value: u.id, raw: u }
    })
    update(() => {
      usuarioOptions.value = mapped
    })
  } catch (err) {
    console.error('Error buscando usuarios:', err)
    update(() => {
      usuarioOptions.value = []
    })
  }
}

async function loadPagos() {
  loading.value = true
  try {
    const params = {
      desde: filterDesde.value,
      hasta: filterHasta.value,
      id_persona: filterPersona.value,
      id_usuario_recibe: filterUsuario.value,
      estado: filterEstado.value?.value,
      id_categoria: filterCategoria.value,
      orden: filterOrden.value?.value,
      limit: pagination.value.rowsPerPage,
      page: pagination.value.page
    }
    const response = await listarPagos(params)
    pagos.value = response.lista || []
    console.log('lista de pagos: ', response.lista);

    pagination.value.rowsNumber = response.total || pagos.value.length
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error cargando pagos' })
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  pagination.value = props.pagination
  loadPagos()
}

onMounted(async () => {
  try {
    const personas = await todasPersonas().catch(() => [])
    allPersonOptions.value = Array.isArray(personas) ? personas.map(p => ({
      id: p.id,
      displayName: `${p.nombres} ${p.apellido_paterno}`,
      raw: p
    })) : []
    personOptions.value = []

    // Usuarios se cargarán dinámicamente al buscar
    usuarioOptions.value = []

    const categorias = await listarCategorias().catch(() => [])
    categoriaOptions.value = Array.isArray(categorias) ? categorias : []
  } catch (err) {
    console.error('Error cargando datos iniciales', err)
  }

  await loadPagos()
})

const comprobanteUrl = (name) => {
  if (!name) return null
  if (name.startsWith('http')) return name
  return `http://localhost:3001/uploads/${name}`
}

function verPago(pago) {
  selectedPago.value = pago
  detalleDialog.value = true
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const day = d.getDate()
  const month = meses[d.getMonth()]
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`
}

function calcularTotal(row) {
  const monto = Number(row.monto || 0)
  const descuento = Number(row.descuento || 0)
  return (monto - descuento).toFixed(2)
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const day = d.getDate()
  const month = meses[d.getMonth()]
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${day} ${month} ${year}, ${hours}:${minutes}`
}

function getEstadoColor(estado) {
  if (estado === 0) return 'red-7'
  if (estado === 1) return 'green-7'
  if (estado === 2) return 'orange-7'
  return 'grey-5'
}

function getEstadoIcon(estado) {
  if (estado === 0) return 'cancel'
  if (estado === 1) return 'check_circle'
  if (estado === 2) return 'schedule'
  return 'help'
}

function getEstadoLabel(estado) {
  if (estado === 0) return 'Anulado'
  if (estado === 1) return 'Pagado'
  if (estado === 2) return 'Deuda'
  return 'Desconocido'
}

async function generarReporte() {
  const current = JSON.parse(sessionStorage.getItem('user'))
  const params = {
    desde: filterDesde.value,
    hasta: filterHasta.value,
    id_persona: filterPersona.value,
    id_usuario_recibe: filterUsuario.value,
    estado: filterEstado.value?.value,
    id_categoria: filterCategoria.value,
    orden: filterOrden.value?.value,
    usuario: current.usuario,
    nombreSistema: 'TarijaSport',
  }
  await reportePagosParams(params)
}

async function generarReporteExcel() {
  const current = JSON.parse(sessionStorage.getItem('user'))
  const params = {
    desde: filterDesde.value,
    hasta: filterHasta.value,
    id_persona: filterPersona.value,
    id_usuario_recibe: filterUsuario.value,
    estado: filterEstado.value?.value,
    id_categoria: filterCategoria.value,
    orden: filterOrden.value?.value,
    usuario: current.usuario,
    nombreSistema: 'TarijaSport',
    pagosLista: pagos.value
  }
  await reportePagosExcel(params)
}
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

// Variables de color - Paleta Verde-Naranja
$color-green-primary: #2e7d32;
$color-green-secondary: #43a047;
$color-green-light: #66bb6a;
$color-orange-primary: #ff6f00;
$color-orange-secondary: #ff8f00;
$color-orange-light: #ffa726;
$pastel-green: #c8e6c9;
$pastel-orange: #ffe0b2;
$pastel-light: #f1f8e9;

.page-container {
  max-width: 1600px;
  margin: 0 auto;
}

// Header
.page-header {
  padding: 24px;
  background: linear-gradient(135deg, $color-green-primary 0%, $color-green-secondary 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
}

.header-title {
  display: flex;
  align-items: center;

  .q-icon {
    color: $color-orange-light;
  }
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.header-actions {
  flex-wrap: wrap;
}

.btn-action {
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
}

// Filtros
.filter-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.filter-header {
  background: linear-gradient(135deg, $pastel-light 0%, $pastel-green 100%);
  color: $color-green-primary;
  font-weight: 600;
  display: flex;
  align-items: center;
  padding: 16px 20px;

  .q-icon {
    color: $color-orange-primary;
  }
}

.filter-input {
  :deep(.q-field__control) {
    border-radius: 12px;
  }

  :deep(.q-field__prepend .q-icon) {
    font-size: 20px;
  }
}

// Tabla
.table-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-header {
  background: linear-gradient(135deg, $color-green-primary 0%, $color-green-secondary 100%);
  color: white;
  padding: 20px;
}

.count-badge {
  font-size: 1rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 12px;
}

.modern-table {
  :deep(.q-table__top) {
    padding: 16px;
  }

  :deep(thead tr th) {
    background: $pastel-light;
    color: $color-green-primary;
    font-weight: 700;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  :deep(tbody tr) {
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      background: $pastel-green;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(46, 125, 50, 0.1);
    }
  }

  :deep(tbody tr td) {
    padding: 12px 16px;
  }
}

.total-chip {
  min-width: 100px;
  justify-content: center;
}

// Diálogo de detalle
.detail-dialog {
  max-width: 1000px;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;

  @media (max-width: 959px) {
    max-width: 100%;
    border-radius: 0;
  }
}

.dialog-header-detail {
  background: linear-gradient(135deg, $color-orange-primary 0%, $color-orange-secondary 100%);
  color: white;
  padding: 20px;
}

.comprobante-container {
  background: $pastel-light;
  border-radius: 12px;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comprobante-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    max-height: 500px;
    object-fit: contain;
    border-radius: 12px;
  }
}

.comprobante-empty {
  text-align: center;
  padding: 60px 20px;
}

.detail-list {
  .detail-item {
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 12px;
    background: white;
    border: 2px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      background: $pastel-light;
      border-color: $color-green-light;
      transform: translateX(4px);
    }
  }
}

.derived-payments {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, $pastel-light 0%, $pastel-green 50%);
  border-radius: 12px;
}

.derived-card {
  background: white;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(46, 125, 50, 0.15);
  }
}

// Responsive
@media (max-width: 959px) {
  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.85rem;
  }

  .header-actions {
    margin-top: 12px;
  }

  .btn-action {
    font-size: 0.85rem;
    padding: 8px 16px;
  }

  .comprobante-container {
    min-height: 300px;
  }
}

@media (max-width: 599px) {
  .page-header {
    padding: 16px;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .header-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-header {
    padding: 12px 16px;
  }

  .table-header {
    padding: 16px;
  }

  .modern-table {
    :deep(thead tr th) {
      font-size: 0.75rem;
    }

    :deep(tbody tr td) {
      padding: 8px;
      font-size: 0.85rem;
    }
  }

  .detail-list .detail-item {
    padding: 10px;
  }
}

// Animaciones
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-card,
.table-card {
  animation: fadeIn 0.4s ease-in-out;
}
</style>
