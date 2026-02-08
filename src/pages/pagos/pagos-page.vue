<template>
  <q-page class="payments-page" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header con título y botón -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title-section">
          <div class="row items-center justify-between">
            <div class="col-auto">
              <q-icon name="payments" size="48px" class="page-icon" />
              <h1 class="page-title q-ma-none">Gestión de Pagos</h1>
              <!-- <p class="header-subtitle">Registro y control de transacciones</p> -->
            </div>
            <div class="col-auto">
              <q-btn icon="add_circle" label="Nuevo Pago" class="btn-add-header" @click="openDialog" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="statistics-section">
      <div class="row q-col-gutter-md justify-center">
        <div class="col-12 col-sm-6 col-md-5">
          <div class="stat-card stat-card-total">
            <div class="stat-content">
              <div class="stat-label">Total Pagos</div>
              <div class="stat-value">Bs {{ totalPagos.toFixed(2) }}</div>
            </div>
            <q-icon name="account_balance_wallet" class="stat-icon" />
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-5">
          <div class="stat-card stat-card-count">
            <div class="stat-content">
              <div class="stat-label">Total Deudas</div>
              <div class="stat-value">Bs {{ totalDeudas.toFixed(2) }}</div>
            </div>
            <q-icon name="warning" class="stat-icon" />
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de búsqueda -->
    <!-- <div class="toolbar-section">
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
              <q-select map-options emit-value option-value="value" dense outlined v-model="filterEstado"
                :options="estadoOptions" label="Estado" clearable class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="toggle_on" color="green-7" />
                </template>
              </q-select>
            </div>

            <!-- <div class="col-12 col-sm-6 col-md-3">
              <q-select dense outlined v-model="filterRol" :options="rolOptions" label="Tipo de Persona" clearable
                class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="badge" color="green-7" />
                </template>
              </q-select>
            </div> -->

            <div class="col-12 col-sm-6 col-md-3">
              <q-select dense outlined v-model="filterPersona" :options="personOptions" option-label="displayName"
                option-value="id" use-input input-debounce="300" emit-value map-options label="Persona" clearable
                @filter="onFilterPerson" class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="person_search" color="green-7" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">{{ searchPersonaFiltro.length < 3
                      ? 'Escribe al menos 3 caracteres' : 'No se encontró' }}</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-select dense outlined v-model="filterUsuario" :options="usuarioOptions" option-label="displayName"
                option-value="id" use-input input-debounce="300" emit-value map-options label="Usuario que registró"
                clearable @filter="onFilterUsuario" class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="account_circle" color="green-7" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">{{ searchUsuario.length < 3 ? 'Escribe al menos 3 caracteres'
                      : 'No se encontró' }}</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-select map-options emit-value option-value="value" dense outlined v-model="filterCategoria"
                :options="categoriaOptions" label="Categoría de Pago" clearable class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="category" color="green-7" />
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
          <div v-for="pago in displayedPagos" :key="pago.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="payment-card" @click="verPago(pago)">
              <div class="payment-header">
                <div class="payment-date">
                  <q-icon name="event" size="18px" />
                  <span>{{ formatDate(pago.fecha) }}</span>
                  <span v-if="extractTime(pago.fecha)">, {{ extractTime(pago.fecha) }}</span>
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

                <!-- Caso: tiene descuento -->
                <template v-if="pago.descuento && pago.descuento > 0">
                  <div class="row q-mt-sm">
                    <div class="col-6">
                      <div class="payment-amount-small">
                        <div class="amount-label-small">Monto</div>
                        <div class="amount-value-small">Bs {{ pago.monto }}</div>
                      </div>
                    </div>
                    <div class="col-5">
                      <div class="payment-discount-small">
                        <div class="discount-label-small">Descuento</div>
                        <div class="discount-value-small">Bs {{ pago.descuento }}</div>
                      </div>
                    </div>
                  </div>
                  <!-- Mostrar Total Pagado o Saldo Pendiente según saldo real -->
                  <div v-if="pago.saldo > 0" class="payment-saldo">
                    <div class="saldo-label">Saldo Pendiente</div>
                    <div class="saldo-value">Bs {{ pago.saldo }}</div>
                  </div>
                  <div v-else class="payment-total">
                    <div class="total-label">{{ pago.estado === 2 && pago.saldo === 0 ? 'Monto Pagado' :
                      'Total Pagado' }}</div>
                    <div class="total-value">Bs {{ (pago.monto - pago.descuento) }}</div>
                  </div>
                </template>

                <!-- Caso: no tiene descuento -->
                <template v-else>
                  <!-- Si estado es 1 (Pagado), mostrar como Total Pagado -->
                  <div v-if="pago.estado === 1" class="payment-total">
                    <div class="total-label">Total Pagado</div>
                    <div class="total-value">Bs {{ pago.monto }}</div>
                  </div>
                  <!-- Si estado es 2 (Parcial), verificar saldo real -->
                  <div v-else-if="pago.estado === 2 && pago.saldo > 0" class="payment-saldo">
                    <div class="saldo-label">Saldo Pendiente</div>
                    <div class="saldo-value">Bs {{ pago.saldo }}</div>
                  </div>
                  <!-- Si estado es 2 pero saldo real es 0, mostrar como pagado -->
                  <div v-else-if="pago.estado === 2 && pago.saldo === 0" class="payment-total">
                    <div class="total-label">Monto Pagado</div>
                    <div class="total-value">Bs {{ pago.monto }}</div>
                  </div>
                  <!-- Otros estados, mostrar monto normal -->
                  <div v-else class="payment-amount">
                    <div class="amount-label">Monto</div>
                    <div class="amount-value">Bs {{ pago.monto }}</div>
                  </div>
                </template>
              </div>

              <div class="payment-footer">
                <q-btn v-if="pago.estado === 2 && pago.saldo > 0" flat dense icon="payment" color="primary"
                  @click.stop="pagarDeuda(pago)">
                  <q-tooltip>Pagar deuda</q-tooltip>
                </q-btn>
                <q-btn v-if="pago.estado != 0" flat dense icon="money_off" color="negative"
                  @click.stop="abrirAnularPago(pago)">
                  <q-tooltip>Anular pago</q-tooltip>
                </q-btn>
                <q-btn v-if="pago.comprobante" flat dense icon="image" color="primary"
                  @click.stop="verComprobante(pago)">
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
                    <q-item-label>{{ selectedPago?.usuario?.usuario || '-' }}</q-item-label>
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

          <!-- Sección de Pagos Derivados (SubPagos) -->
          <div v-if="selectedPago?.pagosDerivados && selectedPago.pagosDerivados.length > 0" class="col-12 q-mt-md">
            <div class="subpagos-section">
              <div class="subpagos-header">
                <q-icon name="account_balance_wallet" size="20px" class="q-mr-sm" />
                <span class="text-h6">Pagos Realizados</span>
              </div>
              <q-separator class="q-my-sm" />

              <div class="subpagos-list">
                <div v-for="subPago in selectedPago.pagosDerivados" :key="subPago.id" class="subpago-item">
                  <div class="subpago-content">
                    <div class="subpago-info">
                      <div class="subpago-row">
                        <q-icon name="event" size="16px" color="grey-7" />
                        <span class="subpago-label">{{ formatDate(subPago.fecha) }}</span>
                      </div>
                      <div class="subpago-row">
                        <q-icon name="credit_card" size="16px" color="green-7" />
                        <span class="subpago-label">{{ subPago.metodo?.nombre || subPago.metodo || '-' }}</span>
                      </div>
                      <div class="subpago-row">
                        <q-icon name="account_circle" size="16px" color="blue-7" />
                        <span class="subpago-label">{{ subPago.usuario?.usuario || '-' }}</span>
                      </div>
                      <div class="subpago-row">
                        <q-badge :color="estadoColor(subPago.estado)" :label="estadoLabel(subPago.estado)" />
                      </div>
                      <div class="subpago-row" v-if="subPago.comprobante">
                        <q-btn flat dense round icon="attach_file" color="primary" size="sm"
                          @click.stop="verComprobanteSubPago(subPago)">
                          <q-tooltip>Ver comprobante</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                    <div class="subpago-amount">
                      <div class="subpago-monto">Bs {{ subPago.monto }}</div>
                      <q-btn v-if="subPago.estado != 0" flat dense round icon="money_off" color="negative" size="sm"
                        @click.stop="abrirAnularPago(subPago)">
                        <q-tooltip>Anular pago</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resumen de saldo -->
              <q-separator class="q-my-sm" />
              <div class="saldo-resumen">
                <div v-if="selectedPago.saldo <= 0" class="saldo-cubierto">
                  <q-icon name="check_circle" size="24px" color="positive" />
                  <span class="text-weight-bold text-positive">Deuda Totalmente Pagada</span>
                </div>
                <div v-else class="saldo-pendiente-resumen">
                  <span class="saldo-label-resumen">Saldo Pendiente:</span>
                  <span class="saldo-value-resumen">Bs {{ selectedPago.saldo }}</span>
                </div>
              </div>
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

    <!-- Dialog comprobante de subpago -->
    <q-dialog v-model="comprobanteSubPagoDialog">
      <q-card class="comprobante-dialog scrollable-comprobante">
        <q-card-section class="comprobante-header">
          <div class="text-h6">Comprobante de Pago Parcial</div>
        </q-card-section>

        <q-card-section class="comprobante-content">
          <q-img v-if="selectedSubPago && selectedSubPago.comprobante"
            :src="comprobanteUrl(selectedSubPago.comprobante)" class="comprobante-full-image" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-if="selectedSubPago && selectedSubPago.comprobante"
            :href="comprobanteUrl(selectedSubPago.comprobante)" target="_blank" label="Abrir" color="primary"
            icon="open_in_new" />
          <q-btn flat label="Cerrar" color="negative" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog externo para Nuevo/Editar Pago -->
    <NuevoPagoDialog v-model="dialogVisible" :pago-deuda="pagoDeuda" @saved="onPagoSaved" />

    <!-- Dialog para Anular Pago -->
    <AnularPagoDialog v-model="anularDialog" :pago="pagoToAnular" @anulado="onPagoAnulado" />
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { listarPagos } from 'src/stores/pago_store.js'
import { todasPersonas } from 'src/stores/persona-store.js'
import { listarRoles } from 'src/stores/rol-store.js'
import { listarUsuarios } from 'src/stores/usuario-store.js'
import { listarCategorias } from 'src/stores/categoria-store.js'
import NuevoPagoDialog from 'src/pages/pagos/NuevoPagoDialog.vue'
import AnularPagoDialog from 'src/pages/pagos/AnularPagoDialog.vue'
import FiltroFechas from 'src/components/FiltroFechas.vue'

const $q = useQuasar()

// Estado
const loading = ref(false)
const displayedPagos = ref([])
const totalPagos = ref(0)
const totalDeudas = ref(0)
const showFilters = ref(false)

// Paginación
const page = ref(0)
const limit = ref(12)
const hasMoreData = ref(true)

// Filtros
const searchTerm = ref('')
const filterDesde = ref(null)
const filterHasta = ref(null)
const filterPersona = ref(null)
const filterEstado = ref(null)
const filterRol = ref(null)
const filterUsuario = ref(null)
const filterCategoria = ref(null)
const searchPersonaFiltro = ref('')
const searchUsuario = ref('')

// Dialogos
const dialogVisible = ref(false)
const detalleDialog = ref(false)
const comprobanteDialog = ref(false)
const comprobanteSubPagoDialog = ref(false)
const anularDialog = ref(false)
const selectedPago = ref(null)
const selectedSubPago = ref(null)
const pagoDeuda = ref(null)
const pagoToAnular = ref(null)

// Opciones
const personOptions = ref([])
const rolOptions = ref([])
const usuarioOptions = ref([])
const categoriaOptions = ref([])
const estadoOptions = [
  { label: 'Todos', value: null },
  { label: 'Anulado', value: 0 },
  { label: 'Valido', value: 1 },
  { label: 'Deuda', value: 2 },
]

const activeFiltersCount = computed(() => {
  let count = 0
  if (filterDesde.value) count++
  if (filterHasta.value) count++
  if (filterPersona.value) count++
  if (filterEstado.value !== null && filterEstado.value !== undefined) count++
  if (filterRol.value) count++
  if (filterUsuario.value) count++
  if (filterCategoria.value) count++
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
  let s = String(dateString).trim()
  // Aceptar formatos: 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', o ISO con 'T'
  if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T')
  if (!s.includes('T')) s = `${s}T00:00:00`
  const date = new Date(s)
  if (isNaN(date)) return String(dateString)
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

function extractTime(dateString) {
  if (!dateString) return ''
  const s = String(dateString).trim()
  if (s.includes(' ')) {
    const parts = s.split(' ')
    return (parts[1] || '').slice(0, 8)
  }
  if (s.includes('T')) {
    const parts = s.split('T')
    return (parts[1] || '').slice(0, 8)
  }
  return ''
}

async function onFilterPerson(val, update) {
  searchPersonaFiltro.value = val
  if (!val || val.length < 3) {
    update(() => { personOptions.value = [] })
    return
  }
  update(async () => {
    try {
      const res = await todasPersonas({ search: val })
      personOptions.value = (Array.isArray(res) ? res : []).map(p => ({
        ...p,
        displayName: `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno || ''}`.trim()
      }))
    } catch (e) {
      console.error(e)
      personOptions.value = []
    }
  })
}

async function onFilterUsuario(val, update) {
  searchUsuario.value = val
  if (!val || val.length < 3) {
    update(() => { usuarioOptions.value = [] })
    return
  }
  update(async () => {
    try {
      const res = await listarUsuarios({ search: val })
      usuarioOptions.value = (Array.isArray(res) ? res : []).map(u => ({
        ...u,
        displayName: `${u.usuario} - ${u.persona?.nombres || ''} ${u.persona?.apellido_paterno || ''}`.trim()
      }))
    } catch (e) {
      console.error(e)
      usuarioOptions.value = []
    }
  })
}

// Cargar pagos con filtros
async function loadPagos(append = false) {
  loading.value = true
  try {
    const params = {
      desde: filterDesde.value,
      hasta: filterHasta.value,
      id_persona: filterPersona.value,
      estado: filterEstado.value,
      search: searchTerm.value,
      id_rol: filterRol.value,
      id_usuario_recibe: filterUsuario.value,
      id_categoria: filterCategoria.value,
      page: page.value,
      limit: limit.value
    }
    console.log('📦 Params enviados a listarPagos:', params)
    const response = await listarPagos(params)
    const newPagos = (response.lista || [])

    if (append) {
      displayedPagos.value.push(...newPagos)
    } else {
      displayedPagos.value = newPagos
    }
    totalPagos.value = response.totalPagos || 0
    totalDeudas.value = response.totalDeudas || 0
    // Si recibimos menos datos que el límite, no hay más datos
    hasMoreData.value = newPagos.length === limit.value

    console.log('pagos-----------------------', displayedPagos.value)

  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error cargando pagos' })
  } finally {
    loading.value = false
  }
}

// Infinite scroll
async function onLoad(index, done) {
  if (!hasMoreData.value) {
    done(true)
    return
  }

  page.value++
  await loadPagos(true)
  done(!hasMoreData.value)
}

// Watch page para log
watch(page, (newPage) => {
  console.log('📄 Page cambió a:', newPage)
})

// Watch filtros
watch([filterDesde, filterHasta, filterPersona, filterEstado, searchTerm, filterRol, filterUsuario, filterCategoria], () => {
  page.value = 1
  hasMoreData.value = true
  loadPagos()
})

// Cargar roles (excluyendo Estudiante)
const loadRoles = async () => {
  try {
    const res = await listarRoles()
    rolOptions.value = (Array.isArray(res) ? res : [])
      .filter(r => r.nombre !== 'Estudiante')
      .map(r => ({ label: r.nombre, value: r.id }))
  } catch (e) {
    console.error(e)
  }
}

// Cargar categorías
const loadCategorias = async () => {
  try {
    const res = await listarCategorias()
    categoriaOptions.value = (Array.isArray(res) ? res : [])
      .map(c => ({ label: c.nombre, value: c.id }))
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await loadRoles()
  await loadCategorias()
  await loadPagos()
})

// Acciones
function openDialog() {
  pagoDeuda.value = null
  dialogVisible.value = true
}

function pagarDeuda(pago) {
  pagoDeuda.value = pago
  dialogVisible.value = true
}

function onPagoSaved() {
  page.value = 1
  hasMoreData.value = true
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

function verComprobanteSubPago(subPago) {
  selectedSubPago.value = subPago
  comprobanteSubPagoDialog.value = true
}

function abrirAnularPago(pago) {
  pagoToAnular.value = pago
  anularDialog.value = true
}

function onPagoAnulado() {
  anularDialog.value = false
  detalleDialog.value = false
  page.value = 1
  hasMoreData.value = true
  loadPagos()
}
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

.payments-page {
  padding: 24px;
  min-height: 100vh;

  &.bg-grey-4 {
    background: linear-gradient(135deg, #f0f9ff 0%, rgba($primary, 0.15) 100%);
  }

  &:not(.bg-grey-4) {
    background: linear-gradient(135deg, $dark 0%, rgba($primary, 0.25) 100%);
  }
}

.page-header {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease-in;
}

.header-content {
  background: linear-gradient(135deg, rgba($primary, 0.25) 0%, rgba($primary, 0.15) 100%);
  padding: 12px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba($primary, 0.35);
  border: 2px solid rgba($primary, 0.5);

  :global(.body--dark) & {
    background: linear-gradient(135deg, rgba($primary, 0.35) 0%, rgba($primary, 0.2) 100%);
    border-color: rgba($primary, 0.7);
  }
}

.page-icon {
  color: $secondary;
  vertical-align: middle;
  margin-right: 12px;
}

.page-title {
  display: inline-block;
  font-size: 2em;
  font-weight: 700;
  color: $primary;
  margin: 0;
  vertical-align: middle;

  :global(.body--dark) & {
    color: $primary;
  }
}

.header-subtitle {
  color: $grey-7;
  margin: 8px 0 0 60px;
  font-size: 1em;

  :global(.body--dark) & {
    color: $grey-5;
  }
}

.btn-add-header {
  background: $primary;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba($primary, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: darken($primary, 8%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba($primary, 0.4);
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

  :global(.body--dark) & {
    background: $dark-page;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);

    :global(.body--dark) & {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    }
  }
}

.stat-card-total {
  border-left-color: #2e7d32;
  border-left-width: 5px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%);

  :global(.body--dark) & {
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.3) 0%, rgba(46, 125, 50, 0.4) 100%);
  }

  .stat-value {
    color: #1b5e20;
  }

  .stat-icon {
    color: #2e7d32;
  }
}

.stat-card-month {
  border-left-color: #558b2f;
  border-left-width: 5px;
  background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 50%, #c5e1a5 100%);

  :global(.body--dark) & {
    background: linear-gradient(135deg, rgba(85, 139, 47, 0.3) 0%, rgba(85, 139, 47, 0.4) 100%);
  }

  .stat-value {
    color: #33691e;
  }

  .stat-icon {
    color: #558b2f;
  }
}

.stat-card-count {
  border-left-color: #ff6f00;
  border-left-width: 5px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%);

  :global(.body--dark) & {
    background: linear-gradient(135deg, rgba(255, 111, 0, 0.3) 0%, rgba(255, 111, 0, 0.4) 100%);
  }

  .stat-value {
    color: #e65100;
  }

  .stat-icon {
    color: #ff6f00;
  }
}

.stat-card-average {
  border-left-color: #7cb342;
  border-left-width: 5px;
  background: linear-gradient(135deg, #f9fbe7 0%, #f0f4c3 30%, #ffecb3 70%, #ffe082 100%);

  :global(.body--dark) & {
    background: linear-gradient(135deg, rgba(124, 179, 66, 0.3) 0%, rgba(255, 160, 0, 0.3) 100%);
  }

  .stat-value {
    color: #689f38;
  }

  .stat-icon {
    color: #8bc34a;
  }
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
  color: $primary;

  :global(.body--dark) & {
    color: lighten($primary, 10%);
  }
}

.stat-icon {
  font-size: 48px;
  color: $primary;
  opacity: 0.6;

  :global(.body--dark) & {
    opacity: 0.8;
  }
}

.toolbar-section {
  margin-bottom: 16px;
}

.search-input {
  background: white;
  border-radius: 12px;

  :global(.body--dark) & {
    background: $dark-page;
  }

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

  :global(.body--dark) & {
    background: $dark-page;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

.filters-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: rgba($primary, 0.2);
  transition: all 0.3s ease;

  :global(.body--dark) & {
    background: rgba($primary, 0.25);
  }

  &:hover {
    background: rgba($primary, 0.3);

    :global(.body--dark) & {
      background: rgba($primary, 0.4);
    }
  }
}

.filters-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: $primary;
  font-size: 1.1em;
}

.filters-content {
  padding: 20px;
  background: white;

  :global(.body--dark) & {
    background: $dark-page;
  }
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
  box-shadow: 0 4px 12px rgba($primary, 0.12);
  transition: all 0.3s ease;
  border: 2px solid rgba($primary, 0.15);
  cursor: pointer;

  :global(.body--dark) & {
    background: $dark-page;
    box-shadow: 0 4px 12px rgba($primary, 0.25);
    border-color: rgba($primary, 0.3);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba($primary, 0.3);
    border-color: $primary;

    :global(.body--dark) & {
      box-shadow: 0 8px 24px rgba($primary, 0.5);
      border-color: lighten($primary, 10%);
    }
  }
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid rgba($primary, 0.4);

  :global(.body--dark) & {
    border-bottom-color: rgba($primary, 0.6);
  }
}

.payment-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: $secondary;
  font-size: 0.9em;
}

.payment-body {
  margin-bottom: 16px;

  >div {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: $grey-7;
    font-size: 0.95em;

    :global(.body--dark) & {
      color: $grey-5;
    }

    .q-icon {
      color: $primary;
      opacity: 1;
    }
  }
}

.payment-person {
  font-weight: 700;
  color: $primary !important;
  font-size: 1.1em !important;
}

.payment-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba($primary, 0.2);
  padding: 12px;
  border-radius: 12px;
  margin-top: 12px;

  :global(.body--dark) & {
    background: rgba($primary, 0.3);
  }

  .amount-label {
    font-weight: 600;
    color: $grey-8;

    :global(.body--dark) & {
      color: $grey-4;
    }
  }

  .amount-value {
    font-size: 1.5em;
    font-weight: 700;
    color: $primary;
  }
}

.payment-amount-small {
  background: rgba($primary, 0.15);
  padding: 8px;
  border-radius: 8px;
  text-align: center;

  :global(.body--dark) & {
    background: rgba($primary, 0.25);
  }

  .amount-label-small {
    font-size: 0.75em;
    font-weight: 600;
    color: $grey-7;
    text-transform: uppercase;
    margin-bottom: 4px;

    :global(.body--dark) & {
      color: $grey-5;
    }
  }

  .amount-value-small {
    font-size: 1.1em;
    font-weight: 700;
    color: $primary;
  }
}

.payment-discount-small {
  background: rgba($secondary, 0.15);
  padding: 8px;
  border-radius: 8px;
  text-align: center;

  :global(.body--dark) & {
    background: rgba($secondary, 0.25);
  }

  .discount-label-small {
    font-size: 0.75em;
    font-weight: 600;
    color: $grey-7;
    text-transform: uppercase;
    margin-bottom: 4px;

    :global(.body--dark) & {
      color: $grey-5;
    }
  }

  .discount-value-small {
    font-size: 1.1em;
    font-weight: 700;
    color: $secondary;
  }
}

.payment-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba($primary, 0.25) 0%, rgba($primary, 0.15) 100%);
  padding: 12px;
  border-radius: 12px;
  margin-top: 8px;
  border: 2px solid rgba($primary, 0.3);

  :global(.body--dark) & {
    background: linear-gradient(135deg, rgba($primary, 0.35) 0%, rgba($primary, 0.25) 100%);
  }

  .total-label {
    font-weight: 700;
    color: $primary;
    font-size: 0.95em;
    text-transform: uppercase;
  }

  .total-value {
    font-size: 1.5em;
    font-weight: 700;
    color: $primary;
  }
}

.payment-saldo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(#f59e0b, 0.2);
  padding: 10px 12px;
  border-radius: 10px;
  margin-top: 8px;
  border: 2px solid rgba(#f59e0b, 0.4);

  :global(.body--dark) & {
    background: rgba(#f59e0b, 0.3);
  }

  .saldo-label {
    font-weight: 700;
    color: #d97706;
    font-size: 0.9em;
  }

  .saldo-value {
    font-size: 1.3em;
    font-weight: 700;
    color: #d97706;
  }
}

.payment-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba($primary, 0.2);

  :global(.body--dark) & {
    border-top-color: rgba($primary, 0.3);
  }
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
  background: rgba($primary, 0.25);
  border-bottom: 4px solid $primary;
  color: $primary;
  flex-shrink: 0;

  :global(.body--dark) & {
    background: rgba($primary, 0.35);
  }
}

.separator-gradient {
  height: 3px;
  background: linear-gradient(90deg, $primary 0%, $secondary 50%, $accent 100%);
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
    background: rgba($primary, 0.12);
    transition: all 0.3s ease;

    :global(.body--dark) & {
      background: rgba($primary, 0.2);
    }

    &:hover {
      background: rgba($primary, 0.2);
      transform: translateX(4px);

      :global(.body--dark) & {
        background: rgba($primary, 0.3);
      }
    }
  }
}

.detail-actions {
  border-top: 1px solid rgba($primary, 0.2);
  flex-shrink: 0;

  :global(.body--dark) & {
    border-top-color: rgba($primary, 0.3);
  }
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
  background: rgba($primary, 0.1);
  color: $primary;
  flex-shrink: 0;

  :global(.body--dark) & {
    background: rgba($primary, 0.2);
  }
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

.subpagos-section {
  background: rgba($primary, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 2px solid rgba($primary, 0.2);

  :global(.body--dark) & {
    background: rgba($primary, 0.15);
    border-color: rgba($primary, 0.3);
  }
}

.subpagos-header {
  display: flex;
  align-items: center;
  color: $primary;
  font-weight: 700;
}

.subpagos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subpago-item {
  background: white;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba($primary, 0.2);
  transition: all 0.3s ease;

  :global(.body--dark) & {
    background: $dark-page;
    border-color: rgba($primary, 0.3);
  }

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba($primary, 0.2);
  }
}

.subpago-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.subpago-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subpago-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
}

.subpago-label {
  color: $grey-7;

  :global(.body--dark) & {
    color: $grey-5;
  }
}

.subpago-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.subpago-monto {
  font-size: 1.3em;
  font-weight: 700;
  color: $primary;
}

.saldo-resumen {
  padding: 12px;
  background: white;
  border-radius: 10px;

  :global(.body--dark) & {
    background: $dark-page;
  }
}

.saldo-cubierto {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.1em;
}

.saldo-pendiente-resumen {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.saldo-label-resumen {
  font-weight: 700;
  color: #d97706;
  font-size: 1.05em;
}

.saldo-value-resumen {
  font-size: 1.4em;
  font-weight: 700;
  color: #d97706;
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

  .subpago-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .subpago-amount {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
