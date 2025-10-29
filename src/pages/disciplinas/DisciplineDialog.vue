<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card style="min-width: 400px; max-width: 600px">
      <q-card-section>
        <div class="text-h6">{{ editing ? 'Editar disciplina' : 'Nueva disciplina' }}</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="save">
          <q-input v-model="local.nombre" label="Nombre" outlined dense :rules="[val => !!val || 'Requerido']" />
          <q-input v-model="local.icono" label="Icono (nombre de icono)" outlined dense class="q-mt-sm" />
          <q-input v-model.number="local.participants" label="Participantes" type="number" outlined dense
            class="q-mt-sm" />
          <q-toggle v-model="local.estado" label="Activo" class="q-mt-sm" />
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn color="primary" label="Guardar" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  discipline: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'save'])

const modelValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const local = ref({ nombre: '', icono: '', estado: true, participants: 0 })
const editing = ref(false)

watch(() => props.discipline, (d) => {
  if (d) {
    local.value = { nombre: d.nombre || d.name || '', icono: d.icono || d.icon || '', estado: typeof d.estado === 'boolean' ? d.estado : (d.status === 'active'), participants: d.participants || d.participantes || 0 }
    editing.value = true
  } else {
    local.value = { nombre: '', icono: '', estado: true, participants: 0 }
    editing.value = false
  }
}, { immediate: true })

function save() {
  const payload = { ...local.value }
  emit('save', payload)
  emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}
</script>
