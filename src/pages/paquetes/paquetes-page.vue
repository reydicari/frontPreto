<template>
  <q-page class="q-pa-md page-container" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <div class="row items-center justify-between q-mb-lg page-header">
      <div class="header-content">
        <div class="header-title">
          <q-icon name="inventory_2" size="42px" class="q-mr-sm" />
          <h4 class="page-title">Gestión de Paquetes</h4>
        </div>
        <p class="header-subtitle">Crea y gestiona paquetes educativos con horarios personalizados</p>
      </div>
      <div class="header-stats row q-gutter-sm">
        <div class="stat-card">
          <div class="stat-number">{{paquetes.filter(p => p.estado).length}}</div>
          <div class="stat-label">Activos</div>
        </div>
        <div class="stat-card stat-card-alt">
          <div class="stat-number">{{ paquetes.length }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Formulario (izquierda) -->
      <div class="col-12 col-md-5">
        <q-card class="form-card">
          <div class="form-header">
            <q-icon :name="editing ? 'edit' : 'add_circle'" size="24px" class="q-mr-sm" />
            <span class="form-title">{{ editing ? 'Editar Paquete' : 'Nuevo Paquete' }}</span>
          </div>
          <q-card-section class="form-body">

            <q-form ref="packageForm" @submit.prevent="savePackage">
              <div class="row q-col-gutter-sm">
                <q-select class="col-12 col-sm-6 input-field" v-model="form.id_disciplina" :options="disciplineOptions"
                  option-label="nombre" option-value="id" label="Disciplina *" emit-value map-options outlined dense
                  :rules="[val => !!val || 'La disciplina es requerida']">
                  <template v-slot:prepend>
                    <q-icon name="sports_soccer" class="text-indigo-6" />
                  </template>
                </q-select>

                <q-input v-model="form.nombre" label="Nombre del paquete *" outlined dense
                  class="col-12 col-sm-6 input-field" :rules="[val => !!val || 'El nombre es requerido']">
                  <template v-slot:prepend>
                    <q-icon name="label" class="text-purple-6" />
                  </template>
                </q-input>

                <q-select v-model="form.id_nivel" :options="nivelOptions" option-label="label" option-value="value"
                  emit-value map-options label="Nivel" outlined dense class="col-12 col-sm-6 input-field">
                  <template v-slot:prepend>
                    <q-icon name="school" class="text-cyan-6" />
                  </template>
                </q-select>

                <div class="col-12 col-sm-6">
                  <q-input dense outlined v-model="form.fecha_inicio" label="Fecha inicio *" readonly
                    class="input-field" :rules="[val => !!val || 'La fecha de inicio es requerida']">
                    <template v-slot:prepend>
                      <q-icon name="event" class="text-pink-6" />
                    </template>
                    <template v-slot:append>
                      <q-icon name="arrow_drop_down" class="cursor-pointer text-pink-6"
                        @click.stop.prevent="openDatePicker = true" />
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
                <!-- Fecha de vencimiento -->
                <div class="col-12 col-sm-6">
                  <q-input dense outlined v-model="form.fecha_vencimiento" label="Fecha vencimiento" readonly
                    class="input-field">
                    <template v-slot:prepend>
                      <q-icon name="event_busy" class="text-deep-orange-6" />
                    </template>
                    <template v-slot:append>
                      <q-icon name="arrow_drop_down" class="cursor-pointer text-deep-orange-6"
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
                <q-input v-model.number="form.edad_minima" type="number" label="Edad mínima" outlined dense :min="0"
                  :max="99" class="col-12 col-sm-4 input-field">
                  <template v-slot:prepend>
                    <q-icon name="child_care" class="text-teal-6" />
                  </template>
                </q-input>
                <q-input v-model.number="form.edad_maxima" type="number" label="Edad máxima" outlined dense :min="0"
                  :max="99" class="col-12 col-sm-4 input-field">
                  <template v-slot:prepend>
                    <q-icon name="elderly" class="text-teal-8" />
                  </template>
                </q-input>

                <q-input v-model.number="form.max_estudiantes" type="number" label="Cupo" outlined dense
                  class="col-12 col-sm-4 input-field">
                  <template v-slot:prepend>
                    <q-icon name="group" class="text-blue-6" />
                  </template>
                </q-input>
              </div>

              <div class="row q-mt-sm q-col-gutter-sm">
                <q-input v-model.number="form.mensualidad" type="number" label="Mensualidad" outlined dense
                  class="col-12 col-sm-6 input-field" prefix="Bs">
                  <template v-slot:prepend>
                    <q-icon name="payments" class="text-green-6" />
                  </template>
                </q-input>
                <q-input v-model.number="form.costo_registro" type="number" label="Costo de registro" outlined dense
                  class="col-12 col-sm-6 input-field" prefix="Bs">
                  <template v-slot:prepend>
                    <q-icon name="receipt" class="text-amber-6" />
                  </template>
                </q-input>
              </div>



              <div class="toggles-section q-mt-md">
                <q-toggle v-model="form.materiales" label="Materiales incluidos" color="purple-6" class="toggle-item">
                  <q-icon name="inventory" size="20px" class="q-ml-xs" />
                </q-toggle>

                <!-- Toggle de estado: solo visible al editar paquetes desactivados -->
                <q-toggle v-if="editing && form.estado === false" v-model="form.estado" label="Activar paquete"
                  color="teal-6" class="toggle-item q-mt-sm">
                  <q-icon name="check_circle" size="20px" class="q-ml-xs" />
                </q-toggle>
              </div>

              <div class="horarios-section q-mt-lg">
                <div class="section-title">
                  <q-icon name="schedule" size="24px" class="q-mr-xs" />
                  <span>Horarios del paquete</span>
                </div>
                <div v-for="(h, idx) in form.horarios" :key="idx" class="horario-row">
                  <div class="row items-center q-gutter-sm q-mb-sm">
                    <q-select class="col-12 col-sm-3" v-model.number="h.dia" :options="diasOptions" option-label="label"
                      option-value="value" dense emit-value map-options outlined />
                    <q-input class="col-12 col-sm-3" v-model="h.hora_inicio" label="Inicio" type="time" dense
                      outlined />
                    <q-input class="col-12 col-sm-3" v-model="h.hora_fin" label="Fin" type="time" dense outlined />
                    <q-btn class="col-12 col-sm-2 btn-delete-horario" dense icon="delete" round
                      @click.prevent="removeHorario(idx)" />
                  </div>
                  <div v-if="h._invalidMessage" class="q-mt-xs">
                    <q-banner dense class="bg-negative text-white">{{ h._invalidMessage }}</q-banner>
                  </div>
                </div>

                <q-btn outline label="Agregar horario" icon="add" class="btn-add-horario" @click.prevent="addHorario"
                  unelevated />

                <div class="q-mt-sm" v-if="formHorarioError">
                  <q-banner dense class="bg-negative text-white">{{ formHorarioError }}</q-banner>
                </div>
              </div>

              <div class="row justify-end q-mt-lg q-gutter-sm">
                <q-btn outline label="Limpiar" icon="refresh" class="btn-reset" @click.prevent="resetForm" />
                <q-btn :class="editing ? 'btn-update' : 'btn-save'" :label="editing ? 'Actualizar' : 'Guardar'"
                  :icon="editing ? 'edit' : 'save'" unelevated @click.prevent="savePackage"
                  :disable="!canSaveForm.allowed">
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
        <q-card class="q-mb-lg filters-card">
          <q-card-section>
            <div class="filters-title q-mb-md">
              <q-icon name="filter_list" size="22px" class="q-mr-xs" />
              <span>Filtros y Búsqueda</span>
            </div>
            <div class="row q-col-gutter-sm items-center">
              <q-select dense clearable class="col-12 col-sm-4 filter-input" v-model="estadoFilter" emit-value
                map-options
                :options="[{ label: 'Activos', value: true }, { label: 'Todos', value: null }, { label: 'Inactivos', value: false }]"
                option-label="label" option-value="value" label="Estado" outlined>
                <template v-slot:prepend>
                  <q-icon name="toggle_on" class="text-teal-6" />
                </template>
              </q-select>

              <q-input dense class="col-12 col-sm-4 filter-input" v-model="nameFilter" placeholder="Buscar por nombre"
                debounce="300" clearable outlined>
                <template v-slot:prepend>
                  <q-icon name="search" class="text-indigo-6" />
                </template>
              </q-input>

              <q-select dense clearable class="col-12 col-sm-4 filter-input" emit-value map-options
                v-model="orderOption" :options="[
                  { label: 'Precio: más caro', value: 'precio' },
                  { label: 'Más horarios', value: 'horarios' }
                ]" option-label="label" option-value="value" label="Ordenar por" outlined>
                <template v-slot:prepend>
                  <q-icon name="sort" class="text-purple-6" />
                </template>
              </q-select>
            </div>
          </q-card-section>
        </q-card>

        <div class="paquetes-grid">
          <q-card v-for="(pkg, index) in filteredList" :key="pkg.id" class="paquete-card"
            :style="{ animationDelay: (index * 50) + 'ms' }">
            <div class="card-ribbon" :class="pkg.estado ? 'ribbon-active' : 'ribbon-inactive'">
              {{ pkg.estado ? 'ACTIVO' : 'INACTIVO' }}
            </div>

            <q-card-section class="card-header">
              <div class="package-title">
                <q-icon name="inventory_2" size="28px" class="title-icon" />
                <span>{{ pkg.nombre }}</span>
              </div>
              <div class="package-meta">
                <q-chip size="sm" class="chip-disciplina" icon="sports_soccer">
                  {{ getDisciplinaName(pkg.id_disciplina) }}
                </q-chip>
                <q-chip size="sm" class="chip-nivel" icon="school">
                  {{ getNivelName(pkg.id_nivel) }}
                </q-chip>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="card-body">
              <div class="info-grid">
                <div class="info-item">
                  <q-icon name="people" class="info-icon text-indigo-6" />
                  <div class="info-content">
                    <div class="info-label">Edad</div>
                    <div class="info-value">{{ pkg.edad_minima }} - {{ pkg.edad_maxima }} años</div>
                  </div>
                </div>

                <div class="info-item">
                  <q-icon name="group" class="info-icon text-cyan-6" />
                  <div class="info-content">
                    <div class="info-label">Cupo</div>
                    <div class="info-value">{{ pkg.max_estudiantes }} estudiantes</div>
                  </div>
                </div>

                <div class="info-item">
                  <q-icon name="payments" class="info-icon text-green-6" />
                  <div class="info-content">
                    <div class="info-label">Mensualidad</div>
                    <div class="info-value">Bs. {{ pkg.mensualidad }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <q-icon name="receipt" class="info-icon text-amber-6" />
                  <div class="info-content">
                    <div class="info-label">Registro</div>
                    <div class="info-value">Bs. {{ pkg.costo_registro }}</div>
                  </div>
                </div>
              </div>

              <div class="date-range q-mt-md">
                <div class="date-item">
                  <q-icon name="event" size="18px" class="text-pink-6" />
                  <span>{{ formatDate(pkg.fecha_inicio) }}</span>
                </div>
                <q-icon name="arrow_forward" size="16px" class="text-grey-6" />
                <div class="date-item">
                  <q-icon name="event_busy" size="18px" class="text-deep-orange-6" />
                  <span>{{ formatDate(pkg.fecha_vencimiento) || '—' }}</span>
                </div>
              </div>

              <div class="materials-badge q-mt-md">
                <q-chip :class="pkg.materiales ? 'chip-materiales-si' : 'chip-materiales-no'"
                  :icon="pkg.materiales ? 'inventory' : 'block'">
                  {{ pkg.materiales ? 'Materiales incluidos' : 'Sin materiales' }}
                </q-chip>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="card-actions">
              <div class="action-buttons">
                <q-btn class="btn-edit-card" round icon="edit" @click.stop="editPackage(pkg)"
                  :disable="!canEditPackage(pkg)">
                  <q-tooltip v-if="!canEditPackage(pkg)">No se puede editar: horarios con errores</q-tooltip>
                  <q-tooltip v-else>Editar paquete</q-tooltip>
                </q-btn>
                <q-btn v-if="pkg.estado" class="btn-delete-card" round icon="delete_forever"
                  @click.stop.prevent="openDeleteDialog(pkg)">
                  <q-tooltip>Desactivar paquete</q-tooltip>
                </q-btn>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="card-horarios">
              <div class="horarios-title">
                <q-icon name="schedule" size="20px" />
                <span>Horarios</span>
                <q-badge class="horarios-count">{{ pkg.horarios?.length || 0 }}</q-badge>
              </div>
              <div class="horarios-list">
                <div v-for="(h, hIndex) in pkg.horarios" :key="h.id" class="horario-chip-modern"
                  :class="`horario-color-${hIndex % 6}`" @click.stop.prevent="openHorarioDialog(pkg.id, h)">
                  <div class="horario-day">{{ getDiaLabel(h.dia) }}</div>
                  <div class="horario-time">
                    <q-icon name="access_time" size="14px" />
                    {{ h.hora_inicio }} - {{ h.hora_fin }}
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

    <!-- Confirmación para desactivar paquete -->
    <q-dialog v-model="deleteDialogOpen" persistent>
      <q-card style="min-width: 320px; max-width: 560px;">
        <q-card-section class="row items-center">
          <q-avatar size="56px" class="bg-negative text-white">
            <q-icon name="delete_forever" />
          </q-avatar>
          <div class="col q-pl-sm">
            <div class="text-h6">Confirmar desactivación</div>
            <div class="text-subtitle2 q-pt-xs">
              ¿Deseas desactivar el paquete <strong>{{ paqueteToDelete ? paqueteToDelete.nombre : '' }}</strong>?
              <br><small class="text-grey-7">Para reactivarlo, deberás editarlo y cambiar su estado.</small>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" @click="cancelDelete" />
          <q-btn flat label="Desactivar" color="negative" @click="doConfirmDelete" />
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
  const clash = form.value.horarios.find(x => x !== h && x.dia === h.dia && overlap(aS, aE, toMin(x.hora_inicio), toMin(x.hora_fin)))
  if (clash) return 'Este horario se solapa con otro horario del mismo paquete (mismo día).'

  // check against other paquetes of same disciplina (solo paquetes activos: estado === true)
  const disciplinaId = form.value.id_disciplina
  if (disciplinaId) {
    const otherClash = paquetes.value.find(p => p.id !== opts.excludePackageId && p.estado === true && p.id_disciplina === disciplinaId && p.horarios && p.horarios.some(x => x.dia === h.dia && overlap(aS, aE, toMin(x.hora_inicio), toMin(x.hora_fin))))
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

const doConfirmDelete = async () => {
  if (!paqueteToDelete.value) return

  // Solo desactivar (eliminar lógicamente)
  await eliminarPaquete(paqueteToDelete.value.id)

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
  // id_nivel es opcional ahora; no bloquea el guardado
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

/* Paleta de colores personalizada - Verde y Naranja */
$color-primary-green: #2e7d32; // Verde principal (forest green)
$color-green-medium: #43a047; // Verde medio
$color-green-light: #66bb6a; // Verde claro
$color-green-lighter: #81c784; // Verde más claro
$color-orange: #ff6f00; // Naranja para detalles
$color-orange-light: #ff8f00; // Naranja claro
$color-orange-accent: #ffa726; // Naranja acento

// Variaciones y tonos
$color-green-dark: darken(#2e7d32, 8%); // Verde más oscuro
$color-green-pale: lighten(#2e7d32, 45%); // Verde muy claro
$color-orange-soft: lighten(#ff6f00, 30%); // Naranja suave
$color-orange-pale: lighten(#ff6f00, 40%); // Naranja muy claro

// Pasteles
$pastel-green: #c8e6c9; // Verde pastel
$pastel-green-light: #e8f5e9; // Verde pastel claro
$pastel-orange: #ffe0b2; // Naranja pastel
$pastel-orange-light: #fff3e0; // Naranja pastel claro

/* Fondo degradado suave */
.bg-gradient {
  background: linear-gradient(135deg, $pastel-green-light 0%, $pastel-green 50%, lighten($pastel-green, 5%) 100%);
}

.page-container {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header principal */
.page-header {
  animation: slideDown 0.6s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-content {
  flex: 1;
}

.header-title {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, $color-green-dark 0%, $color-primary-green 50%, $color-green-medium 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title {
  font-size: 2.5em;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
}

.header-subtitle {
  color: #546e7a;
  font-size: 1.1em;
  margin: 8px 0 0 0;
  font-weight: 500;
}

.header-stats {
  display: flex;
  gap: 12px;
}

.stat-card {
  background: linear-gradient(135deg, $color-primary-green 0%, $color-green-medium 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
  transition: all 0.3s ease;
  min-width: 100px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(46, 125, 50, 0.5);
}

.stat-card-alt {
  background: linear-gradient(135deg, $color-green-medium 0%, $color-green-light 100%);
  box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
}

.stat-card-alt:hover {
  box-shadow: 0 8px 20px rgba(67, 160, 71, 0.5);
}

.stat-number {
  font-size: 2em;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 0.85em;
  opacity: 0.95;
  margin-top: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Formulario */
.form-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  animation: slideRight 0.6s ease;
}

.body--dark .form-card {
  background: $grey-9;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-header {
  background: linear-gradient(135deg, $color-green-dark 0%, $color-primary-green 50%, $color-green-medium 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  font-size: 1.3em;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
}

.form-title {
  font-weight: 700;
}

.form-body {
  padding: 24px;
}

.body--dark .form-body {
  background: $grey-9;
}

.input-field {
  transition: all 0.3s ease;
}

.input-field:hover :deep(.q-field__control) {
  border-color: $color-primary-green;
}

.input-field:focus-within :deep(.q-field__control) {
  box-shadow: 0 0 0 2px rgba(115, 152, 66, 0.3);
}

.toggles-section {
  background: $pastel-green-light;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid $color-orange;
}

.body--dark .toggles-section {
  background: rgba(232, 245, 233, 0.1);
  border-left-color: $color-orange-light;
}

.toggle-item {
  font-weight: 600;
}

.horarios-section {
  background: $pastel-green;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid $color-primary-green;
}

.body--dark .horarios-section {
  background: rgba(200, 230, 201, 0.1);
  border-left-color: $color-green-light;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.2em;
  font-weight: 700;
  color: $color-green-dark;
  margin-bottom: 16px;
}

.body--dark .section-title {
  color: $color-green-light;
}

.horario-row {
  background: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.body--dark .horario-row {
  background: rgba(255, 255, 255, 0.05);
}

.horario-row:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.btn-delete-horario {
  background: linear-gradient(135deg, #ef5350 0%, #e53935 100%);
  color: white;
  transition: all 0.3s ease;
}

.btn-delete-horario:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(239, 83, 80, 0.4);
}

.btn-add-horario {
  background: white;
  color: $color-green-dark;
  border: 2px solid $color-primary-green;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-add-horario:hover {
  background: $color-primary-green;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 169, 31, 0.4);
}

.btn-reset {
  border: 2px solid $color-orange;
  color: $color-orange;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-reset:hover {
  background: $color-orange;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 111, 0, 0.4);
}

.btn-save {
  background: linear-gradient(135deg, $color-primary-green 0%, $color-green-medium 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
  transition: all 0.3s ease;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(46, 125, 50, 0.5);
}

.btn-update {
  background: linear-gradient(135deg, $color-green-medium 0%, $color-green-light 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
  transition: all 0.3s ease;
}

.btn-update:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(67, 160, 71, 0.5);
}

/* Filtros */
.filters-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  animation: slideLeft 0.6s ease;
}

.body--dark .filters-card {
  background: $grey-9;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.filters-title {
  display: flex;
  align-items: center;
  font-size: 1.1em;
  font-weight: 700;
  color: $color-green-dark;
}

.body--dark .filters-title {
  color: $color-green-light;
}

.filter-input :deep(.q-field__control) {
  transition: all 0.3s ease;
}

.filter-input:hover :deep(.q-field__control) {
  border-color: $color-primary-green;
}

/* Grid de paquetes */
.paquetes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  animation: fadeIn 0.8s ease;
}

@media (max-width: 599px) {
  .paquetes-grid {
    grid-template-columns: 1fr;
  }
}

/* Tarjetas de paquetes */
.paquete-card {
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(46, 125, 50, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  opacity: 0;
  animation: cardFadeIn 0.6s ease forwards;
}

.body--dark .paquete-card {
  background: $grey-9;
  border-color: rgba(102, 187, 106, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
  }
}

.paquete-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(46, 125, 50, 0.4);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
}

.card-ribbon {
  position: absolute;
  top: 16px;
  right: -32px;
  padding: 4px 40px;
  font-size: 0.7em;
  font-weight: 800;
  letter-spacing: 1px;
  transform: rotate(45deg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.ribbon-active {
  background: linear-gradient(135deg, $color-primary-green 0%, $color-green-medium 100%);
  color: white;
}

.ribbon-inactive {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  color: white;
}

.card-header {
  background: linear-gradient(135deg, $pastel-green 0%, $pastel-green-light 100%);
  padding: 20px;
}

.body--dark .card-header {
  background: linear-gradient(135deg, darken($color-primary-green, 20%) 0%, darken($color-green-medium, 15%) 100%);
}

.package-title {
  display: flex;
  align-items: center;
  font-size: 1.4em;
  font-weight: 700;
  color: $color-green-dark;
  margin-bottom: 12px;
}

.body--dark .package-title {
  color: $color-green-light;
}

.title-icon {
  margin-right: 8px;
  color: $color-orange;
}

.package-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-disciplina {
  background: linear-gradient(135deg, $color-primary-green 0%, $color-green-medium 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.4);
}

.chip-nivel {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 111, 0, 0.4);
}

.card-body {
  padding: 20px;
}

.body--dark .card-body {
  background: $grey-9;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $pastel-green-light;
  border-radius: 12px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.info-item:hover {
  background: $pastel-green;
  transform: translateX(4px);
  border-left-color: $color-orange;
}

.body--dark .info-item {
  background: rgba(46, 125, 50, 0.15);
}

.body--dark .info-item:hover {
  background: rgba(46, 125, 50, 0.25);
  border-left-color: $color-orange-light;
}

.info-icon {
  font-size: 28px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 0.75em;
  color: #607d8b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.body--dark .info-label {
  color: #90a4ae;
}

.info-value {
  font-size: 1em;
  font-weight: 700;
  color: #37474f;
  margin-top: 2px;
}

.body--dark .info-value {
  color: #b0bec5;
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: $pastel-orange-light;
  border-radius: 12px;
  border: 2px solid $color-orange-light;
}

.body--dark .date-range {
  background: rgba(255, 111, 0, 0.15);
  border-color: rgba(255, 143, 0, 0.3);
}

.date-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9em;
  font-weight: 600;
  color: #424242;
}

.body--dark .date-item {
  color: #cfd8dc;
}

.materials-badge {
  display: flex;
  justify-content: center;
}

.chip-materiales-si {
  background: linear-gradient(135deg, $color-green-dark 0%, $color-primary-green 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.4);
}

.chip-materiales-no {
  background: #e0e0e0;
  color: #616161;
  font-weight: 600;
}

.card-actions {
  background: #fafafa;
  padding: 16px 20px;
}

.body--dark .card-actions {
  background: $grey-10;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-edit-card {
  background: linear-gradient(135deg, $color-primary-green 0%, $color-green-medium 100%);
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
}

.btn-edit-card:hover {
  transform: scale(1.15) rotate(5deg);
  box-shadow: 0 6px 16px rgba(46, 125, 50, 0.6);
}

.btn-delete-card {
  background: linear-gradient(135deg, #ef5350 0%, #e53935 100%);
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 83, 80, 0.4);
}

.btn-delete-card:hover {
  transform: scale(1.15) rotate(-5deg);
  box-shadow: 0 6px 16px rgba(239, 83, 80, 0.6);
}

.card-horarios {
  background: linear-gradient(135deg, darken($pastel-green, 8%) 0%, darken($pastel-green-light, 5%) 100%);
  padding: 16px 20px;
  border-top: 3px solid rgba(46, 125, 50, 0.3);
}

.body--dark .card-horarios {
  background: linear-gradient(135deg, rgba(46, 125, 50, 0.2) 0%, rgba(67, 160, 71, 0.15) 100%);
  border-top-color: rgba(102, 187, 106, 0.4);
}

.horarios-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: $color-green-dark;
  margin-bottom: 12px;
}

.body--dark .horarios-title {
  color: $color-green-light;
}

.horarios-count {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
  font-weight: 700;
}

.horarios-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.horario-chip-modern {
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 140px;
}

.horario-chip-modern:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.horario-color-0 {
  background: linear-gradient(135deg, $pastel-green 0%, lighten($pastel-green, 3%) 100%);
  border-left: 4px solid $color-primary-green;
}

.horario-color-1 {
  background: linear-gradient(135deg, $pastel-green-light 0%, $pastel-green 100%);
  border-left: 4px solid $color-green-medium;
}

.horario-color-2 {
  background: linear-gradient(135deg, $pastel-orange-light 0%, $pastel-orange 100%);
  border-left: 4px solid $color-orange;
}

.horario-color-3 {
  background: linear-gradient(135deg, lighten($pastel-green, 5%) 0%, $pastel-green-light 100%);
  border-left: 4px solid $color-green-light;
}

.horario-color-4 {
  background: linear-gradient(135deg, $pastel-orange 0%, lighten($pastel-orange, 5%) 100%);
  border-left: 4px solid $color-orange-accent;
}

.horario-color-5 {
  background: linear-gradient(135deg, $pastel-green 0%, $pastel-green-light 100%);
  border-left: 4px solid $color-green-dark;
}

.horario-day {
  font-weight: 700;
  font-size: 0.9em;
  color: #37474f;
  margin-bottom: 4px;
}

.body--dark .horario-day {
  color: #b0bec5;
}

.horario-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
  color: #546e7a;
  font-weight: 600;
}

.body--dark .horario-time {
  color: #90a4ae;
}

/* Responsive */
@media (max-width: 959px) {
  .page-title {
    font-size: 2em;
  }

  .header-stats {
    flex-direction: column;
    width: 100%;
    margin-top: 16px;
  }

  .stat-card {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.6em;
  }

  .header-subtitle {
    font-size: 0.95em;
  }

  .horarios-list {
    flex-direction: column;
  }

  .horario-chip-modern {
    width: 100%;
  }

  .package-title {
    font-size: 1.2em;
  }

  .action-buttons {
    justify-content: center;
  }
}

/* Estilos para modo dark */
.body--dark .form-card {
  background: $grey-9;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.body--dark .filters-card {
  background: $grey-9;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.body--dark .paquete-card {
  background: $grey-9;
  border-color: rgba(102, 187, 106, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

.body--dark .paquete-card:hover {
  border-color: rgba(102, 187, 106, 0.5);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7);
}

.body--dark .card-header {
  background: linear-gradient(135deg, darken($color-primary-green, 25%) 0%, darken($color-green-medium, 20%) 100%);
}

.body--dark .card-body {
  background: $grey-9;
}

.body--dark .info-item {
  background: rgba(46, 125, 50, 0.15);
  border-left-color: transparent;
}

.body--dark .info-item:hover {
  background: rgba(46, 125, 50, 0.25);
  border-left-color: $color-orange-light;
}

.body--dark .date-range {
  background: rgba(255, 111, 0, 0.15);
  border-color: rgba(255, 143, 0, 0.3);
}

.body--dark .card-actions {
  background: $grey-10;
}

.body--dark .card-horarios {
  background: linear-gradient(135deg, rgba(46, 125, 50, 0.2) 0%, rgba(67, 160, 71, 0.15) 100%);
  border-top-color: rgba(102, 187, 106, 0.4);
}

.body--dark .horario-row {
  background: rgba(255, 255, 255, 0.05);
}

.body--dark .filters-body {
  background: rgba(0, 0, 0, 0.3);
}

.body--dark .toggles-section {
  background: rgba(232, 245, 233, 0.08);
  border-left-color: $color-orange-light;
}

.body--dark .horarios-section {
  background: rgba(200, 230, 201, 0.08);
  border-left-color: $color-green-light;
}

.body--dark .form-body {
  background: $grey-9;
}

.body--dark .package-title {
  color: $color-green-light;
}

.body--dark .info-value {
  color: #cfd8dc;
}

.body--dark .date-item {
  color: #cfd8dc;
}

.body--dark .horario-day {
  color: #cfd8dc;
}

.body--dark .horario-time {
  color: #b0bec5;
}

.body--dark .section-title {
  color: $color-green-light;
}

.body--dark .horarios-title {
  color: $color-green-light;
}

.body--dark .filters-title {
  color: $color-green-light;
}

.body--dark .info-label {
  color: #90a4ae;
}

.body--dark .horario-chip-modern {
  border-left-width: 4px;
}

.body--dark .filters-expansion {
  background: rgba(200, 230, 201, 0.08);
}
</style>
