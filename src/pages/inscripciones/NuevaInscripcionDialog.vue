<template>
  <q-dialog v-model="isDialogVisible" persistent>
    <q-card style="min-width: 800px; max-width: 900px">
      <q-card-section>
        <div class="text-h6">
          {{ editMode ? 'Editar Inscripción' : 'Nueva Inscripción' }}
        </div>
      </q-card-section>

      <q-stepper v-model="step" color="primary" persistent>
        <!-- Paso 1: Datos de la inscripción -->
        <q-step name="datos" title="Datos de Inscripción" :done="step > 'datos'">
          <div class="q-gutter-y-md">
            <!-- Selección de estudiante -->
            <div class="row items-center q-gutter-sm">
              <div class="col-md-3">
                <q-select ref="nivelSelect" v-model="localInscripcion.id_nivel" :options="nivelOptions" label="Nivel" option-label="label"
                  option-value="value" emit-value map-options outlined dense clearable :rules="[val => !!val || 'Seleccione un nivel']" />
              </div>
              <div class="col-md-7">
                <q-select ref="estudianteSelect" v-model="selectedEstudiante" :options="displayedEstudiantes"
                  option-label="displayName" label="Estudiante *" outlined :use-input="!props.editMode"
                  @filter="filterEstudiantes" @input-value="updateNewEstudianteName" @click.stop
                  @popup-show="onPopupShow" :readonly="props.editMode" :clearable="!props.editMode"
                  :rules="[val => !!val || 'Seleccione un estudiante']">
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No se encontraron estudiantes
                      </q-item-section>
                    </q-item>
                    <q-item clickable v-if="newEstudianteName" @click="addNewEstudiante">
                      <q-item-section avatar>
                        <q-icon name="add_circle" color="positive" />
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
              <div class="col-auto">
                <q-btn icon="person_add" color="secondary" label="Nuevo" @click="showNewStudentDialog = true" />
              </div>
            </div>


            <!-- Configuración de fechas -->
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <!-- Paquetes: scroller horizontal -->
                <div class="packages-row">
                  <div class="packages-scroll" ref="packagesContainer">
                    <div v-for="(pkg, i) in paquetesAvailable" :key="pkg.id" class="package-item" :data-pkg-id="pkg.id"
                      :style="{ animationDelay: (i * 60) + 'ms' }"
                      :class="{ recommended: isRecommended(pkg), selected: localInscripcion.id_paquete === pkg.id }">
                      <q-card class="q-mb-sm" clickable @click.stop.prevent="selectPackage(pkg)"
                        :bordered="localInscripcion.id_paquete === pkg.id">
                        <q-card-section>
                          <div class="text-subtitle1">{{ pkg.nombre }}</div>
                          <div class="text-caption q-mt-xs">Inicio: {{ formatDate(pkg.fecha_inicio) || '—' }} · Fin: {{
                            formatDate(pkg.fecha_vencimiento) || '—' }}</div>
                          <q-badge v-if="isRecommended(pkg)" color="amber" class="q-ml-sm recommended-badge">Recomendado
                            por
                            edad</q-badge>
                          <div class="text-caption">Cupo máximo: {{ pkg.max_estudiantes || '—' }}</div>
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
            <div class="row">
              <div class="col-4">
                <q-input ref="fechaInicioInput" v-model="localInscripcion.fecha_inicio" label="Fecha inicio *"
                  type="date" outlined :rules="[val => !!val || 'Campo requerido']" class="q-mt-md" />

              </div>
              <div class="col-4">
                <q-toggle v-model="inscripcionIndefinida" label="Inscripción indefinida" />

              </div>
              <div class="col-4">

                <q-input v-if="!inscripcionIndefinida" v-model="localInscripcion.meses_duracion"
                  label="Duración en meses *" type="number" outlined min="1"
                  :rules="[val => !!val || 'Campo requerido']" class="q-mt-sm" />
              </div>
            </div>
          </div>

          <q-stepper-navigation>
            <q-btn v-if="!inscripcionIndefinida" @click="stepPago" color="primary" label="Continuar a Pago" />
            <q-btn v-else @click="saveInscripcion" color="positive" label="Guardar Inscripción" />

            <q-btn flat @click="closeDialog" color="negative" label="Cancelar" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <!-- Paso 2: Pago (opcional) -->
        <q-step name="pago" title="Pago">


          <div class="q-mt-md">
            <div class="row q-col-gutter-md">
              <div class="col-md-4">
                <q-input v-model="nuevoPago.monto" label="Monto total" type="number" prefix="$" outlined readonly
                  :rules="[val => val > 0 || 'Monto debe ser positivo']" />
              </div>
              <div class="col-md-4" v-if="localInscripcion.fecha_fin">
                <q-input v-model="nuevoPago.meses_cubiertos" label="Meses cubiertos" type="number" outlined readonly
                  :rules="[val => val > 0 || 'Debe cubrir al menos 1 mes']" />
              </div>
              <div class="col-md-4">
                <q-select v-model="nuevoPago.metodo_pago" :options="metodosPago" label="Método de pago *" outlined
                  :rules="[val => !!val || 'Seleccione método']" />
              </div>
              <div class="col-12">
                <q-input v-model="nuevoPago.detalle" label="Observaciones" type="textarea" outlined />
              </div>
            </div>
          </div>

          <q-stepper-navigation>
            <q-btn @click="saveInscripcion" color="positive" label="Guardar Inscripción" />
            <q-btn flat @click="step = 'datos'" color="primary" label="Atrás" class="q-ml-sm" />
            <q-btn flat @click="closeDialog" color="negative" label="Cancelar" class="q-ml-sm" />
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
import PersonaDialog from "pages/estudiantes/PersonaDialog.vue";
import { agregarIscripcionPersona } from 'src/stores/inscripcion-store';

const $q = useQuasar()

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

function selectPackage(pkg) {
  if (!pkg) return
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

/* Card base: borde suave y fondo neutro */
.package-item .q-card {
  border: 2px solid rgba(16, 24, 40, 0.06);
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  overflow: hidden;
  /* clip el brillo dentro de la tarjeta */
  position: relative;
  /* para los pseudo-elementos de brillo */
}

/* Indicador circular en la esquina para el seleccionado */
.package-item.selected::after {
  content: '✔';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1E88E5, #1976D2);
  color: white;
  font-weight: 700;
  border-radius: 50%;
  box-shadow: 0 6px 18px rgba(30, 88, 165, 0.18);
  z-index: 6;
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
  transform: scale(1.04);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
  box-shadow: 0 12px 30px rgba(16, 24, 40, 0.14);
  border-color: rgba(30, 120, 220, 0.95);
  background: linear-gradient(180deg, #E8F2FF, #F5FAFF);
}

/* Estilo para recomendado (efecto reluciente) */
.package-item.recommended .q-card {
  box-shadow: 0 0 0 3px rgba(255, 200, 50, 0.08), 0 6px 18px rgba(255, 180, 20, 0.12);
  border-color: rgba(255, 180, 20, 0.6);
}

@keyframes glow {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 200, 50, 0.12);
  }

  50% {
    box-shadow: 0 0 20px 6px rgba(255, 200, 50, 0.14);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(255, 200, 50, 0.12);
  }
}

.package-item.recommended .q-card {
  animation: glow 2.2s infinite ease-in-out;
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

/* Línea gruesa (doble de la delgada) - arriba */
.package-item.recommended .q-card::before {
  top: 28%;
  height: 20px;
  /* gruesa */
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.12));
  opacity: 0.88;
  animation: diagLR 3.2s linear infinite;
}

/* Línea delgada - justo debajo, en paralelo */
.package-item.recommended .q-card::after {
  top: 36%;
  height: 5px;
  /* delgada (aprox la mitad) */
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.18));
  opacity: 0.95;
  animation: diagLR 2.6s linear infinite;
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
}

/* Ajustes de contraste para badge */
.recommended-badge {
  background: linear-gradient(90deg, #FFC107, #FFB300) !important;
  color: #1f2937 !important;
  border-radius: 8px;
  padding: 2px 6px;
}

/* Scrollbar suave en Webkit */
.packages-scroll::-webkit-scrollbar {
  height: 8px;
}

.packages-scroll::-webkit-scrollbar-thumb {
  background: rgba(16, 24, 40, 0.08);
  border-radius: 8px;
}
</style>
