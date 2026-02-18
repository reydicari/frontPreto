<template>
  <q-page class="expenses-page" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header con título, botón y estadísticas -->
    <div class="page-header">
      <div class="header-content">
        <div class="row items-center q-col-gutter-md">
          <!-- Título e icono -->
          <div class="col-12 col-md-auto">
            <div class="header-title-group">
              <q-icon name="receipt_long" size="48px" class="page-icon" />
              <h1 class="page-title q-ma-none">Gastos</h1>
            </div>
          </div>

          <!-- Estadísticas compactas -->
          <div class="col-12 col-md q-mt-md q-mt-md-none">
            <div class="row q-col-gutter-sm">
              <div class="col-6 col-sm-4">
                <div class="stat-card-compact stat-card-total">
                  <div class="stat-compact-content">
                    <q-icon name="account_balance_wallet" size="24px" class="stat-compact-icon" />
                    <div>
                      <div class="stat-compact-label">Total Gastado</div>
                      <div class="stat-compact-value">Bs {{ totalGastado }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-6 col-sm-4">
                <div class="stat-card-compact stat-card-count">
                  <div class="stat-compact-content">
                    <q-icon name="receipt" size="24px" class="stat-compact-icon" />
                    <div>
                      <div class="stat-compact-label">Nº Gastos</div>
                      <div class="stat-compact-value">{{ cantidadGastos }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Botón de nuevo -->
          <div class="col-12 col-md-auto q-mt-sm q-mt-md-none">
            <q-btn icon="add_circle" label="Nuevo Gasto" class="btn-add-header" @click="openDialog" />
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de búsqueda -->
    <!-- <div class="toolbar-section">
      <div class="row q-col-gutter-md items-center">
        <div class="col-12">
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar por observación o categoría..."
            class="search-input">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
</q-input>
</div>
</div>
</div> -->

    <!-- Filtros avanzados -->
    <div class="filters-section">
      <div class="filters-header" @click="showFilters = !showFilters">
        <div class="filters-title">
          <q-icon name="filter_list" size="20px" />
          <span>Filtros Avanzados</span>
          <q-badge v-if="activeFiltersCount > 0" :label="activeFiltersCount" color="green-7" class="q-ml-sm" />
        </div>
        <q-icon :name="showFilters ? 'expand_less' : 'expand_more'" size="24px" />
      </div>

      <q-slide-transition>
        <div v-show="showFilters" class="filters-content">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <FiltroFechas @update:desde="filterDesde = $event" @update:hasta="filterHasta = $event" />
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-select dense outlined v-model="filterCategoria" :options="categoriaOptions" option-label="nombre"
                option-value="id" emit-value map-options label="Categoría" clearable class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="category" color="green-7" />
                </template>
              </q-select>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-select dense outlined v-model="filterUsuario" :options="usuarioOptions" option-label="usuario"
                option-value="id" emit-value map-options label="Usuario" clearable use-input input-debounce="300"
                @filter="filterUsuariosFn" class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="person" color="green-7" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No se encontraron usuarios
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <q-select dense outlined v-model="filterEstado" :options="estadoOptions" map-options emit-value
                option-value="value" label="Estado" clearable class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="toggle_on" color="green-7" />
                </template>
              </q-select>
            </div>
          </div>
        </div>
      </q-slide-transition>
    </div>

    <!-- Lista de gastos con cards -->
    <div class="expenses-list">
      <q-infinite-scroll @load="onLoad" :offset="250">
        <div class="row q-col-gutter-md">
          <div v-for="gasto in gastos" :key="gasto.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <q-card class="expense-card" :class="{ 'expense-card-anulado': !gasto.estado }">
              <!-- Chip de estado flotante -->
              <q-badge :color="gasto.estado ? 'green-7' : 'red-7'" :label="gasto.estado ? 'Activo' : 'Anulado'"
                class="status-badge" />

              <!-- Header con categoría -->
              <q-card-section class="expense-card-header">
                <div class="category-section" v-if="gasto.categorium">
                  <q-avatar size="40px" :color="gasto.estado ? 'green-1' : 'red-1'" text-color="white">
                    <q-icon name="category" :color="gasto.estado ? 'green-7' : 'red-7'" size="24px" />
                  </q-avatar>
                  <div class="category-info">
                    <div class="category-label">Categoría</div>
                    <div class="category-name">{{ gasto.categorium.nombre }}</div>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <!-- Body con información -->
              <q-card-section class="expense-card-body">
                <!-- Fecha -->
                <div class="info-row">
                  <q-icon name="event" size="18px" color="grey-7" />
                  <span class="info-text">{{ formatDate(gasto.fecha) }}</span>
                </div>

                <!-- Usuario -->
                <div class="info-row" v-if="gasto.usuario">
                  <q-icon name="person" size="18px" color="grey-7" />
                  <span class="info-text">{{ gasto.usuario.usuario }}</span>
                </div>

                <!-- Observación -->
                <div class="info-row observation-row" v-if="gasto.observacion">
                  <q-icon name="notes" size="18px" color="grey-7" />
                  <span class="info-text observation-text">{{ gasto.observacion }}</span>
                </div>

                <!-- Monto destacado -->
                <div class="amount-section">
                  <div class="amount-container">
                    <q-icon name="attach_money" size="20px" :color="gasto.estado ? 'green-7' : 'red-7'" />
                    <div class="amount-info">
                      <div class="amount-label">Monto Total</div>
                      <div class="amount-value" :class="gasto.estado ? 'text-green-7' : 'text-red-7'">
                        Bs {{ parseFloat(gasto.monto).toFixed(2) }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <!-- Footer con acciones -->
              <q-card-actions class="expense-card-actions">
                <q-btn flat dense icon="visibility" color="primary" @click="verGasto(gasto)">
                  <q-tooltip class="bg-primary">Ver detalles</q-tooltip>
                </q-btn>

                <q-btn v-if="gasto.comprobante" flat dense icon="image" color="blue-7"
                  @click.stop="verComprobante(gasto)">
                  <q-tooltip class="bg-blue-7">Ver comprobante</q-tooltip>
                </q-btn>

                <q-space />

                <q-btn v-if="gasto.estado" flat dense icon="cancel" color="negative" @click.stop="anularGasto(gasto)">
                  <q-tooltip class="bg-negative">Anular gasto</q-tooltip>
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="green-7" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>

      <div v-if="gastos.length === 0 && !loading" class="no-results">
        <q-icon name="receipt_long" size="64px" color="grey-5" />
        <p>No se encontraron gastos</p>
      </div>
    </div>

    <!-- Dialog detalle de gasto -->
    <q-dialog v-model="detalleDialog">
      <q-card class="detail-dialog scrollable-dialog">
        <q-card-section class="detail-header">
          <div class="text-h6">
            <q-icon name="receipt_long" size="24px" class="q-mr-sm" />
            Detalle del Gasto
          </div>
        </q-card-section>

        <q-separator class="separator-gradient" />

        <q-card-section class="detail-body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6" v-if="selectedGasto && selectedGasto.comprobante">
              <div class="comprobante-container">
                <img :src="comprobanteUrl(selectedGasto.comprobante)" class="comprobante-image" />
              </div>
            </div>

            <div :class="selectedGasto && selectedGasto.comprobante ? 'col-12 col-md-6' : 'col-12'">
              <q-list class="detail-list">
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="event" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Fecha</q-item-label>
                    <q-item-label>{{ formatDateFull(selectedGasto?.fecha) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="category" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Categoría</q-item-label>
                    <q-item-label>{{ selectedGasto?.categorium?.nombre || '-' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="person" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Usuario</q-item-label>
                    <q-item-label>{{ selectedGasto?.usuario?.usuario || '-' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="attach_money" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Monto</q-item-label>
                    <q-item-label class="text-weight-bold text-green-7">Bs {{ parseFloat(selectedGasto?.monto ||
                      0).toFixed(2) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedGasto?.observacion">
                  <q-item-section avatar>
                    <q-icon name="notes" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Observación</q-item-label>
                    <q-item-label>{{ selectedGasto?.observacion }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="toggle_on" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Estado</q-item-label>
                    <q-badge :color="selectedGasto?.estado ? 'green-7' : 'red-7'"
                      :label="selectedGasto?.estado ? 'Activo' : 'Anulado'" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-7" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog imagen comprobante -->
    <q-dialog v-model="comprobanteDialog">
      <q-card class="comprobante-dialog-card">
        <q-card-section class="q-pa-none">
          <img :src="selectedComprobante" class="comprobante-dialog-image" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="white" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogs -->
    <NuevoGastoDialog v-model="dialogNuevo" @saved="cargarGastos" />
    <AnularGastoDialog v-model="dialogAnular" :gasto="gastoSeleccionado" @anulado="cargarGastos" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { listarGastos } from 'stores/gasto-store'
import { listarCategorias } from 'stores/categoria-store'
import { listarUsuarios } from 'stores/usuario-store'
import NuevoGastoDialog from './NuevoGastoDialog.vue'
import AnularGastoDialog from './AnularGastoDialog.vue'
import FiltroFechas from 'components/FiltroFechas.vue'

const loading = ref(false)
const gastos = ref([])
const searchTerm = ref('')
const showFilters = ref(false)
const filterDesde = ref('')
const filterHasta = ref('')
const filterCategoria = ref(null)
const filterEstado = ref(null)
const filterUsuario = ref(null)
const categoriaOptions = ref([])
const usuarioOptions = ref([])
const estadoOptions = ref([
  { label: 'Todos', value: null },
  { label: 'Activo', value: true },
  { label: 'Anulado', value: false }
])

// Paginación
const currentPage = ref(1)
const totalGastos = ref(0)
const cantidadGastos = ref(0)
const hasMoreData = ref(true)
const limit = 12

const dialogNuevo = ref(false)
const dialogAnular = ref(false)
const gastoSeleccionado = ref(null)
const detalleDialog = ref(false)
const selectedGasto = ref(null)
const comprobanteDialog = ref(false)
const selectedComprobante = ref('')

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001'

// Estadísticas computadas
const totalGastado = computed(() => {
  const total = gastos.value
    .filter(g => g.estado)
    .reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)
  return total.toFixed(2)
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filterDesde.value) count++
  if (filterHasta.value) count++
  if (filterCategoria.value) count++
  if (filterEstado.value !== null) count++
  if (filterUsuario.value) count++
  return count
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const formattedDate = date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  const timeStr = dateStr.split(' ')[1] || dateStr.substring(11, 19)
  return `${formattedDate}, ${timeStr}`
}

function formatDateFull(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function comprobanteUrl(comprobante) {
  if (!comprobante) return ''
  return `${BACKEND_URL}/uploads/${comprobante}`
}

function openDialog() {
  dialogNuevo.value = true
}

function verGasto(gasto) {
  selectedGasto.value = gasto
  detalleDialog.value = true
}

function anularGasto(gasto) {
  gastoSeleccionado.value = gasto
  dialogAnular.value = true
}

function verComprobante(gasto) {
  selectedComprobante.value = comprobanteUrl(gasto.comprobante)
  comprobanteDialog.value = true
}

async function cargarGastos(reset = false) {
  if (reset) {
    currentPage.value = 1
    gastos.value = []
    hasMoreData.value = true
  }

  if (!hasMoreData.value) return

  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: limit,
      estado: filterEstado.value,
      id_categoria: filterCategoria.value,
      id_usuario_gasta: filterUsuario.value,
      desde: filterDesde.value,
      hasta: filterHasta.value,
      busqueda: searchTerm.value
    }

    const response = await listarGastos(params)

    const nuevosGastos = Array.isArray(response.lista) ? response.lista : (response.data?.lista || [])

    if (reset) {
      gastos.value = nuevosGastos
    } else {
      gastos.value = [...gastos.value, ...nuevosGastos]
    }

    totalGastos.value = response.totalGastos || gastos.value.length
    cantidadGastos.value = response.cantidadGastos || gastos.value.length
    hasMoreData.value = nuevosGastos.length === limit

  } catch (error) {
    console.error('Error cargando gastos:', error)
  } finally {
    loading.value = false
  }
}

async function cargarCategorias() {
  try {
    const res = await listarCategorias()
    categoriaOptions.value = res || []
  } catch (error) {
    console.error('Error cargando categorías:', error)
  }
}

async function cargarUsuarios(search = '') {
  try {
    const params = {
      search: search,
      page: 1,
      limit: 5
    }
    const res = await listarUsuarios(params)
    usuarioOptions.value = res.lista || res || []
  } catch (error) {
    console.error('Error cargando usuarios:', error)
  }
}

function filterUsuariosFn(val, update) {
  if (val === '') {
    update(() => {
      cargarUsuarios('')
    })
    return
  }

  update(() => {
    cargarUsuarios(val)
  })
}

async function onLoad(index, done) {
  if (!hasMoreData.value || loading.value) {
    done()
    return
  }

  currentPage.value++
  await cargarGastos(false)
  done()
}

// Watch para recargar cuando cambien los filtros
watch([filterEstado, filterCategoria, filterUsuario, filterDesde, filterHasta, searchTerm], () => {
  cargarGastos(true)
}, { deep: true })

onMounted(() => {
  cargarGastos(true)
  cargarCategorias()
  cargarUsuarios()
})
</script>

<style scoped>
.expenses-page {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(46, 125, 50, 0.3);
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-icon {
  color: rgba(255, 255, 255, 0.9);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
}

/* Estadísticas compactas dentro del header */
.stat-card-compact {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  height: 100%;
}

.stat-card-compact:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.stat-card-compact.stat-card-total {
  border-left: 4px solid #2e7d32;
}

.stat-card-compact.stat-card-count {
  border-left: 4px solid #66bb6a;
}

.stat-compact-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-compact-icon {
  color: #2e7d32;
  opacity: 0.8;
}

.stat-card-compact.stat-card-count .stat-compact-icon {
  color: #66bb6a;
}

.stat-compact-label {
  font-size: 11px;
  color: #757575;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.stat-compact-value {
  font-size: 18px;
  font-weight: 700;
  color: #2e7d32;
  line-height: 1.2;
}

.stat-card-compact.stat-card-count .stat-compact-value {
  color: #66bb6a;
}

.btn-add-header {
  background: white;
  color: #2e7d32;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  width: 100%;
}

.btn-add-header:hover {
  background: #f1f8f4;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Filtros */
.filters-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.filters-header {
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%);
  transition: background 0.3s ease;
}

.filters-header:hover {
  background: linear-gradient(135deg, #e8f5e9 0%, #dcedc8 100%);
}

.filters-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2e7d32;
}

.filters-content {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.filter-input {
  background: white;
}

/* Lista de gastos */
.expenses-list {
  min-height: 400px;
}

.expense-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  overflow: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.expense-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(46, 125, 50, 0.2);
}

.expense-card-anulado {
  opacity: 0.7;
}

.expense-card-anulado:hover {
  box-shadow: 0 8px 24px rgba(211, 47, 47, 0.2);
}

.status-badge {
  position: absolute;
  top: -8px;
  right: 12px;
  z-index: 1;
  font-weight: 600;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.expense-card-header {
  padding: 20px 16px 16px;
  background: linear-gradient(135deg, #f8fdf9 0%, #ffffff 100%);
}

.expense-card-anulado .expense-card-header {
  background: linear-gradient(135deg, #fef5f5 0%, #ffffff 100%);
}

.category-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-label {
  font-size: 11px;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-bottom: 2px;
}

.category-name {
  font-size: 15px;
  font-weight: 600;
  color: #2e7d32;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expense-card-anulado .category-name {
  color: #d32f2f;
}

.expense-card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #424242;
}

.info-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.observation-row {
  align-items: flex-start;
}

.observation-text {
  font-style: italic;
  color: #757575;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.amount-section {
  margin-top: auto;
  padding-top: 12px;
}

.amount-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%);
  border-radius: 8px;
  border-left: 3px solid #2e7d32;
}

.expense-card-anulado .amount-container {
  background: linear-gradient(135deg, #fef5f5 0%, #ffebee 100%);
  border-left-color: #d32f2f;
}

.amount-info {
  flex: 1;
}

.amount-label {
  font-size: 11px;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-bottom: 2px;
}

.amount-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.expense-card-actions {
  padding: 8px 12px;
  background: #fafafa;
}

.expense-card-anulado .expense-card-actions {
  background: #f5f5f5;
}

/* Dialog detalle */
.detail-dialog {
  width: 100%;
  max-width: 800px;
  border-radius: 12px;
}

.detail-header {
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
  color: white;
  padding: 20px 24px;
}

.separator-gradient {
  height: 3px;
  background: linear-gradient(90deg, #2e7d32, #66bb6a, #2e7d32);
}

.detail-body {
  padding: 24px;
}

.detail-list {
  border-radius: 8px;
  overflow: hidden;
}

.comprobante-container {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comprobante-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Dialog comprobante */
.comprobante-dialog-card {
  background: rgba(0, 0, 0, 0.9);
  max-width: 90vw;
  max-height: 90vh;
}

.comprobante-dialog-image {
  max-width: 100%;
  max-height: 80vh;
  display: block;
  margin: 0 auto;
}

/* No results */
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #9e9e9e;
}

.no-results p {
  margin-top: 16px;
  font-size: 16px;
}

.scrollable-dialog {
  max-height: 85vh;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 599px) {
  .expenses-page {
    padding: 12px;
  }

  .header-content {
    padding: 16px;
  }

  .header-title-group {
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-icon {
    font-size: 36px;
  }

  .stat-compact-label {
    font-size: 10px;
  }

  .stat-compact-value {
    font-size: 16px;
  }

  .btn-add-header {
    width: 100%;
  }

  .detail-dialog {
    max-width: 100%;
    margin: 0;
    border-radius: 0;
  }
}

@media (min-width: 600px) and (max-width: 1023px) {
  .btn-add-header {
    width: auto;
  }
}
</style>
