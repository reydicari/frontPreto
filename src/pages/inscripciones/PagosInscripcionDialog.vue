<template>
  <q-dialog v-model="isDialogVisible" :maximized="$q.screen.lt.sm" persistent>
    <q-card class="pagos-dialog">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="row items-center justify-between">
          <div class="col">
            <div class="dialog-title">
              <q-icon name="payments" size="32px" class="q-mr-sm" />
              Pagos de Inscripción
            </div>
            <div class="dialog-subtitle" v-if="props.inscripcion">
              {{ getEstudianteNombre() }} - {{ props.inscripcion.paquete?.nombre || 'Sin paquete' }}
            </div>
          </div>
          <q-btn icon="close" flat round dense @click="isDialogVisible = false" />
        </div>
      </q-card-section>

      <div class="separator-gradient"></div>

      <!-- Selector de límite -->
      <q-card-section class="controls-section">
        <div class="row items-center justify-between">
          <div class="col-auto">
            <div class="limit-selector">
              <q-icon name="visibility" class="q-mr-sm" color="primary" />
              <span class="limit-label">Mostrar:</span>
              <q-select v-model="limit" :options="limitOptions" dense outlined class="limit-input"
                @update:model-value="loadPagos" />
            </div>
          </div>
          <div class="col-auto">
            <q-btn icon="refresh" label="Recargar" color="primary" outline @click="loadPagos" :loading="loading" />
          </div>
        </div>
      </q-card-section>

      <!-- Lista de pagos -->
      <q-card-section class="pagos-list-section">
        <div v-if="loading" class="loading-container">
          <q-spinner-dots color="primary" size="50px" />
          <p class="text-grey-7 q-mt-md">Cargando pagos...</p>
        </div>

        <div v-else-if="pagos.length === 0" class="no-results">
          <q-icon name="receipt" size="64px" color="grey-5" />
          <p class="text-h6 text-grey-6 q-mt-md">No hay pagos registrados</p>
          <p class="text-grey-7">Esta inscripción aún no tiene pagos asociados</p>
        </div>

        <div v-else class="pagos-grid">
          <div v-for="pago in pagos" :key="pago.id" class="pago-card" @click="verDetallePago(pago)">
            <div class="pago-header">
              <div class="pago-date">
                <q-icon name="event" size="18px" />
                <span>{{ formatDate(pago.fecha) }}</span>
                <span v-if="extractTime(pago.fecha)">, {{ extractTime(pago.fecha) }}</span>
              </div>
              <q-badge :color="getEstadoColor(pago.estado)" :label="getEstadoLabel(pago.estado)">
                <q-icon :name="getEstadoIcon(pago.estado)" size="14px" class="q-ml-xs" />
              </q-badge>
            </div>

            <div class="pago-body">
              <div class="pago-detail" v-if="pago.metodo_pago">
                <q-icon name="credit_card" size="18px" />
                <span>{{ pago.metodo_pago.nombre }}</span>
              </div>

              <div class="pago-detail" v-if="pago.meses_cubiertos">
                <q-icon name="calendar_month" size="18px" />
                <span>Meses: {{ pago.meses_cubiertos }}</span>
              </div>

              <div class="pago-detail" v-if="pago.observaciones">
                <q-icon name="comment" size="18px" />
                <span>{{ pago.observaciones }}</span>
              </div>

              <div class="pago-detail" v-if="pago.usuario">
                <q-icon name="person" size="18px" />
                <span>{{ pago.usuario.usuario || 'Usuario' }}</span>
              </div>

              <!-- Caso: tiene descuento -->
              <template v-if="pago.descuento && pago.descuento > 0">
                <div class="row q-mt-sm">
                  <div class="col-6">
                    <div class="pago-amount-small">
                      <div class="amount-label-small">Monto</div>
                      <div class="amount-value-small">Bs {{ pago.monto.toLocaleString() }}</div>
                    </div>
                  </div>
                  <div class="col-5">
                    <div class="pago-discount-small">
                      <div class="discount-label-small">Descuento</div>
                      <div class="discount-value-small">Bs {{ pago.descuento.toLocaleString() }}</div>
                    </div>
                  </div>
                </div>
                <!-- Mostrar Total Pagado o Saldo Pendiente según saldo real -->
                <div v-if="pago.saldo > 0" class="pago-saldo">
                  <div class="saldo-label">Saldo Pendiente</div>
                  <div class="saldo-value">Bs {{ pago.saldo.toLocaleString() }}</div>
                </div>
                <div v-else class="pago-total">
                  <div class="total-label">{{ pago.estado === 2 && pago.saldo === 0 ? 'Monto Pagado' : 'Total Pagado' }}
                  </div>
                  <div class="total-value">Bs {{ (pago.monto - pago.descuento).toLocaleString() }}</div>
                </div>
              </template>

              <!-- Caso: no tiene descuento -->
              <template v-else>
                <!-- Si estado es 1 (Pagado), mostrar como Total Pagado -->
                <div v-if="pago.estado === 1" class="pago-total">
                  <div class="total-label">Total Pagado</div>
                  <div class="total-value">Bs {{ pago.monto.toLocaleString() }}</div>
                </div>
                <!-- Si estado es 2 (Parcial), verificar saldo real -->
                <div v-else-if="pago.estado === 2 && pago.saldo > 0" class="pago-saldo">
                  <div class="saldo-label">Saldo Pendiente</div>
                  <div class="saldo-value">Bs {{ pago.saldo.toLocaleString() }}</div>
                </div>
                <!-- Si estado es 2 pero saldo real es 0, mostrar como pagado -->
                <div v-else-if="pago.estado === 2 && pago.saldo === 0" class="pago-total">
                  <div class="total-label">Monto Pagado</div>
                  <div class="total-value">Bs {{ pago.monto.toLocaleString() }}</div>
                </div>
                <!-- Otros estados, mostrar monto normal -->
                <div v-else class="pago-amount">
                  <div class="amount-label">Monto</div>
                  <div class="amount-value">Bs {{ pago.monto.toLocaleString() }}</div>
                </div>
              </template>
            </div>

            <div class="pago-footer">
              <q-btn v-if="pago.comprobante" flat dense icon="image" color="primary" @click.stop="verComprobante(pago)">
                <q-tooltip>Ver comprobante</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Footer -->
      <q-card-actions class="dialog-footer">
        <q-btn label="Cerrar" color="primary" flat @click="isDialogVisible = false" />
      </q-card-actions>
    </q-card>

    <!-- Dialog de comprobante -->
    <q-dialog v-model="comprobanteDialog">
      <q-card class="comprobante-dialog">
        <q-card-section class="comprobante-header">
          <div class="text-h6">Comprobante de Pago #{{ selectedPago?.id }}</div>
        </q-card-section>
        <q-card-section class="comprobante-content">
          <img v-if="selectedPago?.comprobante" :src="comprobanteUrl(selectedPago.comprobante)"
            class="comprobante-image" alt="Comprobante" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Cerrar" color="primary" flat v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { listarPagos } from 'src/stores/pago_store.js'

const $q = useQuasar()
const host = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  inscripcion: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

// Estado
const loading = ref(false)
const pagos = ref([])
const totalRegistros = ref(0)
const limit = ref(10)
const comprobanteDialog = ref(false)
const selectedPago = ref(null)

// Opciones de límite
const limitOptions = [
  { label: '5 pagos', value: 5 },
  { label: '10 pagos', value: 10 },
  { label: '15 pagos', value: 15 },
  { label: '20 pagos', value: 20 },
  { label: 'Todos', value: 999 }
]

// Computed
const isDialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Métodos
const loadPagos = async () => {
  if (!props.inscripcion) return

  loading.value = true
  try {
    const params = {
      id_persona: props.inscripcion.id_persona,
      id_inscripcion: props.inscripcion.id,
      page: 1,
      limit: limit.value
    }

    const response = await listarPagos(params)
    const data = response.data || response

    pagos.value = data?.lista || data || []
    totalRegistros.value = data?.total || pagos.value.length

    console.log('Pagos cargados:', response)
  } catch (error) {
    console.error('Error al cargar pagos:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los pagos',
      position: 'bottom'
    })
    pagos.value = []
  } finally {
    loading.value = false
  }
}

const getEstudianteNombre = () => {
  if (!props.inscripcion?.persona) return 'Estudiante'
  const p = props.inscripcion.persona
  return `${p.nombres || ''} ${p.apellido_paterno || ''}`.trim()
}

const formatDate = (dateInput) => {
  if (!dateInput) return '-'
  let s = String(dateInput).trim()
  if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T')
  if (!s.includes('T')) s = `${s}T00:00:00`
  const date = new Date(s)
  if (isNaN(date)) return String(dateInput)
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

const extractTime = (dateString) => {
  if (!dateString) return ''
  const s = String(dateString).trim()
  if (s.includes(' ')) {
    const parts = s.split(' ')
    if (parts[1]) return parts[1].substring(0, 5)
  }
  if (s.includes('T')) {
    const parts = s.split('T')
    if (parts[1]) return parts[1].substring(0, 5)
  }
  return ''
}

const getEstadoColor = (estado) => {
  switch (estado) {
    case 0: return 'grey'
    case 1: return 'green'
    case 2: return 'orange'
    default: return 'grey'
  }
}

const getEstadoLabel = (estado) => {
  switch (estado) {
    case 0: return 'Anulado'
    case 1: return 'Válido'
    case 2: return 'Deuda'
    default: return 'Desconocido'
  }
}

const getEstadoIcon = (estado) => {
  switch (estado) {
    case 0: return 'cancel'
    case 1: return 'check_circle'
    case 2: return 'error'
    default: return 'help'
  }
}

const verDetallePago = (pago) => {
  // Aquí podrías abrir un dialog de detalle completo si lo deseas
  console.log('Ver detalle de pago:', pago)
}

const verComprobante = (pago) => {
  selectedPago.value = pago
  comprobanteDialog.value = true
}

const comprobanteUrl = (name) => {
  if (!name) return null
  if (name.startsWith('http')) return name
  return `${host}/uploads/${name}`
}

// Watch
watch(isDialogVisible, (visible) => {
  if (visible) {
    loadPagos()
  }
})
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

.pagos-dialog {
  min-width: 900px;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 959px) {
    min-width: 100%;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
  color: white;
  padding: 20px 24px;

  .dialog-title {
    font-size: 1.5em;
    font-weight: 700;
    display: flex;
    align-items: center;
  }

  .dialog-subtitle {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.95em;
    margin-top: 4px;
    margin-left: 40px;
  }
}

.separator-gradient {
  height: 3px;
  background: linear-gradient(90deg, #1b5e20 0%, #f57c00 50%, #ff6f00 100%);
}

.controls-section {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.limit-selector {
  display: flex;
  align-items: center;
  gap: 8px;

  .limit-label {
    font-weight: 600;
    color: $grey-7;
  }

  .limit-input {
    min-width: 120px;
  }
}

.pagos-list-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: $grey-2;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.pagos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.pago-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba($primary, 0.12);
  transition: all 0.3s ease;
  border: 2px solid rgba($primary, 0.15);
  cursor: pointer;

  &:hover {
    border-color: $primary;
    box-shadow: 0 4px 16px rgba(27, 94, 32, 0.15);
  }

  .pago-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 3px solid rgba($primary, 0.4);
  }

  .pago-date {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: $secondary;
    font-size: 0.9em;
  }

  .pago-body {
    margin-bottom: 16px;

    >div:not(.row) {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: $grey-7;
      font-size: 0.95em;

      .q-icon {
        color: $primary;
        opacity: 1;
      }
    }
  }

  .pago-detail {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: $grey-7;
    font-size: 0.95em;

    .q-icon {
      color: $primary;
      opacity: 1;
    }
  }

  .pago-amount {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba($primary, 0.2);
    padding: 12px;
    border-radius: 12px;
    margin-top: 12px;

    .amount-label {
      font-weight: 600;
      color: $grey-8;
    }

    .amount-value {
      font-size: 1.5em;
      font-weight: 700;
      color: $primary;
    }
  }

  .pago-amount-small {
    background: rgba($primary, 0.15);
    padding: 8px;
    border-radius: 8px;
    text-align: center;

    .amount-label-small {
      font-size: 0.75em;
      font-weight: 600;
      color: $grey-7;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .amount-value-small {
      font-size: 1.1em;
      font-weight: 700;
      color: $primary;
    }
  }

  .pago-discount-small {
    background: rgba($secondary, 0.15);
    padding: 8px;
    border-radius: 8px;
    text-align: center;

    .discount-label-small {
      font-size: 0.75em;
      font-weight: 600;
      color: $grey-7;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .discount-value-small {
      font-size: 1.1em;
      font-weight: 700;
      color: $secondary;
    }
  }

  .pago-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba($primary, 0.25) 0%, rgba($primary, 0.15) 100%);
    padding: 12px;
    border-radius: 12px;
    margin-top: 8px;
    border: 2px solid rgba($primary, 0.3);

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

  .pago-saldo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(#f59e0b, 0.2);
    padding: 10px 12px;
    border-radius: 10px;
    margin-top: 8px;
    border: 2px solid rgba(#f59e0b, 0.4);

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

  .pago-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid rgba($primary, 0.2);
  }
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
}

.comprobante-dialog {
  min-width: 600px;
  max-width: 90vw;

  @media (max-width: 599px) {
    min-width: 100%;
  }
}

.comprobante-header {
  background: rgba($primary, 0.1);
  color: $primary;
}

.comprobante-content {
  display: flex;
  justify-content: center;
  align-items: center;
  background: $grey-2;
  max-height: 70vh;
  overflow: auto;

  .comprobante-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
  }
}
</style>
