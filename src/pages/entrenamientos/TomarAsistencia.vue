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
        <q-btn flat round dense icon="close" class="close-btn" @click="handleCancel" />
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

      <q-card-section class="list-section">
        <div class="list-header">
          <div class="list-title">
            <q-icon name="people" size="20px" class="q-mr-xs" />
            Estudiantes seleccionados
          </div>
          <q-badge :color="pickedStudents.length > 0 ? 'green-7' : 'grey-5'" :label="pickedStudents.length.toString()"
            class="count-badge" />
        </div>

        <q-list bordered class="students-list">
          <q-item v-for="p in pickedStudents" :key="p.id" class="student-item">
            <q-item-section avatar>
              <q-avatar color="green-7" text-color="white" size="40px">
                <q-icon name="person" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="student-name">{{ formatLabel(p) }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn round dense flat color="red-7" icon="close" @click="removeStudent(p.id)" class="remove-btn">
                <q-tooltip>Quitar de la lista</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-item v-if="!pickedStudents.length" class="empty-item">
            <q-item-section class="text-center">
              <q-icon name="person_off" size="48px" color="grey-4" />
              <q-item-label caption class="empty-text">No hay estudiantes seleccionados aún</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="footer-actions">
        <q-btn flat label="Cancelar" color="brown-7" icon="close" @click="handleCancel" class="cancel-btn" />
        <q-btn unelevated :disable="!canSave" label="Guardar asistencia" color="green-7" icon="check_circle"
          @click="handleSave" class="save-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarTodosEstudiantes } from 'stores/persona-store.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  entrenamientoId: { type: [Number, String], required: true }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const show = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })

const students = ref([])
const search = ref('')
const singleSelect = ref(null)
const pickedStudents = ref([]) // array of student objects

const filteredStudents = computed(() => {
  if (!search.value) return students.value.map(s => ({ ...s, label: formatLabel(s) }))
  const term = String(search.value).toLowerCase()
  return students.value
    .filter(s => {
      const nombre = (s.nombre || s.nombres || '').toString().toLowerCase()
      const ci = (s.ci || s.cedula || '').toString().toLowerCase()
      const tel = (s.telefono || s.telefono_celular || '').toString().toLowerCase()
      return nombre.includes(term) || ci.includes(term) || tel.includes(term)
    })
    .map(s => ({ ...s, label: formatLabel(s) }))
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

const filterMethod = (val, update) => {
  update(() => {
    search.value = val
  })
}

const canSave = computed(() => (pickedStudents.value && pickedStudents.value.length > 0))

onMounted(async () => {
  try {
    const resp = await listarTodosEstudiantes()
    students.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) {
    console.warn('No se pudieron cargar estudiantes:', e)
    students.value = []
  }
})

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

const onSelect = (val) => {
  if (!val) return
  // val is an id (emit-value)
  const s = students.value.find(x => String(x.id) === String(val))
  if (s) {
    const exists = pickedStudents.value.some(p => String(p.id) === String(s.id))
    if (!exists) pickedStudents.value.push(s)
  }
  // reset select and search to allow searching another
  singleSelect.value = null
  search.value = ''
}

const removeStudent = (id) => {
  const idx = pickedStudents.value.findIndex(p => String(p.id) === String(id))
  if (idx !== -1) pickedStudents.value.splice(idx, 1)
}

const handleSave = () => {
  const fecha = getBoliviaDatetimeString()
  const asistencias = (pickedStudents.value || []).map(p => ({
    id_persona: p.id,
    id_entrenamiento: Number(props.entrenamientoId),
    es_entrenador: false,
    fecha
  }))
  console.log('asistencias', asistencias)

  emit('save', { asistencias })
  show.value = false
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

.list-section {
  padding: 20px 24px;

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .list-title {
      font-size: 1rem;
      font-weight: 700;
      color: $color-forest-dark;
      display: flex;
      align-items: center;
    }

    .count-badge {
      font-size: 0.85rem;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .students-list {
    max-height: 400px;
    overflow-y: auto;
    border-radius: 12px;
    border: 2px solid rgba($color-forest, 0.12);

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba($color-forest, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba($color-forest, 0.2);
      border-radius: 4px;

      &:hover {
        background: rgba($color-forest, 0.3);
      }
    }

    .student-item {
      transition: all 0.3s ease;
      border-bottom: 1px solid rgba($color-forest, 0.08);

      &:hover {
        background: linear-gradient(90deg, rgba($color-forest, 0.04) 0%, transparent 100%);
      }

      .student-name {
        font-weight: 600;
        color: $color-forest-dark;
      }

      .remove-btn {
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.2) rotate(90deg);
        }
      }
    }

    .empty-item {
      padding: 48px 24px;

      .empty-text {
        margin-top: 12px;
        font-size: 0.9rem;
        color: #999;
      }
    }
  }
}

.footer-actions {
  padding: 16px 24px;
  background: rgba($color-forest, 0.03);
  gap: 12px;

  .cancel-btn {
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(#6d4c41, 0.1);
    }
  }

  .save-btn {
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

  .list-section {
    .list-title {
      color: $color-lime;
    }

    .students-list {
      border-color: rgba($color-lime, 0.2);
      background: #2a2a2a;

      .student-item {
        border-bottom-color: rgba($color-lime, 0.1);

        &:hover {
          background: linear-gradient(90deg, rgba($color-lime, 0.08) 0%, transparent 100%);
        }

        .student-name {
          color: $color-lime;
        }
      }

      .empty-text {
        color: #808080;
      }
    }
  }

  .footer-actions {
    background: rgba($color-forest, 0.1);
  }
}
</style>
