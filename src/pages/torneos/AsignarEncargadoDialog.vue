<template>
  <q-dialog v-model="localVisible" persistent :maximized="$q.screen.lt.md">
    <q-card style="min-width:420px; max-width:640px;" class="encargado-dialog">
      <q-card-section class="bg-gradient-green text-white q-pa-md">
        <div class="row items-center q-gutter-sm">
          <q-icon name="people" size="32px" />
          <div class="col">
            <div class="text-h5 text-weight-medium">Asignar Encargados</div>
            <div class="text-body2 q-mt-xs" style="opacity: 0.9;">Seleccione uno o varios entrenadores para encargarse
              del torneo</div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-lg">
        <div v-if="loading" class="row items-center justify-center q-pa-xl">
          <div class="column items-center q-gutter-md">
            <q-spinner-dots size="48px" color="teal" />
            <div class="text-body2 text-grey-7">Cargando entrenadores...</div>
          </div>
        </div>
        <div v-else-if="isTorneoSuspended" class="q-gutter-md">
          <!-- Vista de solo lectura para torneo suspendido -->
          <q-banner rounded class="bg-red-1 text-red-9 q-mb-md">
            <template v-slot:avatar>
              <q-icon name="block" color="red" />
            </template>
            <div class="text-body2 text-weight-medium">
              El torneo está suspendido. No se pueden modificar los encargados.
            </div>
          </q-banner>

          <div class="text-h6 text-weight-medium q-mb-md">Encargados Asignados</div>

          <q-list v-if="currentEncargados.length > 0" bordered separator class="rounded-borders">
            <q-item v-for="(enc, idx) in currentEncargados" :key="enc.id">
              <q-item-section avatar>
                <q-avatar color="green-7" text-color="white">
                  <q-icon name="person" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body1 text-weight-medium">{{ enc.nombre }}</q-item-label>
                <q-item-label caption>Encargado #{{ idx + 1 }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <q-banner v-else rounded class="bg-grey-2 text-grey-8">
            <template v-slot:avatar>
              <q-icon name="info" color="grey" />
            </template>
            <div class="text-body2">
              No hay encargados asignados a este torneo.
            </div>
          </q-banner>
        </div>
        <div v-else class="q-gutter-md">
          <!-- Vista normal para torneo activo -->
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

          <q-banner v-if="selectedIds.length > 0" rounded class="bg-orange-1 text-orange-9">
            <template v-slot:avatar>
              <q-icon name="info" color="orange" />
            </template>
            <span class="text-weight-medium">{{ selectedIds.length }}</span>
            {{ selectedIds.length === 1 ? 'entrenador seleccionado' : 'entrenadores seleccionados' }}
          </q-banner>
        </div>
      </q-card-section>

      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat :label="isTorneoSuspended ? 'Cerrar' : 'Cancelar'" icon="close" color="grey-7" @click="close"
          class="text-body2" />
        <q-btn v-if="!isTorneoSuspended" unelevated label="Confirmar" icon="check_circle" color="green-7"
          @click="confirm" :disable="selectedIds.length === 0" class="text-body2" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { listar } from 'src/stores/persona-store'
import { Notify } from 'quasar'

const props = defineProps({ modelValue: { type: Boolean, required: true }, torneo: { type: Object, required: false }, torneoId: { type: [String, Number], required: false } })
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

// Computed para verificar si el torneo está suspendido (estado == 0)
const isTorneoSuspended = computed(() => {
  return props.torneo && Number(props.torneo.estado) === 0
})

// Computed para obtener lista de encargados actuales
const currentEncargados = computed(() => {
  if (!props.torneo || !Array.isArray(props.torneo.encargados)) return []
  return props.torneo.encargados.map(e => {
    const persona = e.persona || {}
    return {
      id: persona.id,
      nombre: buildLabel(persona)
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
    // si el torneo trae encargados con 'persona', asegurarnos que estén en la lista
    syncAssignedFromTorneo()
  } catch (err) {
    console.error('Error cargando entrenadores', err)
    Notify.create({ type: 'negative', message: 'Error al cargar entrenadores' })
  } finally {
    loading.value = false
  }
}

function syncAssignedFromTorneo() {
  const t = props.torneo
  if (!t || !Array.isArray(t.encargados)) return
  const personas = t.encargados.map(e => e.persona).filter(Boolean)
  // agregar personas faltantes a trainers
  personas.forEach(p => {
    if (!trainers.value.find(x => String(x.id) === String(p.id))) {
      trainers.value.push(p)
    }
  })
  // setear selecionados
  const ids = personas.map(p => p.id)
  selectedIds.value = ids
}

// Si cambia el torneo mientras el dialog está abierto, sincronizar
watch(() => props.torneo, (t) => {
  if (t) syncAssignedFromTorneo()
})

// Cuando se abre el diálogo, sincronizar también
watch(localVisible, (v) => {
  if (v) syncAssignedFromTorneo()
})

function close() {
  localVisible.value = false
}

function confirm() {
  // permitir id_torneo nulo si el torneo aún no existe
  const torneoId = props.torneo?.id || props.torneoId || null
  const payload = selectedIds.value.map(pid => ({ id_torneo: torneoId, id_persona: pid }))
  emit('assigned', payload)
  localVisible.value = false
}
</script>

<style scoped>
.encargado-dialog .q-card {
  overflow: visible;
  border-radius: 12px;
}

.bg-gradient-green {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%);
}

.encargado-dialog .q-card-section {
  transition: all 0.3s ease;
}

@media (max-width: 599px) {
  .encargado-dialog .q-card {
    border-radius: 0;
  }
}
</style>
