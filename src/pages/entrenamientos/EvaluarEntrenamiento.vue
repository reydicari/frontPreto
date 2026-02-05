<template>
  <q-dialog v-model="show" persistent>
    <q-card class="eval-card">
      <!-- Header mejorado con degradado verde -->
      <q-card-section class="eval-header">
        <div class="header-content">
          <div class="header-icon">
            <q-icon name="star" size="25px" />
          </div>
          <div class="header-titles">
            <div class="header-title">Evaluar Entrenamiento</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" class="close-btn" @click="handleCancel" />
      </q-card-section>

      <q-separator v-if="false" />

      <q-card-section v-if="false" class="selection-section">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="select-label">Evaluador</div>
            <template v-if="personaLocked">
              <div class="locked-value">{{ personaName }}</div>
            </template>
            <template v-else>
              <q-select v-model="selectedPersona" :options="personasLocal" option-value="id" option-label="nombre"
                label="Soy" outlined dense emit-value map-options class="custom-select" />
            </template>
          </div>

          <div class="col-12 col-md-6">
            <div class="select-label">Entrenamiento</div>
            <template v-if="multipleEntrenamientos">
              <q-select v-model="selectedEntrenamiento" :options="entrenamientosLocal" option-value="id"
                option-label="nombre" label="Entrenamiento" outlined dense emit-value map-options
                class="custom-select" />
            </template>
            <template v-else>
              <div class="locked-value">{{ entrenamientosLocal[0]?.nombre || 'Entrenamiento' }}</div>
            </template>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="cualidades-section">
        <div v-if="!cualidadesLocal || !cualidadesLocal.length" class="empty-state">
          <q-icon name="warning" size="48px" color="orange" />
          <div class="empty-text">No hay cualidades disponibles para evaluar</div>
        </div>

        <div v-else>
          <div v-for="c in cualidadesLocal" :key="c.id" class="cualidad-item">
            <div class="cualidad-header">
              <div class="cualidad-name">
                <q-icon name="grade" color="amber-8" class="q-mr-sm" />
                {{ c.nombre }}
              </div>
              <div class="cualidad-rating">
                <q-rating v-model="responses[c.id].valor" max="5" color="amber-7" size="28px" icon="star"
                  icon-selected="star" icon-half="star_half" />
              </div>
            </div>

            <q-input v-model="responses[c.id].comentario" type="textarea" rows="2" outlined dense
              placeholder="Comentario opcional sobre esta cualidad..." class="comentario-input" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="footer-actions">
        <q-btn flat label="Cancelar" color="brown-7" icon="close" @click="handleCancel" class="cancel-btn" />
        <q-btn unelevated :disable="!canSubmit" label="Enviar evaluación" color="green-7" icon="send"
          @click="handleSubmit" class="submit-btn" />
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
  // Verificar que haya persona y entrenamiento seleccionados
  if (!selectedPersona.value || !selectedEntrenamiento.value) return false

  // Al menos una cualidad con valor > 0
  return (cualidadesLocal.value || []).some(c => (responses[c.id] && responses[c.id].valor > 0))
})

// Si sólo hay un entrenamiento, no permitir selección y preseleccionarlo al abrir
const multipleEntrenamientos = computed(() => (entrenamientosLocal.value || []).length > 1)

watch(() => show.value, (val) => {
  if (val) {
    // Auto-seleccionar persona desde sessionStorage si no está seleccionada
    if (!selectedPersona.value) {
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
        selectedPersona.value = null
        personaLocked.value = false
        personaFromSession.value = null
      }
    }

    // Auto-seleccionar entrenamiento si hay exactamente uno
    const et = entrenamientosLocal.value || []
    if (et.length === 1 && !selectedEntrenamiento.value) {
      selectedEntrenamiento.value = et[0].id
    }

    // Initialize responses (in case cualidades changed)
    ; (cualidadesLocal.value || []).forEach(c => {
      if (!responses[c.id]) responses[c.id] = { valor: 0, comentario: '' }
    })
  }
})

const handleSubmit = () => {
  // Obtener fecha/hora actual en Bolivia (UTC-4)
  const ahora = new Date()
  const offsetBolivia = -4 * 60 // Bolivia: UTC-4 en minutos
  const offsetLocal = ahora.getTimezoneOffset() // Offset del navegador en minutos
  const offsetDiff = offsetLocal - offsetBolivia // Diferencia a ajustar

  // Crear fecha ajustada a Bolivia
  const fechaBolivia = new Date(ahora.getTime() + offsetDiff * 60 * 1000)

  // Formatear: YYYY-MM-DD HH:MM:SS (sin milisegundos, con espacio en vez de T)
  const año = fechaBolivia.getFullYear()
  const mes = String(fechaBolivia.getMonth() + 1).padStart(2, '0')
  const dia = String(fechaBolivia.getDate()).padStart(2, '0')
  const hora = String(fechaBolivia.getHours()).padStart(2, '0')
  const minuto = String(fechaBolivia.getMinutes()).padStart(2, '0')
  const segundo = String(fechaBolivia.getSeconds()).padStart(2, '0')

  const fechaFormateada = `${año}-${mes}-${dia} ${hora}:${minuto}:${segundo}`

  const evaluaciones = (cualidadesLocal.value || []).map(c => ({
    id: null,
    id_persona: selectedPersona.value,
    id_entrenamiento: selectedEntrenamiento.value,
    id_cualidad: c.id,
    valor: responses[c.id]?.valor || 0,
    comentario: responses[c.id]?.comentario || '',
    fecha: fechaFormateada
  }))
  emit('save', { evaluaciones })
}

const handleCancel = () => {
  emit('cancel')
  show.value = false
}
</script>

<style scoped lang="scss">
$color-forest-dark: #1a5e3f;
$color-forest: #2e7d52;
$color-leaf: #3d9970;
$color-lime: #4caf7d;
$color-amber: #ffa726;
$color-orange: #ff9800;

.eval-card {
  min-width: 500px;
  max-width: 920px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.eval-header {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 40%, $color-leaf 100%);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    position: relative;
    z-index: 1;
  }

  .header-icon {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

    .q-icon {
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
  }

  .header-titles {
    color: white;

    .header-title {
      font-size: 1.3rem;
      font-weight: 800;
      line-height: 1.2;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .header-subtitle {
      font-size: 0.9rem;
      opacity: 0.95;
      margin-top: 4px;
    }
  }

  .close-btn {
    color: white;
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.1) rotate(90deg);
    }
  }
}

.selection-section {
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba($color-forest, 0.04) 0%, rgba($color-leaf, 0.02) 100%);

  .select-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: $color-forest;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .locked-value {
    font-size: 1.05rem;
    font-weight: 600;
    color: $color-forest-dark;
    padding: 10px 14px;
    background: white;
    border-radius: 8px;
    border: 2px solid rgba($color-forest, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .custom-select {
    :deep(.q-field__control) {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }
}

.cualidades-section {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba($color-forest, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($color-forest, 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba($color-forest, 0.3);
    }
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;

    .empty-text {
      margin-top: 16px;
      font-size: 1rem;
      color: #666;
      font-weight: 500;
    }
  }

  .cualidad-item {
    background: white;
    border: 2px solid rgba($color-forest, 0.12);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    &:hover {
      border-color: rgba($color-forest, 0.25);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .cualidad-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 12px;

      .cualidad-name {
        font-size: 1.05rem;
        font-weight: 700;
        color: $color-forest-dark;
        display: flex;
        align-items: center;
      }

      .cualidad-rating {
        :deep(.q-rating__icon) {
          transition: transform 0.2s ease;

          &:hover {
            transform: scale(1.2);
          }
        }
      }
    }

    .comentario-input {
      :deep(.q-field__control) {
        border-radius: 8px;
        background: rgba($color-forest, 0.02);
      }
    }
  }
}

.footer-actions {
  padding: 16px 24px;
  background: rgba($color-forest, 0.03);
  gap: 12px;
  position: sticky;
  bottom: 0;
  z-index: 10;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;

  .cancel-btn {
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(#6d4c41, 0.1);
    }
  }

  .submit-btn {
    font-weight: 700;
    padding: 10px 24px;
    border-radius: 10px;
    background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
    box-shadow: 0 4px 12px rgba($color-forest, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba($color-forest, 0.4);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.5;
    }
  }
}

@media (max-width: 768px) {
  .eval-card {
    min-width: unset;
    width: 100%;
    border-radius: 0;
  }

  .eval-header {
    padding: 20px;

    .header-icon {
      width: 50px;
      height: 50px;

      .q-icon {
        font-size: 28px;
      }
    }

    .header-titles .header-title {
      font-size: 1.1rem;
    }
  }

  .cualidad-item .cualidad-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.body--dark {
  .eval-card {
    background: #1e1e1e;
  }

  .selection-section {
    background: linear-gradient(135deg, rgba($color-forest, 0.15) 0%, rgba($color-leaf, 0.08) 100%);

    .locked-value {
      background: #2a2a2a;
      color: $color-lime;
      border-color: rgba($color-lime, 0.3);
    }
  }

  .cualidades-section {
    .empty-text {
      color: #b0b0b0;
    }

    .cualidad-item {
      background: #2a2a2a;
      border-color: rgba($color-lime, 0.2);

      .cualidad-name {
        color: $color-lime;
      }

      .comentario-input :deep(.q-field__control) {
        background: rgba($color-forest, 0.1);
      }
    }
  }

  .footer-actions {
    background: rgba($color-forest, 0.1);
  }
}
</style>
