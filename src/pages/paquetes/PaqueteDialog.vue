<template>
  <q-dialog v-model="isOpen" persistent :maximized="$q.screen.lt.md">
    <q-card style="min-width: 600px; max-width: 800px;" class="paquete-dialog-card">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <q-icon :name="editMode ? 'edit' : 'add_circle'" size="32px" class="q-mr-sm" />
          <div>
            <div class="dialog-title">{{ editMode ? 'Editar Paquete' : 'Nuevo Paquete' }}</div>

          </div>
        </div>
        <q-btn flat dense round icon="close" v-close-popup @click="closeDialog" />
      </div>

      <!-- Body -->
      <q-card-section class="dialog-body scroll" style="max-height: 70vh;">
        <q-form ref="packageForm">
          <!-- Información Básica -->
          <div class="section-group">
            <div class="section-title">
              <q-icon name="info" size="20px" />
              <span>Información Básica</span>
            </div>

            <div class="row q-col-gutter-sm">
              <q-select class="col-12 col-sm-6 col-md-4" v-model="localForm.id_disciplina" :options="disciplineOptions"
                option-label="nombre" option-value="id" label="Disciplina *" emit-value map-options outlined dense
                :rules="[val => !!val || 'La disciplina es requerida']">
                <template v-slot:prepend>
                  <q-icon name="sports_soccer" class="text-indigo-6" />
                </template>
              </q-select>

              <q-input v-model="localForm.nombre" label="Nombre del paquete *" outlined dense
                class="col-12 col-sm-6 col-md-4" :rules="[val => !!val || 'El nombre es requerido']">
                <template v-slot:prepend>
                  <q-icon name="label" class="text-purple-6" />
                </template>
              </q-input>

              <q-select v-model="localForm.id_nivel" :options="nivelOptions" option-label="label" option-value="value"
                emit-value map-options label="Nivel" outlined dense class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="school" class="text-cyan-6" />
                </template>
              </q-select>

              <div class="col-12 col-sm-6">
                <q-input dense outlined v-model="localForm.fecha_inicio" label="Fecha inicio *" readonly
                  :rules="[val => !!val || 'La fecha de inicio es requerida']">
                  <template v-slot:prepend>
                    <q-icon name="event" class="text-pink-6" />
                  </template>
                  <template v-slot:append>
                    <q-icon name="arrow_drop_down" class="cursor-pointer" @click.stop="openDatePickerInicio = true" />
                  </template>
                </q-input>
                <q-popup-proxy v-model="openDatePickerInicio" transition-show="scale" transition-hide="scale">
                  <q-card>
                    <q-date v-model="localForm.fecha_inicio" mask="YYYY-MM-DD" />
                    <q-card-actions align="right">
                      <q-btn flat label="Cerrar" color="primary" v-close-popup />
                    </q-card-actions>
                  </q-card>
                </q-popup-proxy>
              </div>

              <div class="col-12 col-sm-6">
                <q-input dense outlined v-model="localForm.fecha_vencimiento" label="Fecha vencimiento" readonly>
                  <template v-slot:prepend>
                    <q-icon name="event_busy" class="text-deep-orange-6" />
                  </template>
                  <template v-slot:append>
                    <q-icon name="arrow_drop_down" class="cursor-pointer"
                      @click.stop="openDatePickerVencimiento = true" />
                  </template>
                </q-input>
                <q-popup-proxy v-model="openDatePickerVencimiento" transition-show="scale" transition-hide="scale">
                  <q-card>
                    <q-date v-model="localForm.fecha_vencimiento" mask="YYYY-MM-DD" />
                    <q-card-actions align="right">
                      <q-btn flat label="Cerrar" color="primary" v-close-popup />
                    </q-card-actions>
                  </q-card>
                </q-popup-proxy>
              </div>

              <q-input v-model.number="localForm.edad_minima" type="number" label="Edad mínima" outlined dense :min="0"
                :max="99" class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="child_care" class="text-teal-6" />
                </template>
              </q-input>

              <q-input v-model.number="localForm.edad_maxima" type="number" label="Edad máxima" outlined dense :min="0"
                :max="99" class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="elderly" class="text-teal-8" />
                </template>
              </q-input>

              <q-input v-model.number="localForm.max_estudiantes" type="number" label="Cupo" outlined dense
                class="col-12 col-sm-6 col-md-4">
                <template v-slot:prepend>
                  <q-icon name="group" class="text-blue-6" />
                </template>
              </q-input>

              <q-input v-model.number="localForm.mensualidad" type="number" label="Mensualidad *" outlined dense
                class="col-12 col-sm-6 col-md-4" prefix="Bs"
                :rules="[val => val != null || 'La mensualidad es requerida']">
                <template v-slot:prepend>
                  <q-icon name="payments" class="text-green-6" />
                </template>
              </q-input>

              <q-input v-model.number="localForm.costo_registro" type="number" label="Costo de registro" outlined dense
                class="col-12 col-sm-6 col-md-4" prefix="Bs">
                <template v-slot:prepend>
                  <q-icon name="receipt" class="text-amber-6" />
                </template>
              </q-input>

              <div class="col-12 col-sm-6 col-md-4">
                <q-toggle v-model="localForm.materiales" label="Materiales incluidos" color="purple-6">
                  <q-icon name="inventory" size="20px" class="q-ml-xs" />
                </q-toggle>
              </div>
            </div>
          </div>

          <!-- Configuración -->
          <div class="section-group q-mt-md" v-if="editMode && editingPackage?.estado === false">
            <div class="section-title">
              <q-icon name="settings" size="20px" />
              <span>Configuración</span>
            </div>

            <div class="toggles-section">
              <q-toggle v-model="localForm.estado" label="Activar paquete" color="teal-6">
                <q-icon name="check_circle" size="20px" class="q-ml-xs" />
              </q-toggle>
            </div>
          </div>

          <!-- Horarios -->
          <div class="section-group q-mt-md">
            <div class="section-title">
              <q-icon name="schedule" size="20px" />
              <span>Horarios del paquete</span>
            </div>

            <div class="horarios-list">
              <div v-for="(h, idx) in localForm.horarios" :key="idx" class="horario-item">
                <div class="row items-center q-col-gutter-sm">
                  <q-select class="col-12 col-sm-6 col-md-3" v-model.number="h.dia" :options="diasOptions"
                    option-label="label" option-value="value" dense emit-value map-options outlined label="Día" />
                  <q-input class="col-12 col-sm-6 col-md-3" v-model="h.hora_inicio" label="Inicio" type="time" dense
                    outlined />
                  <q-input class="col-12 col-sm-6 col-md-3" v-model="h.hora_fin" label="Fin" type="time" dense
                    outlined />
                  <div class="col-12 col-sm-6 col-md-3 flex justify-center">
                    <q-btn dense icon="delete" round color="negative" size="sm" @click.prevent="removeHorario(idx)">
                      <q-tooltip>Eliminar horario</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <div v-if="h._invalidMessage" class="q-mt-xs">
                  <q-banner dense class="bg-negative text-white">{{ h._invalidMessage }}</q-banner>
                </div>
              </div>

              <q-btn outline label="Agregar horario" icon="add" color="green-7" class="q-mt-sm full-width"
                @click.prevent="addHorario" unelevated />

              <div class="q-mt-sm" v-if="formHorarioError">
                <q-banner dense class="bg-negative text-white">{{ formHorarioError }}</q-banner>
              </div>
            </div>
          </div>
        </q-form>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="dialog-actions">
        <q-btn flat label="Cancelar" color="grey-7" @click="closeDialog" />
        <q-btn unelevated :label="editMode ? 'Actualizar' : 'Guardar'" :icon="editMode ? 'edit' : 'save'"
          color="green-7" @click="save" :disable="!canSave">
          <q-tooltip v-if="!canSave">{{ saveDisabledReason }}</q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: Boolean,
  editingPackage: Object,
  disciplineOptions: Array,
  nivelOptions: Array,
  diasOptions: Array,
  paquetes: Array
})

const emit = defineEmits(['update:modelValue', 'save'])

const $q = useQuasar()
const packageForm = ref(null)
const openDatePickerInicio = ref(false)
const openDatePickerVencimiento = ref(false)
const formHorarioError = ref('')

const today = new Date().toISOString().slice(0, 10)

const localForm = ref({
  id: null,
  id_disciplina: null,
  nombre: '',
  edad_minima: null,
  edad_maxima: null,
  id_nivel: null,
  max_estudiantes: null,
  mensualidad: null,
  materiales: false,
  costo_registro: 0,
  estado: true,
  habilitado: true,
  fecha_inicio: today,
  fecha_vencimiento: '',
  usuario_registro: '',
  horarios: []
})

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const editMode = computed(() => props.editingPackage && props.editingPackage.id != null)

const resetForm = () => {
  localForm.value = {
    id: null,
    id_disciplina: null,
    nombre: '',
    edad_minima: null,
    edad_maxima: null,
    id_nivel: null,
    max_estudiantes: null,
    mensualidad: null,
    materiales: false,
    costo_registro: 0,
    estado: true,
    habilitado: true,
    fecha_inicio: today,
    fecha_vencimiento: '',
    usuario_registro: '',
    horarios: []
  }
  formHorarioError.value = ''
}

watch(() => props.editingPackage, (newVal) => {
  if (newVal) {
    localForm.value = JSON.parse(JSON.stringify(newVal))
  } else {
    resetForm()
  }
}, { immediate: true })

const addHorario = () => {
  const newH = {
    id: Date.now(),
    dia: 1,
    hora_inicio: '07:00',
    hora_fin: '09:00',
    estado: true,
    _invalidMessage: ''
  }
  localForm.value.horarios.push(newH)
  validateHorario(newH)
}

const removeHorario = (idx) => {
  localForm.value.horarios.splice(idx, 1)
  formHorarioError.value = ''
}

const validateHorario = (h) => {
  const toMin = (t) => {
    if (!t) return 0
    const [hh, mm] = t.split(':').map(Number)
    return hh * 60 + (mm || 0)
  }

  const overlap = (aS, aE, bS, bE) => {
    return (aS < bE && aE > bS)
  }

  if (h.hora_inicio && h.hora_fin) {
    if (toMin(h.hora_fin) <= toMin(h.hora_inicio)) {
      h._invalidMessage = 'La hora de fin debe ser posterior a la hora de inicio.'
      return h._invalidMessage
    }
  }

  const aS = toMin(h.hora_inicio)
  const aE = toMin(h.hora_fin)

  // Check overlaps within current form
  const clash = localForm.value.horarios.find(x =>
    x !== h &&
    x.dia === h.dia &&
    overlap(aS, aE, toMin(x.hora_inicio), toMin(x.hora_fin))
  )
  if (clash) {
    h._invalidMessage = 'Este horario se solapa con otro horario del mismo paquete.'
    return h._invalidMessage
  }

  // Check against other packages of same discipline
  const disciplinaId = localForm.value.id_disciplina
  if (disciplinaId && props.paquetes) {
    const otherPkg = props.paquetes.find(p =>
      p.id !== localForm.value.id &&
      p.id_disciplina === disciplinaId &&
      p.estado === true &&
      p.horarios &&
      p.horarios.some(oh =>
        oh.dia === h.dia &&
        overlap(aS, aE, toMin(oh.hora_inicio), toMin(oh.hora_fin))
      )
    )
    if (otherPkg) {
      h._invalidMessage = `Este horario se solapa con el paquete "${otherPkg.nombre}".`
      return h._invalidMessage
    }
  }

  h._invalidMessage = ''
  return null
}

watch(() => localForm.value.horarios, (newVal) => {
  newVal.forEach(h => {
    validateHorario(h)
  })
  if (localForm.value.horarios && localForm.value.horarios.length > 0) {
    formHorarioError.value = ''
  }
}, { deep: true })

watch(() => localForm.value.id_disciplina, () => {
  localForm.value.horarios.forEach(h => {
    validateHorario(h)
  })
})

const canSave = computed(() => {
  if (!localForm.value.id_disciplina) return false
  if (!localForm.value.nombre) return false
  if (!localForm.value.fecha_inicio) return false
  if (!localForm.value.horarios || localForm.value.horarios.length === 0) return false

  const bad = localForm.value.horarios.find(h => h._invalidMessage && h._invalidMessage.length > 0)
  if (bad) return false

  const duplicate = props.paquetes?.find(p =>
    p.id !== localForm.value.id &&
    p.id_disciplina === localForm.value.id_disciplina &&
    (p.id_nivel == localForm.value.id_nivel)
  )
  if (duplicate) return false

  return true
})

const saveDisabledReason = computed(() => {
  if (!localForm.value.id_disciplina) return 'Selecciona una disciplina'
  if (!localForm.value.nombre) return 'Ingresa un nombre'
  if (!localForm.value.fecha_inicio) return 'Selecciona fecha de inicio'
  if (!localForm.value.horarios || localForm.value.horarios.length === 0) return 'Agrega al menos un horario'

  const bad = localForm.value.horarios.find(h => h._invalidMessage && h._invalidMessage.length > 0)
  if (bad) return 'Corrige los errores en los horarios'

  const duplicate = props.paquetes?.find(p =>
    p.id !== localForm.value.id &&
    p.id_disciplina === localForm.value.id_disciplina &&
    (p.id_nivel == localForm.value.id_nivel)
  )
  if (duplicate) return 'Ya existe un paquete con esta disciplina y nivel'

  return ''
})

const save = async () => {
  if (!canSave.value) return

  if (!localForm.value.horarios || localForm.value.horarios.length === 0) {
    formHorarioError.value = 'Debes agregar al menos un horario.'
    return
  }

  emit('save', JSON.parse(JSON.stringify(localForm.value)))
  closeDialog()
}

const closeDialog = () => {
  isOpen.value = false
  setTimeout(() => resetForm(), 300)
}
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

$color-primary-green: #2e7d32;
$color-green-medium: #43a047;
$color-green-light: #66bb6a;
$pastel-green: #c8e6c9;
$pastel-green-light: #e8f5e9;

.paquete-dialog-card {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, $color-primary-green 0%, $color-green-medium 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.dialog-title {
  font-size: 1.5em;
  font-weight: 700;
  line-height: 1.2;
}

.dialog-subtitle {
  font-size: 0.9em;
  opacity: 0.9;
  margin-top: 4px;
}

.dialog-body {
  padding: 24px;
}

.section-group {
  background: $pastel-green-light;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid $color-primary-green;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1em;
  font-weight: 700;
  color: $color-primary-green;
  margin-bottom: 16px;
}

.toggles-section {
  background: white;
  padding: 16px;
  border-radius: 8px;
}

.horarios-list {
  background: white;
  padding: 16px;
  border-radius: 8px;
}

.horario-item {
  background: $pastel-green-light;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.horario-item:hover {
  background: $pastel-green;
  transform: translateX(4px);
}

.dialog-actions {
  padding: 16px 24px;
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
}

.body--dark .paquete-dialog-card {
  background: $grey-9;
}

.body--dark .section-group {
  background: rgba(46, 125, 50, 0.1);
}

.body--dark .toggles-section,
.body--dark .horarios-list {
  background: rgba(0, 0, 0, 0.2);
}

.body--dark .horario-item {
  background: rgba(46, 125, 50, 0.15);
}

.body--dark .horario-item:hover {
  background: rgba(46, 125, 50, 0.25);
}

.body--dark .dialog-actions {
  background: $grey-10;
  border-top-color: $grey-8;
}

/* Responsive - Mobile First */
@media (max-width: 599px) {
  .paquete-dialog-card {
    min-width: 100% !important;
    max-width: 100% !important;
  }

  .dialog-header {
    padding: 12px 16px;
  }

  .header-content {
    flex-direction: row;
    gap: 8px;
  }

  .dialog-title {
    font-size: 1.1em;
  }

  .dialog-subtitle {
    font-size: 0.75em;
  }

  .dialog-body {
    padding: 12px;
    max-height: calc(100vh - 180px) !important;
  }

  .section-group {
    padding: 10px;
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 0.95em;
    gap: 6px;
    margin-bottom: 12px;
  }

  .section-title .q-icon {
    font-size: 18px;
  }

  .horarios-list,
  .toggles-section {
    padding: 10px;
  }

  .horario-item {
    padding: 8px;
    margin-bottom: 8px;
  }

  .horario-item .row {
    flex-direction: column;
    gap: 8px;
  }

  .horario-item .col-12,
  .horario-item .col-sm-3,
  .horario-item .col-auto {
    width: 100% !important;
    max-width: 100% !important;
  }

  .horario-item .col-auto {
    display: flex;
    justify-content: center;
  }

  .dialog-actions {
    padding: 10px 12px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .dialog-actions .q-btn {
    flex: 1;
    min-width: 120px;
  }
}

/* Tablet */
@media (min-width: 600px) and (max-width: 959px) {
  .paquete-dialog-card {
    min-width: 90vw !important;
    max-width: 650px !important;
  }

  .dialog-body {
    max-height: 65vh !important;
  }

  .section-group {
    padding: 14px;
  }

  .section-title {
    font-size: 1.05em;
  }
}

/* Desktop pequeño */
@media (min-width: 960px) and (max-width: 1279px) {
  .paquete-dialog-card {
    min-width: 650px !important;
    max-width: 750px !important;
  }
}

/* Desktop grande */
@media (min-width: 1280px) {
  .paquete-dialog-card {
    min-width: 700px !important;
    max-width: 850px !important;
  }

  .dialog-body {
    max-height: 75vh !important;
  }
}
</style>
