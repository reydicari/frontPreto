<template>
  <q-card style="width: min(920px, 96vw); max-width: 920px;">
    <q-card-section class="row items-center">
      <div>
        <div class="text-h6">Equipos en torneo </div>
      </div>
      <q-space />
      <q-btn dense flat icon="close" @click="onCancel" />
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div v-if="loading" class="row items-center justify-center q-pa-md">
        <q-spinner-dots size="32px" />
      </div>

      <div v-else>
        <div class="row q-gutter-xs q-mb-md">


          <div v-if="originals.length === 0" class="col-12 text-caption q-pa-sm">No hay borradores existentes.</div>

          <div v-for="(item, idx) in originals" :key="`orig-${item.id}`" class="col-xs-12 col-sm-6 col-md-4">
            <q-card flat bordered :class="[{ 'border-glow': item._highlight }, 'bg-grey-1', 'q-pa-xs']">
              <div class="row items-center">
                <div class="col">
                  <div class="text-subtitle2">{{ item.nombre }}</div>
                  <div class="text-caption">Nro: {{ idx + 1 }}</div>
                </div>
                <div>
                  <q-btn dense round flat color="negative" icon="remove_circle" @click="removeOriginal(item)"
                    title="Quitar del borrador" />
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <q-separator />

        <div class="row q-mt-md q-gutter-xs">
          <div class="col-12">
            <div class="text-subtitle1 q-mb-sm">Agregar nuevos equipos</div>
            <div class="text-caption q-mb-sm">Complete el nombre del equipo. Cuando termine uno se genera
              automáticamente otro campo vacío.</div>
          </div>

          <div v-for="(card, idx) in newCards" :key="card._tempId" class="col-12 col-sm-6 col-md-4">
            <q-card class="q-pa-xs">
              <div class="row items-center">
                <div class="col">
                  <q-input dense v-model="card.nombre" placeholder="Nombre del equipo" @input="onNewInput(idx)"
                    @keyup.enter="onEnter(idx)" :ref="el => setInputRef(el, idx)" :readonly="card.registered" />
                </div>
                <div class="row items-center" style="gap:8px;">
                  <q-btn v-if="!card.registered" dense round flat color="positive" icon="cloud_upload"
                    @click="registerNew(idx)" title="Registrar equipo" />
                  <!-- permitir quitar cualquier tarjeta, registrada o no -->
                  <q-btn dense round flat color="negative" icon="close" @click="removeNew(idx)" title="Quitar" />
                  <div v-if="card.registered" class="row items-center" style="gap:8px;">
                    <q-badge color="positive" icon="check" />
                    <div v-if="card.registeredType === 'nuevo'" class="text-caption text-positive">nuevo registro</div>
                    <div v-else-if="card.registeredType === 'existente'" class="text-caption text-grey">existente</div>
                  </div>
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <q-separator class="q-mt-md" />

        <div class="row items-center justify-end q-gutter-sm q-mt-md">
          <q-btn flat label="Cancelar" color="secondary" @click="onCancel" />
          <q-btn label="Guardar equipos" color="primary" @click="onSave" />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { listarBorradores, listarEquipos } from 'src/stores/borrador-store'
import { Notify } from 'quasar'

const props = defineProps({ torneoId: { type: [Number, String], required: true } })
const emit = defineEmits(['save', 'cancel'])

const loading = ref(false)
const originals = ref([]) // borradores que vienen del backend
const desechados = ref([]) // los borrados desde originals
const newCards = ref([]) // tarjetas temporales para nuevos equipos
const nuevosCollected = ref([]) // equipos que el usuario "registra" explícitamente (solo los confirmados)
const existente = ref([]) // nuevos enviados que coinciden con la lista principal de equipos
const equiposList = ref([]) // lista principal de equipos obtenida del store
const inputRefs = ref([])

function setInputRef(el, idx) {
  if (!inputRefs.value) inputRefs.value = []
  inputRefs.value[idx] = el
}

let tempIdCounter = 1
function makeNewCard() { return { _tempId: `t${tempIdCounter++}`, nombre: '', registered: false } }

onMounted(async () => {
  loading.value = true
  try {
    const res = await listarBorradores(props.torneoId).catch(() => [])
    originals.value = Array.isArray(res) ? res : (res?.data || [])
    console.log('borradores: ', originals.value);

    // cargar lista principal de equipos para detectar existentes
    try {
      const eq = await listarEquipos().catch(() => [])
      equiposList.value = Array.isArray(eq) ? eq : (eq?.data || [])
      console.log('equipos principales:', equiposList.value)
    } catch (e) {
      console.warn('No se pudieron cargar equipos principales', e)
    }

  } catch (err) {
    console.error('error cargando borradores', err)
    Notify.create({ type: 'negative', message: 'No se pudo cargar borradores' })
  } finally {
    loading.value = false
  }

  // siempre comenzar con una tarjeta nueva vacía
  newCards.value = [makeNewCard()]
  // preparar refs array
  inputRefs.value = []
})

function removeOriginal(item) {
  const idx = originals.value.findIndex(o => o.id === item.id)
  if (idx !== -1) originals.value.splice(idx, 1)
  desechados.value.push(item)
}

function onNewInput(idx) {
  const card = newCards.value[idx]
  if (!card) return
  // si estamos en la última tarjeta y se escribió algo, agregar otra vacía
  if (idx === newCards.value.length - 1 && card.nombre && card.nombre.trim() !== '') {
    newCards.value.push(makeNewCard())
    // focus next after nextTick
    nextTick(() => {
      const nextInput = inputRefs.value[inputRefs.value.length - 1]
      if (nextInput && nextInput.focus) nextInput.focus()
    })
  }

}

function onEnter(idx) {
  const card = newCards.value[idx]
  if (!card) return
  // si ya está registrada no hacemos nada
  if (card.registered) return
  // delegar en la función existente que valida y registra
  registerNew(idx)
}

function removeNew(idx) {
  const card = newCards.value[idx]
  if (!card) return
  // if card was registered, remove from nuevosCollected or existente as well
  if (card.registered) {
    const nameKey = (card.nombre || '').trim().toLowerCase()
    // remover de nuevosCollected
    const nidx = nuevosCollected.value.findIndex(n => (n.nombre || '').trim().toLowerCase() === nameKey)
    if (nidx !== -1) nuevosCollected.value.splice(nidx, 1)
    // remover de existente
    const eidx = existente.value.findIndex(n => (n.nombre || '').trim().toLowerCase() === nameKey)
    if (eidx !== -1) existente.value.splice(eidx, 1)
  }
  newCards.value.splice(idx, 1)
  // remove associated input ref if exists
  if (inputRefs.value && inputRefs.value.length > idx) {
    inputRefs.value.splice(idx, 1)
  }
  // si al quitar queda ninguna tarjeta, añadir una vacía
  if (newCards.value.length === 0) newCards.value.push(makeNewCard())
}

async function registerNew(idx) {
  const card = newCards.value[idx]
  if (!card) return
  if (!card.nombre || !card.nombre.trim()) {
    Notify.create({ type: 'warning', message: 'Ingrese un nombre válido antes de registrar' })
    return
  }
  const name = card.nombre.trim()
  const lower = name.toLowerCase()

  // Si el nombre ya existe en los borradores originales, mostrar notificación y resaltar
  const origMatch = originals.value.find(o => (o.nombre || '').trim().toLowerCase() === lower)
  if (origMatch) {
    Notify.create({ duration: 3000, type: 'info', message: 'El equipo ya existe en los borradores del torneo' })
    // marcar temporalmente para que el usuario lo vea
    origMatch._highlight = true
    // quitar el highlight después de 3s
    setTimeout(() => { origMatch._highlight = false }, 3000)
    return
  }

  // revisar si existe en lista principal de equipos (comparación case-insensitive)
  const found = equiposList.value.find(e => (e.nombre || '').trim().toLowerCase() === lower)
  if (found) {
    // si ya está en 'existente' no lo duplicamos
    if (!existente.value.find(e => (e.nombre || '').trim().toLowerCase() === lower)) {
      existente.value.push({ id: found.id, nombre: found.nombre })
    }
    card.registered = true
    card.registeredType = 'existente'
  } else {
    // agregar a nuevosCollected (solo nuevos netos)
    if (!nuevosCollected.value.find(n => (n.nombre || '').trim().toLowerCase() === lower)) {
      nuevosCollected.value.push({ nombre: name })
    }
    card.registered = true
    card.registeredType = 'nuevo'
  }
  // crear una nueva tarjeta vacía y enfocar
  newCards.value.push(makeNewCard())
  await nextTick()
  const nextInput = inputRefs.value[inputRefs.value.length - 1]
  if (nextInput && nextInput.focus) nextInput.focus()
}

function onSave() {
  // tomar los nuevos que el usuario "registró" explícitamente (nuevosCollected)
  const nuevos = nuevosCollected.value.slice()
  const existentesCopy = existente.value.slice()
  const desechadosCopy = desechados.value.slice()
  emit('save', { torneoId: props.torneoId, nuevos, existentes: existentesCopy, desechados: desechadosCopy })
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.q-card {
  overflow: visible
}

/* Resalte temporal para un equipo que ya existe en los borradores */
.border-glow {
  /* Borde más grueso y sombra ligeramente mayor para visibilidad */
  box-shadow: 0 0 0 6px rgba(0, 150, 136, 0.16);
  border: 2px solid rgba(0, 150, 136, 0.8);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
</style>
