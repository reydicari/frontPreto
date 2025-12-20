<template>
  <q-dialog v-model="isDialogVisible" persistent>
    <q-card class="dialog-card">
      <q-card-section class="row items-center justify-between dialog-header">
        <div class="dialog-title">
          <q-icon name="local_activity" size="28px" class="q-mr-sm" />
          {{ editMode ? 'Modificar Inscripción' : 'Nueva Inscripción' }}
        </div>
        <div>
          <q-btn flat dense round class="help-nueva-inscripcion help-btn" aria-label="Ayuda" title="Ayuda"
            @click.stop="onInscripcionHelpClick">
            <q-icon name="help_outline" />
          </q-btn>
        </div>
      </q-card-section>

      <q-stepper v-model="step" color="teal-7" animated persistent class="custom-stepper">
        <!-- Paso 1: Datos de la inscripción -->
        <q-step name="datos" title="Datos de Inscripción" icon="assignment" :done="step > 'datos'">
          <div class="q-gutter-y-md dialog-content">
            <!-- Selección de estudiante en una sola fila -->
            <div class="row q-col-gutter-sm items-end">
              <div class="col-12 col-sm-3">
                <q-select ref="nivelSelect" data-driver="nivel-select" v-model="localInscripcion.id_nivel"
                  :options="nivelOptions" label="Nivel *" option-label="label" option-value="value" emit-value
                  map-options outlined dense clearable :rules="[val => !!val || 'Seleccione un nivel']" />
              </div>
              <div class="col-12 col-sm-6">
                <q-select ref="estudianteSelect" data-driver="estudiante-select" v-model="selectedEstudiante"
                  :options="displayedEstudiantes" option-label="displayName" label="Estudiante *" outlined dense
                  :use-input="!props.editMode" @filter="filterEstudiantes" @input-value="updateNewEstudianteName"
                  @click.stop @popup-show="onPopupShow" :readonly="props.editMode" :clearable="!props.editMode"
                  :rules="[val => !!val || 'Seleccione un estudiante']">
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No se encontraron estudiantes
                      </q-item-section>
                    </q-item>
                    <q-item clickable v-if="newEstudianteName" @click="addNewEstudiante">
                      <q-item-section avatar>
                        <q-icon name="add_circle" class="text-teal-7" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Agregar: "{{ newEstudianteName }}"</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>

                  <template v-slot:selected-item="scope">
                    {{ scope.opt.displayName }}
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-sm-3">
                <q-btn icon="person_add" class="btn-add-student" label="Nuevo" data-driver="new-student-btn" unelevated
                  no-caps dense @click="showNewStudentDialog = true" style="width: 100%;" />
              </div>
            </div>


            <!-- Sección de paquetes -->
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div class="text-subtitle2 text-weight-medium q-mb-sm">
                  <q-icon name="inventory_2" size="20px" class="q-mr-xs" />
                  Seleccione un paquete
                </div>
                <!-- Paquetes: scroller horizontal -->
                <div class="packages-row">
                  <div class="packages-scroll" data-driver="packages-scroll" ref="packagesContainer">
                    <div v-for="(pkg, i) in visiblePaquetes" :key="pkg.id" class="package-item" :data-pkg-id="pkg.id"
                      :style="{ animationDelay: (i * 60) + 'ms' }"
                      :class="{ recommended: recommendationReason(pkg) !== null, selected: localInscripcion.id_paquete === pkg.id, taken: studentPackageIds.includes(pkg.id), overlap: hasHorarioOverlap(pkg) }">
                      <q-card class="q-mb-sm" clickable @click.stop.prevent="selectPackage(pkg)"
                        :bordered="localInscripcion.id_paquete === pkg.id">
                        <q-card-section>
                          <div class="text-subtitle1">{{ pkg.nombre }}</div>
                          <div class="row items-center q-mt-xs">
                            <div class="col-auto text-caption">Inicio: {{ formatDate(pkg.fecha_inicio) || '—' }} · Fin:
                              {{
                                formatDate(pkg.fecha_vencimiento) || '—' }}</div>
                            <div class="col-auto">
                              <q-badge v-if="recommendationReason(pkg) === 'edad'"
                                class="q-ml-sm badge-edad">Recomendado por
                                edad</q-badge>
                              <q-badge v-else-if="recommendationReason(pkg) === 'nivel'"
                                class="q-ml-sm badge-nivel">Recomendado por
                                nivel</q-badge>
                              <q-badge v-else-if="studentPackageIds.includes(pkg.id)" class="q-ml-sm badge-inscrito">Ya
                                inscrito</q-badge>
                              <q-badge v-else-if="hasHorarioOverlap(pkg)" class="q-ml-sm badge-overlap">Solapamiento de
                                horario</q-badge>
                            </div>
                          </div>
                          <div class="text-caption">
                            <q-icon name="group" size="14px" class="q-mr-xs" />
                            Cupo máximo: {{ pkg.max_estudiantes || '—' }}
                            <span class="q-ml-sm">
                              <q-badge v-if="pkg.disponible === 0" class="badge-sin-cupo">Sin cupo</q-badge>
                              <q-badge v-else-if="pkg.disponible <= 3 && pkg.disponible > 0" class="badge-cupo-bajo">
                                {{ pkg.disponible }} disponibles
                              </q-badge>
                              <span v-else class="text-weight-medium text-teal-8">{{ pkg.disponible == null ? '—' :
                                pkg.disponible
                                }} disponibles</span>
                            </span>
                          </div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="q-pa-sm">
                          <div v-if="pkg.horarios && pkg.horarios.length">
                            <div v-for="(h, i) in pkg.horarios" :key="i" class="q-mb-xs">
                              <div class="text-subtitle2">{{ getDiaLabel(h.dia) }}</div>
                              <div class="text-caption">{{ h.hora_inicio }} - {{ h.hora_fin }}</div>
                            </div>
                          </div>
                          <div v-else class="text-caption">Sin horarios</div>
                        </q-card-section>
                      </q-card>

                    </div>
                  </div>
                  <div class="row items-center justify-end q-mt-sm">
                    <q-btn dense flat icon="chevron_left" @click="scrollLeft" />
                    <q-btn dense flat icon="chevron_right" @click="scrollRight" />
                  </div>
                </div>
              </div>

            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-4">
                <q-input ref="fechaInicioInput" v-model="localInscripcion.fecha_inicio" label="Fecha inicio *"
                  type="date" outlined dense :rules="[val => !!val || 'Campo requerido']" />
              </div>
              <div class="col-12 col-sm-4">
                <div class="flex items-center" style="height: 40px;">
                  <q-toggle v-model="inscripcionIndefinida" label="Inscripción indefinida" color="deep-orange-6" />
                </div>
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-if="!inscripcionIndefinida" v-model="localInscripcion.meses_duracion"
                  label="Duración en meses *" type="number" outlined dense min="1"
                  :rules="[val => !!val || 'Campo requerido']" />
              </div>
            </div>
          </div>

          <q-stepper-navigation>
            <q-btn v-if="!inscripcionIndefinida" @click="stepPago" class="btn-continuar" label="Continuar a Pago"
              icon-right="arrow_forward" unelevated />
            <q-btn v-else @click="saveInscripcion" class="btn-guardar" label="Guardar Inscripción" icon-right="save"
              unelevated />

            <q-btn flat @click="closeDialog" class="btn-cancelar" label="Cancelar" icon="close" />
          </q-stepper-navigation>
        </q-step>

        <!-- Paso 2: Pago (opcional) -->
        <q-step name="pago" title="Pago" icon="payments">


          <div class="q-mt-md dialog-content">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input v-model="nuevoPago.monto" label="Monto total" type="number" prefix="$" outlined dense readonly
                  :rules="[val => val > 0 || 'Monto debe ser positivo']" />
              </div>
              <div class="col-12 col-sm-4" v-if="localInscripcion.fecha_fin">
                <q-input v-model="nuevoPago.meses_cubiertos" label="Meses cubiertos" type="number" outlined dense
                  readonly :rules="[val => val > 0 || 'Debe cubrir al menos 1 mes']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-select v-model="nuevoPago.metodo_pago" :options="metodosPago" label="Método de pago *" outlined dense
                  :rules="[val => !!val || 'Seleccione método']" />
              </div>
              <div class="col-12">
                <q-input v-model="nuevoPago.detalle" label="Observaciones" type="textarea" outlined dense rows="3" />
              </div>
            </div>
          </div>

          <q-stepper-navigation>
            <q-btn @click="saveInscripcion" class="btn-guardar" label="Guardar Inscripción" icon-right="save"
              unelevated />
            <q-btn flat @click="step = 'datos'" class="btn-atras" label="Atrás" icon="arrow_back" />
            <q-btn flat @click="closeDialog" class="btn-cancelar" label="Cancelar" icon="close" />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-card>
  </q-dialog>

  <!-- Diálogo para nuevo estudiante -->
  <persona-dialog v-model="showNewStudentDialog" :persona="nuevoEstudiante" @save="onStudentSaved" student-mode
    @close="closeDialogEstudiante" :inscripcion="true" :student="true" />
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive, nextTick } from 'vue'
import { useQuasar } from 'quasar'

import { listar } from 'src/stores/persona-store.js'
import { listarPaquetes } from 'src/stores/paquete-store'
import { listarNiveles } from 'src/stores/nivel'
import { listar as listarInscripciones } from 'src/stores/inscripcion-store'
import useDrive from 'src/composables/useDrive'
import PersonaDialog from "pages/estudiantes/PersonaDialog.vue";
import { agregarIscripcionPersona } from 'src/stores/inscripcion-store';

const $q = useQuasar()

// drive tour helpers
const { startInscripcionTour, attachToIconInscripcion } = useDrive()

async function onInscripcionHelpClick() {
  try {
    // Intentar iniciar la guía y loguear fallos para facilitar depuración cliente
    const drv = await startInscripcionTour().catch((err) => {
      console.warn('startInscripcionTour rejected:', err)
      return null
    })
    if (!drv) {
      console.warn('startInscripcionTour: no se pudo iniciar la guía (drv falsy)')
    }
  } catch (err) {
    console.error('Error iniciando guía de inscripción:', err)
  }
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentInscripcion: Object,
  editMode: Boolean
})

const emit = defineEmits(['update:modelValue', 'saved'])

const isDialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Estado del diálogo
const step = ref('datos')
const showNewStudentDialog = ref(false)
const registrarPago = ref(true)
const inscripcionIndefinida = ref(false)

//para el despleagable del select de estudiantes
const estudianteSelect = ref(null)
const nivelSelect = ref(null)

// Datos del formulario para una nueva inscripción
const localInscripcion = reactive({
  id_persona: null,
  id_paquete: null,
  id_nivel: null,
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: '',
  meses_duracion: 1,
  // 0: terminada, 1: en marcha, 2: sin comenzar
  estado: 1
})

const nuevoPago = ref({
  monto: 90,
  meses_cubiertos: 1,
  metodo_pago: 'Efectivo',
  detalle: '',
  estado: 1,
  fecha: new Date().toISOString().split('T')[0],
  usuario_cobrador: 'angel1',
  id_categoria: 1,
  id_inscripcion: null
})

const nuevoEstudiante = ref({
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  ci: '',
  complemento: '',
  telefono: '',
  fecha_nacimiento: '',
  tipo_persona: 'estudiante',
  categoria: null,
  estado: true,
  fotografia: null,
  biografia: '',
  experiencia: 0
})

const stepPago = () => {
  // Validar que haya un estudiante seleccionado y una fecha de inicio
  const estudianteOk = selectedEstudiante.value && (selectedEstudiante.value.id || selectedEstudiante.value.id_persona)
  const fechaOk = !!localInscripcion.fecha_inicio
  const nivelOk = !!localInscripcion.id_nivel

  if (!estudianteOk || !fechaOk) {
    if (!estudianteOk) {
      $q.notify({ type: 'negative', message: 'Seleccione un estudiante antes de continuar.' })
      // Intentar enfocar el select para ayudar al usuario
      try {
        if (estudianteSelect.value && typeof estudianteSelect.value.focus === 'function') {
          estudianteSelect.value.focus()
        }
      } catch (err) {
        console.warn('No se pudo enfocar el select de estudiante', err)
      }
    }
    if (!fechaOk) {
      $q.notify({ type: 'negative', message: 'Ingrese la fecha de inicio de la inscripción.' })
    }
    if (!nivelOk) {
      $q.notify({ type: 'negative', message: 'Seleccione un nivel antes de continuar.' })
      try {
        if (nivelSelect.value && typeof nivelSelect.value.focus === 'function') nivelSelect.value.focus()
      } catch (err) {
        console.warn('No se pudo enfocar select nivel', err)
      }
    }
    return
  }

  step.value = 'pago'
  if (!inscripcionIndefinida.value) {
    localInscripcion.fecha_fin = sumarMesesFecha(localInscripcion.fecha_inicio, localInscripcion.meses_duracion)
  }
  console.log('paso al paso 2', localInscripcion)
}
const sumarMesesFecha = (fechaI, meses) => {
  const fecha = new Date(fechaI);
  const diaOriginal = fecha.getDate();

  // Sumar los meses correctamente
  fecha.setMonth(fecha.getMonth() + parseInt(meses));

  // Ajustar el día si es necesario (por ejemplo, 31 de enero + 1 mes = 28/29 de febrero)
  if (fecha.getDate() !== diaOriginal) {
    fecha.setDate(0); // Va al último día del mes anterior
  }

  // Formatear la fecha de vuelta a 'yyyy-MM-dd'
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}
// Opciones para selects
const metodosPago = ['Efectivo', 'Transferencia', 'Tarjeta', 'Depósito', 'Otro']
const estudiantesOptions = ref([])
const allEstudiantes = ref([])
const paquetesAvailable = ref([])
const packagesContainer = ref(null)
const nivelOptions = ref([])
const studentPackageIds = ref([])
const studentInscripcionesList = ref([])
// Estado del componente
const selectedEstudiante = ref({})
const newEstudianteName = ref('')
const filteredEstudiantes = ref([])
const fechaInicioInput = ref(null)
const evitarAperturaSelect = ref(false)

function onPopupShow() {
  // Si acabamos de crear/seleccionar un estudiante y marcamos evitar apertura,
  // cerramos inmediatamente el popup para que no se despliegue.
  if (!evitarAperturaSelect.value) return
  nextTick(() => {
    try {
      if (estudianteSelect.value && typeof estudianteSelect.value.hidePopup === 'function') {
        estudianteSelect.value.hidePopup()
      }
      // retirar la bandera para permitir aperturas normales posteriores
      evitarAperturaSelect.value = false
    } catch (err) {
      console.warn('No se pudo ocultar popup al mostrar:', err)
      evitarAperturaSelect.value = false
    }
  })
}

watch(isDialogVisible, (visible) => {
  if (visible) {
    loadPaquetes()
    loadNiveles()
    // limpiar paquetes del estudiante cuando se abre el diálogo
    studentPackageIds.value = []
  }
});
// const loadStudents = async () => {
//   try {
//     allEstudiantes.value = await listar('estudiante')
//     estudiantesOptions.value = [...allEstudiantes.value.data]
//   } catch (error) {
//     console.log(error)
//     $q.notify({
//       type: 'negative',
//       message: 'Error al cargar estudiantes'
//     })
//   }
// }
const estudiantesWithDisplayName = computed(() => {
  return estudiantesOptions.value.map(e => ({
    ...e,
    displayName: `${e.nombres} ${e.apellido_paterno} ${e.apellido_materno}`
  }))
})

// Cuando estamos en modo edición queremos que el select muestre sólo al estudiante seleccionado
const displayedEstudiantes = computed(() => {
  if (props.editMode) {
    if (selectedEstudiante.value && Object.keys(selectedEstudiante.value).length) return [selectedEstudiante.value]
    return []
  }
  return filteredEstudiantes.value
})
// Filtrar estudiantes
function filterEstudiantes(val, update) {
  update(() => {
    if (val === '') {
      filteredEstudiantes.value = [...estudiantesWithDisplayName.value]
    } else {
      const needle = val.toLowerCase()
      filteredEstudiantes.value = estudiantesWithDisplayName.value.filter(
        e => e.displayName.toLowerCase().includes(needle))

      // Guardar el texto para posible nuevo estudiante
      newEstudianteName.value = val
    }
  })
}

// Actualizar cuando se escribe manualmente
function updateNewEstudianteName(val) {
  newEstudianteName.value = val
}

// Agregar nuevo estudiante desde el input
function addNewEstudiante() {
  // Separar nombres y apellidos (lógica básica)
  const parts = newEstudianteName.value.split(' ')
  nuevoEstudiante.value = {
    id: 0,
    nombres: parts[0] || '',
    apellido_paterno: parts[1] || '',
    apellido_materno: parts.slice(2).join(' ') || '',
    ci: '',
    complemento: '',
    telefono: '',
    fecha_nacimiento: '',
    tipo_persona: 'estudiante'
  }
  showNewStudentDialog.value = true
}
// Watch para cambios en el estudiante seleccionado
//watch(selectedEstudiante, (newVal) => {
//if (newVal && newVal.id) {
//emit('update:modelValue', newVal.id)
//}
//})
// Por esto:
watch(selectedEstudiante, (newVal) => {
  if (newVal && newVal.id !== 0) {
    localInscripcion.id_persona = newVal.id
    // cargar inscripciones del estudiante seleccionado
    loadInscripcionesForStudent(newVal.id)
  } else {
    studentPackageIds.value = []
    studentInscripcionesList.value = []
  }
})
// Calcular monto total automáticamente
watch(() => localInscripcion.meses_duracion, (newVal) => {
  if (newVal && !inscripcionIndefinida.value) {
    nuevoPago.value.meses_cubiertos = newVal
    nuevoPago.value.monto = 90 * newVal
  }
})


// Cargar opciones iniciales
async function loadNiveles() {
  try {
    const niveles = await listarNiveles()
    // formatear a { label, value } para usar con map-options + emit-value
    nivelOptions.value = (niveles || []).map(n => ({ value: n.id, label: n.nombre_nivel || n.nombre || n.label }))
  } catch (err) {
    console.error('Error cargando niveles', err)
    nivelOptions.value = []
  }
}

onMounted(async () => {
  await loadOptions()
  await loadPaquetes()
  // attach the tour icon listener if available
  try {
    const { attachToIconInscripcion } = useDrive()
    attachToIconInscripcion('.help-nueva-inscripcion')
  } catch {
    // ignore
  }
})
// Cargar estudiantes y disciplinas
async function loadOptions() {
  try {
    const params = {
      tipo_persona: 'estudiante',
      estado: true
    }
    allEstudiantes.value = await listar(params)
    estudiantesOptions.value = [...allEstudiantes.value.data]
    // Inicializar lista filtrada con todas las opciones (displayName ya disponible vía computed)
    filteredEstudiantes.value = estudiantesWithDisplayName.value.slice()
    // disciplinas cargadas si es necesario por otra parte del sistema
  } catch (error) {
    console.log(error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar opciones xxx'
    })
  }
}
// Cargar paquetes disponibles
async function loadPaquetes() {
  try {
    const res = await listarPaquetes()
    paquetesAvailable.value = Array.isArray(res) ? res : (res && res.data ? res.data : [])
    // preseleccionar el primer paquete si no hay ninguno seleccionado
    if (paquetesAvailable.value.length) {
      if (!localInscripcion.id_paquete) {
        localInscripcion.id_paquete = paquetesAvailable.value[0].id
      }
    }
    console.log('paquetes cargados', paquetesAvailable.value)
    // Si ya tenemos edad del estudiante, desplazar al primer paquete recomendado
    nextTick(() => {
      try {
        if (studentAge.value != null) {
          const firstRecommended = paquetesAvailable.value.find(p => isRecommended(p))
          if (firstRecommended && packagesContainer.value) {
            const el = packagesContainer.value.querySelector(`[data-pkg-id="${firstRecommended.id}"]`)
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
          }
        }
      } catch {
        // silently ignore
      }
    })
  } catch (err) {
    console.error('Error cargando paquetes', err)
    $q.notify({ type: 'negative', message: 'Error al cargar paquetes' })
  }
}

// Cargar inscripciones del estudiante y extraer los ids de paquete
async function loadInscripcionesForStudent(personaId) {
  if (!personaId) {
    studentPackageIds.value = []
    return
  }
  try {
    // Intentar pedir inscripciones filtradas por persona si el store lo soporta
    const res = await listarInscripciones({ id_persona: personaId })
    const list = Array.isArray(res) ? res : (res && res.data ? res.data : [])
    studentInscripcionesList.value = list
    const ids = []
    for (const ins of list) {
      const pid = ins.id_paquete || (ins.paquete && ins.paquete.id) || null
      if (pid != null) ids.push(pid)
    }
    studentPackageIds.value = Array.from(new Set(ids))
  } catch (err) {
    console.error('Error cargando inscripciones del estudiante', err)
    studentInscripcionesList.value = []
    studentPackageIds.value = []
  }
}

// Convertir "HH:MM" a minutos desde medianoche
function toMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null
  const parts = hhmm.split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

// Determina si dos horarios (mismo dia) se solapan
function horarioOverlap(h1, h2) {
  // h1/h2: { dia, hora_inicio, hora_fin }
  if (!h1 || !h2) return false
  if (h1.dia != h2.dia) return false
  const aStart = toMinutes(h1.hora_inicio)
  const aEnd = toMinutes(h1.hora_fin)
  const bStart = toMinutes(h2.hora_inicio)
  const bEnd = toMinutes(h2.hora_fin)
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false
  return aStart < bEnd && bStart < aEnd
}

// Determina si el paquete tiene solapamiento de horarios con alguna inscripción del estudiante
function hasHorarioOverlap(pkg) {
  if (!pkg || !pkg.horarios || !pkg.horarios.length) return false
  if (!studentInscripcionesList.value || !studentInscripcionesList.value.length) return false
  for (const ins of studentInscripcionesList.value) {
    const otherHorarios = ins.horarios || (ins.paquete && ins.paquete.horarios) || []
    for (const oh of otherHorarios) {
      for (const ph of pkg.horarios) {
        if (horarioOverlap(ph, oh)) return true
      }
    }
  }
  return false
}

// Si un paquete puede seleccionarse: no está ya tomado y no tiene solapamiento
function isPackageSelectable(pkg) {
  if (!pkg) return false
  if (studentPackageIds.value && studentPackageIds.value.includes(pkg.id)) return false
  if (hasHorarioOverlap(pkg)) return false
  return true
}

function selectPackage(pkg) {
  if (!pkg) return
  // impedir selección si no es selectable (ya inscrito o solapamiento)
  if (!isPackageSelectable(pkg)) {
    if (studentPackageIds.value && studentPackageIds.value.includes(pkg.id)) {
      $q.notify({ type: 'negative', message: 'El estudiante seleccionado ya está inscrito en este paquete.' })
    } else if (hasHorarioOverlap(pkg)) {
      $q.notify({ type: 'negative', message: 'Solapamiento de horario con otra inscripción.' })
    } else {
      $q.notify({ type: 'negative', message: 'El paquete no es seleccionable.' })
    }
    return
  }
  localInscripcion.id_paquete = pkg.id
  // desplazar la card seleccionada al centro del contenedor si es posible
  nextTick(() => {
    const container = packagesContainer.value
    if (!container) return
    const el = container.querySelector(`[data-pkg-id="${pkg.id}"]`)
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  })
}

function scrollLeft() {
  const c = packagesContainer.value
  if (!c) return
  c.scrollBy({ left: -320, behavior: 'smooth' })
}

function scrollRight() {
  const c = packagesContainer.value
  if (!c) return
  c.scrollBy({ left: 320, behavior: 'smooth' })
}

// helper para formatear fechas cortas
const formatDate = (d) => {
  if (!d) return ''
  try {
    const t = new Date(d)
    if (isNaN(t.getTime())) return d
    return t.toLocaleDateString()
  } catch {
    return d
  }
}
// mapear día numérico a etiqueta (1..7) si es necesario
const getDiaLabel = (v) => {
  const map = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
  }
  return map[v] || String(v || '')
}
// Edad del estudiante (años) si está disponible
const studentAge = computed(() => {
  const dob = selectedEstudiante.value && (selectedEstudiante.value.fecha_nacimiento || selectedEstudiante.value.fechaNacimiento)
  if (!dob) return null
  try {
    const b = new Date(dob)
    if (isNaN(b.getTime())) return null
    const diff = Date.now() - b.getTime()
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    return age
  } catch {
    return null
  }
})

// Determina si el paquete coincide con la edad del estudiante (soporta min, max o ambos)
function packageMatchesAge(pkg, age) {
  const min = pkg.edad_minima == null ? null : Number(pkg.edad_minima)
  const max = pkg.edad_maxima == null ? null : Number(pkg.edad_maxima)
  if (age == null) {
    // Si no hay edad disponible, solo aceptar paquetes sin restricciones de edad
    return min == null && max == null
  }
  if (min != null && max != null) return age >= min && age <= max
  if (min != null) return age >= min
  if (max != null) return age <= max
  return true
}

// Computed: paquetes visibles según selección de estudiante y nivel
const visiblePaquetes = computed(() => {
  const nivelId = localInscripcion.id_nivel
  const age = studentAge.value

  // Si NO hay estudiante ni nivel seleccionado -> mostrar solo paquetes sin id_nivel (genéricos)
  if (!selectedEstudiante.value && !nivelId) {
    return (paquetesAvailable.value || []).filter(p => p.id_nivel == null)
  }

  // En caso contrario, incluir paquetes que coincidan por edad o por nivel
  return (paquetesAvailable.value || []).filter(p => {
    const matchesAge = packageMatchesAge(p, age)
    const matchesNivel = nivelId ? (p.id_nivel == null ? false : p.id_nivel === nivelId) : false
    return matchesAge || matchesNivel
  })
})

// Al cambiar estudiante o nivel, seleccionar el primer paquete recomendado (por edad o por nivel).
watch([selectedEstudiante, () => localInscripcion.id_nivel], (/* newVals */) => {
  nextTick(() => {
    const list = (visiblePaquetes.value || []).filter(p => isPackageSelectable(p))
    if (!list.length) return

    // buscar primero paquetes recomendados por edad o nivel
    const firstRecommended = list.find(p => {
      const byAge = packageMatchesAge(p, studentAge.value) && (p.edad_minima != null || p.edad_maxima != null)
      const byNivel = localInscripcion.id_nivel && p.id_nivel === localInscripcion.id_nivel
      return !!(byAge || byNivel)
    })

    const pick = firstRecommended || list[0]
    if (pick) {
      localInscripcion.id_paquete = pick.id
      // desplazar al primer paquete seleccionado
      try {
        if (packagesContainer.value) {
          const el = packagesContainer.value.querySelector(`[data-pkg-id="${pick.id}"]`)
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        }
      } catch {
        // ignore
      }
    }
  })
})

// Recomienda paquete si la edad cae dentro del rango edad_minima / edad_maxima
function isRecommended(pkg) {
  if (!pkg) return false
  const min = pkg.edad_minima == null ? null : Number(pkg.edad_minima)
  const max = pkg.edad_maxima == null ? null : Number(pkg.edad_maxima)
  const age = studentAge.value
  if (age == null) return false
  if (min != null && age < min) return false
  if (max != null && age > max) return false
  // if neither min nor max defined, don't recommend
  if (min == null && max == null) return false
  return true
}

// Devuelve 'edad' | 'nivel' | null indicando la razón de recomendación
function recommendationReason(pkg) {
  if (!pkg) return null
  // prioridad: nivel (si coincide), luego edad (si rango definido y edad disponible)
  if (localInscripcion.id_nivel && pkg.id_nivel != null && pkg.id_nivel === localInscripcion.id_nivel) return 'nivel'
  const age = studentAge.value
  const min = pkg.edad_minima == null ? null : Number(pkg.edad_minima)
  const max = pkg.edad_maxima == null ? null : Number(pkg.edad_maxima)
  if (age == null) return null
  if (min == null && max == null) return null
  if (min != null && age < min) return null
  if (max != null && age > max) return null
  return 'edad'
}
const StudentToCreate = ref(new FormData())//guardar el estudiante, foto, archivos y luego la inscripcion que se va a crear
// Cuando se guarda un nuevo estudiante
function onStudentSaved(formData) {
  StudentToCreate.value = formData
  const newStudent = JSON.parse(formData.get('persona'))
  // Cerrar el desplegable de estudiantes si está abierto
  // Evitar que el popup se abra justo después de guardar
  evitarAperturaSelect.value = true
  // Limpiar el input (texto de búsqueda) y pedir que se oculte el popup
  if (estudianteSelect.value && typeof estudianteSelect.value.updateInputValue === 'function') {
    estudianteSelect.value.updateInputValue('') // quitar lo escrito en el input
  }
  nextTick(() => {
    if (estudianteSelect.value && typeof estudianteSelect.value.hidePopup === 'function') {
      estudianteSelect.value.hidePopup()
    }
  })

  // Cerrar el diálogo de nuevo estudiante
  showNewStudentDialog.value = false

  console.log('Nuevo estudiante guardado:', newStudent)

  // Crear el displayName para el nuevo estudiante
  const displayName = `${newStudent.nombres || ''} ${newStudent.apellido_paterno || ''} ${newStudent.apellido_materno || ''}`.trim();
  const studentOption = {
    ...newStudent,
    fullName: displayName,
    displayName: displayName // Asegurarse de que displayName esté definido
  };
  // Agregar el nuevo estudiante a las listas
  allEstudiantes.value.data.unshift(studentOption);

  // allEstudiantes.value.unshift(studentOption)
  estudiantesOptions.value = [studentOption, ...estudiantesOptions.value]

  // Actualizar el estudiante seleccionado
  selectedEstudiante.value = studentOption;
  localInscripcion.id_persona = newStudent.id || 0

  // Para el nuevo estudiante: limpiar el texto de búsqueda del select y ocultar las opciones
  if (estudianteSelect.value) {
    nextTick(() => {
      try {
        if (typeof estudianteSelect.value.updateInputValue === 'function') {
          estudianteSelect.value.updateInputValue('')
        }
        if (typeof estudianteSelect.value.hidePopup === 'function') {
          estudianteSelect.value.hidePopup()
        }
      } catch (err) {
        console.warn('No se pudo limpiar/ocultar el select de estudiante', err)
      }
    })
  }

  $q.notify({
    type: 'positive',
    message: 'Estudiante registrado correctamente'
  })
}

// Guardar inscripción
async function saveInscripcion() {
  // Validar que haya estudiante y fecha de inicio antes de guardar
  const estudianteOk = selectedEstudiante.value
  const fechaOk = !!localInscripcion.fecha_inicio
  const nivelOk = !!localInscripcion.id_nivel
  if (!estudianteOk || !fechaOk) {
    if (!estudianteOk) {
      $q.notify({ type: 'negative', message: 'Seleccione un estudiante antes de guardar la inscripción.' })
      try { if (estudianteSelect.value && typeof estudianteSelect.value.focus === 'function') estudianteSelect.value.focus() } catch (err) { console.warn('No se pudo enfocar select estudiante', err) }
    }
    if (!fechaOk) {
      $q.notify({ type: 'negative', message: 'Ingrese la fecha de inicio antes de guardar la inscripción.' })
      try { if (fechaInicioInput.value && typeof fechaInicioInput.value.focus === 'function') fechaInicioInput.value.focus() } catch (err) { console.warn('No se pudo enfocar fecha inicio', err) }
    }
    if (!nivelOk) {
      $q.notify({ type: 'negative', message: 'Seleccione un nivel antes de guardar la inscripción.' })
      try { if (nivelSelect.value && typeof nivelSelect.value.focus === 'function') nivelSelect.value.focus() } catch (err) { console.warn('No se pudo enfocar select nivel', err) }
    }
    return
  }
  try {
    const inscripcionData = {
      ...localInscripcion,
      fecha_fin: inscripcionIndefinida.value ? null : calculateEndDate(),
      pago: registrarPago.value ? { ...nuevoPago.value } : null
    }
    // Calcular estado: si la fecha de inicio es posterior a hoy => 2 (sin comenzar), sino 1 (en marcha)
    try {
      const today = new Date()
      // Normalizar horas para comparar sólo la fecha
      today.setHours(0, 0, 0, 0)
      const inicio = new Date(inscripcionData.fecha_inicio)
      inicio.setHours(0, 0, 0, 0)
      if (!isNaN(inicio.getTime())) {
        inscripcionData.estado = inicio.getTime() > today.getTime() ? 2 : 1
      } else {
        inscripcionData.estado = 1
      }
    } catch {
      inscripcionData.estado = 1
    }
    inscripcionData.fecha_creacion = new Date().toISOString()
    if (JSON.parse(JSON.stringify(selectedEstudiante.value)).id) {
      if (inscripcionIndefinida.value) {
        inscripcionData.fecha_fin = null
        inscripcionData.pago = null
        inscripcionData.meses_duracion = null
      }
      await agregarIscripcionPersona(inscripcionData)
    } else {
      StudentToCreate.value.append('inscripcion', JSON.stringify(inscripcionData))
      inscripcionData.persona = selectedEstudiante.value
      // await agregarIscripcionNormal(inscripcionData) StudentToCreate.value.get('persona')
      console.log('INSCRIPCION CON ESTUDIANTE CREADO: ', inscripcionData);
    }
    selectedEstudiante.value = localInscripcion
    $q.notify({
      type: 'positive',
      message: 'Inscripción actualizada correctamente'
    })

    // refrescar lista de inscripciones del estudiante para actualizar badges
    try {
      const pid = localInscripcion.id_persona || (selectedEstudiante.value && selectedEstudiante.value.id)
      if (pid) await loadInscripcionesForStudent(pid)
    } catch {
      // ignore
    }

    emit('saved')
    closeDialog()
  } catch (error) {
    console.log(error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar la inscripción'
    })
  }
}

// Calcular fecha final
function calculateEndDate() {
  if (!localInscripcion.fecha_inicio) return null

  const startDate = new Date(localInscripcion.fecha_inicio)
  startDate.setMonth(startDate.getMonth() + parseInt(localInscripcion.meses_duracion))
  return startDate.toISOString().split('T')[0]
}
// Cerrar diálogo persona nuevq
function closeDialogEstudiante() {
  showNewStudentDialog.value = false
}
// Cerrar diálogo
function closeDialog() {
  selectedEstudiante.value = localInscripcion
  emit('update:modelValue', false)
  resetForm()
}

// Resetear formulario
function resetForm() {
  step.value = 'datos'
  // resetear campos del objeto reactivo localInscripcion
  Object.assign(localInscripcion, {
    id_persona: null,
    id_paquete: null,
    id_nivel: null,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    meses_duracion: 1,
    estado: 1
  })
  nuevoPago.value = {
    monto: 0,
    meses_cubiertos: 1,
    metodo_pago: 'Efectivo',
    detalle: ''
  }
  registrarPago.value = false
  inscripcionIndefinida.value = false
}

// Inicializar con datos si es edición
watch(() => props.currentInscripcion, (newVal) => {
  if (newVal) {
    Object.assign(localInscripcion, {
      id_persona: newVal.id_persona,
      id_paquete: newVal.id_paquete ?? null,
      id_nivel: (newVal.id_nivel ?? (newVal.nivel && newVal.nivel.id)) || null,
      fecha_inicio: newVal.fecha_inicio || localInscripcion.fecha_inicio,
      meses_duracion: newVal.fecha_fin ? calculateMonthsDuration(newVal.fecha_inicio, newVal.fecha_fin) : 1,
      estado: newVal.estado ?? 1
    })

    // Asegurar que el estudiante seleccionado esté seteado en el select cuando estamos en modo edición
    try {
      if (newVal.persona) {
        const p = newVal.persona
        const displayName = `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim()
        selectedEstudiante.value = { ...p, displayName }
        localInscripcion.id_persona = p.id || newVal.id_persona || null
      } else if (newVal.id_persona) {
        // buscar en opciones cargadas
        const found = estudiantesOptions.value.find(e => e.id === newVal.id_persona) || (allEstudiantes.value && allEstudiantes.value.data && allEstudiantes.value.data.find(e => e.id === newVal.id_persona))
        if (found) {
          const displayName = `${found.nombres || ''} ${found.apellido_paterno || ''} ${found.apellido_materno || ''}`.trim()
          selectedEstudiante.value = { ...found, displayName }
        } else {
          // fallback mínimo
          selectedEstudiante.value = { id: newVal.id_persona, displayName: String(newVal.id_persona) }
        }
      }
    } catch {
      // ignore
    }

    if (!newVal.fecha_fin) {
      inscripcionIndefinida.value = true
    }

    if (newVal.pago) {
      registrarPago.value = true
      nuevoPago.value = { ...newVal.pago }
    }
  }
}, { immediate: true })

function calculateMonthsDuration(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
}
</script>

<style scoped>
/* Estilos del diálogo - Paleta verde y naranja escuela de fútbol */
.dialog-card {
  width: 95vw;
  max-width: 950px;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-content {
  overflow-y: auto;
  max-height: calc(90vh - 200px);
  padding-right: 4px;
}

/* Scrollbar para el contenido del diálogo */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: rgba(46, 125, 50, 0.05);
  border-radius: 8px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: rgba(46, 125, 50, 0.2);
  border-radius: 8px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: rgba(46, 125, 50, 0.35);
}

.dialog-header {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #558b2f 100%);
  color: white;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(27, 94, 32, 0.2);
  flex-shrink: 0;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  color: white;
}

.help-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  transition: all 0.3s ease;
}

.help-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

/* Stepper personalizado */
.custom-stepper {
  flex: 1;
  overflow-y: auto;
}

.custom-stepper :deep(.q-stepper__header) {
  background: linear-gradient(to right, #e8f5e9, #f1f8e9);
  flex-shrink: 0;
}

.custom-stepper :deep(.q-stepper__tab--active) {
  color: #1b5e20;
  font-weight: 600;
}

.custom-stepper :deep(.q-stepper__tab--active .q-stepper__dot) {
  background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%);
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.3);
}

.custom-stepper :deep(.q-stepper__content) {
  overflow: visible;
}

.custom-stepper :deep(.q-stepper__nav) {
  padding: 16px;
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

/* Botones de acción */
.btn-add-student {
  background: linear-gradient(135deg, #43a047 0%, #558b2f 100%);
  color: white;
  font-weight: 600;
  padding: 8px 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(67, 160, 71, 0.3);
}

.btn-add-student:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
}

.btn-continuar {
  background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%);
  color: white;
  font-weight: 600;
  padding: 10px 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-continuar::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #ff6f00, #f57c00);
  opacity: 0.8;
}

.btn-continuar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
}

.btn-guardar {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
  color: white;
  font-weight: 600;
  padding: 10px 24px;
  transition: all 0.3s ease;
}

.btn-guardar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(27, 94, 32, 0.4);
}

.btn-atras {
  color: #558b2f;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-atras:hover {
  background: rgba(85, 139, 47, 0.1);
  color: #2e7d32;
}

.btn-cancelar {
  color: #ef6c00;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancelar:hover {
  background: rgba(239, 108, 0, 0.1);
  color: #d84315;
}

/* Badges personalizados */
.badge-edad {
  background: linear-gradient(135deg, #7cb342 0%, #8bc34a 100%);
  color: white;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(124, 179, 66, 0.3);
}

.badge-nivel {
  background: linear-gradient(135deg, #43a047 0%, #66bb6a 100%);
  color: white;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(67, 160, 71, 0.3);
}

.badge-inscrito {
  background: #bdbdbd;
  color: #424242;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
}

.badge-overlap {
  background: linear-gradient(135deg, #ef6c00 0%, #f57c00 100%);
  color: white;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(239, 108, 0, 0.3);
}

.badge-sin-cupo {
  background: linear-gradient(135deg, #d84315 0%, #e64a19 100%);
  color: white;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(216, 67, 21, 0.3);
}

.badge-cupo-bajo {
  background: linear-gradient(135deg, #ff6f00 0%, #ff8f00 100%);
  color: white;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(255, 111, 0, 0.3);
  animation: pulse 2s infinite;
}

.packages-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px;
  -webkit-overflow-scrolling: touch;
}

.package-item {
  flex: 0 0 280px;
  min-width: 240px;
}

.packages-row .q-card {
  height: 100%;
}

/* Asegurar posicion relativa para pseudo-elementos */
.package-item {
  position: relative;
}

/* Card base: borde suave y fondo verde claro */
.package-item .q-card {
  border: 2px solid rgba(46, 125, 50, 0.15);
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff, #f1f8e9);
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

/* Indicador circular en la esquina para el seleccionado */
.package-item.selected::after {
  content: '✔';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1b5e20, #2e7d32);
  color: white;
  font-weight: 700;
  border-radius: 50%;
  box-shadow: 0 6px 18px rgba(27, 94, 32, 0.3);
  z-index: 6;
  animation: checkPulse 0.5s ease;
}

@keyframes checkPulse {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

/* Animación de aparición */
.package-item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeInUp .36s ease forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Estilo para seleccionado */
.package-item.selected .q-card {
  transform: scale(1.05);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
  box-shadow: 0 12px 30px rgba(27, 94, 32, 0.25);
  border-color: #2e7d32;
  background: linear-gradient(180deg, #e8f5e9, #f1f8e9);
}

/* Estilo para recomendado (efecto reluciente) */
.package-item.recommended .q-card {
  box-shadow: 0 0 0 3px rgba(124, 179, 66, 0.15), 0 6px 18px rgba(124, 179, 66, 0.2);
  border-color: #7cb342;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 0 3px rgba(124, 179, 66, 0.15), 0 6px 18px rgba(124, 179, 66, 0.2);
  }

  50% {
    box-shadow: 0 0 0 5px rgba(124, 179, 66, 0.25), 0 8px 24px rgba(124, 179, 66, 0.3);
  }

  100% {
    box-shadow: 0 0 0 3px rgba(124, 179, 66, 0.15), 0 6px 18px rgba(124, 179, 66, 0.2);
  }
}

.package-item.recommended .q-card {
  animation: glow 2s infinite ease-in-out;
}


.package-item.recommended .q-card::before,
.package-item.recommended .q-card::after {
  content: '';
  position: absolute;
  left: -60%;
  width: 220%;
  pointer-events: none;
  z-index: 2;
  transform: translateX(-100%) rotate(-25deg);
}

/* Línea gruesa - arriba */
.package-item.recommended .q-card::before {
  top: 28%;
  height: 18px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.1));
  opacity: 0.8;
  animation: diagLR 3s linear infinite;
}

/* Línea delgada - justo debajo, en paralelo */
.package-item.recommended .q-card::after {
  top: 36%;
  height: 4px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.15));
  opacity: 0.85;
  animation: diagLR 2.5s linear infinite;
}

@keyframes diagLR {
  0% {
    transform: translateX(-100%) rotate(-25deg);
  }

  100% {
    transform: translateX(100%) rotate(-25deg);
  }
}

.recommended-badge {
  font-weight: 600;
  border-radius: 8px;
  padding: 2px 6px;
}

/* Scrollbar suave en Webkit */
.packages-scroll::-webkit-scrollbar {
  height: 8px;
}

.packages-scroll::-webkit-scrollbar-track {
  background: rgba(46, 125, 50, 0.05);
  border-radius: 8px;
}

.packages-scroll::-webkit-scrollbar-thumb {
  background: rgba(46, 125, 50, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.packages-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(46, 125, 50, 0.35);
}

/* Paquetes que el estudiante ya tiene: apariencia plomeada */
.package-item.taken .q-card {
  opacity: 0.55;
  filter: grayscale(0.7);
  pointer-events: none;
}

.package-item.taken {
  pointer-events: auto;
  /* permitir scroll en el contenedor, pero la card no responde al click */
}

/* Estilo para paquetes con solapamiento: borde naranja para indicar conflicto */
.package-item.overlap .q-card {
  border-color: #ef6c00 !important;
  box-shadow: 0 0 0 2px rgba(239, 108, 0, 0.15), 0 4px 12px rgba(239, 108, 0, 0.2);
}

/* Responsive: Pantallas pequeñas */
@media (max-width: 599px) {
  .dialog-card {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .dialog-header {
    padding: 12px 16px;
  }

  .dialog-title {
    font-size: 1.2rem;
  }

  .dialog-title .q-icon {
    font-size: 24px !important;
  }

  .dialog-content {
    max-height: calc(100vh - 180px);
    padding: 12px;
  }

  .package-item {
    flex: 0 0 240px;
    min-width: 200px;
  }

  .btn-add-student {
    padding: 8px 16px;
    font-size: 0.875rem;
  }

  .custom-stepper :deep(.q-stepper__header) {
    flex-wrap: wrap;
  }

  .custom-stepper :deep(.q-stepper__tab) {
    min-width: 0;
    padding: 12px 8px;
  }
}

@media (max-width: 400px) {
  .package-item {
    flex: 0 0 200px;
    min-width: 180px;
  }

  .dialog-title {
    font-size: 1.1rem;
  }

  .packages-scroll {
    gap: 8px;
  }
}
</style>
