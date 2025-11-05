<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width:520px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Editar Pago' : 'Nuevo Pago' }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-input v-model="local.detalle" label="Detalle" outlined dense />

        <div class="row ">
          <q-input class="col" v-model.number="local.monto" type="number" label="Monto" prefix="Bs " outlined dense />
          <q-input class="col" v-model.number="local.descuento" type="number" label="Descuento" prefix="Bs " outlined
            dense />
        </div>

        <q-input v-model="local.fecha" label="Fecha" outlined dense readonly>
          <template v-slot:append>
            <q-popup-proxy transition-show="scale" transition-hide="scale">
              <q-date v-model="local.fecha" mask="YYYY-MM-DD" />
            </q-popup-proxy>
          </template>
        </q-input>

        <q-file v-model="comprobanteFile" accept="image/*" label="Comprobante (imagen)" filled />

        <q-select v-model="local.id_persona" :options="personOptions" option-label="displayName" option-value="id"
          label="Persona" use-input input-debounce="200" emit-value map-options outlined dense @filter="filterPerson" />

        <q-select v-model="local.id_categoria" :options="categoriaOptions" option-value="id" option-label="nombre"
          label="Categoría" outlined dense />

        <q-select v-model="local.id_metodo" :options="metodoOptions" option-value="id" option-label="nombre"
          label="Método de pago" outlined dense />

        <q-input v-model="local.usuario_cobrador" label="Usuario cobrador" outlined dense disabled />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn color="primary" label="Guardar" @click="handleSave" :disable="!canSave" />
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
  pago: { type: Object, default: null } // si viene para editar
})
const emit = defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()

const show = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const isEdit = computed(() => !!props.pago)

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
  usuario_cobrador: '',
  id_persona: null,
  descuento: 0,
  id_metodo: null,
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
    local.usuario_cobrador = p.usuario_cobrador || getCurrentUserName()
    local.id_persona = p.id_persona ?? (p.persona ? p.persona.id : (p.inscripcion && p.inscripcion.persona ? p.inscripcion.persona.id : null))
    local.descuento = p.descuento ?? 0
    local.id_metodo = p.id_metodo ?? (p.metodo ? p.metodo.id : null)
    local.estado = p.estado ?? 1
  } else {
    resetLocal()
  }
}, { immediate: true })

function getCurrentUserName() {
  try {
    const raw = sessionStorage.getItem('user')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.usuario || parsed?.username || ''
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
  local.usuario_cobrador = getCurrentUserName()
  local.id_persona = null
  local.descuento = 0
  local.id_metodo = null
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
  if (!local.id_categoria) return false
  if (!local.id_persona) return false
  if (!local.id_metodo) return false
  return true
})

const handleSave = async () => {
  if (!canSave.value) { $q.notify({ type: 'negative', message: 'Complete los campos requeridos' }); return }
  // Armar objeto pago y FormData
  const pagoObj = {
    id: local.id,
    comprobante: local.comprobante,
    detalle: local.detalle,
    fecha: local.fecha,
    id_inscripcion: local.id_inscripcion,
    monto: local.monto,
    id_categoria: local.id_categoria,
    usuario_cobrador: local.usuario_cobrador,
    id_persona: local.id_persona,
    descuento: local.descuento,
    id_metodo: local.id_metodo,
    estado: local.estado
  }
  console.log('pago antes de crear: ', pagoObj);

  const fd = new FormData()
  fd.append('pagoObj', JSON.stringify(pagoObj))
  if (comprobanteFile.value) fd.append('comprobante', comprobanteFile.value)

  try {
    await agregarPago(fd)
    emit('saved')
    show.value = false
    resetLocal()
  } catch (e) {
    console.error('Error guardando pago', e)
  }
}

watch(() => show.value, (v) => { if (v) loadLists() })

const close = () => { show.value = false }

</script>

<style scoped>
.q-file {
  max-width: 100%
}
</style>
