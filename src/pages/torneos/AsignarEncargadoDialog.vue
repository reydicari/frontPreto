<template>
  <q-dialog v-model="localVisible" persistent>
    <q-card style="min-width:420px; max-width:640px;">
      <q-card-section>
        <div class="text-h6">Asignar encargados</div>
        <div class="text-caption q-mt-sm">Seleccione uno o varios entrenadores para encargarse del torneo.</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-if="loading" class="row items-center justify-center q-pa-md">
          <q-spinner-dots size="28px" />
        </div>
        <div v-else>
          <q-select dense multiple use-chips v-model="selectedIds" :options="personOptions" option-value="value"
            option-label="label" label="Entrenadores" hint="Escriba para filtrar" clearable map-options emit-value />

          <div class="q-mt-md text-caption">Seleccionados: {{ selectedIds.length }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="secondary" @click="close" />
        <q-btn label="Confirmar" color="primary" @click="confirm" :disable="selectedIds.length === 0" />
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
.q-card {
  overflow: visible
}
</style>
