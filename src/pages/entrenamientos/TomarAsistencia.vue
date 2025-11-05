<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width:420px; max-width:800px">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6">Tomar asistencia</div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-select v-model="singleSelect" :options="filteredStudents" option-value="id" option-label="label"
              use-input input-debounce="200" emit-value map-options dense outlined
              placeholder="Buscar y seleccionar estudiantes..." @filter="filterMethod" @update:model-value="onSelect">
            </q-select>
            <div class="text-caption text-grey-6 q-mt-sm">Busca por nombre, CI o teléfono y presiona Enter o selecciona
              un resultado para añadirlo a la lista.</div>
          </div>

          <div class="col-12">
            <q-list bordered>
              <q-item v-for="p in pickedStudents" :key="p.id">
                <q-item-section>
                  <q-item-label>{{ formatLabel(p) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn dense flat color="negative" icon="close" @click="removeStudent(p.id)">
                    <q-tooltip>Quitar</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
              <q-item v-if="!pickedStudents.length">
                <q-item-section>
                  <q-item-label caption>No hay estudiantes seleccionados.</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" color="primary" @click="handleCancel" />
        <q-btn :disable="!canSave" label="Guardar asistencia" color="primary" @click="handleSave" />
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

<style scoped>
.q-card-section .row {
  gap: 8px
}
</style>
