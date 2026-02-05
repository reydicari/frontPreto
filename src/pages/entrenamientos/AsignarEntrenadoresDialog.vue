<template>
  <q-dialog v-model="localVisible" persistent :maximized="$q.screen.lt.md">
    <q-card style="min-width:420px; max-width:640px;" class="entrenadores-dialog">
      <q-card-section class="bg-gradient-forest text-white q-pa-md">
        <div class="row items-center q-gutter-sm">
          <q-icon name="sports_martial_arts" size="32px" />
          <div class="col">
            <div class="text-h5 text-weight-medium">Asignar Entrenadores</div>
            <div class="text-body2 q-mt-xs" style="opacity: 0.9;">Seleccione uno o varios entrenadores para
              este entrenamiento</div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-lg">
        <div v-if="loading" class="row items-center justify-center q-pa-xl">
          <div class="column items-center q-gutter-md">
            <q-spinner-dots size="48px" color="green-7" />
            <div class="text-body2 text-grey-7">Cargando entrenadores...</div>
          </div>
        </div>
        <div v-else-if="isEntrenamientoSuspendido" class="q-gutter-md">
          <!-- Vista de solo lectura para entrenamiento suspendido -->
          <q-banner rounded class="bg-red-1 text-red-9 q-mb-md">
            <template v-slot:avatar>
              <q-icon name="block" color="red" />
            </template>
            <div class="text-body2 text-weight-medium">
              El entrenamiento está suspendido. No se pueden modificar los entrenadores.
            </div>
          </q-banner>

          <div class="text-h6 text-weight-medium q-mb-md">Entrenadores Asignados</div>

          <q-list v-if="currentEntrenadores.length > 0" bordered separator class="rounded-borders">
            <q-item v-for="(ent, idx) in currentEntrenadores" :key="ent.id">
              <q-item-section avatar>
                <q-avatar color="green-7" text-color="white">
                  <q-icon name="person" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body1 text-weight-medium">{{ ent.nombre }}</q-item-label>
                <q-item-label caption>Entrenador #{{ idx + 1 }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <q-banner v-else rounded class="bg-grey-2 text-grey-8">
            <template v-slot:avatar>
              <q-icon name="info" color="grey" />
            </template>
            <div class="text-body2">
              No hay entrenadores asignados a este entrenamiento.
            </div>
          </q-banner>
        </div>
        <div v-else class="q-gutter-md">
          <!-- Vista normal para entrenamiento activo -->
          <q-select outlined multiple use-chips v-model="selectedIds" :options="personOptions" option-value="value"
            option-label="label" label="Entrenadores" hint="Escriba para filtrar" map-options emit-value color="green-8"
            class="text-body1">
            <template v-slot:prepend>
              <q-icon name="search" color="green-8" />
            </template>
            <template v-slot:selected-item="scope">
              <q-chip removable @remove="scope.removeAtIndex(scope.index)" :tabindex="scope.tabindex" color="green-7"
                text-color="white" class="q-ma-xs">
                <q-avatar color="white" text-color="green-7" icon="person" />
                {{ scope.opt.label }}
              </q-chip>
            </template>
          </q-select>

          <q-banner v-if="selectedIds.length > 0" rounded class="bg-lime-1 text-green-9">
            <template v-slot:avatar>
              <q-icon name="info" color="green" />
            </template>
            <span class="text-weight-medium">{{ selectedIds.length }}</span>
            {{ selectedIds.length === 1 ? 'entrenador seleccionado' : 'entrenadores seleccionados' }}
          </q-banner>
        </div>
      </q-card-section>

      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat :label="isEntrenamientoSuspendido ? 'Cerrar' : 'Cancelar'" icon="close" color="grey-7"
          @click="close" class="text-body2" />
        <q-btn v-if="!isEntrenamientoSuspendido" unelevated label="Confirmar" icon="check_circle" color="green-7"
          @click="confirm" :disable="selectedIds.length === 0" class="text-body2" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { listar } from 'src/stores/persona-store'
import { Notify } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  entrenamiento: { type: Object, required: false },
  entrenamientoId: { type: [String, Number], required: false }
})
const emit = defineEmits(['update:modelValue', 'assigned'])

const localVisible = ref(props.modelValue)
const loading = ref(false)
const trainers = ref([])
const selectedIds = ref([])

function buildLabel(p) {
  if (!p) return ''
  const names = (p.nombres || p.nombre || '').trim()
  const ap1 = (p.apellido_paterno || p.apellidos || '').trim()
  const ap2 = (p.apellido_materno || '').trim()
  const parts = [names, ap1, ap2].filter(Boolean)
  return parts.join(' ') || (p.usuario || `#${p.id}`)
}

watch(() => props.modelValue, v => localVisible.value = v)
watch(localVisible, v => emit('update:modelValue', v))

const personOptions = computed(() => trainers.value.map(p => ({ label: buildLabel(p), value: p.id })))

// Computed para verificar si el entrenamiento está suspendido (estado == -1 o 0)
const isEntrenamientoSuspendido = computed(() => {
  return props.entrenamiento && (Number(props.entrenamiento.estado) === -1 || Number(props.entrenamiento.estado) === 0)
})

// Computed para obtener lista de entrenadores actuales
const currentEntrenadores = computed(() => {
  if (!props.entrenamiento || !Array.isArray(props.entrenamiento.entrenadores)) return []
  return props.entrenamiento.entrenadores.map(e => {
    return {
      id: e.id,
      nombre: buildLabel(e)
    }
  }).filter(e => e.id)
})

onMounted(async () => {
  await loadTrainers()
})

async function loadTrainers() {
  loading.value = true
  trainers.value = []
  try {
    const res = await listar({ tipo_persona: 'entrenador' }).catch(() => [])
    trainers.value = Array.isArray(res) ? res : (res?.data || [])
    // si el entrenamiento trae entrenadores, asegurarnos que estén en la lista
    syncAssignedFromEntrenamiento()
  } catch (err) {
    console.error('Error cargando entrenadores', err)
    Notify.create({ type: 'negative', message: 'Error al cargar entrenadores' })
  } finally {
    loading.value = false
  }
}

function syncAssignedFromEntrenamiento() {
  const e = props.entrenamiento
  if (!e || !Array.isArray(e.entrenadores)) return
  const entrenadores = e.entrenadores.filter(Boolean)
  // agregar entrenadores faltantes a trainers
  entrenadores.forEach(ent => {
    if (!trainers.value.find(x => String(x.id) === String(ent.id))) {
      trainers.value.push(ent)
    }
  })
  // setear seleccionados
  const ids = entrenadores.map(ent => ent.id)
  selectedIds.value = ids
}

// Si cambia el entrenamiento mientras el dialog está abierto, sincronizar
watch(() => props.entrenamiento, (e) => {
  if (e) syncAssignedFromEntrenamiento()
})

// Cuando se abre el diálogo, sincronizar también
watch(localVisible, (v) => {
  if (v) syncAssignedFromEntrenamiento()
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

function close() {
  localVisible.value = false
}

function confirm() {
  // Crear asistencias con es_entrenador: true
  const entrenamientoId = props.entrenamiento?.id || props.entrenamientoId || null
  const fecha = getBoliviaDatetimeString()

  const asistencias = selectedIds.value.map(pid => ({
    id_persona: pid,
    id_entrenamiento: Number(entrenamientoId),
    es_entrenador: true,
    fecha
  }))

  emit('assigned', asistencias)
  localVisible.value = false
}
</script>

<style scoped lang="scss">
.entrenadores-dialog .q-card {
  overflow: visible;
  border-radius: 12px;
}

.bg-gradient-forest {
  background: linear-gradient(135deg, #2e7d32 0%, #558b2f 50%, #7cb342 100%);
}

.entrenadores-dialog .q-card-section {
  transition: all 0.3s ease;
}

@media (max-width: 959px) {
  .entrenadores-dialog .q-card {
    min-width: unset !important;
    max-width: unset !important;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .entrenadores-dialog .q-card-section {
    padding: 16px !important;
  }

  .entrenadores-dialog .text-h5 {
    font-size: 1.2rem;
  }

  .entrenadores-dialog .text-body2 {
    font-size: 0.85rem;
  }
}

@media (max-width: 599px) {
  .entrenadores-dialog .q-card {
    border-radius: 0;
  }

  .entrenadores-dialog .q-card-section {
    padding: 12px !important;
  }

  .entrenadores-dialog .text-h5 {
    font-size: 1.1rem;
  }

  .entrenadores-dialog .q-icon[size="32px"] {
    font-size: 28px !important;
  }

  .entrenadores-dialog .q-banner {
    padding: 12px;
  }

  .entrenadores-dialog .q-list {
    max-height: 50vh;
    overflow-y: auto;
  }
}
</style>
