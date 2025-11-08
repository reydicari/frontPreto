<template>
  <q-card style="min-width:420px; max-width:900px;">
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
        <div class="row q-gutter-sm q-mb-md">


          <div v-if="originals.length === 0" class="col-12 text-caption q-pa-sm">No hay borradores existentes.</div>

          <div v-for="item in originals" :key="`orig-${item.id}`" class="col-xs-12 col-sm-6 col-md-4">
            <q-card flat bordered class="bg-grey-1 q-pa-sm">
              <div class="row items-center">
                <div class="col">
                  <div class="text-subtitle2">{{ item.nombre }}</div>
                  <div class="text-caption">ID: {{ item.id }}</div>
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

        <div class="row q-mt-md q-gutter-sm">
          <div class="col-12">
            <div class="text-subtitle1 q-mb-sm">Agregar nuevos equipos</div>
            <div class="text-caption q-mb-sm">Complete el nombre del equipo. Cuando termine uno se genera
              automáticamente otro campo vacío.</div>
          </div>

          <div v-for="(card, idx) in newCards" :key="card._tempId" class="col-12 col-sm-6 col-md-4">
            <q-card class="q-pa-sm">
              <div class="row items-center">
                <div class="col">
                  <q-input dense v-model="card.nombre" placeholder="Nombre del equipo" @input="onNewInput(idx)"
                    :ref="el => setInputRef(el, idx)" :readonly="card.registered" />
                </div>
                <div class="row items-center">
                  <q-btn v-if="!card.registered" dense round flat color="positive" icon="cloud_upload"
                    @click="registerNew(idx)" title="Registrar equipo" />
                  <q-btn v-if="!card.registered" dense round flat color="negative" icon="close" @click="removeNew(idx)"
                    title="Quitar" />
                  <q-badge v-if="card.registered" color="positive" icon="check" />
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
import { listarBorradores } from 'src/stores/borrador-store'
import { Notify } from 'quasar'

const props = defineProps({ torneoId: { type: [Number, String], required: true } })
const emit = defineEmits(['save', 'cancel'])

const loading = ref(false)
const originals = ref([]) // borradores que vienen del backend
const desechados = ref([]) // los borrados desde originals
const newCards = ref([]) // tarjetas temporales para nuevos equipos
const nuevosCollected = ref([]) // equipos que el usuario "registra" explícitamente (solo los confirmados)
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

function removeNew(idx) {
  const card = newCards.value[idx]
  if (!card) return
  // if card was registered, remove from nuevosCollected as well
  if (card.registered) {
    const nidx = nuevosCollected.value.findIndex(n => n.nombre === card.nombre)
    if (nidx !== -1) nuevosCollected.value.splice(nidx, 1)
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
  // agregar a nuevosCollected
  nuevosCollected.value.push({ nombre: card.nombre.trim() })
  // marcar la card como registrada y dejarla readonly
  card.registered = true
  // crear una nueva tarjeta vacía y enfocar
  newCards.value.push(makeNewCard())
  await nextTick()
  const nextInput = inputRefs.value[inputRefs.value.length - 1]
  if (nextInput && nextInput.focus) nextInput.focus()
}

function onSave() {
  // solo tomar los nuevos que el usuario "registró" explícitamente (nuevosCollected)
  const nuevos = nuevosCollected.value.slice()
  const desechadosCopy = desechados.value.slice()
  // mostrar en consola y emitir
  console.log('Borradores - nuevos:', nuevos)
  console.log('Borradores - desechados:', desechadosCopy)
  Notify.create({ type: 'positive', message: `Se procesaron ${nuevos.length} nuevos y ${desechadosCopy.length} eliminados` })
  emit('save', { nuevos, desechados: desechadosCopy })
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.q-card {
  overflow: visible
}
</style>
