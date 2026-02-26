<template>
  <q-dialog v-model="show" persistent>
    <q-card class="asistencia-card">
      <!-- Header mejorado con degradado verde -->
      <q-card-section class="asistencia-header">
        <div class="header-content">
          <div class="header-icon">
            <q-icon name="how_to_reg" size="32px" />
          </div>
          <div class="header-titles">
            <div class="header-title">Tomar Asistencia</div>
            <div class="header-subtitle">Registra quién asistió al entrenamiento</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" class="close-btn" @click="handleClose" />
      </q-card-section>

      <q-separator />

      <q-card-section class="search-section">
        <div class="search-label">
          <q-icon name="search" size="20px" class="q-mr-xs" />
          Buscar estudiantes
        </div>
        <q-select v-model="singleSelect" :options="filteredStudents" option-value="id" option-label="label" use-input
          input-debounce="200" emit-value map-options dense outlined placeholder="Buscar por nombre, CI o teléfono..."
          @filter="filterMethod" @update:model-value="onSelect" class="search-input">
          <template v-slot:prepend>
            <q-icon name="person_search" color="green-7" />
          </template>
        </q-select>
        <div class="search-hint">
          <q-icon name="info" size="14px" class="q-mr-xs" />
          Busca y selecciona para añadir a la lista de asistencia
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="footer-actions">
        <q-btn unelevated label="Listo" color="green-7" icon="check" @click="handleClose" class="save-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { listar } from 'stores/persona-store.js'
import { asistenciaEstudiante } from 'stores/asistencia-store.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  entrenamientoId: { type: [Number, String], required: true }
})

const emit = defineEmits(['update:modelValue', 'save'])

const show = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })

const students = ref([])
const search = ref('')
const singleSelect = ref(null)

const filteredStudents = computed(() => {
  return students.value.map(s => ({ ...s, label: formatLabel(s) }))
})

function formatLabel(s) {
  const nombre = s.nombre || s.nombres || ''
  const ci = s.ci || s.cedula || ''
  const tel = s.telefono || s.telefono_celular || ''
  const parts = [nombre]
  if (ci) parts.push(`CI: ${ci}`)
  if (tel) parts.push(`T: ${tel}`)
  return parts.join(' • ')
}

const filterMethod = async (val, update) => {
  search.value = val

  try {
    const params = {
      tipo_persona: 'estudiante',
      estado: true,
      limit: 5,
      page: 1,
      search: search.value || '',
      esAsistencia: true,
      id_entrenamiento: props.entrenamientoId
    }
    const resp = await listar(params)
    students.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) {
    console.warn('Error al buscar estudiantes:', e)
    students.value = []
  }

  update()
}

function getBoliviaDatetimeString() {
  // Compute Bolivia time (UTC-4) regardless of local timezone
  const now = new Date()
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000)
  const boliviaOffsetMinutes = -4 * 60 // UTC-4
  const boliviaMs = utcMs + boliviaOffsetMinutes * 60000
  const d = new Date(boliviaMs)
  const pad = (n) => String(n).padStart(2, '0')
  const Y = d.getFullYear()
  const M = pad(d.getMonth() + 1)
  const D = pad(d.getDate())
  const h = pad(d.getHours())
  const m = pad(d.getMinutes())
  const s = pad(d.getSeconds())
  return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

const onSelect = async (val) => {
  if (!val) return
  // val is an id (emit-value)
  const s = students.value.find(x => String(x.id) === String(val))
  if (s) {
    const fecha = getBoliviaDatetimeString()
    const asistencia = {
      id_persona: s.id,
      id_entrenamiento: Number(props.entrenamientoId),
      es_entrenador: false,
      fecha
    }

    try {
      await asistenciaEstudiante(asistencia)
      emit('save')
    } catch (error) {
      console.error('Error al registrar asistencia:', error)
    }
  }
  // reset select and search to allow searching another
  singleSelect.value = null
  search.value = ''
}

const handleClose = () => {
  show.value = false
}
</script>

<style scoped lang="scss">
$color-forest-dark: #1a5e3f;
$color-forest: #2e7d52;
$color-leaf: #3d9970;
$color-lime: #4caf7d;

.asistencia-card {
  min-width: 460px;
  max-width: 850px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.asistencia-header {
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
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%);
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

.search-section {
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba($color-forest, 0.04) 0%, rgba($color-leaf, 0.02) 100%);

  .search-label {
    font-size: 0.9rem;
    font-weight: 700;
    color: $color-forest;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }

  .search-input {
    :deep(.q-field__control) {
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 2px solid rgba($color-forest, 0.15);
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba($color-forest, 0.3);
      }
    }

    :deep(.q-field__control:focus-within) {
      border-color: $color-forest;
      box-shadow: 0 3px 16px rgba($color-forest, 0.2);
    }
  }

  .search-hint {
    margin-top: 10px;
    font-size: 0.8rem;
    color: #666;
    display: flex;
    align-items: center;
    font-style: italic;
  }
}

.footer-actions {
  padding: 16px 24px;
  background: rgba($color-forest, 0.03);
  gap: 12px;

  .save-btn {
    font-weight: 700;
    padding: 10px 24px;
    border-radius: 10px;
    background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
    box-shadow: 0 4px 12px rgba($color-forest, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 6px 20px rgba($color-forest, 0.4);
      transform: translateY(-2px);
    }
  }
}

@media (max-width: 768px) {
  .asistencia-card {
    min-width: unset;
    width: 100%;
    border-radius: 0;
  }

  .asistencia-header {
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
}

.body--dark {
  .asistencia-card {
    background: #1e1e1e;
  }

  .search-section {
    background: linear-gradient(135deg, rgba($color-forest, 0.15) 0%, rgba($color-leaf, 0.08) 100%);

    .search-hint {
      color: #b0b0b0;
    }
  }

  .footer-actions {
    background: rgba($color-forest, 0.1);
  }
}
</style>
