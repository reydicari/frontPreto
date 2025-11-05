<template>
  <q-dialog v-model="show" persistent>
    <q-card class="q-pa-md" style="min-width:480px; max-width:900px">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <template v-if="personaLocked">
              <div class="text-subtitle2">{{ personaName }}</div>
            </template>
            <template v-else>
              <q-select v-model="selectedPersona" :options="personasLocal" option-value="id" option-label="nombre"
                label="Soy" outlined dense emit-value map-options />
            </template>
          </div>

          <div class="col-12 col-md-6">
            <template v-if="multipleEntrenamientos">
              <q-select v-model="selectedEntrenamiento" :options="entrenamientosLocal" option-value="id"
                option-label="nombre" label="Entrenamiento" outlined dense emit-value map-options />
            </template>
            <template v-else>
              <div class="text-subtitle2">{{ entrenamientosLocal[0]?.nombre || 'Entrenamiento' }}</div>
            </template>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-if="!selectedPersona || !selectedEntrenamiento" class="text-caption text-grey">
          Selecciona tu persona y el entrenamiento para poder evaluar.
        </div>

        <div v-else>
          <div v-if="!cualidadesLocal || !cualidadesLocal.length" class="text-caption text-grey">
            No hay cualidades disponibles para evaluar.
          </div>

          <div v-for="c in cualidadesLocal" :key="c.id" class="q-mb-md evaluar-item">
            <div class="row items-center justify-between q-mb-sm">
              <div class="col">
                <div class="text-subtitle2">{{ c.nombre }}</div>
              </div>
              <div class="col-auto">
                <q-rating v-model="responses[c.id].valor" max="5" color="amber" size="20" no-reset />
              </div>
            </div>

            <q-input v-model="responses[c.id].comentario" type="textarea" rows="2" outlined dense
              placeholder="Comentario (opcional)" />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" color="primary" @click="handleCancel" />
        <q-btn :disable="!canSubmit" label="Enviar evaluación" color="primary" @click="handleSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'

// Datos de prueba para visualización si no se pasan props
const SAMPLE_PERSONAS = [
  { id: 1, nombre: 'Juan Pérez' },
  { id: 2, nombre: 'María Gómez' }
]

const SAMPLE_ENTRENAMIENTOS = [
  { id: 1, nombre: 'Entrenamiento A', fecha: new Date().toISOString() },
  { id: 2, nombre: 'Entrenamiento B', fecha: new Date().toISOString() }
]

const SAMPLE_CUALIDADES = [
  { id: 1, nombre: 'Técnica' },
  { id: 2, nombre: 'Actitud' },
  { id: 3, nombre: 'Puntualidad' }
]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  personas: { type: Array, default: () => [] },
  entrenamientos: { type: Array, default: () => [] },
  cualidades: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// v-model wrapper
const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// Local fallbacks para ver datos de prueba si no se pasan
const personasLocal = computed(() => (props.personas && props.personas.length) ? props.personas : SAMPLE_PERSONAS)
const entrenamientosLocal = computed(() => (props.entrenamientos && props.entrenamientos.length) ? props.entrenamientos : SAMPLE_ENTRENAMIENTOS)
const cualidadesLocal = computed(() => (props.cualidades && props.cualidades.length) ? props.cualidades : SAMPLE_CUALIDADES)

const selectedPersona = ref(null)
const personaLocked = ref(false)
const personaFromSession = ref(null)

const personaName = computed(() => {
  // Primero usa el objeto guardado en session, si existe
  if (personaFromSession.value) {
    if (typeof personaFromSession.value === 'object') return personaFromSession.value.nombre || personaFromSession.value.name || String(personaFromSession.value.id || '')
    return String(personaFromSession.value)
  }
  // Si no, intentar buscar en la lista local
  const p = (personasLocal.value || []).find(x => String(x.id) === String(selectedPersona.value))
  return p ? (p.nombre || p.name) : ''
})
const selectedEntrenamiento = ref(null)

// respuestas por id de cualidad: { valor: number, comentario: string }
const responses = reactive({})

// Inicializar responses cuando cambian las cualidades locales
const initResponses = () => {
  (cualidadesLocal.value || []).forEach(c => {
    if (!responses[c.id]) {
      responses[c.id] = { valor: 0, comentario: '' }
    }
  })
}

watch(cualidadesLocal, initResponses, { immediate: true })

const canSubmit = computed(() => {
  if (!selectedPersona.value || !selectedEntrenamiento.value) return false
  // Al menos una cualidad con valor > 0
  return (cualidadesLocal.value || []).some(c => (responses[c.id] && responses[c.id].valor > 0))
})

// Si sólo hay un entrenamiento, no permitir selección y preseleccionarlo al abrir
const multipleEntrenamientos = computed(() => (entrenamientosLocal.value || []).length > 1)

watch(() => show.value, (val) => {
  if (val) {
    // abrir: preseleccionar entrenamiento si hay exactamente uno
    const et = entrenamientosLocal.value || []
    if (et.length === 1) {
      selectedEntrenamiento.value = et[0].id
    }
    // intentar preseleccionar persona desde localStorage (usuario autenticado)
    try {
      const raw = sessionStorage.getItem('user')
      if (raw) {
        const parsed = JSON.parse(raw)
        const personaObj = parsed?.persona
        const personaId = personaObj?.id ?? personaObj
        if (personaId !== undefined && personaId !== null) {
          selectedPersona.value = personaId
          personaLocked.value = true
          personaFromSession.value = personaObj
        } else {
          selectedPersona.value = null
          personaLocked.value = false
          personaFromSession.value = null
        }
      } else {
        selectedPersona.value = null
        personaLocked.value = false
        personaFromSession.value = null
      }
    } catch {
      // si falla parseo, no bloquear
      selectedPersona.value = null
      personaLocked.value = false
      personaFromSession.value = null
    }
    // initialize responses (in case cualidades changed)
    ; (cualidadesLocal.value || []).forEach(c => {
      if (!responses[c.id]) responses[c.id] = { valor: 0, comentario: '' }
    })
  }
})

const handleSubmit = () => {
  const now = new Date().toISOString()
  const evaluaciones = (cualidadesLocal.value || []).map(c => ({
    id: null,
    id_persona: selectedPersona.value,
    id_entrenamiento: selectedEntrenamiento.value,
    id_cualidad: c.id,
    valor: responses[c.id]?.valor || 0,
    comentario: responses[c.id]?.comentario || '',
    fecha: now
  }))
  console.log(evaluaciones);

  emit('save', { evaluaciones })
  show.value = false
}

const handleCancel = () => {
  emit('cancel')
  show.value = false
}
</script>

<style scoped>
.evaluar-item {
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 8px;
  border-radius: 6px;
}

@media (hover: hover) {
  .evaluar-item:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
  }
}
</style>
