<template>
  <q-card style="width: min(920px, 96vw); max-width: 920px;" class="borradores-dialog">
    <q-card-section class="bg-gradient-teal text-white q-pa-md">
      <div class="row items-center q-gutter-sm">
        <q-icon name="groups" size="36px" />
        <div class="col">
          <div class="text-h5 text-weight-medium">Gestionar Equipos</div>
          <div class="text-body2 q-mt-xs" style="opacity: 0.9;">Administre los equipos participantes del torneo</div>
        </div>
        <q-btn flat round dense icon="close" color="white" @click="onCancel" />
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-lg">
      <div v-if="loading" class="row items-center justify-center q-pa-xl">
        <div class="column items-center q-gutter-md">
          <q-spinner-dots size="48px" color="green-7" />
          <div class="text-body2 text-grey-7">Cargando equipos...</div>
        </div>
      </div>

      <div v-else>
        <div class="cards-grid q-mb-md">


          <div v-if="originals.length === 0" class="empty-caption text-center q-pa-md">
            <q-icon name="info" size="24px" color="grey-6" />
            <div class="text-body2 text-grey-7 q-mt-sm">No hay equipos existentes</div>
          </div>

          <div v-for="(item, idx) in originals" :key="`orig-${item.id}`" class="team-grid-item">
            <q-card flat bordered :class="[{ 'border-glow': item._highlight }, 'team-card']">
              <q-card-section class="q-pa-sm">
                <div class="row items-center">
                  <q-avatar color="green-7" text-color="white" size="32px" class="q-mr-sm">
                    <q-icon name="military_tech" size="18px" />
                  </q-avatar>
                  <div class="col">
                    <div class="text-subtitle2 text-weight-medium">{{ item.nombre }}</div>
                    <div class="text-caption text-grey-7">Equipo #{{ idx + 1 }}</div>
                  </div>
                  <div>
                    <q-btn dense round flat color="deep-orange-6" icon="remove_circle" @click="removeOriginal(item)"
                      size="sm">
                      <q-tooltip>Quitar del torneo</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-separator />

        <div class="q-mt-lg">
          <div class="row items-center q-mb-md">
            <q-icon name="add_circle" color="green-7" size="24px" class="q-mr-sm" />
            <div class="text-h6 text-weight-medium">Agregar Nuevos Equipos</div>
          </div>
          <q-banner rounded class="bg-blue-1 text-blue-9 q-mb-md">
            <template v-slot:avatar>
              <q-icon name="info" color="blue" />
            </template>
            <div class="text-body2">
              Complete el nombre del equipo. Al terminar uno se genera automáticamente otro campo vacío.
            </div>
          </q-banner>
          <div v-if="torneoData && Number(torneoData.estado) === 2" class="q-mb-md">
            <q-banner rounded class="bg-orange-1 text-orange-9">
              <template v-slot:avatar>
                <q-icon name="warning" color="orange" />
              </template>
              <div class="text-body2 text-weight-medium">
                No se pueden agregar equipos: el torneo ya fue iniciado.
              </div>
            </q-banner>
          </div>

          <div class="cards-grid">
            <div v-for="(card, idx) in newCards" :key="card._tempId" class="team-grid-item">
              <q-card bordered class="new-team-card">
                <q-card-section class="q-pa-sm">
                  <div class="row items-center q-gutter-sm">
                    <q-avatar v-if="!card.registered" color="grey-4" text-color="grey-7" size="32px">
                      <q-icon name="sports" size="18px" />
                    </q-avatar>
                    <q-avatar v-else :color="card.registeredType === 'nuevo' ? 'green-7' : 'grey'" text-color="white"
                      size="32px">
                      <q-icon name="check" size="18px" />
                    </q-avatar>
                    <div class="col">
                      <q-input dense outlined v-model="card.nombre" placeholder="Nombre del equipo"
                        @input="onNewInput(idx)" @keyup.enter="onEnter(idx)" :ref="el => setInputRef(el, idx)"
                        :readonly="card.registered || (torneoData && Number(torneoData.estado) === 2)" color="green-8"
                        class="text-body2" />
                    </div>
                    <div class="row items-center no-wrap" style="gap:4px;">
                      <q-btn v-if="!card.registered && !(torneoData && Number(torneoData.estado) === 2)" dense round
                        flat color="green-7" icon="cloud_upload" @click="registerNew(idx)" size="sm">
                        <q-tooltip>Registrar equipo</q-tooltip>
                      </q-btn>
                      <q-btn dense round flat color="deep-orange-6" icon="close" @click="removeNew(idx)" size="sm">
                        <q-tooltip>Quitar</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                  <div v-if="card.registered" class="row items-center q-gutter-xs q-mt-xs q-ml-sm">
                    <q-badge :color="card.registeredType === 'nuevo' ? 'green-7' : 'grey'"
                      :label="card.registeredType === 'nuevo' ? 'Nuevo registro' : 'Existente'" />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <q-separator class="q-mt-lg" />

        <div class="row items-center justify-end q-gutter-sm q-mt-md">
          <q-btn v-if="!isTorneoFinished" flat label="Asignar Encargados" icon="people" color="grey-7"
            @click="showAssignDialog = true" class="text-body2" />
          <q-btn flat label="Cancelar" icon="close" color="grey-7" @click="onCancel" class="text-body2" />
          <q-btn v-if="torneoData && Number(torneoData.estado) === 2" unelevated label="Seguir Torneo" icon="visibility"
            color="green-7" @click="showSeguimiento = true" class="text-body2" />
          <q-btn v-else-if="!isTorneoFinished" unelevated label="Comenzar" icon="flag" color="deep-orange-6"
            @click="openStartFlow" class="text-body2" />
          <q-btn v-if="!isTorneoFinished" unelevated label="Guardar Equipos" icon="save" color="green-7" @click="onSave"
            class="text-body2" />
        </div>
      </div>
    </q-card-section>
  </q-card>

  <!-- Diálogo de aviso: la fecha de inicio aún no llega -->
  <q-dialog v-model="showDateWarning" :maximized="$q.screen.lt.md">
    <q-card class="warning-dialog" style="min-width: 320px;">
      <q-card-section class="bg-orange-7 text-white q-pa-md">
        <div class="row items-center q-gutter-sm">
          <q-icon name="warning" size="32px" />
          <div class="text-h6 text-weight-medium">Fecha de Inicio No Permitida</div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-lg">
        <p class="text-body1">La fecha de inicio del torneo es futura. No es posible comenzar el torneo antes de la
          fecha
          de inicio.</p>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn unelevated label="Entendido" icon="check" color="orange" @click="showDateWarning = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Componente externo que organiza partidos (abre cuando se inicia el torneo) -->
  <OrganizeMatchesDialog v-model="showOrganizeDialog" :torneoId="props.torneoId"
    @generatedMatches="handleGeneratedMatches" @started="handleOrganizeStarted" />

  <!-- Diálogo de seguimiento específico del torneo (lista de partidos) -->
  <SeguimientoTorneoDialog v-model="showSeguimiento" :torneo-id="props.torneoId" />

  <AsignarEncargadoDialog v-model="showAssignDialog" :torneo="torneoData" :torneo-id="props.torneoId"
    @assigned="handleAssignedEncargados" />

  <!-- Diálogo para confirmar/comenzar el torneo y mostrar resultado -->
  <q-dialog v-model="showStartDialog" :maximized="$q.screen.lt.md">
    <q-card style="min-width: 320px;" class="start-dialog">
      <q-card-section class="bg-gradient-green text-white q-pa-md">
        <div class="row items-center q-gutter-sm">
          <q-icon name="flag" size="32px" />
          <div class="text-h6 text-weight-medium">Comenzar Torneo</div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-lg">
        <p class="text-body1">{{ startResponseMessage || '¿Desea comenzar el torneo ahora?' }}</p>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" icon="close" color="grey-7" @click="closeStartDialog" />
        <q-btn v-if="!startResponseMessage" unelevated label="Confirmar" icon="check_circle" color="green-7"
          @click="confirmarComenzar" />
        <q-btn v-else unelevated label="Aceptar" icon="check" color="green-7" @click="closeStartDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { listarBorradores, listarEquipos } from 'src/stores/borrador-store'
import { obtenerTorneo, comenzarTorneo } from 'src/stores/torneo-store'
import OrganizeMatchesDialog from './OrganizeMatchesDialog.vue'
import SeguimientoTorneoDialog from './SeguimientoTorneoDialog.vue'
import AsignarEncargadoDialog from './AsignarEncargadoDialog.vue'
import { agregarEncargadoTorneo } from 'src/stores/partido-store'
import { Notify } from 'quasar'

// helper to compute totals and limits
function computeOriginalsBefore(originals, desechados) {
  return (originals?.length || 0) + (desechados?.length || 0)
}

function computeCurrentFinal(originals, desechados, nuevos, existentes) {
  const originalsBefore = computeOriginalsBefore(originals, desechados)
  return originalsBefore + (nuevos?.length || 0) + (existentes?.length || 0) - (desechados?.length || 0)
}

const props = defineProps({ torneoId: { type: [Number, String], required: true } })
const emit = defineEmits(['save', 'cancel', 'generatedMatches', 'started'])


const torneoData = ref(null)
const showStartDialog = ref(false)
const startResponseMessage = ref('')
const showDateWarning = ref(false)
const showOrganizeDialog = ref(false)
const showSeguimiento = ref(false)
const showAssignDialog = ref(false)
const assignedEncargados = ref(null)

// Computed para verificar si el torneo ha vencido (fecha_fin < hoy)
const isTorneoFinished = computed(() => {
  if (!torneoData.value || !torneoData.value.fecha_fin) return false
  const fechaFin = new Date(torneoData.value.fecha_fin)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return fechaFin < hoy
})

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

    // cargar lista principal de equipos para detectar existentes
    try {
      const eq = await listarEquipos().catch(() => [])
      equiposList.value = Array.isArray(eq) ? eq : (eq?.data || [])
    } catch (e) {
      console.warn('No se pudieron cargar equipos principales', e)
    }

  } catch (err) {
    console.error('error cargando borradores', err)
    Notify.create({ type: 'negative', message: 'No se pudo cargar borradores' })
  } finally {
    loading.value = false
  }

  // cargar datos del torneo para validar fecha inicio
  try {
    const t = await obtenerTorneo(props.torneoId).catch(() => null)
    torneoData.value = t || null
  } catch (e) {
    console.warn('No se pudo obtener torneo', e)
    torneoData.value = null
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
  // Si el torneo ya fue iniciado, no permitir crear nuevas tarjetas
  if (torneoData.value && Number(torneoData.value.estado) === 2) return
  // si estamos en la última tarjeta y se escribió algo, agregar otra vacía
  if (idx === newCards.value.length - 1 && card.nombre && card.nombre.trim() !== '') {
    // comprobar si al añadir otra tarjeta se supera el máximo final (16)
    const nuevosNow = nuevosCollected.value.slice()
    const existentesNow = existente.value.slice()
    const desechadosNow = desechados.value.slice()
    const currentFinal = computeCurrentFinal(originals.value, desechadosNow, nuevosNow, existentesNow)
    // prospectivo al añadir una tarjeta extra (el usuario escribiría y la registraría)
    const prospectivo = currentFinal + 1
    if (prospectivo > 16) {
      Notify.create({ type: 'negative', message: 'No puede agregarse más: el total máximo permitido es 16 equipos' })
      return
    }
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

function openStartFlow() {
  // verificar que exista al menos un encargado asignado al torneo
  try {
    const encs = torneoData.value?.encargados || []
    console.log('encargados: ', torneoData.value);

    if (!Array.isArray(encs) || encs.length === 0) {
      Notify.create({ type: 'negative', message: 'Asigne al menos un encargado al torneo antes de comenzar' })
      return
    }
  } catch (e) {
    // continuar con validaciones normales si hay problemas leyendo encargados
    console.warn('No se pudo verificar encargados del torneo', e)
  }
  // validar fecha_inicio: no permitir comenzar si fecha_inicio > hoy
  const fi = torneoData.value?.fecha_inicio
  if (fi) {
    const inicio = new Date(fi)
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    if (inicio > hoy) {
      showDateWarning.value = true
      return
    }
  }
  // si hay cambios sin guardar en la lista (nuevos, existentes o desechados), pedir guardar antes de comenzar
  if ((nuevosCollected.value && nuevosCollected.value.length > 0) || (existente.value && existente.value.length > 0) || (desechados.value && desechados.value.length > 0)) {
    Notify.create({ type: 'warning', message: 'Guarde la configuracion de la lista para poder comenzar' })
    return
  }
  // abrir diálogo de confirmación
  startResponseMessage.value = ''
  showStartDialog.value = true
}

async function confirmarComenzar() {
  if (!props.torneoId) return
  // llamar al store comenzarTorneo
  const data = await comenzarTorneo(props.torneoId)
  // mostrar mensaje si viene
  const msg = data?.mensaje ?? null
  if (msg) {
    startResponseMessage.value = msg
    // dejar dialog abierto para que el usuario lo lea
  } else {
    // No hay mensaje: abrir el diálogo de organización externo
    showStartDialog.value = false
    showOrganizeDialog.value = true
  }
}

// Nota: la organización visual se delega ahora a OrganizeMatchesDialog.vue

function handleGeneratedMatches(payload) {
  // reenviar al padre para que lo persista o lo maneje quien corresponda
  emit('generatedMatches', payload)
  Notify.create({ type: 'positive', message: 'Partidos generados listos' })
  showOrganizeDialog.value = false
}

function handleOrganizeStarted(evt) {
  // El OrganizeMatchesDialog confirmó que el torneo fue iniciado en backend.
  // Cerramos el diálogo de organización (por si aún está abierto) y reenviamos al padre.
  showOrganizeDialog.value = false
  emit('started', evt)
}
// handler when AsignarEncargadoDialog emits assigned
function handleAssignedEncargados(payload) {
  assignedEncargados.value = Array.isArray(payload) ? payload : []
  Notify.create({ type: 'info', message: `Seleccionados ${assignedEncargados.value.length} encargado(s)` })
}
function closeStartDialog() {
  showStartDialog.value = false
  startResponseMessage.value = ''
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
  // Si el torneo ya fue iniciado, impedir registro de nuevos equipos
  if (torneoData.value && Number(torneoData.value.estado) === 2) {
    Notify.create({ type: 'negative', message: 'No se pueden agregar equipos: el torneo ya fue iniciado' })
    return
  }
  const card = newCards.value[idx]
  if (!card) return
  if (!card.nombre || !card.nombre.trim()) {
    Notify.create({ type: 'warning', message: 'Ingrese un nombre válido antes de registrar' })
    return
  }
  // antes de registrar, comprobar que no excedamos 16 equipos
  const nuevosNow = nuevosCollected.value.slice()
  const existentesNow = existente.value.slice()
  const desechadosNow = desechados.value.slice()
  const currentFinal = computeCurrentFinal(originals.value, desechadosNow, nuevosNow, existentesNow)
  if (currentFinal + 1 > 16) {
    Notify.create({ type: 'negative', message: 'No puede registrarse este equipo: el total final superaría 16 equipos' })
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
  // crear una nueva tarjeta vacía y enfocar (siempre que no se supere el límite)
  const nuevosAfter = nuevosCollected.value.slice()
  const existentesAfter = existente.value.slice()
  const desechadosAfter = desechados.value.slice()
  const finalAfter = computeCurrentFinal(originals.value, desechadosAfter, nuevosAfter, existentesAfter)
  if (finalAfter < 16) {
    newCards.value.push(makeNewCard())
    await nextTick()
    const nextInput = inputRefs.value[inputRefs.value.length - 1]
    if (nextInput && nextInput.focus) nextInput.focus()
  }
}

async function onSave() {
  // tomar los nuevos que el usuario "registró" explícitamente (nuevosCollected)
  const nuevos = nuevosCollected.value.slice()
  const existentesCopy = existente.value.slice()
  const desechadosCopy = desechados.value.slice()

  // calcular total final esperado:
  // consideramos el estado inicial de originals antes de eliminar (originals + desechados)
  const originalsBefore = (originals.value?.length || 0) + (desechadosCopy.length || 0)
  // según la fórmula solicitada: originals_before + nuevos + existentes - desechados
  const totalFinal = originalsBefore + nuevos.length + existentesCopy.length - desechadosCopy.length

  if (totalFinal > 16) {
    Notify.create({ type: 'negative', message: `No se puede guardar: el total final de equipos sería ${totalFinal} (máximo 16). Desglosado: originales=${originalsBefore}, nuevos=${nuevos.length}, existentes=${existentesCopy.length}, desechados=${desechadosCopy.length}` })
    return
  }

  // emitir el payload principal (guardar borradores/equipos)
  emit('save', { torneoId: props.torneoId, nuevos, existentes: existentesCopy, desechados: desechadosCopy })
  console.log('DESPUES DE EMIT');
  nuevosCollected.value = []
  existente.value = []
  desechados.value = []

  // Si se asignaron encargados desde el diálogo y hay cambios, llamar al store
  try {
    if (Array.isArray(assignedEncargados.value)) {
      // comparar con los encargados actuales del torneo (torneoData.value.encargados puede tener estructura diversa)
      const current = (torneoData.value && Array.isArray(torneoData.value.encargados)) ? torneoData.value.encargados.map(e => (e.persona && e.persona.id) || e.id_persona || e.id) : []
      const assignedIds = assignedEncargados.value.map(a => a.id_persona || a.id_persona)
      const same = assignedIds.length === current.length && assignedIds.every(id => current.includes(id))
      if (!same && props.torneoId) {
        // construir payload [{id_torneo,id_persona}]
        const payload = assignedEncargados.value.map(a => ({ id_torneo: props.torneoId, id_persona: a.id_persona || a.id }))
        if (payload.length) {
          await agregarEncargadoTorneo(payload)
        }
      }
    }
  } catch (e) {
    console.warn('Error agregando encargados:', e)
  }
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.borradores-dialog .q-card {
  overflow: visible;
  border-radius: 12px;
}

.bg-gradient-teal {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%);
}

.bg-gradient-green {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%);
}

.team-card {
  transition: all 0.3s ease;
  background: linear-gradient(to right, #f1f8e9 0%, #ffffff 100%);
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
}

.new-team-card {
  transition: all 0.3s ease;
  background: #ffffff;
}

.new-team-card:hover {
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.1);
}

/* Resalte temporal para un equipo que ya existe en los borradores */
.border-glow {
  box-shadow: 0 0 0 6px rgba(46, 125, 50, 0.16);
  border: 2px solid rgba(67, 160, 71, 0.8);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {

  0%,
  100% {
    box-shadow: 0 0 0 6px rgba(0, 150, 136, 0.16);
  }

  50% {
    box-shadow: 0 0 0 8px rgba(0, 150, 136, 0.24);
  }
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.team-grid-item {
  width: 100%;
}

.empty-caption {
  grid-column: 1 / -1;
  color: var(--q-color-grey-6);
  padding: 16px;
}

.warning-dialog .q-card,
.start-dialog .q-card {
  border-radius: 12px;
}

/* Responsive: 2 columns on medium screens, 1 on small */
@media (max-width: 900px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .borradores-dialog .q-card {
    border-radius: 8px;
  }
}

@media (max-width: 600px) {
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .borradores-dialog .q-card,
  .warning-dialog .q-card,
  .start-dialog .q-card {
    border-radius: 0;
  }
}
</style>
