<template>
  <q-dialog v-model:modelValue="modelValue" persistent>
    <q-card style="min-width: 720px; max-width: 920px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento' }}</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSave" class="q-gutter-md q-ml-xs">
          <div class="row q-col-gutter-md">
            <q-input v-model="local.nombre" label="Nombre" outlined dense class="col-md-6"
              :rules="[v => !!v || 'Requerido']" />

            <div class="col-md-3">
              <q-toggle v-model="local.requiere_confirmacion" label="Requiere confirmación" dense icon="check"
                unchecked-icon="clear" />
            </div>

            <q-input v-model="local.fecha_inicio" label="Fecha inicio" type="date" outlined dense class="col-md-4" />
            <q-input v-model="local.fecha_fin" label="Fecha fin" type="date" outlined dense class="col-md-4" />

            <!-- Paquete se elige mediante las tarjetas disponibles más abajo -->

            <div class="col-md-12">
              <q-input v-model="local.observacion" label="Observación" type="textarea" outlined dense />
            </div>

            <q-select v-model="local.id_ubicacion" :options="ubicaciones" option-label="nombre" option-value="id"
              label="Ubicación" outlined dense class="col-md-6" emit-value map-options />

            <!-- usuario_cancela es gestionado automáticamente al cancelar; no se muestra aquí -->

            <div class="col-md-12 q-mt-sm">
              <div class="text-subtitle2 q-mb-lg">Paquetes disponibles</div>
              <div class="row q-col-gutter-md packages-grid">
                <q-card v-for="p in paquetes" :key="p.id"
                  class="col-xs-12 col-sm-6 col-md-4 paquete-card paquete-card-clickable" bordered>
                  <q-card-section class="row items-start no-wrap">
                    <div class="col">
                      <div class="text-subtitle1">{{ p.nombre }}</div>
                      <div class="text-caption">Capacidad: {{ p.max_estudiantes }} | Edades: {{ p.edad_minima }}-{{
                        p.edad_maxima }}</div>
                    </div>
                    <div class="col-auto">
                      <q-checkbox dense :model-value="local.id_paquete === p.id"
                        @update:model-value="val => togglePaqueteSelection(val, p)" />
                    </div>
                  </q-card-section>
                  <q-separator />
                  <q-card-actions align="right">
                    <q-btn flat dense label="Ver horarios" @click="selectPaqueteCard(p)" />
                  </q-card-actions>
                </q-card>
              </div>
            </div>

          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="onCancel" />
        <q-btn color="primary" label="Guardar" @click="onSave" />
      </q-card-actions>
    </q-card>

    <!-- Paquete details dialog -->
    <q-dialog v-model="pkgDetailsOpen">
      <q-card style="min-width: 480px; max-width: 720px">
        <q-card-section>
          <div class="text-h6">Detalles del paquete</div>
        </q-card-section>
        <q-card-section v-if="selectedPackage">
          <div class="text-h6">{{ selectedPackage.nombre }}</div>
          <div class="text-caption">Capacidad: {{ selectedPackage.max_estudiantes }}</div>
          <div class="q-mt-sm">Edades: {{ selectedPackage.edad_minima }} - {{ selectedPackage.edad_maxima }}</div>
          <div class="q-mt-sm">Mensualidad: Bs. {{ selectedPackage.mensualidad }}</div>
          <div class="q-mt-sm text-subtitle2">Horarios</div>
          <q-list bordered>
            <q-item v-for="h in selectedPackage.horarios" :key="h.id">
              <q-item-section>{{ h.dia }}: {{ h.hora_inicio }} - {{ h.hora_fin }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" @click="pkgDetailsOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  training: { type: Object, default: () => ({}) },
  paquetes: { type: Array, default: () => [] },
  ubicaciones: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const modelValue = ref(props.modelValue)
const local = ref({ ...props.training })
const paquetes = ref(props.paquetes || [])
const ubicaciones = ref(props.ubicaciones || [])

const isEdit = ref(!!props.training && !!props.training.id)

// Estado se calcula automáticamente a partir de las fechas (0: Terminado, 1: En marcha, 2: Sin comenzar, 3: Cancelado)

const pkgDetailsOpen = ref(false)
const selectedPackage = ref(null)

watch(() => props.modelValue, v => modelValue.value = v)
watch(modelValue, v => emit('update:modelValue', v))
watch(() => props.training, (t) => { local.value = { ...t }; isEdit.value = !!t && !!t.id }, { immediate: true })



function selectPaqueteCard(p) {
  local.value.id_paquete = p.id
  selectedPackage.value = p
  pkgDetailsOpen.value = true
}

function togglePaqueteSelection(val, p) {
  if (val) {
    local.value.id_paquete = p.id
  } else if (local.value.id_paquete === p.id) {
    local.value.id_paquete = null
  }
}

function computeEstado() {
  const hoy = new Date()
  const inicio = local.value.fecha_inicio ? new Date(local.value.fecha_inicio) : null
  const fin = local.value.fecha_fin ? new Date(local.value.fecha_fin) : null

  if (fin && fin < hoy) return 0 // Terminado
  if (inicio && inicio <= hoy && (!fin || fin >= hoy)) return 1 // En marcha
  if (inicio && inicio > hoy) return 2 // Sin comenzar
  return 2
}

function onSave() {
  // basic validation
  if (!local.value.nombre) return
  // calcular estado automáticamente antes de emitir
  local.value.estado = computeEstado()
  // no enviar usuario_cancela desde el diálogo (se gestionará automáticamente si corresponde)
  const payload = { ...local.value }
  delete payload.usuario_cancela
  emit('save', payload)
  modelValue.value = false
}

function onCancel() {
  emit('cancel')
  modelValue.value = false
}
</script>

<style scoped>
.paquete-card-clickable {
  cursor: pointer;
}
</style>

<style scoped>
.packages-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.paquete-card {
  border: 2px solid var(--q-color-primary);
  border-radius: 8px;
  padding: 6px;
  transition: box-shadow 0.12s ease, transform 0.12s ease;
}

.paquete-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
</style>
