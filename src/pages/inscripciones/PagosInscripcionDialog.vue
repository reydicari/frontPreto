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
            <!-- Header del pago -->
            <div class="pago-header">
              <div class="pago-id">
                <q-icon name="tag" size="18px" class="q-mr-xs" />
                Pago #{{ pago.id }}
              </div>
              <q-badge :color="getEstadoColor(pago.estado)" :label="getEstadoLabel(pago.estado)" class="estado-badge">
                <q-icon :name="getEstadoIcon(pago.estado)" size="14px" class="q-ml-xs" />
              </q-badge>
            </div>

            <!-- Fecha -->
            <div class="pago-fecha">
              <q-icon name="event" size="20px" color="primary" class="q-mr-sm" />
              <span>{{ formatDate(pago.fecha) }}</span>
              <span v-if="extractTime(pago.fecha)" class="pago-hora">{{ extractTime(pago.fecha) }}</span>
            </div>

            <!-- Detalles -->
            <div class="pago-details">
              <div class="detail-row">
                <span class="detail-label">
                  <q-icon name="account_balance_wallet" size="16px" class="q-mr-xs" />
                  Método:
                </span>
                <span class="detail-value">{{ pago.metodo_pago?.nombre || 'N/A' }}</span>
              </div>

              <div class="detail-row" v-if="pago.meses_cubiertos">
                <span class="detail-label">
                  <q-icon name="calendar_month" size="16px" class="q-mr-xs" />
                  Meses cubiertos:
                </span>
                <span class="detail-value">{{ pago.meses_cubiertos }}</span>
              </div>

              <div class="detail-row" v-if="pago.descuento > 0">
                <span class="detail-label">
                  <q-icon name="discount" size="16px" class="q-mr-xs" />
                  Descuento:
                </span>
                <span class="detail-value discount-value">-${{ pago.descuento.toLocaleString() }}</span>
              </div>

              <div class="detail-row" v-if="pago.id_usuario">
                <span class="detail-label">
                  <q-icon name="person" size="16px" class="q-mr-xs" />
                  Registrado por:
                </span>
                <span class="detail-value">{{ pago.usuario?.nombre || 'Usuario' }}</span>
              </div>

              <div class="detail-row" v-if="pago.observaciones">
                <span class="detail-label">
                  <q-icon name="comment" size="16px" class="q-mr-xs" />
                  Nota:
                </span>
                <span class="detail-value">{{ pago.observaciones }}</span>
              </div>
            </div>

            <!-- Monto destacado -->
            <div class="pago-monto" :class="{ 'monto-deuda': pago.estado === 2 }">
              <span class="monto-label">{{ pago.estado === 2 ? 'Adeuda' : 'Monto' }}</span>
              <span class="monto-value">${{ pago.monto.toLocaleString() }}</span>
            </div>

            <!-- Sub-pagos si existen -->
            <div v-if="pago.subpagos && pago.subpagos.length > 0" class="subpagos-section">
              <div class="subpagos-header">
                <q-icon name="payments" size="16px" class="q-mr-xs" />
                Abonos ({{ pago.subpagos.length }})
              </div>
              <div class="subpagos-list">
                <div v-for="subpago in pago.subpagos" :key="subpago.id" class="subpago-item">
                  <span class="subpago-fecha">{{ formatDate(subpago.fecha) }}</span>
                  <span class="subpago-monto">${{ subpago.monto.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- Comprobante -->
            <div v-if="pago.comprobante" class="pago-comprobante">
              <q-btn icon="attach_file" label="Ver comprobante" size="sm" color="primary" outline dense
                @click.stop="verComprobante(pago)" />
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
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: $primary;
    box-shadow: 0 4px 16px rgba(27, 94, 32, 0.15);
  }

  .pago-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba($primary, 0.2);

    .pago-id {
      font-weight: 700;
      color: $primary;
      display: flex;
      align-items: center;
    }

    .estado-badge {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
    }
  }

  .pago-fecha {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    color: $grey-8;

    .pago-hora {
      margin-left: auto;
      font-size: 0.85em;
      color: $grey-6;
    }
  }

  .pago-details {
    margin-bottom: 12px;

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 6px 0;
      border-bottom: 1px solid $grey-3;

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        font-size: 0.85em;
        color: $grey-7;
        display: flex;
        align-items: center;
        font-weight: 500;
      }

      .detail-value {
        font-weight: 600;
        color: $grey-9;
        text-align: right;
        max-width: 60%;
        word-break: break-word;

        &.discount-value {
          color: $secondary;
        }
      }
    }
  }

  .pago-monto {
    background: linear-gradient(135deg, rgba(#2e7d32, 0.15) 0%, rgba(#558b2f, 0.1) 100%);
    padding: 12px;
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    border: 2px solid rgba(#2e7d32, 0.3);

    &.monto-deuda {
      background: linear-gradient(135deg, rgba(#ef6c00, 0.15) 0%, rgba(#f57c00, 0.1) 100%);
      border-color: rgba(#ef6c00, 0.3);

      .monto-label {
        color: #ef6c00;
      }

      .monto-value {
        color: #ef6c00;
      }
    }

    .monto-label {
      font-weight: 700;
      color: #2e7d32;
      text-transform: uppercase;
      font-size: 0.85em;
    }

    .monto-value {
      font-size: 1.4em;
      font-weight: 700;
      color: #2e7d32;
    }
  }

  .subpagos-section {
    margin-top: 12px;
    padding: 12px;
    background: rgba($primary, 0.05);
    border-radius: 8px;
    border: 1px solid rgba($primary, 0.2);

    .subpagos-header {
      font-weight: 600;
      color: $primary;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      font-size: 0.9em;
    }

    .subpagos-list {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .subpago-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 8px;
        background: white;
        border-radius: 6px;
        font-size: 0.85em;

        .subpago-fecha {
          color: $grey-7;
        }

        .subpago-monto {
          font-weight: 700;
          color: $primary;
        }
      }
    }
  }

  .pago-comprobante {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid $grey-3;
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
