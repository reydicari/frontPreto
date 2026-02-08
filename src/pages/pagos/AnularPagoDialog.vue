<template>
  <q-dialog v-model="show" persistent>
    <q-card class="anular-dialog">
      <q-card-section class="anular-header">
        <div class="header-title-anular">
          <q-icon name="cancel" size="32px" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold">Anular Pago</div>
        </div>
      </q-card-section>

      <q-separator class="separator-danger" />

      <q-card-section class="anular-body">
        <div class="warning-message">
          <q-icon name="warning" size="48px" color="orange" />
          <p class="text-center q-mt-md">
            ¿Está seguro que desea anular este pago?
          </p>
        </div>

        <div class="pago-info" v-if="pago">
          <div class="info-row">
            <span class="info-label">Monto:</span>
            <span class="info-value">Bs {{ parseFloat(pago.monto).toFixed(2) }}</span>
          </div>
          <div class="info-row" v-if="pago.categorium || pago.categoria">
            <span class="info-label">Categoría:</span>
            <span class="info-value">{{ (pago.categorium || pago.categoria).nombre }}</span>
          </div>
          <div class="info-row" v-if="pago.persona">
            <span class="info-label">Persona:</span>
            <span class="info-value">{{ pago.persona.nombre }} {{ pago.persona.apellido }}</span>
          </div>
          <div class="info-row" v-if="pago.fecha">
            <span class="info-label">Fecha:</span>
            <span class="info-value">{{ formatDate(pago.fecha) }}</span>
          </div>
          <div class="info-row" v-if="pago.detalle">
            <span class="info-label">Detalle:</span>
            <span class="info-value">{{ pago.detalle }}</span>
          </div>
          <div class="info-row" v-if="pago.metodo">
            <span class="info-label">Método:</span>
            <span class="info-value">{{ pago.metodo.nombre }}</span>
          </div>
        </div>

        <div class="warning-note">
          <q-icon name="info" size="20px" color="orange" />
          <span>Esta acción no se puede deshacer</span>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cerrar" class="action-btn" />
        <q-btn unelevated label="Anular" color="negative" @click="confirmarAnular" :loading="loading"
          class="action-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { anularPago } from 'stores/pago_store'

const props = defineProps({
  modelValue: Boolean,
  pago: Object
})

const emit = defineEmits(['update:modelValue', 'anulado'])

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)

function formatDate(dateStr) {
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

async function confirmarAnular() {
  if (!props.pago?.id) return

  loading.value = true
  try {
    // const res =
    console.log('id del pago a anular: ', props.pago.id);

    await anularPago(props.pago.id)
    // if (res.ok) {
    emit('anulado')
    cerrar()
    // }
  } catch (error) {
    console.error('Error al anular pago:', error)
  } finally {
    loading.value = false
  }
}

function cerrar() {
  show.value = false
}
</script>

<style scoped>
.anular-dialog {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
}

.anular-header {
  background: linear-gradient(135deg, #c62828 0%, #d32f2f 100%);
  color: white;
  padding: 20px 24px;
}

.header-title-anular {
  display: flex;
  align-items: center;
}

.separator-danger {
  height: 3px;
  background: linear-gradient(90deg, #c62828, #ef5350, #c62828);
}

.anular-body {
  padding: 24px;
}

.warning-message {
  text-align: center;
  padding: 20px 0;
}

.warning-message p {
  font-size: 16px;
  color: #424242;
  margin: 0;
}

.pago-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #616161;
}

.info-value {
  color: #212121;
}

.warning-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff3e0;
  border-radius: 6px;
  color: #e65100;
  font-size: 14px;
  margin-top: 16px;
}

.action-btn {
  min-width: 100px;
  font-weight: 500;
}

@media (max-width: 599px) {
  .anular-dialog {
    max-width: 95vw;
  }

  .anular-header {
    padding: 16px;
  }

  .anular-body {
    padding: 16px;
  }
}
</style>
