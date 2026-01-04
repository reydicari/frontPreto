<template>
  <q-dialog v-model="show" persistent>
    <q-card class="payment-dialog responsive-dialog scrollable-dialog">
      <q-card-section class="payment-header">
        <div class="header-title-payment">
          <q-icon name="add_card" size="32px" class="q-mr-sm" />
          <div class="text-h5 text-weight-bold">{{ isPagoDeuda ? 'Pagar Deuda' : (isEdit ? 'Editar Pago' : 'Nuevo Pago')
            }}</div>
        </div>
      </q-card-section>

      <q-separator class="separator-gradient" />

      <q-card-section class="payment-form">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-input v-model="local.detalle" label="Detalle del pago" outlined dense class="form-input">
              <template v-slot:prepend>
                <q-icon name="description" color="green-7" />
              </template>
            </q-input>
          </div>

          <div :class="isPagoDeuda ? 'col-12' : 'col-12 col-sm-6'">
            <q-input v-model.number="local.monto" type="number" label="Monto *" prefix="Bs " outlined dense
              class="form-input" :rules="montoRules">
              <template v-slot:prepend>
                <q-icon name="payments" color="green-7" />
              </template>
              <template v-slot:hint v-if="isPagoDeuda">
                <span class="text-caption">Saldo pendiente: Bs {{ maxMontoDeuda.toFixed(2) }}</span>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6" v-if="!isPagoDeuda">
            <q-input v-model.number="local.descuento" type="number" label="Descuento" prefix="Bs " outlined dense
              class="form-input" hint="Opcional" :rules="descuentoRules">
              <template v-slot:prepend>
                <q-icon name="discount" color="orange-7" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input v-model="local.fecha" label="Fecha *" outlined dense readonly class="form-input">
              <template v-slot:prepend>
                <q-icon name="event" color="green-7" />
              </template>
              <template v-slot:append>
                <q-icon name="calendar_month" class="cursor-pointer" />
              </template>
              <q-popup-proxy transition-show="scale" transition-hide="scale">
                <q-date v-model="local.fecha" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="OK" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-input>
          </div>

          <div class="col-12 col-sm-6" v-if="!isPagoDeuda">
            <q-select v-model="local.id_persona" :options="personOptions" option-label="displayName" option-value="id"
              label="Persona *" use-input input-debounce="200" emit-value map-options outlined dense
              @filter="filterPerson" class="form-input">
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

          <div class="col-12" v-if="!isPagoDeuda">
            <q-select v-model="local.id_categoria" :options="categoriaOptions" option-value="id" option-label="nombre"
              map-options emit-value label="Categoría *" outlined dense class="form-input">
              <template v-slot:prepend>
                <q-icon name="category" color="green-7" />
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <q-file v-model="comprobanteFile" accept="image/*" label="Comprobante (imagen opcional)" outlined dense
              class="form-input" counter>
              <template v-slot:prepend>
                <q-icon name="image" color="green-7" />
              </template>
              <template v-slot:append>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </div>
        </div>
      </q-card-section>

      <q-card-actions class="payment-actions">
        <div class="row q-col-gutter-sm full-width">
          <div class="col-12">
            <q-btn flat label="Cancelar" color="negative" @click="close" class="full-width" />
          </div>

          <div v-for="metodo in filteredMetodoOptions" :key="metodo.id" class="col-12 col-sm-4"
            :class="{ 'col-6': $q.screen.lt.sm }">
            <q-btn :label="metodo.nombre" :icon="getMetodoIcon(metodo.nombre)" :class="getMetodoClass(metodo.nombre)"
              @click="handlePaymentMethod(metodo)" :disable="!canSave" class="full-width payment-method-btn" no-caps />
          </div>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { todasPersonas } from 'src/stores/persona-store.js'
import { listarCategorias } from 'src/stores/categoria-store.js'
import { listarMetodos } from 'src/stores/metodo-pago-store.js'
import { agregarPago } from 'src/stores/pago_store.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  pago: { type: Object, default: null }, // si viene para editar
  pagoDeuda: { type: Object, default: null } // si viene para pagar deuda
})
const emit = defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()

const show = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const isEdit = computed(() => !!props.pago)
const isPagoDeuda = computed(() => !!props.pagoDeuda)

// opciones
const personOptions = ref([])
const allPersonOptions = ref([])
const categoriaOptions = ref([])
const metodoOptions = ref([])

// archivo y estado local
const comprobanteFile = ref(null)

const today = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const local = reactive({
  id: null,
  comprobante: '',
  detalle: '',
  fecha: today(),
  id_inscripcion: null,
  monto: null,
  id_categoria: null,
  id_usuario_recibe: null,
  id_persona: null,
  descuento: 0,
  id_metodo: null,
  saldo: 0,
  id_pago_original: null,
  estado: 1
})

watch(() => props.pago, (p) => {
  if (p) {
    local.id = p.id || null
    local.comprobante = p.comprobante || ''
    local.detalle = p.detalle || ''
    local.fecha = p.fecha ? String(p.fecha).slice(0, 10) : today()
    local.id_inscripcion = p.id_inscripcion ?? null
    local.monto = p.monto ?? null
    local.id_categoria = p.id_categoria ?? (p.categoria ? p.categoria.id : null)
    local.id_usuario_recibe = p.id_usuario_recibe || getCurrentUserName()//ahora obtendra el id
    local.id_persona = p.id_persona ?? (p.persona ? p.persona.id : (p.inscripcion && p.inscripcion.persona ? p.inscripcion.persona.id : null))
    local.descuento = p.descuento ?? 0
    local.id_metodo = p.id_metodo ?? (p.metodo ? p.metodo.id : null)
    local.saldo = p.saldo ?? 0
    local.id_pago_original = null
    local.estado = p.estado ?? 1
  } else {
    resetLocal()
  }
}, { immediate: true })

watch(() => props.pagoDeuda, (pd) => {
  if (pd) {
    // Pre-llenar con los datos del pago original para pagar la deuda
    local.id = null // Es un nuevo pago
    local.comprobante = ''
    local.detalle = `Pago de deuda - ${pd.detalle || 'Sin detalle'}`
    local.fecha = today()
    local.id_inscripcion = pd.id_inscripcion ?? null
    // Calcular saldo real considerando subpagos ya realizados
    const totalPago = (pd.monto || 0) - (pd.descuento || 0)
    const pagosDerivados = pd.pagosDerivados || []
    const totalSubPagos = pagosDerivados
      .filter(sp => sp.estado !== 0)
      .reduce((sum, sp) => sum + (sp.monto || 0), 0)
    const saldoReal = totalPago - totalSubPagos
    local.monto = saldoReal > 0 ? saldoReal : 0
    local.id_categoria = pd.id_categoria ?? (pd.categorium ? pd.categorium.id : null)
    local.id_usuario_recibe = getCurrentUserName()
    local.id_persona = pd.id_persona ?? (pd.persona ? pd.persona.id : null)
    local.descuento = 0
    local.id_metodo = null
    local.saldo = 0
    local.id_pago_original = pd.id // Guardar referencia al pago original
    local.estado = 1
  } else if (!props.pago) {
    resetLocal()
  }
}, { immediate: true })

function getCurrentUserName() {
  try {
    const raw = sessionStorage.getItem('user')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.id || parsed?.id || ''
  } catch { return '' }
}

function resetLocal() {
  local.id = null
  local.comprobante = ''
  local.detalle = ''
  local.fecha = today()
  local.id_inscripcion = null
  local.monto = null
  local.id_categoria = null
  local.id_usuario_recibe = getCurrentUserName()
  local.id_persona = null
  local.descuento = 0
  local.id_metodo = null
  local.saldo = 0
  local.id_pago_original = null
  local.estado = 1
  comprobanteFile.value = null
}

const loadLists = async () => {
  try {
    const persons = await todasPersonas()
    allPersonOptions.value = (Array.isArray(persons) ? persons : []).map(p => ({ ...p, displayName: `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno}` }))
    personOptions.value = [...allPersonOptions.value]
  } catch (e) { console.error(e) }
  try {
    const cats = await listarCategorias()
    categoriaOptions.value = Array.isArray(cats) ? cats : []
  } catch (e) { console.error(e) }
  try {
    const mets = await listarMetodos()
    metodoOptions.value = Array.isArray(mets) ? mets : []
    console.log('Métodos de pago cargados:', metodoOptions.value)
  } catch (e) { console.error(e) }
}

const filterPerson = (val, update) => {
  update(() => {
    if (!val) { personOptions.value = [...allPersonOptions.value]; return }
    const needle = val.toLowerCase()
    personOptions.value = allPersonOptions.value.filter(p => (p.displayName || '').toLowerCase().includes(needle))
  })
}

const canSave = computed(() => {
  // detalle, descuento y comprobante NO son obligatorios
  if (!local.monto || local.monto <= 0) return false
  if (local.descuento && (local.descuento > local.monto)) return false
  if (!isPagoDeuda.value && !local.id_categoria) return false
  if (!isPagoDeuda.value && !local.id_persona) return false
  return true
})

const filteredMetodoOptions = computed(() => {
  if (!isPagoDeuda.value) return metodoOptions.value
  // Filtrar crédito cuando es pago de deuda
  return metodoOptions.value.filter(m => {
    const nombre = (m.nombre || '').toLowerCase()
    return !nombre.includes('credito') && !nombre.includes('crédito')
  })
})

// Computed para calcular el saldo máximo que se puede pagar cuando es pago de deuda
const maxMontoDeuda = computed(() => {
  if (!props.pagoDeuda) return 0
  const pd = props.pagoDeuda
  const totalPago = (pd.monto || 0) - (pd.descuento || 0)
  const pagosDerivados = pd.pagosDerivados || []
  const totalSubPagos = pagosDerivados
    .filter(sp => sp.estado !== 0)
    .reduce((sum, sp) => sum + (sp.monto || 0), 0)
  return totalPago - totalSubPagos
})

// Reglas de validación para el monto
const montoRules = computed(() => [
  val => !!val || 'El monto es requerido',
  val => val > 0 || 'El monto debe ser mayor a 0',
  val => {
    if (isPagoDeuda.value) {
      return val <= maxMontoDeuda.value || `El monto no puede ser mayor al saldo pendiente (Bs ${maxMontoDeuda.value.toFixed(2)})`
    }
    return true
  }
])

// Reglas de validación para el descuento
const descuentoRules = [
  val => {
    if (val === null || val === undefined || val === '') return true
    return val >= 0 || 'El descuento no puede ser negativo'
  },
  val => {
    if (val === null || val === undefined || val === '') return true
    return val <= (local.monto || 0) || 'El descuento no puede ser mayor al monto'
  }
]

// Función para obtener el icono según el método de pago
const getMetodoIcon = (nombre) => {
  const n = (nombre || '').toLowerCase()
  if (n.includes('efectivo')) return 'payments'
  if (n.includes('qr')) return 'qr_code'
  if (n.includes('credito') || n.includes('crédito')) return 'credit_card'
  return 'payment'
}

// Función para obtener la clase CSS según el método de pago
const getMetodoClass = (nombre) => {
  const n = (nombre || '').toLowerCase()
  if (n.includes('efectivo')) return 'btn-efectivo'
  if (n.includes('qr')) return 'btn-qr'
  if (n.includes('credito') || n.includes('crédito')) return 'btn-credito'
  return 'btn-default'
}

const handlePaymentMethod = async (metodo) => {
  if (!canSave.value) {
    $q.notify({ type: 'negative', message: 'Complete los campos requeridos' })
    return
  }

  console.log('Método seleccionado:', metodo)

  // Asignar el método de pago - obtener el id correctamente
  const metodoPagoId = metodo.id || metodo.id_metodo || null
  local.id_metodo = metodoPagoId

  console.log('ID del método de pago asignado:', local.id_metodo)

  // Lógica específica según el método
  const nombreMetodo = (metodo.nombre || '').toLowerCase()

  if (nombreMetodo.includes('credito') || nombreMetodo.includes('crédito')) {
    // Para crédito: copiar monto a saldo y estado = 2 (Parcial)
    local.saldo = local.monto
    local.estado = 2
  } else {
    // Para efectivo o QR: estado = 1 (Pagado)
    local.saldo = 0
    local.estado = 1
  }

  // Armar objeto pago y FormData
  const pagoObj = {
    id: local.id,
    comprobante: local.comprobante,
    detalle: local.detalle,
    fecha: local.fecha,
    id_inscripcion: local.id_inscripcion,
    monto: local.monto,
    id_categoria: local.id_categoria,
    id_usuario_recibe: local.id_usuario_recibe,
    id_persona: local.id_persona,
    descuento: local.descuento,
    id_metodo: metodoPagoId,
    saldo: local.saldo,
    id_pago_original: local.id_pago_original,
    estado: local.estado
  }
  console.log('Pago antes de crear:', pagoObj)

  const fd = new FormData()
  fd.append('pagoObj', JSON.stringify(pagoObj))
  if (comprobanteFile.value) fd.append('comprobante', comprobanteFile.value)

  try {
    await agregarPago(fd)
    emit('saved')
    show.value = false
    resetLocal()
    $q.notify({
      type: 'positive',
      message: `Pago registrado con ${metodo.nombre}`
    })
  } catch (e) {
    console.error('Error guardando pago', e)
    $q.notify({ type: 'negative', message: 'Error al guardar el pago' })
  }
}

watch(() => show.value, (v) => { if (v) loadLists() })

const close = () => { show.value = false }

</script>

<style scoped lang="scss">
/* Paleta de colores verdosos pastel */
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

.payment-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.responsive-dialog {
  width: 90vw;
  max-width: 600px;
}

.scrollable-dialog {
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  :deep(.q-card__section) {
    &:not(.payment-header):not(.payment-actions) {
      overflow-y: auto;
      flex: 1;
    }
  }
}

.payment-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 50%, $pastel-emerald 100%);
  padding: 24px;
  border-bottom: 3px solid $color-mint;
  flex-shrink: 0;
}

.header-title-payment {
  display: flex;
  align-items: center;
  color: $color-forest;
}

.separator-gradient {
  height: 3px;
  background: linear-gradient(90deg, $color-forest 0%, $color-jade 50%, $color-emerald 100%);
}

.payment-form {
  background: linear-gradient(135deg, #ffffff 0%, $pastel-sage 100%);
  padding: 24px;
}

.form-input {
  :deep(.q-field__control) {
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      border-color: $color-sage;
      box-shadow: 0 0 0 1px $pastel-mint;
    }
  }

  :deep(.q-field--focused .q-field__control) {
    border-color: $color-mint;
    box-shadow: 0 0 0 2px $pastel-emerald;
  }

  :deep(.q-field__label) {
    color: $color-jade;
  }
}

.payment-actions {
  border-top: 2px solid $pastel-mint;
  padding: 16px 24px;
  background: white;
  flex-shrink: 0;

  .q-btn {
    border-radius: 8px;
    font-weight: 600;
    text-transform: none;
    padding: 10px 24px;
  }
}

.payment-methods-label {
  font-weight: 700;
  font-size: 0.95em;
  color: $color-forest;
  text-align: center;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-method-btn {
  font-size: 0.95em;
  padding: 14px 20px !important;
  transition: all 0.3s ease;

  &:hover:not([disabled]) {
    transform: translateY(-2px);
  }
}

.btn-efectivo {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

  &:hover:not([disabled]) {
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }
}

.btn-qr {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);

  &:hover:not([disabled]) {
    box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
  }
}

.btn-credito {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);

  &:hover:not([disabled]) {
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
  }
}

.btn-default {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.btn-save {
  background: linear-gradient(135deg, $color-emerald 0%, $color-jade 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  &:disabled {
    background: #9ca3af;
    box-shadow: none;
  }
}

@media (max-width: 599px) {
  .responsive-dialog {
    width: 95vw;
    margin: 8px;
  }

  .scrollable-dialog {
    max-height: 95vh;
  }

  .payment-header {
    padding: 16px;
  }

  .header-title-payment {
    .q-icon {
      font-size: 24px !important;
    }

    .text-h5 {
      font-size: 1.2em;
    }
  }

  .payment-form {
    padding: 16px;
  }

  .row.q-col-gutter-md {
    margin-left: -8px;
    margin-right: -8px;

    >div {
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  :deep(.q-field__label) {
    font-size: 0.9em;
  }

  .payment-actions {
    padding: 12px 16px;

    .row {
      gap: 8px 0;
    }
  }

  .payment-method-btn {
    font-size: 0.85em;
    padding: 12px 16px !important;
  }

  .payment-methods-label {
    font-size: 0.85em;
  }
}
</style>
