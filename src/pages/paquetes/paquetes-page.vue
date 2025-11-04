<template>
  <q-page class="q-pa-md " :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <div class="row items-center justify-between">
      <div>
        <h4 class="text-primary q-mb-xs q-mt-none page-title">Gestión de Paquetes</h4>
        <p class="text-grey-7">Crear y gestionar paquetes por disciplina y sus horarios</p>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Formulario (izquierda) -->
      <div class="col-12 col-md-5">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-sm">{{ editing ? 'Editar paquete' : 'Nuevo paquete' }}</div>

            <q-form ref="packageForm" @submit.prevent="savePackage">
              <div class="row q-col-gutter-sm">
                <q-select class="col-6" v-model="form.id_disciplina" :options="disciplineOptions" option-label="nombre"
                  option-value="id" label="Disciplina *" emit-value map-options filled dense
                  :rules="[val => !!val || 'La disciplina es requerida']" />

                <q-input v-model="form.nombre" label="Nombre del paquete *" filled dense class=" col-6"
                  :rules="[val => !!val || 'El nombre es requerido']" />
                <q-select v-model="form.id_nivel" :options="nivelOptions" option-label="label" option-value="value"
                  emit-value map-options label="Nivel *" filled dense class="col-6" style="min-width: 160px"
                  :rules="[val => !!val || 'El nivel es requerido']" />

                <div class="col-6">
                  <q-input dense filled v-model="form.fecha_inicio" label="Fecha inicio *" readonly
                    :rules="[val => !!val || 'La fecha de inicio es requerida']">
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer" @click.stop.prevent="openDatePicker = true" />
                    </template>
                  </q-input>
                  <q-popup-proxy v-model:show="openDatePicker" transition-show="scale" transition-hide="scale">
                    <q-card>
                      <q-date v-model="form.fecha_inicio" mask="YYYY-MM-DD" />
                      <q-card-actions align="right">
                        <q-btn flat label="Cerrar" color="primary" v-close-popup @click="openDatePicker = false" />
                      </q-card-actions>
                    </q-card>
                  </q-popup-proxy>
                </div>
                <div class="col-6"></div>
                <!-- Fecha de vencimiento -->
                <div class="col-6">
                  <q-input dense filled v-model="form.fecha_vencimiento" label="Fecha vencimiento" readonly>
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer"
                        @click.stop.prevent="openDatePickerVencimiento = true" />
                    </template>
                  </q-input>
                  <q-popup-proxy v-model:show="openDatePickerVencimiento" transition-show="scale"
                    transition-hide="scale">
                    <q-card>
                      <q-date v-model="form.fecha_vencimiento" mask="YYYY-MM-DD" />
                      <q-card-actions align="right">
                        <q-btn flat label="Cerrar" color="primary" v-close-popup
                          @click="openDatePickerVencimiento = false" />
                      </q-card-actions>
                    </q-card>
                  </q-popup-proxy>
                </div>
              </div>
              <div class="row q-mt-sm q-col-gutter-sm">
                <q-input v-model.number="form.edad_minima" type="number" label="Edad mínima" filled dense :min="0"
                  :max="99" class="col-4" />
                <q-input v-model.number="form.edad_maxima" type="number" label="Edad máxima" filled dense :min="0"
                  :max="99" class="col-4" />

                <q-input v-model.number="form.max_estudiantes" type="number" label="cupo" filled dense class="col-4" />
              </div>

              <div class="row q-mt-sm q-col-gutter-sm">
                <q-input v-model.number="form.mensualidad" type="number" label="Mensualidad" filled dense class="col-6"
                  prefix="Bs" />
                <q-input v-model.number="form.costo_registro" type="number" label="Costo de registro" filled dense
                  class="col-6" prefix="Bs" />

              </div>



              <q-toggle v-model="form.materiales" label="Materiales incluidos" class="q-mt-sm" />

              <div class="q-mt-md">
                <div class="text-subtitle2 q-mb-xs">Horarios del paquete</div>
                <div v-for="(h, idx) in form.horarios" :key="idx">
                  <div class="row items-center q-gutter-sm q-mb-sm">
                    <q-select class="col-3" v-model.number="h.dia" :options="diasOptions" option-label="label"
                      option-value="value" dense emit-value map-options />
                    <q-input class="col-3" v-model="h.hora_inicio" label="Inicio" type="time" dense />
                    <q-input class="col-3" v-model="h.hora_fin" label="Fin" type="time" dense />
                    <q-btn class="col-1" dense icon="delete" color="negative" flat
                      @click.prevent="removeHorario(idx)" />
                  </div>
                  <div v-if="h._invalidMessage" class="q-mt-xs">
                    <q-banner dense class="bg-negative text-white">{{ h._invalidMessage }}</q-banner>
                  </div>
                </div>

                <q-btn flat label="Agregar horario" color="primary" @click.prevent="addHorario" />

                <div class="q-mt-sm" v-if="formHorarioError">
                  <q-banner dense class="bg-negative text-white">{{ formHorarioError }}</q-banner>
                </div>
              </div>

              <div class="row justify-end q-mt-md">
                <q-btn flat label="Limpiar" color="secondary" @click.prevent="resetForm" />
                <q-btn :color="editing ? 'info' : 'primary'" :label="editing ? 'Actualizar' : 'Guardar'" class="q-ml-sm"
                  @click.prevent="savePackage" :disable="!canSaveForm.allowed">
                  <q-tooltip v-if="!canSaveForm.allowed">{{ canSaveForm.message }}</q-tooltip>
                </q-btn>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lista (derecha) -->
      <div class="col-12 col-md-7">
        <!-- Controles de filtro y orden -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="row q-col-gutter-sm items-center">
              <q-select dense clearable class="col-4" v-model="estadoFilter" emit-value map-options
                :options="[{ label: 'Activos', value: true }, { label: 'Todos', value: null }, { label: 'Inactivos', value: false }]"
                option-label="label" option-value="value" label="Estado" />

              <q-input dense class="col-4" v-model="nameFilter" placeholder="Buscar por nombre de paquete"
                debounce="300" clearable>
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>

              <q-select dense clearable class="col-4" emit-value map-options v-model="orderOption" :options="[
                { label: 'Precio: de más caro a barato', value: 'precio' },
                { label: 'Mayor número de horarios', value: 'horarios' }
              ]" option-label="label" option-value="value" label="Ordenar por" />
            </div>
          </q-card-section>
        </q-card>

        <div class="q-gutter-y-md">
          <q-card v-for="pkg in filteredList" :key="pkg.id" class="paquete-card q-pa-sm">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-h6">
                    {{ pkg.nombre }}
                    <small class="text-grey">(Disciplina: {{ getDisciplinaName(pkg.id_disciplina) }} · Nivel: {{
                      getNivelName(pkg.id_nivel) }})</small>
                  </div>
                  <div class="row items-center q-mt-xs">
                    <div class="col text-caption">Edad: {{ pkg.edad_minima }} - {{ pkg.edad_maxima }} | Mensualidad: Bs.
                      {{
                        pkg.mensualidad }}</div>
                    <div class="col-auto">
                      <q-badge :color="pkg.materiales ? 'primary' : 'grey-5'" align="top" class="q-ml-sm q-mr-md">
                        {{ pkg.materiales ? 'Materiales incluidos' : 'Sin materiales' }}
                      </q-badge>
                    </div>
                    <div class="col-12 q-mt-xs text-caption">
                      <small>Inicio: {{ formatDate(pkg.fecha_inicio) }} · Fin: {{ formatDate(pkg.fecha_vencimiento) ||
                        '—'
                        }}</small>
                    </div>
                  </div>
                </div>

                <div class="col-auto row items-center q-gutter-sm">
                  <!-- <q-toggle dense v-model="pkg.habilitado" @update:model-value="() => toggleHabilitado(pkg)" label="" /> -->
                  <q-btn dense round flat icon="edit" @click.stop="editPackage(pkg)" :disable="!canEditPackage(pkg)">
                    <q-tooltip v-if="!canEditPackage(pkg)">No se puede editar: horarios con errores o duplicidad de
                      disciplina</q-tooltip>
                  </q-btn>
                  <q-btn dense round flat :icon="pkg.estado ? 'delete_forever' : 'restore'"
                    :color="pkg.estado ? 'negative' : 'positive'" :title="pkg.estado ? 'Eliminar' : 'Restaurar'"
                    @click.stop.prevent="openDeleteDialog(pkg)" />
                </div>
              </div>

              <div class="q-mt-sm">
                <!-- <div class="text-subtitle2 q-mb-xs">Horarios</div> -->
                <div class="row  wrap horario-chips">
                  <div v-for="h in pkg.horarios" :key="h.id" class="horario-chip"
                    @click.stop.prevent="openHorarioDialog(pkg.id, h)">
                    <div class="hora-top">{{ getDiaLabel(h.dia) }}</div>
                    <div class="hora-main">{{ h.hora_inicio }} - {{ h.hora_fin }}</div>
                    <!-- <q-badge :color="h.estado ? 'green' : 'grey'" class="hora-badge">{{ h.estado ? 'Activo' : 'Inactivo'
                      }}</q-badge> -->
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Horario dialog -->
    <HorarioDialog v-model:modelValue="horarioDialogOpen" :horario="editingHorario"
      :paquete-id="editingHorarioPaqueteId" :paquetes="paquetes" @save="onSaveHorario" @remove="onRemoveHorario" />

    <!-- Confirmación para eliminar / restaurar paquete -->
    <q-dialog v-model="deleteDialogOpen" persistent>
      <q-card style="min-width: 320px; max-width: 560px;">
        <q-card-section class="row items-center">
          <q-avatar size="56px" :class="dialogIsDelete ? 'bg-negative text-white' : 'bg-positive text-white'">
            <q-icon :name="dialogIsDelete ? 'delete_forever' : 'restore'" />
          </q-avatar>
          <div class="col q-pl-sm">
            <div class="text-h6">{{ dialogIsDelete ? 'Confirmar eliminación' : 'Confirmar restauración' }}</div>
            <div class="text-subtitle2 q-pt-xs">
              <template v-if="dialogIsDelete">
                ¿Deseas eliminar el paquete <strong>{{ paqueteToDelete ? paqueteToDelete.nombre : '' }}</strong>?
              </template>
              <template v-else>
                ¿Deseas restaurar el paquete <strong>{{ paqueteToDelete ? paqueteToDelete.nombre : '' }}</strong>?
              </template>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" @click="cancelDelete" />
          <q-btn flat :label="dialogIsDelete ? 'Eliminar' : 'Restaurar'"
            :color="dialogIsDelete ? 'negative' : 'positive'" @click="doConfirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { listarDisciplinas } from 'src/stores/disciplina-store'
import { listarNiveles } from 'src/stores/nivel'
import { actualizarPaquete, crearPaquete, eliminarPaquete, listarPaquetes } from 'src/stores/paquete-store'
import { onMounted, ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
const $q = useQuasar();

const today = new Date().toISOString().slice(0, 10)

const paquetes = ref([])
const editing = ref(false)
const nextId = ref(1)

// filtros y orden
const estadoFilter = ref(true) // por defecto mostrar solo activos
const nameFilter = ref('')
const orderOption = ref(null) // 'precio' | 'horarios' | null

// filtered list managed via watch (reactive array)
const filteredList = ref([])

const parseEstado = (v) => {
  if (v === null || v === undefined) return null
  if (v === true || v === 'true') return true
  if (v === false || v === 'false') return false
  return null
}

const applyFilters = () => {
  let list = Array.isArray(paquetes.value) ? paquetes.value.slice() : []
  const estadoVal = parseEstado(estadoFilter.value)
  if (estadoVal !== null) {
    list = list.filter(p => {
      const pe = p && (p.estado === true || p.estado === false) ? p.estado : !!p.estado
      return pe === estadoVal
    })
  }

  if (nameFilter.value && nameFilter.value.trim() !== '') {
    const q = nameFilter.value.trim().toLowerCase()
    list = list.filter(p => (p.nombre || '').toLowerCase().includes(q))
  }

  if (orderOption.value === 'precio') {
    list.sort((a, b) => (Number(b.mensualidad) || 0) - (Number(a.mensualidad) || 0))
  } else if (orderOption.value === 'horarios') {
    list.sort((a, b) => ((b.horarios || []).length) - ((a.horarios || []).length))
  }

  filteredList.value = list
}

// re-aplicar filtros cuando cambien los criterios o la fuente
watch([estadoFilter, nameFilter, orderOption, paquetes], () => {
  applyFilters()
}, { immediate: true })

// Form model
const form = ref({
  id: null,
  id_disciplina: null,
  nombre: 'paquete A',
  edad_minima: null,
  edad_maxima: null,
  id_nivel: null,
  max_estudiantes: null,
  mensualidad: 100,
  materiales: false,
  costo_registro: 0,
  estado: true,
  habilitado: true,
  fecha_inicio: today,
  fecha_vencimiento: '',
  usuario_registro: '',
  horarios: []
})

// Opciones de ejemplo (reemplazar con datos reales)
const disciplineOptions = ref([])
const nivelOptions = ref([])
const diasOptions = ref([
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
  { label: 'Domingo', value: 7 }
])
onMounted(async () => {
  // paquetes.value = await listarPaquetes()
  disciplineOptions.value = await listarDisciplinas()
  const niveles = await listarNiveles()
  nivelOptions.value = niveles.map(n => ({ label: n.nombre_nivel, value: n.id }))
  listar()
})
const listar = async () => {
  paquetes.value = await listarPaquetes()
  console.log(paquetes.value);
}
const addHorario = () => {
  // allow adding even if it conflicts; mark the horario with an inline error so user can edit it
  const newH = { dia: 1, hora_inicio: '07:00', hora_fin: '09:00', estado: true, _invalidMessage: '' }
  form.value.horarios.push(newH)
  // validate newly added one (exclude itself from same-form check)
  const err = validateHorarioInForm(newH, { excludePackageId: form.value.id })
  if (err) {
    newH._invalidMessage = err
  } else {
    newH._invalidMessage = ''
    // si ya había un mensaje global de falta de horarios, limpiarlo
    formHorarioError.value = ''
  }
}

const removeHorario = (idx) => {
  form.value.horarios.splice(idx, 1)
  formHorarioError.value = ''
}

const formHorarioError = ref('')

function validateHorarioInForm(h, opts = {}) {
  // opts.excludePackageId: id of package to exclude from other-packages check (e.g., when editing this package)
  // convert time to minutes
  const toMin = (t) => {
    if (!t) return null
    const [hh, mm] = t.split(':').map(Number)
    return hh * 60 + (mm || 0)
  }

  const overlap = (aS, aE, bS, bE) => {
    if (aS == null || aE == null || bS == null || bE == null) return false
    return aS < bE && bS < aE
  }

  // hora_fin must be after hora_inicio
  if (h.hora_inicio && h.hora_fin) {
    const start = toMin(h.hora_inicio)
    const end = toMin(h.hora_fin)
    if (end <= start) return 'La hora de fin debe ser posterior a la hora de inicio.'
  }

  const aS = toMin(h.hora_inicio)
  const aE = toMin(h.hora_fin)

  // check overlaps inside current form.horarios (exclude same id)
  const clash = form.value.horarios.find(x => x.id !== h.id && x.dia === h.dia && overlap(aS, aE, toMin(x.hora_inicio), toMin(x.hora_fin)))
  if (clash) return 'Este horario se solapa con otro horario del mismo paquete (mismo día).'

  // check against other paquetes of same disciplina
  const disciplinaId = form.value.id_disciplina
  if (disciplinaId) {
    const otherClash = paquetes.value.find(p => p.id !== opts.excludePackageId && p.id_disciplina === disciplinaId && p.horarios && p.horarios.some(x => x.dia === h.dia && overlap(aS, aE, toMin(x.hora_inicio), toMin(x.hora_fin))))
    if (otherClash) return `Otro paquete ('${otherClash.nombre || otherClash.id}') de la misma disciplina tiene un horario que se solapa.`
  }

  return null
}

// re-validate horarios when user edits them so inline errors update


function pad(n) { return n.toString().padStart(2, '0') }

function addHoursToTime(timeStr, hrs) {
  if (!timeStr) return ''
  const [hh, mm] = timeStr.split(':').map(Number)
  const d = new Date(2000, 0, 1, hh, mm || 0)
  d.setHours(d.getHours() + hrs)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function compareTimes(a, b) {
  if (!a || !b) return 0
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return (ah * 60 + (am || 0)) - (bh * 60 + (bm || 0))
}

watch(() => form.value.horarios, (newVal) => {
  newVal.forEach(h => {
    // if hora_inicio changed and hora_fin is empty or invalid, set default +2h
    if (h.hora_inicio) {
      if (!h.hora_fin || compareTimes(h.hora_fin, h.hora_inicio) <= 0) {
        h.hora_fin = addHoursToTime(h.hora_inicio, 2)
      }
    }
    const err = validateHorarioInForm(h, { excludePackageId: form.value.id })
    h._invalidMessage = err || ''
  })
  // si ya existe al menos un horario, borrar el error global
  if (form.value.horarios && form.value.horarios.length > 0) {
    formHorarioError.value = ''
  }
}, { deep: true })

// when disciplina changes, revalidate all horarios against paquetes of that disciplina
watch(() => form.value.id_disciplina, () => {
  form.value.horarios.forEach(h => {
    const err = validateHorarioInForm(h, { excludePackageId: form.value.id })
    h._invalidMessage = err || ''
  })
})

const resetForm = () => {
  editing.value = false
  form.value = {
    id: null,
    id_disciplina: null,
    nombre: 'Paquete ' + Date.now(),
    edad_minima: null,
    edad_maxima: null,
    id_nivel: null,
    max_estudiantes: null,
    mensualidad: 100,
    materiales: false,
    costo_registro: 0,
    estado: true,
    fecha_inicio: today,
    habilitado: true,
    fecha_vencimiento: '',
    usuario_registro: '',
    horarios: []
  }
}

// Date picker control
const openDatePicker = ref(false)
const openDatePickerVencimiento = ref(false)

const packageForm = ref(null)

const savePackage = async () => {
  // validate q-form
  if (packageForm.value && packageForm.value.validate) {
    const ok = await packageForm.value.validate()
    if (!ok) {
      return
    }
  }

  // require at least one horario
  if (!form.value.horarios || form.value.horarios.length === 0) {
    formHorarioError.value = 'Se requiere al menos un horario para el paquete'
    return
  }
  formHorarioError.value = ''

  if (editing.value && form.value.id != null) {
    const pkgModifcado = JSON.parse(JSON.stringify(form.value))
    console.log('MODIFICANDO: ', pkgModifcado);
    await actualizarPaquete(pkgModifcado)
    listar()
  } else {
    const newPkg = JSON.parse(JSON.stringify(form.value))
    // asignar id incremental
    newPkg.id = nextId.value++
    const current = JSON.parse(sessionStorage.getItem('user'))
    newPkg.usuario_registro = current ? current.usuario : ''
    // fecha_creacion se toma como hoy
    newPkg.fecha_creacion = today
    await crearPaquete(newPkg)
    listar()
  }
  resetForm()
}

const editPackage = (pkg) => {
  editing.value = true
  form.value = JSON.parse(JSON.stringify(pkg))
}

const getDisciplinaName = (id) => {
  const d = disciplineOptions.value.find(x => x.id === id)
  return d ? d.nombre : 'Sin disciplina'
}

const getNivelName = (id) => {
  if (id == null || nivelOptions.value == null) return 'Sin nivel'
  const n = nivelOptions.value.find(x => x.value === id || x.value == id)
  return n ? n.label : 'Sin nivel'
}

const formatDate = (d) => {
  if (!d) return ''
  // expect YYYY-MM-DD; try to be permissive
  try {
    const t = new Date(d)
    if (isNaN(t.getTime())) return d
    return t.toLocaleDateString()
  } catch {
    return d
  }
}

const getDiaLabel = (v) => {
  const d = diasOptions.value.find(x => x.value == v)
  return d ? d.label : ''
}

// Horario dialog state & handlers
const horarioDialogOpen = ref(false)
const editingHorario = ref(null)
const editingHorarioPaqueteId = ref(null)

const openHorarioDialog = (paqueteId, horario) => {
  editingHorarioPaqueteId.value = paqueteId
  // clone to avoid mutating until saved
  editingHorario.value = horario ? JSON.parse(JSON.stringify(horario)) : { id: Date.now(), dia: 1, hora_inicio: '08:00', hora_fin: '09:00', estado: true }
  horarioDialogOpen.value = true
}

const onSaveHorario = (h) => {
  const pkgIdx = paquetes.value.findIndex(p => p.id === editingHorarioPaqueteId.value)
  if (pkgIdx === -1) return
  const pkg = paquetes.value[pkgIdx]
  const idx = pkg.horarios.findIndex(x => x.id === h.id)
  if (idx === -1) {
    pkg.horarios.push(h)
  } else {
    pkg.horarios.splice(idx, 1, h)
  }
  // limpiar posible mensaje global de falta de horarios
  if (pkg.horarios && pkg.horarios.length > 0) formHorarioError.value = ''
  horarioDialogOpen.value = false
}

const onRemoveHorario = (h) => {
  const pkgIdx = paquetes.value.findIndex(p => p.id === editingHorarioPaqueteId.value)
  if (pkgIdx === -1) return
  const pkg = paquetes.value[pkgIdx]
  pkg.horarios = pkg.horarios.filter(x => x.id !== h.id)
  horarioDialogOpen.value = false
}



// Confirmación de eliminación
const deleteDialogOpen = ref(false)
const paqueteToDelete = ref(null)

const openDeleteDialog = (pkg) => {
  paqueteToDelete.value = pkg
  deleteDialogOpen.value = true
}

const cancelDelete = () => {
  deleteDialogOpen.value = false
  paqueteToDelete.value = null
}

// computed to determine if current dialog is a delete (true) or restore (false)
const dialogIsDelete = computed(() => {
  return paqueteToDelete.value ? Boolean(paqueteToDelete.value.estado) : true
})

const doConfirmDelete = async () => {
  if (!paqueteToDelete.value) return

  if (dialogIsDelete.value) {
    // acción de eliminar
    await eliminarPaquete(paqueteToDelete.value.id)
  } else {
    // acción de restaurar: marcar estado = true y actualizar
    const updated = { ...paqueteToDelete.value, estado: true }
    await actualizarPaquete(updated)
  }

  await listar()
  deleteDialogOpen.value = false
  paqueteToDelete.value = null
}

// Detectar duplicidad de disciplina+nivel: si existe otro paquete con misma disciplina y mismo nivel
const hasDuplicateDisciplina = (pkg) => {
  if (!pkg || pkg.id_disciplina == null) return false
  return paquetes.value.some(p => p.id !== pkg.id && p.id_disciplina === pkg.id_disciplina && (p.id_nivel == pkg.id_nivel))
}

// Determina si el paquete puede editarse: no debe tener horarios con mensajes de error ni duplicidad de disciplina
const canEditPackage = (pkg) => {
  if (!pkg) return false
  const hasHorarioErrors = pkg.horarios && pkg.horarios.some(h => h._invalidMessage && h._invalidMessage.length > 0)
  const duplicate = hasDuplicateDisciplina(pkg)
  return !hasHorarioErrors && !duplicate
}

// Computed para permitir/deshabilitar el guardado del formulario
const canSaveForm = computed(() => {
  const reason = { allowed: true, message: '' }
  // campos requeridos básicos
  if (!form.value.id_disciplina) {
    reason.allowed = false
    reason.message = 'Seleccione la disciplina (requerido)'
    return reason
  }
  if (!form.value.nombre) {
    reason.allowed = false
    reason.message = 'Ingrese el nombre del paquete'
    return reason
  }
  if (!form.value.id_nivel) {
    reason.allowed = false
    reason.message = 'Seleccione el nivel (requerido)'
    return reason
  }
  if (!form.value.fecha_inicio) {
    reason.allowed = false
    reason.message = 'Seleccione la fecha de inicio'
    return reason
  }

  // al menos un horario
  if (!form.value.horarios || form.value.horarios.length === 0) {
    reason.allowed = false
    reason.message = 'Se requiere al menos un horario para el paquete'
    return reason
  }

  // errores en horarios (mensajes en rojo)
  const bad = form.value.horarios.find(h => h._invalidMessage && h._invalidMessage.length > 0)
  if (bad) {
    reason.allowed = false
    reason.message = bad._invalidMessage || 'Existe un error en los horarios'
    return reason
  }

  // duplicidad con otros paquetes (excluir current when editing)
  const duplicate = paquetes.value.find(p => p.id !== form.value.id && p.id_disciplina === form.value.id_disciplina && (p.id_nivel == form.value.id_nivel))
  if (duplicate) {
    reason.allowed = false
    reason.message = `Ya existe otro paquete ('${duplicate.nombre || duplicate.id}') con la misma disciplina y nivel`
    return reason
  }

  return reason
})
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

.page-title {
  border-left: 6px solid $orange-8;
  padding-left: 12px;
  color: $primary;
  font-size: 2.2em;
  font-weight: 800;
  line-height: 1.2;
}

.paquete-card {
  transition: transform 0.12s, box-shadow 0.12s;
}

.paquete-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
}

.horario-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.horario-chip {
  background: var(--q-color-grey-2);
  padding: 8px 10px;
  border-radius: 8px;
  min-width: 120px;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
}

.horario-chip .hora-top {
  font-weight: 600;
  font-size: 0.9rem;
}

.horario-chip .hora-main {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.7);
}

.horario-chip .hora-badge {
  margin-top: 6px;
}
</style>
