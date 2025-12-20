<template>
  <q-page class="payments-page" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header con título y botón -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title-section">
          <div class="row items-center">
            <div class="col-12 col-sm-auto">
              <q-icon name="payments" size="48px" class="page-icon" />
              <h1 class="page-title">Gestión de Pagos</h1>
              <p class="header-subtitle">Registro y control de transacciones</p>
            </div>
            <div class="col-12 col-sm-auto q-ml-sm-auto">
              <q-btn icon="add_circle" label="Nuevo Pago" class="btn-add-header" @click="openDialog" />
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
              <div class="stat-label">Total Cobrado</div>
              <div class="stat-value">Bs {{ totalCobrado }}</div>
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
              <div class="stat-label">Nº Transacciones</div>
              <div class="stat-value">{{ cantidadPagos }}</div>
            </div>
            <q-icon name="receipt_long" class="stat-icon" />
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
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar por detalle, comprobante o persona..."
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
              <q-select dense outlined v-model="filterPersona" :options="personOptions" option-label="displayName"
                option-value="id" use-input input-debounce="200" emit-value map-options label="Persona" clearable
                @filter="filterPerson" class="filter-input">
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

    <!-- Lista de pagos con cards -->
    <div class="payments-list">
      <q-infinite-scroll @load="onLoad" :offset="250">
        <div class="row q-col-gutter-md">
          <div v-for="pago in displayedPagos" :key="pago.id" class="col-12 col-sm-6 col-lg-4">
            <div class="payment-card">
              <div class="payment-header">
                <div class="payment-date">
                  <q-icon name="event" size="18px" />
                  {{ formatDate(pago.fecha) }}
                </div>
                <q-badge :color="estadoColor(pago.estado)" :label="estadoLabel(pago.estado)" />
              </div>

              <div class="payment-body">
                <div class="payment-person">
                  <q-icon name="person" size="20px" />
                  <span>{{ personaLabel(pago) }}</span>
                </div>

                <div class="payment-detail" v-if="pago.detalle">
                  <q-icon name="description" size="18px" />
                  <span>{{ pago.detalle }}</span>
                </div>

                <div class="payment-category" v-if="pago.categorium">
                  <q-icon name="category" size="18px" />
                  <span>{{ pago.categorium.nombre || pago.categorium }}</span>
                </div>

                <div class="payment-method" v-if="pago.metodo">
                  <q-icon name="credit_card" size="18px" />
                  <span>{{ pago.metodo.nombre || pago.metodo }}</span>
                </div>

                <div class="payment-amount">
                  <div class="amount-label">Monto</div>
                  <div class="amount-value">Bs {{ pago.monto }}</div>
                </div>

                <div class="payment-discount" v-if="pago.descuento && pago.descuento > 0">
                  <div class="discount-label">Descuento</div>
                  <div class="discount-value">Bs {{ pago.descuento }}</div>
                </div>
              </div>

              <div class="payment-footer">
                <q-btn flat dense icon="visibility" color="green-7" @click="verPago(pago)">
                  <q-tooltip>Ver detalles</q-tooltip>
                </q-btn>
                <q-btn v-if="pago.estado != 0" flat dense icon="cancel" color="negative" @click="anularPago(pago)">
                  <q-tooltip>Anular pago</q-tooltip>
                </q-btn>
                <q-btn v-if="pago.comprobante" flat dense icon="image" color="primary" @click="verComprobante(pago)">
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

      <div v-if="displayedPagos.length === 0 && !loading" class="no-results">
        <q-icon name="payment" size="64px" color="grey-5" />
        <p>No se encontraron pagos</p>
      </div>
    </div>

    <!-- Dialog detalle de pago -->
    <q-dialog v-model="detalleDialog">
      <q-card class="detail-dialog scrollable-dialog">
        <q-card-section class="detail-header">
          <div class="text-h6">
            <q-icon name="receipt_long" size="24px" class="q-mr-sm" />
            Detalle del Pago
          </div>
        </q-card-section>

        <q-separator class="separator-gradient" />

        <q-card-section class="detail-body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6" v-if="selectedPago && selectedPago.comprobante">
              <div class="comprobante-container">
                <img :src="comprobanteUrl(selectedPago.comprobante)" class="comprobante-image" />
              </div>
            </div>

            <div :class="selectedPago && selectedPago.comprobante ? 'col-12 col-md-6' : 'col-12'">
              <q-list class="detail-list">
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="description" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Detalle</q-item-label>
                    <q-item-label>{{ selectedPago?.detalle || '-' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="event" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Fecha</q-item-label>
                    <q-item-label>{{ formatDate(selectedPago?.fecha) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="person" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Persona</q-item-label>
                    <q-item-label>{{ personaLabel(selectedPago || {}) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="payments" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Monto</q-item-label>
                    <q-item-label class="text-weight-bold text-green-7">Bs {{ selectedPago?.monto ?? '-'
                      }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedPago?.descuento && selectedPago.descuento > 0">
                  <q-item-section avatar>
                    <q-icon name="discount" color="orange-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Descuento</q-item-label>
                    <q-item-label class="text-weight-bold text-orange-7">Bs {{ selectedPago?.descuento }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="category" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Categoría</q-item-label>
                    <q-item-label>{{ selectedPago?.categorium?.nombre || selectedPago?.categorium || '-'
                      }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="credit_card" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Método</q-item-label>
                    <q-item-label>{{ selectedPago?.metodo?.nombre || selectedPago?.metodo || '-' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="account_circle" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Usuario cobrador</q-item-label>
                    <q-item-label>{{ selectedPago?.usuario_cobrador || '-' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="toggle_on" color="green-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Estado</q-item-label>
                    <q-item-label>
                      <q-badge :color="estadoColor(selectedPago?.estado)" :label="estadoLabel(selectedPago?.estado)" />
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="detail-actions">
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog comprobante ampliado -->
    <q-dialog v-model="comprobanteDialog">
      <q-card class="comprobante-dialog scrollable-comprobante">
        <q-card-section class="comprobante-header">
          <div class="text-h6">Comprobante de Pago</div>
        </q-card-section>

        <q-card-section class="comprobante-content">
          <q-img v-if="selectedPago && selectedPago.comprobante" :src="comprobanteUrl(selectedPago.comprobante)"
            class="comprobante-full-image" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-if="selectedPago && selectedPago.comprobante" :href="comprobanteUrl(selectedPago.comprobante)"
            target="_blank" label="Abrir" color="primary" icon="open_in_new" />
          <q-btn flat label="Cerrar" color="negative" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog externo para Nuevo/Editar Pago -->
    <NuevoPagoDialog v-model="dialogVisible" @saved="onPagoSaved" />
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { listarPagos, anularPago as anularPagoStore } from 'src/stores/pago_store.js'
import NuevoPagoDialog from 'src/pages/pagos/NuevoPagoDialog.vue'

const $q = useQuasar()

// Estado
const pagos = ref([])
const loading = ref(false)
const displayedPagos = ref([])
const showFilters = ref(false)

// Filtros
const searchTerm = ref('')
const filterDesde = ref(null)
const filterHasta = ref(null)
const filterPersona = ref(null)
const filterEstado = ref(null)

// Dialogos
const dialogVisible = ref(false)
const detalleDialog = ref(false)
const comprobanteDialog = ref(false)
const selectedPago = ref(null)

// Opciones
const personOptions = ref([])
const allPersonOptions = ref([])
const estadoOptions = [
  { label: 'Anulado', value: 0 },
  { label: 'Pagado', value: 1 },
  { label: 'Parcial', value: 2 }
]

// Estadísticas computadas
const totalCobrado = computed(() => {
  return pagos.value
    .filter(p => p.estado !== 0)
    .reduce((sum, p) => sum + (p.monto || 0) - (p.descuento || 0), 0)
    .toFixed(2)
})

const totalMesActual = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return pagos.value
    .filter(p => {
      if (p.estado === 0) return false
      const fecha = new Date(p.fecha)
      return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + (p.monto || 0) - (p.descuento || 0), 0)
    .toFixed(2)
})

const cantidadPagos = computed(() => {
  return pagos.value.filter(p => p.estado !== 0).length
})

const promedioMonto = computed(() => {
  const activos = pagos.value.filter(p => p.estado !== 0)
  if (activos.length === 0) return '0.00'
  const total = activos.reduce((sum, p) => sum + (p.monto || 0) - (p.descuento || 0), 0)
  return (total / activos.length).toFixed(2)
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filterDesde.value) count++
  if (filterHasta.value) count++
  if (filterPersona.value) count++
  if (filterEstado.value !== null && filterEstado.value !== undefined) count++
  return count
})

// Utilidades
function estadoColor(estado) {
  switch (estado) {
    case 0: return 'negative'
    case 1: return 'positive'
    case 2: return 'orange-7'
    default: return 'grey'
  }
}

function estadoLabel(estado) {
  switch (estado) {
    case 0: return 'Anulado'
    case 1: return 'Pagado'
    case 2: return 'Parcial'
    default: return 'Desconocido'
  }
}

function personaLabel(row) {
  if (row.id_persona && row.persona) return `${row.persona.nombres} ${row.persona.apellido_paterno}`
  return 'General'
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

function filterPerson(val, update) {
  update(() => {
    if (!val) {
      personOptions.value = [...allPersonOptions.value]
      return
    }
    const needle = val.toLowerCase()
    personOptions.value = allPersonOptions.value.filter(p => (p.displayName || '').toLowerCase().includes(needle))
  })
}

// Cargar pagos con filtros
async function loadPagos() {
  loading.value = true
  try {
    const params = {
      desde: filterDesde.value,
      hasta: filterHasta.value,
      id_persona: filterPersona.value,
      estado: filterEstado.value,
      search: searchTerm.value
    }
    const response = await listarPagos(params)
    pagos.value = Array.isArray(response) ? response : (response.data || [])
    displayedPagos.value = pagos.value.slice(0, 12)
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error cargando pagos' })
  } finally {
    loading.value = false
  }
}

// Infinite scroll
function onLoad(index, done) {
  setTimeout(() => {
    const currentLength = displayedPagos.value.length
    const nextBatch = pagos.value.slice(currentLength, currentLength + 12)

    if (nextBatch.length > 0) {
      displayedPagos.value.push(...nextBatch)
    }

    done(nextBatch.length === 0)
  }, 300)
}

// Watch filtros
watch([filterDesde, filterHasta, filterPersona, filterEstado, searchTerm], () => {
  loadPagos()
})

onMounted(async () => {
  await loadPagos()
})

// Acciones
function openDialog() {
  dialogVisible.value = true
}

function onPagoSaved() {
  loadPagos()
}

const comprobanteUrl = (name) => {
  if (!name) return null
  if (name.startsWith('http')) return name
  return `http://localhost:3001/uploads/${name}`
}

function verPago(pago) {
  selectedPago.value = pago
  detalleDialog.value = true
}

function verComprobante(pago) {
  selectedPago.value = pago
  comprobanteDialog.value = true
}

function anularPago(pago) {
  $q.dialog({
    title: 'Anular pago',
    message: `¿Desea anular el pago de ${personaLabel(pago)} por Bs ${pago.monto}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await anularPagoStore(pago.id)
      $q.notify({ type: 'positive', message: 'Pago anulado correctamente' })
      await loadPagos()
    } catch (e) {
      console.error('Error anulando pago', e)
      $q.notify({ type: 'negative', message: 'Error al anular el pago' })
    }
  })
}
</script>

<style scoped lang="scss">
/* Paleta de colores verdosos moderna */
$color-emerald: #10b981;
$color-jade: #059669;
$color-mint: #6ee7b7;
$color-sage: #34d399;
$color-forest: #047857;
$color-lime: #84cc16;

$pastel-mint: #d1fae5;
$pastel-sage: #ecfdf5;
$pastel-lime: #f7fee7;
$pastel-emerald: #a7f3d0;

.payments-page {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, $pastel-sage 100%);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease-in;
}

.header-content {
  background: linear-gradient(135deg, $pastel-mint 0%, $pastel-emerald 50%, $pastel-sage 100%);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  border: 2px solid $color-mint;
}

.page-icon {
  color: $color-emerald;
  vertical-align: middle;
  margin-right: 12px;
}

.page-title {
  display: inline-block;
  font-size: 2em;
  font-weight: 700;
  color: $color-forest;
  margin: 0;
  vertical-align: middle;
}

.header-subtitle {
  color: $color-jade;
  margin: 8px 0 0 60px;
  font-size: 1em;
}

.btn-add-header {
  background: linear-gradient(135deg, $color-emerald 0%, $color-jade 100%);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }
}

.statistics-section {
  margin-bottom: 24px;
  animation: slideDown 0.6s ease-out;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
}

.stat-card-total {
  border-left-color: $color-emerald;
  background: linear-gradient(135deg, white 0%, $pastel-mint 100%);
}

.stat-card-month {
  border-left-color: $color-jade;
  background: linear-gradient(135deg, white 0%, $pastel-emerald 100%);
}

.stat-card-count {
  border-left-color: $color-sage;
  background: linear-gradient(135deg, white 0%, $pastel-sage 100%);
}

.stat-card-average {
  border-left-color: $color-lime;
  background: linear-gradient(135deg, white 0%, $pastel-lime 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.85em;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.8em;
  font-weight: 700;
  color: $color-forest;
}

.stat-icon {
  font-size: 48px;
  color: $color-mint;
  opacity: 0.6;
}

.toolbar-section {
  margin-bottom: 16px;
}

.search-input {
  background: white;
  border-radius: 12px;

  :deep(.q-field__control) {
    border-radius: 12px;
  }
}

.filters-section {
  background: white;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.filters-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 100%);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, $pastel-mint 0%, $pastel-emerald 100%);
  }
}

.filters-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: $color-forest;
  font-size: 1.1em;
}

.filters-content {
  padding: 20px;
  background: white;
}

.filter-input {
  :deep(.q-field__control) {
    border-radius: 12px;
  }
}

.payments-list {
  animation: fadeIn 0.8s ease-in;
}

.payment-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.15);
    border-color: $color-mint;
  }
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid $pastel-mint;
}

.payment-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: $color-jade;
  font-size: 0.9em;
}

.payment-body {
  margin-bottom: 16px;

  >div {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: #4b5563;
    font-size: 0.95em;

    .q-icon {
      color: $color-sage;
    }
  }
}

.payment-person {
  font-weight: 600;
  color: $color-forest !important;
  font-size: 1.1em !important;
}

.payment-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 100%);
  padding: 12px;
  border-radius: 12px;
  margin-top: 12px;

  .amount-label {
    font-weight: 600;
    color: $color-jade;
  }

  .amount-value {
    font-size: 1.5em;
    font-weight: 700;
    color: $color-emerald;
  }
}

.payment-discount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff7ed;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 8px;

  .discount-label {
    font-weight: 600;
    color: #ea580c;
    font-size: 0.9em;
  }

  .discount-value {
    font-weight: 700;
    color: #ea580c;
  }
}

.payment-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid $pastel-mint;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;

  p {
    font-size: 1.2em;
    margin-top: 16px;
  }
}

.detail-dialog {
  min-width: 700px;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.scrollable-dialog {
  :deep(.q-card__section) {
    &:not(.detail-header):not(.detail-actions) {
      overflow-y: auto;
      flex: 1;
    }
  }
}

.detail-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 50%, $pastel-emerald 100%);
  border-bottom: 3px solid $color-mint;
  color: $color-forest;
  flex-shrink: 0;
}

.separator-gradient {
  height: 3px;
  background: linear-gradient(90deg, $color-forest 0%, $color-jade 50%, $color-emerald 100%);
}

.detail-body {
  overflow-y: auto;
  flex: 1;
}

.comprobante-container {
  background: #f3f4f6;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.comprobante-image {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.detail-list {
  .q-item {
    border-radius: 12px;
    margin-bottom: 8px;
    background: $pastel-sage;
    transition: all 0.3s ease;

    &:hover {
      background: $pastel-mint;
      transform: translateX(4px);
    }
  }
}

.detail-actions {
  border-top: 1px solid $pastel-mint;
  flex-shrink: 0;
}

.comprobante-dialog {
  max-width: 90vw;
  max-height: 90vh;
}

.scrollable-comprobante {
  display: flex;
  flex-direction: column;

  .comprobante-content {
    overflow-y: auto;
    flex: 1;
  }
}

.comprobante-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 100%);
  color: $color-forest;
  flex-shrink: 0;
}

.comprobante-content {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
  max-height: 70vh;
  overflow: auto;
}

.comprobante-full-image {
  max-height: 70vh;
  max-width: 100%;
  object-fit: contain;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 959px) {
  .btn-add-header {
    width: 100%;
    margin-top: 12px;
  }

  .page-title {
    font-size: 1.6em;
  }

  .header-subtitle {
    font-size: 0.9em;
    margin-left: 0;
  }
}

@media (max-width: 599px) {
  .payments-page {
    padding: 12px;
  }

  .header-content {
    padding: 16px;
  }

  .page-title {
    font-size: 1.4em;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 1.5em;
  }

  .stat-icon {
    font-size: 36px;
  }

  .payment-card {
    padding: 16px;
  }

  .detail-dialog {
    min-width: 95vw;
    max-width: 95vw;
    margin: 8px;
  }

  .detail-body {
    padding: 12px;
  }

  .comprobante-container {
    margin-bottom: 16px;
  }

  .comprobante-dialog {
    width: 95vw;
    margin: 8px;
  }

  .comprobante-content {
    max-height: 60vh;
  }

  .comprobante-full-image {
    max-height: 60vh;
  }
}
</style>
