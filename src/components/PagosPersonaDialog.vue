<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section>
        <div class="row items-center">

          <div class="col-6 text-h6">Pagos de {{ persona?.nombres }} {{ persona?.apellido_paterno }}</div>
          <q-btn color="primary" label="Generar Reporte PDF" class="col-4 q-mt-sm" @click="generarReportePDF()" />
        </div>
      </q-card-section>
      <q-card-section>
        <div v-if="loading" class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="40px" />
        </div>
        <div v-else>
          <div v-if="pagos.length === 0" class="text-center text-grey-7 q-mt-md">
            No hay pagos registrados para esta persona.
          </div>
          <div v-else class="q-gutter-md">
            <q-card v-for="pago in pagos" :key="pago.id" class="q-mb-md">
              <q-card-section class="row items-center">
                <div class="col-3">
                  <q-img v-if="pago.comprobante" :src="host + pago.comprobante"
                    style="max-width: 100px; max-height: 100px;" />
                  <q-icon v-else name="receipt" size="40px" color="grey" />
                </div>
                <div class="col-5">
                  <div class="text-subtitle2" v-if="pago.detalle">{{ pago.detalle }}</div>
                  <div class="text-caption">Fecha: {{ formatDate(pago.fecha) }}</div>
                  <div class="text-caption">Estado: <q-badge :color="pago.estado ? 'positive' : 'negative'">{{
                    pago.estado ? 'Activo' : 'Inactivo' }}</q-badge></div>
                  <div class="text-caption" v-if="pago.inscripcion">Inscripción: {{
                    formatDate(pago.inscripcion.fecha_inicio) }}</div>
                  <div class="text-caption">Cobrador: {{ pago.usuario_cobrador || 'N/A' }}</div>

                </div>
                <div class="col-4 text-right">
                  <div class="text-caption">Categoría: {{ pago.categorium?.nombre || 'N/A' }}</div>
                  <div class="text-caption">Método de pago: {{ pago.metodo_pago }}</div>
                  <div class="text-h6">Monto: {{ Number(pago.monto).toFixed(2) }} Bs</div>
                  <div class="text-caption">Saldo: {{ Number(pago.saldo).toFixed(2) }} Bs</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { listarPagos } from 'src/stores/pago_store.js'
const props = defineProps({
  modelValue: Boolean,
  persona: Object
})
const emit = defineEmits(['update:modelValue'])
const show = ref(props.modelValue)
const pagos = ref([])
const loading = ref(false)
const host = 'http://localhost:3001/uploads/'

watch(() => props.modelValue, async (val) => {
  await cargarPagos()
  show.value = val
})
watch(show, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.persona, async (persona) => {
  console.log('watch que activa la listya ----------------------------', persona);

  if (show.value && persona && persona.id) {
    await cargarPagos()
  }
})

async function cargarPagos() {
  if (!props.persona || !props.persona.id) return
  loading.value = true
  try {
    const params = {
      idPersona: props.persona.id,

    }
    pagos.value = await listarPagos(params)
    console.log('Pagos cargados:', pagos.value);

  } finally {
    loading.value = false
  }
}
import { reportePagosPersona } from 'src/stores/reportes'
const generarReportePDF = async () => {
  const params = {
    id_persona: props.persona.id,
  }
  await reportePagosPersona(params)
}
function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.q-card-section {
  padding-bottom: 0;
}
</style>
