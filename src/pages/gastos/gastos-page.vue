<template>
  <q-page class="expenses-page" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header con título y botón -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title-section">
          <div class="row items-center justify-between">
            <div class="col-auto">
              <q-icon name="receipt_long" size="48px" class="page-icon" />
              <h1 class="page-title q-ma-none">Gestión de Gastos</h1>
            </div>
            <div class="col-auto">
              <q-btn icon="add_circle" label="Nuevo Gasto" class="btn-add-header" @click="openDialog" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="statistics-section">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <div class="stat-card stat-card-total">
            <div class="stat-content">
              <div class="stat-label">Total Gastado</div>
              <div class="stat-value">Bs {{ totalGastado }}</div>
            </div>
            <q-icon name="account_balance_wallet" class="stat-icon" />
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="stat-card stat-card-month">
            <div class="stat-content">
              <div class="stat-label">Este Mes</div>
              <div class="stat-value">Bs {{ totalMesActual }}</div>
            </div>
            <q-icon name="calendar_today" class="stat-icon" />
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="stat-card stat-card-count">
            <div class="stat-content">
              <div class="stat-label">Nº Gastos</div>
              <div class="stat-value">{{ cantidadGastos }}</div>
            </div>
            <q-icon name="receipt" class="stat-icon" />
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="stat-card stat-card-average">
            <div class="stat-content">
              <div class="stat-label">Promedio</div>
              <div class="stat-value">Bs {{ promedioMonto }}</div>
            </div>
            <q-icon name="trending_up" class="stat-icon" />
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de búsqueda -->
    <div class="toolbar-section">
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
    </div>

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
              <q-input dense outlined label="Desde" v-model="filterDesde" readonly class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="event" color="green-7" />
                </template>
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-date v-model="filterDesde" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Cerrar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-input>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-input dense outlined label="Hasta" v-model="filterHasta" readonly class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="event" color="green-7" />
                </template>
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-date v-model="filterHasta" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Cerrar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-input>
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
              <q-select dense outlined v-model="filterEstado" :options="estadoOptions" label="Estado" clearable
                class="filter-input">
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
          <div v-for="gasto in displayedGastos" :key="gasto.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="expense-card" :class="{ 'expense-card-anulado': !gasto.estado }" @click="verGasto(gasto)">
              <div class="expense-header">
                <div class="expense-date">
                  <q-icon name="event" size="18px" />
                  {{ formatDate(gasto.fecha) }}
                </div>
                <q-badge :color="gasto.estado ? 'green-7' : 'red-7'" :label="gasto.estado ? 'Activo' : 'Anulado'" />
              </div>

              <div class="expense-body">
                <div class="expense-category" v-if="gasto.categorium">
                  <q-icon name="category" size="20px" />
                  <span>{{ gasto.categorium.nombre }}</span>
                </div>

                <div class="expense-user" v-if="gasto.usuario">
                  <q-icon name="person" size="18px" />
                  <span>{{ gasto.usuario.usuario }}</span>
                </div>

                <div class="expense-observation" v-if="gasto.observacion">
                  <q-icon name="notes" size="18px" />
                  <span>{{ gasto.observacion }}</span>
                </div>

                <div class="expense-amount">
                  <div class="amount-label">Monto</div>
                  <div class="amount-value">Bs {{ parseFloat(gasto.monto).toFixed(2) }}</div>
                </div>
              </div>

              <div class="expense-footer">
                <q-btn v-if="gasto.estado" flat dense icon="cancel" color="negative" @click.stop="anularGasto(gasto)">
                  <q-tooltip>Anular gasto</q-tooltip>
                </q-btn>
                <q-btn v-if="gasto.comprobante" flat dense icon="image" color="primary"
                  @click.stop="verComprobante(gasto)">
                  <q-tooltip>Ver comprobante</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>

        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="green-7" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>

      <div v-if="displayedGastos.length === 0 && !loading" class="no-results">
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
import NuevoGastoDialog from './NuevoGastoDialog.vue'
import AnularGastoDialog from './AnularGastoDialog.vue'

const loading = ref(false)
const gastos = ref([])
const displayedGastos = ref([])
const searchTerm = ref('')
const showFilters = ref(false)
const filterDesde = ref('')
const filterHasta = ref('')
const filterCategoria = ref(null)
const filterEstado = ref(null)
const categoriaOptions = ref([])
const estadoOptions = ref([
  { label: 'Activo', value: true },
  { label: 'Anulado', value: false }
])

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
  const total = gastosActivos.value.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)
  return total.toFixed(2)
})

const gastosActivos = computed(() => {
  return gastos.value.filter(g => g.estado)
})

const totalMesActual = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const total = gastosActivos.value
    .filter(g => {
      const gastoDate = new Date(g.fecha)
      return gastoDate.getMonth() === currentMonth && gastoDate.getFullYear() === currentYear
    })
    .reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)

  return total.toFixed(2)
})

const cantidadGastos = computed(() => {
  return gastosActivos.value.length
})

const promedioMonto = computed(() => {
  if (cantidadGastos.value === 0) return '0.00'
  const promedio = parseFloat(totalGastado.value) / cantidadGastos.value
  return promedio.toFixed(2)
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filterDesde.value) count++
  if (filterHasta.value) count++
  if (filterCategoria.value) count++
  if (filterEstado.value !== null) count++
  return count
})

const gastosFiltrados = computed(() => {
  let filtered = [...gastos.value]

  // Búsqueda por texto
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(g =>
      (g.observacion && g.observacion.toLowerCase().includes(term)) ||
      (g.categorium && g.categorium.nombre && g.categorium.nombre.toLowerCase().includes(term))
    )
  }

  // Filtro por fecha desde
  if (filterDesde.value) {
    filtered = filtered.filter(g => g.fecha >= filterDesde.value)
  }

  // Filtro por fecha hasta
  if (filterHasta.value) {
    filtered = filtered.filter(g => g.fecha <= filterHasta.value)
  }

  // Filtro por categoría
  if (filterCategoria.value) {
    filtered = filtered.filter(g => g.id_categoria === filterCategoria.value)
  }

  // Filtro por estado
  if (filterEstado.value !== null) {
    filtered = filtered.filter(g => g.estado === filterEstado.value)
  }

  return filtered
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
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

async function cargarGastos() {
  loading.value = true
  try {
    const response = await listarGastos()
    console.log('lista de gas gastos: ', response.lista);

    gastos.value = Array.isArray(response.lista) ? response.lista : (response.data.lista || [])
    displayedGastos.value = gastosFiltrados.value.slice(0, 20)

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

function onLoad(index, done) {
  setTimeout(() => {
    const nextBatch = gastosFiltrados.value.slice(
      displayedGastos.value.length,
      displayedGastos.value.length + 20
    )
    displayedGastos.value.push(...nextBatch)
    done()
  }, 500)
}

// Watch para actualizar displayedGastos cuando cambien los filtros
watch(gastosFiltrados, (newVal) => {
  displayedGastos.value = newVal.slice(0, 20)
})

onMounted(() => {
  cargarGastos()
  cargarCategorias()
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
  padding: 24px;
  box-shadow: 0 4px 20px rgba(46, 125, 50, 0.3);
}

.header-title-section {
  color: white;
}

.page-icon {
  color: rgba(255, 255, 255, 0.9);
  margin-right: 16px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  display: inline-block;
  vertical-align: middle;
}

.btn-add-header {
  background: white;
  color: #2e7d32;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-add-header:hover {
  background: #f1f8f4;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Estadísticas */
.statistics-section {
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: currentColor;
}

.stat-card-total {
  color: #2e7d32;
}

.stat-card-month {
  color: #388e3c;
}

.stat-card-count {
  color: #66bb6a;
}

.stat-card-average {
  color: #81c784;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #757575;
  font-weight: 500;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: currentColor;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.2;
}

/* Toolbar */
.toolbar-section {
  margin-bottom: 16px;
}

.search-input {
  background: white;
  border-radius: 8px;
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
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 4px solid #2e7d32;
}

.expense-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(46, 125, 50, 0.15);
}

.expense-card-anulado {
  opacity: 0.6;
  border-left-color: #d32f2f;
}

.expense-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.expense-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #757575;
}

.expense-body {
  flex: 1;
}

.expense-category,
.expense-user,
.expense-observation {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #424242;
}

.expense-category {
  font-weight: 600;
  color: #2e7d32;
}

.expense-observation {
  font-size: 13px;
  color: #757575;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.expense-amount {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.amount-label {
  font-size: 12px;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.amount-value {
  font-size: 24px;
  font-weight: 700;
  color: #2e7d32;
}

.expense-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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

  .page-title {
    font-size: 24px;
  }

  .page-icon {
    font-size: 36px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-icon {
    font-size: 36px;
  }

  .detail-dialog {
    max-width: 100%;
    margin: 0;
    border-radius: 0;
  }
}
</style>
