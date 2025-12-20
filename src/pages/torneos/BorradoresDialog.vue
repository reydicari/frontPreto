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
        <div class="cards-grid q-mb-md">


          <div v-if="originals.length === 0" class="empty-caption">No hay borradores existentes.</div>

          <div v-for="(item, idx) in originals" :key="`orig-${item.id}`" class="team-grid-item">
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

        <div class="cards-grid q-mt-md">
          <div class="col-12">
            <div class="text-subtitle1 q-mb-sm">Agregar nuevos equipos</div>
            <div class="text-caption q-mb-sm">Complete el nombre del equipo. Cuando termine uno se genera
              automáticamente otro campo vacío.</div>
            <div v-if="torneoData && Number(torneoData.estado) === 2" class="q-mt-sm text-negative">
              No se pueden agregar equipos: el torneo ya fue iniciado.
            </div>
          </div>

          <div v-for="(card, idx) in newCards" :key="card._tempId" class="team-grid-item">
            <q-card class="q-pa-xs">
              <div class="row items-center">
                <div class="col">
                  <q-input dense v-model="card.nombre" placeholder="Nombre del equipo" @input="onNewInput(idx)"
                    @keyup.enter="onEnter(idx)" :ref="el => setInputRef(el, idx)"
                    :readonly="card.registered || (torneoData && Number(torneoData.estado) === 2)" />
                </div>
                <div class="row items-center" style="gap:8px;">
                  <q-btn v-if="!card.registered && !(torneoData && Number(torneoData.estado) === 2)" dense round flat
                    color="positive" icon="cloud_upload" @click="registerNew(idx)" title="Registrar equipo" />
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
          <q-btn v-if="!isTorneoFinished" flat label="Asignar encargados" color="secondary"
            @click="showAssignDialog = true" />
          <q-btn flat label="Cancelar" color="secondary" @click="onCancel" />
          <q-btn v-if="torneoData && Number(torneoData.estado) === 2" flat label="Seguir torneo" color="primary"
            @click="showSeguimiento = true" />
          <q-btn v-else-if="!isTorneoFinished" flat label="Comenzar" color="accent" @click="openStartFlow" />
          <q-btn v-if="!isTorneoFinished" label="Guardar equipos" color="primary" @click="onSave" />
        </div>
      </div>
    </q-card-section>
  </q-card>

  <!-- Diálogo de aviso: la fecha de inicio aún no llega -->
  <q-dialog v-model="showDateWarning">
    <q-card>
      <q-card-section>
        <div class="text-h6">Fecha de inicio no permitida</div>
        <div class="q-mt-sm">La fecha de inicio del torneo es futura. No es posible comenzar el torneo antes de la fecha
          de inicio.</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="primary" @click="showDateWarning = false" />
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
  <q-dialog v-model="showStartDialog">
    <q-card style="min-width: 320px;">
      <q-card-section>
        <div class="text-h6">Comenzar torneo</div>
        <div class="q-mt-sm">{{ startResponseMessage || '¿Desea comenzar el torneo ahora?' }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancelar" color="secondary" @click="closeStartDialog" />
        <q-btn v-if="!startResponseMessage" color="primary" label="Confirmar" @click="confirmarComenzar" />
        <q-btn v-else flat label="Aceptar" color="primary" @click="closeStartDialog" />
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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.team-grid-item {
  width: 100%;
}

.empty-caption {
  grid-column: 1 / -1;
  color: var(--q-color-grey-6);
  padding: 8px;
}

/* Responsive: 2 columns on small screens, 1 on extra small */
@media (max-width: 900px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .cards-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
