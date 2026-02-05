<template>
  <q-dialog v-model:modelValue="modelValue" :maximized="$q.screen.lt.md" persistent>
    <q-card class="dialog-card" :style="$q.screen.lt.md ? '' : 'min-width: 720px; max-width: 920px'">
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="fitness_center" size="32px" class="header-icon" />
            <div>
              <div class="header-title">{{ isEdit ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento' }}</div>
              <div class="header-subtitle">{{ currentStep === 1 ? 'Información básica' : 'Selección de entrenadores' }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="onCancel" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="currentStep === 1" class="dialog-content">
        <q-form @submit.prevent="onSave" class="q-gutter-md" ref="formRef">
          <div class="row q-col-gutter-md">
            <q-input v-model="local.nombre" label="Nombre del Entrenamiento" outlined class="col-12 col-md-6">
              <template v-slot:prepend>
                <q-icon name="edit_note" color="green-8" />
              </template>
              <template v-slot:append>
                <q-icon name="fitness_center" color="orange-7" />
              </template>
            </q-input>

            <q-input v-model="local.fecha_inicio" label="Fecha de Inicio" type="date" outlined class="col-12 col-md-6"
              :rules="[v => !!v || 'Fecha inicio requerida']" ref="fechaInicioRef">
              <template v-slot:prepend>
                <q-icon name="event" color="green-8" />
              </template>
            </q-input>

            <q-select v-model="local.id_ubicacion" :options="ubicacionesFormateadas" option-label="label"
              option-value="value" label="Ubicación" outlined class="col-12 col-md-6" emit-value map-options
              :rules="[v => !!v || 'Ubicación requerida']" ref="ubicacionRef">
              <template v-slot:prepend>
                <q-icon name="place" color="green-8" />
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>
                      Capacidad: {{ scope.opt.capacidad }} • {{ scope.opt.equipado ? 'Equipado' : 'No equipado' }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input v-model="local.fecha_fin" label="Fecha de Fin (Opcional)" type="date" outlined
              class="col-12 col-md-6" :rules="[validarFechaFin]" ref="fechaFinRef"
              :hint="local.fecha_fin ? 'Fecha de fin configurada' : 'Sin fecha fin: entrenamiento indefinido'">
              <template v-slot:prepend>
                <q-icon name="event_available" color="orange-7" />
              </template>
            </q-input>

            <div class="col-12">
              <q-input v-model="local.observacion" label="Observaciones" type="textarea" outlined
                :rules="[validarObservacion]" counter maxlength="100" hint="Máximo 100 palabras" rows="3">
                <template v-slot:prepend>
                  <q-icon name="description" color="green-8" />
                </template>
              </q-input>
            </div>


            <!-- usuario_cancela es gestionado automáticamente al cancelar; no se muestra aquí -->

            <div class="col-12 q-mt-md">
              <div class="packages-header q-mb-md">
                <q-icon name="inventory_2" size="24px" color="orange-7" class="q-mr-sm" />
                <span class="packages-title">Paquetes Disponibles</span>
                <q-chip v-if="local.id_paquete" size="sm" color="orange-7" text-color="white" icon="check_circle">
                  Seleccionado
                </q-chip>
                <span v-if="!local.id_paquete && mostrarErrorPaquete" class="text-red text-caption q-ml-sm">
                  <q-icon name="error" size="16px" /> Requerido
                </span>
              </div>
              <div class="packages-scroll" ref="packagesContainer"
                :class="{ 'error-border': !local.id_paquete && mostrarErrorPaquete }">
                <div v-for="p in paquetesList" :key="p.id" class="package-item-horizontal"
                  :class="{ selected: local.id_paquete === p.id }" @click="selectPaqueteCard(p)">

                  <!-- Badge de selección -->
                  <div v-if="local.id_paquete === p.id" class="selected-badge">
                    <q-icon name="check_circle" size="20px" />
                  </div>

                  <!-- Tooltip con horarios en hover -->
                  <q-tooltip v-if="p.horarios && p.horarios.length" class="custom-tooltip">
                    <div class="tooltip-header">
                      <q-icon name="schedule" size="18px" class="q-mr-xs" />
                      Horarios de {{ p.nombre }}
                    </div>
                    <q-separator class="q-my-xs" />
                    <div v-for="h in p.horarios" :key="h.id" class="tooltip-item">
                      <q-icon name="access_time" size="14px" class="q-mr-xs" />
                      {{ obtenerNombreDia(h.dia) }}: {{ h.hora_inicio }} - {{ h.hora_fin }}
                    </div>
                  </q-tooltip>

                  <div class="pkg-icon">
                    <q-icon :name="p?.disciplina?.icono" size="28px" />

                  </div>
                  <div class="pkg-title">{{ p.nombre }}</div>
                  <div class="pkg-sub">
                    <q-icon name="groups" size="14px" class="q-mr-xs" />
                    Cupo: {{ p.max_estudiantes }}
                  </div>
                  <div class="pkg-sub">
                    <q-icon name="cake" size="14px" class="q-mr-xs" />
                    {{ p.edad_minima }}-{{ p.edad_maxima }} años
                  </div>
                  <div class="pkg-sub">
                    <q-icon :name="p?.disciplina?.icono" size="14px" class="q-mr-xs" />
                    {{ p.disciplina?.nombre || 'Sin disciplina' }}
                  </div>
                  <div class="pkg-inscritos">
                    <q-icon name="person_add" size="14px" class="q-mr-xs" />
                    {{ p.inscritos || 0 }} inscrito(s)
                  </div>
                </div>
              </div>

              <!-- Botón copiar fechas del paquete seleccionado -->
              <div v-if="local.id_paquete && selectedPaquete" class="q-mt-md">
                <q-btn flat icon="content_copy" label="Copiar fechas del paquete" color="white" class="btn-copy-dates"
                  @click="copiarFechasPaquete">
                  <q-tooltip>Aplicar las fechas del paquete seleccionado</q-tooltip>
                </q-btn>
              </div>
            </div>

          </div>
        </q-form>
      </q-card-section>

      <!-- Paso 2: selección de entrenadores -->
      <q-card-section v-if="currentStep === 2" class="dialog-content">
        <div class="section-header q-mb-md">
          <div class="section-title">
            <q-icon name="group" size="28px" class="q-mr-sm" color="orange-7" />
            <span>Seleccionar Entrenadores</span>
          </div>
          <q-chip v-if="selectedCoaches.length > 0" color="green-8" text-color="white" icon="how_to_reg">
            {{ selectedCoaches.length }} seleccionado(s)
          </q-chip>
        </div>
        <q-table :rows="entrenadoresList" :columns="coachColumns" row-key="id" selection="multiple"
          v-model:selected="selectedCoaches" :loading="loadingCoaches" :grid="$q.screen.lt.sm" class="coaches-table"
          :rows-per-page-options="[5, 10, 20]" :pagination="{ rowsPerPage: 5 }">
          <template v-slot:body-cell-edad="props">
            <q-td :props="props">{{ calcularEdad(props.row.fecha_nacimiento) }}</q-td>
          </template>

          <!-- Vista grid para móviles -->
          <template v-slot:item="props">
            <div class="q-pa-xs col-12">
              <q-card flat bordered class="coach-mobile-card" @click="toggleCoachSelection(props.row)"
                :class="{ 'selected': isCoachSelected(props.row) }">
                <q-card-section class="q-pa-md">
                  <div class="row items-center">
                    <q-checkbox :model-value="isCoachSelected(props.row)"
                      @update:model-value="toggleCoachSelection(props.row)" color="orange-7" class="q-mr-md" />
                    <q-avatar size="48px" class="coach-avatar q-mr-md">
                      <q-icon name="person" size="28px" />
                    </q-avatar>
                    <div class="col">
                      <div class="coach-name">{{ props.row.nombres }} {{ props.row.apellido_paterno }}</div>
                      <div class="coach-info">
                        <q-icon name="phone" size="14px" class="q-mr-xs" />
                        {{ props.row.telefono }}
                      </div>
                      <div class="coach-info">
                        <q-icon name="cake" size="14px" class="q-mr-xs" />
                        {{ calcularEdad(props.row.fecha_nacimiento) }} años
                      </div>
                    </div>
                    <q-icon v-if="isCoachSelected(props.row)" name="check_circle" size="24px" color="orange-7" />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-separator />

      <!-- Stepper actions -->
      <q-card-actions align="right" class="dialog-actions">
        <q-btn flat label="Cancelar" color="brown-7" icon="close" @click="onCancel" class="btn-cancel" />
        <q-btn v-if="currentStep === 1" unelevated label="Siguiente" color="white" class="btn-next"
          icon-right="arrow_forward" @click="goToStep2">
          <q-icon name="sports_martial_arts" size="18px" class="q-mr-xs" />
        </q-btn>
        <div v-else class="row q-gutter-sm">
          <q-btn flat label="Volver" color="green-8" icon="arrow_back" @click="currentStep = 1" class="btn-back" />
          <q-btn unelevated label="Guardar Entrenamiento" color="white" class="btn-save" icon="save" @click="onSave" />
        </div>
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
import { ref, watch, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { listarPaquetes } from 'src/stores/paquete-store'
import { listarUbicaciones } from 'src/stores/ubicacion-store'
import { listar } from 'src/stores/persona-store'

const $q = useQuasar()

const props = defineProps({
  modelValue: Boolean,
  training: { type: Object, default: () => ({}) },
  paquetes: { type: Array, default: () => [] },
  ubicaciones: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const modelValue = ref(props.modelValue)
const paquetesList = ref(props.paquetes || [])
const ubicacionesList = ref([])
const packagesContainer = ref(null)
const formRef = ref(null)
const nombreRef = ref(null)
const fechaInicioRef = ref(null)
const fechaFinRef = ref(null)
const ubicacionRef = ref(null)
const mostrarErrorPaquete = ref(false)
// Stepper
const currentStep = ref(1)

// Entrenadores (paso 2)
const entrenadoresList = ref([])
const loadingCoaches = ref(false)
const selectedCoaches = ref([])
const coachColumns = [
  { name: 'nombres', label: 'Nombres', field: row => `${row.nombres}` },
  { name: 'apellido_paterno', label: 'Apellido Paterno', field: 'apellido_paterno' },
  { name: 'apellido_materno', label: 'Apellido Materno', field: 'apellido_materno' },
  { name: 'telefono', label: 'Teléfono', field: 'telefono' },
  { name: 'edad', label: 'Edad', field: 'fecha_nacimiento' }
]

// Computed para formatear ubicaciones para el select
const ubicacionesFormateadas = computed(() => {
  return ubicacionesList.value.map(u => ({
    label: u.nombre,
    value: u.id,
    nombre: u.nombre,
    capacidad: u.capacidad,
    equipado: u.equipado
  }))
})

const defaultStart = new Date().toISOString().split('T')[0]
function addMonthsStr(dateStr, months) { const d = new Date(dateStr); d.setMonth(d.getMonth() + months); return d.toISOString().split('T')[0] }

const local = ref({
  id: null,
  nombre: '',
  estado: 1,
  fecha_inicio: defaultStart,
  fecha_fin: '', // Iniciar vacío para permitir entrenamientos indefinidos
  observacion: '',
  id_paquete: null,
  id_ubicacion: null
})

const isEdit = ref(!!props.training && !!props.training.id)

// Estado se calcula automáticamente a partir de las fechas (0: Terminado, 1: En marcha, 2: Sin comenzar, 3: Cancelado)

const pkgDetailsOpen = ref(false)
const selectedPackage = ref(null)

// Computed para encontrar el paquete seleccionado
const selectedPaquete = computed(() => {
  return paquetesList.value.find(p => p.id === local.value.id_paquete) || null
})

// Watcher para actualizar ubicación por defecto cuando se cargan las ubicaciones
watch(ubicacionesList, (newUbicaciones) => {
  if (newUbicaciones.length && !local.value.id_ubicacion) {
    const petroambiental = newUbicaciones.find(u => u.nombre === 'PETROAMBIENTAL')
    if (petroambiental) {
      local.value.id_ubicacion = petroambiental.id
    }
  }
})

watch(() => props.modelValue, v => modelValue.value = v)
watch(modelValue, v => emit('update:modelValue', v))
watch(() => props.training, (t) => {
  isEdit.value = !!t && !!t.id
  if (t && Object.keys(t || {}).length) {
    local.value = {
      id: t.id ?? null,
      nombre: t.nombre || '',
      fecha_inicio: t.fecha_inicio || defaultStart,
      fecha_fin: t.fecha_fin || addMonthsStr(t.fecha_inicio || defaultStart, 6),
      observacion: t.observacion || '',
      id_paquete: (t.id_paquete && (t.id_paquete.id ?? t.id_paquete)) || null,
      id_ubicacion: (t.id_ubicacion && (t.id_ubicacion.id ?? t.id_ubicacion)) || (ubicacionesList.value.find(u => u.nombre === 'PETROAMBIENTAL')?.id ?? null),
      estado: computeEstado(t.fecha_inicio || defaultStart, t.fecha_fin || addMonthsStr(t.fecha_inicio || defaultStart, 6))
    }
  } else {
    // nuevo
    local.value = {
      id: null,
      nombre: '',
      fecha_inicio: defaultStart,
      fecha_fin: '', // Iniciar vacío para permitir entrenamientos indefinidos
      observacion: '',
      id_paquete: null,
      id_ubicacion: (ubicacionesList.value.find(u => u.nombre === 'PETROAMBIENTAL')?.id ?? null),
      estado: computeEstado(defaultStart, '')
    }
  }
}, { immediate: true })

// Si vienen entrenadores en props.training, preseleccionarlos (acepta ids o objetos)
watch(() => props.training, async (t) => {
  if (t && Array.isArray(t.entrenadores) && t.entrenadores.length) {
    // ensure coaches list is loaded
    await loadEntrenadores()
    const sel = []
    for (const e of t.entrenadores) {
      if (e && typeof e === 'object') {
        const found = entrenadoresList.value.find(x => String(x.id) === String(e.id))
        sel.push(found || e)
      } else {
        const found = entrenadoresList.value.find(x => String(x.id) === String(e))
        if (found) sel.push(found)
        else sel.push({ id: e })
      }
    }
    selectedCoaches.value = sel
    // also keep the local model in sync with full objects
    local.value.entrenadores = sel
  } else {
    selectedCoaches.value = []
    local.value.entrenadores = []
  }
}, { immediate: true })

// Cargar paquetes desde el store y popular el carrusel
async function loadPaquetes() {
  try {
    const res = await listarPaquetes()
    paquetesList.value = Array.isArray(res) ? res : (res && res.data ? res.data : [])
    console.log('Paquetes cargados en NuevoEntrenamientoDialog:', paquetesList.value)
    // preseleccionar el primer paquete si no hay ninguno seleccionado
    // if (paquetesList.value.length && !local.value.id_paquete) {
    //   local.value.id_paquete = paquetesList.value[0].id
    // }
  } catch (err) {
    console.error('Error cargando paquetes en NuevoEntrenamientoDialog:', err)
    // notificar suavemente
    // (usar $q.notify no disponible aquí si no se importa; omitimos notificación)
  }
}

// Cargar ubicaciones desde el store
async function loadUbicaciones() {
  try {
    const res = await listarUbicaciones()
    ubicacionesList.value = Array.isArray(res) ? res : (res && res.data ? res.data : [])

    // Seleccionar por defecto la ubicación 'PETROAMBIENTAL' si existe
    const petroambiental = ubicacionesList.value.find(u => u.nombre === 'PETROAMBIENTAL')
    if (petroambiental && !local.value.id_ubicacion) {
      local.value.id_ubicacion = petroambiental.id
    }
  } catch (err) {
    console.error('Error cargando ubicaciones en NuevoEntrenamientoDialog:', err)
  }
}

// Helpers para selección de coaches en móvil
function isCoachSelected(coach) {
  return selectedCoaches.value.some(c => c.id === coach.id)
}

function toggleCoachSelection(coach) {
  const index = selectedCoaches.value.findIndex(c => c.id === coach.id)
  if (index > -1) {
    selectedCoaches.value.splice(index, 1)
  } else {
    selectedCoaches.value.push(coach)
  }
}

onMounted(() => {
  loadPaquetes()
  loadUbicaciones()
  // no cargamos entrenadores de inicio; se cargan al pasar al paso 2
})

// Cargar entrenadores
async function loadEntrenadores() {
  loadingCoaches.value = true
  try {
    // algunos lugares usan listar('entrenador') pasando un string
    const res = await listar({ tipo_persona: 'entrenador' })
    entrenadoresList.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('Error cargando entrenadores:', e)
    entrenadoresList.value = []
  } finally {
    loadingCoaches.value = false
  }
}

// Calcular edad desde fecha de nacimiento (YYYY-MM-DD o ISO)
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return ''
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

// Ir al paso 2 validando primero el paso 1
async function goToStep2() {
  mostrarErrorPaquete.value = false

  // Validar nombre
  if (!local.value.nombre || local.value.nombre.trim() === '') {
    $q.notify({ type: 'negative', message: 'El nombre es requerido' })
    if (nombreRef.value) nombreRef.value.validate()
    return
  }

  const isFormValid = formRef.value?.validate()
  if (!isFormValid) {
    $q.notify({ type: 'negative', message: 'Por favor completa todos los campos requeridos' })
    return
  }

  if (!local.value.id_paquete) {
    mostrarErrorPaquete.value = true
    $q.notify({ type: 'negative', message: 'El paquete es requerido' })
    return
  }

  // cargar entrenadores y cambiar a paso 2
  await loadEntrenadores()
  currentStep.value = 2
}



function selectPaqueteCard(p) {
  local.value.id_paquete = p.id
  mostrarErrorPaquete.value = false // Limpiar error al seleccionar

  // Si el nombre está vacío, copiar el nombre del paquete
  if (!local.value.nombre || local.value.nombre.trim() === '') {
    local.value.nombre = p.nombre
  }
}

// Función para convertir número de día a nombre
function obtenerNombreDia(numeroDia) {
  const dias = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo',
    0: 'Domingo' // Por si usan 0 para domingo
  }
  return dias[numeroDia] || `Día ${numeroDia}`
}

function validarObservacion(val) {
  if (!val) return true // Observación es opcional
  const palabras = val.trim().split(/\s+/).filter(word => word.length > 0)
  if (palabras.length > 100) {
    return `Máximo 100 palabras (actualmente: ${palabras.length})`
  }
  return true
}

function validarFechaFin(val) {
  if (!val) return true // Fecha fin es opcional

  if (!local.value.fecha_inicio) {
    return 'Debe establecer primero la fecha de inicio'
  }

  const fechaInicio = new Date(local.value.fecha_inicio)
  const fechaFin = new Date(val)

  // Calcular fecha mínima (1 mes después de fecha inicio)
  const fechaMinima = new Date(fechaInicio)
  fechaMinima.setMonth(fechaMinima.getMonth() + 1)

  if (fechaFin < fechaMinima) {
    return 'La fecha fin debe ser al menos 1 mes después de la fecha de inicio'
  }

  return true
}

function copiarFechasPaquete() {
  const paquete = selectedPaquete.value
  if (paquete && paquete.fecha_inicio) {
    local.value.fecha_inicio = paquete.fecha_inicio
    // Para fecha_fin usar fecha_vencimiento del paquete si existe, sino limpiar
    if (paquete.fecha_vencimiento) {
      local.value.fecha_fin = paquete.fecha_vencimiento
    } else {
      local.value.fecha_fin = '' // Limpiar para entrenamiento indefinido
    }
  }
}

function computeEstado() {
  const hoy = new Date()
  const inicio = local.value.fecha_inicio ? new Date(local.value.fecha_inicio) : null
  const fin = local.value.fecha_fin ? new Date(local.value.fecha_fin) : null

  // Si no hay fecha de fin, el entrenamiento puede estar en marcha indefinidamente
  if (fin && fin < hoy) return 0 // Terminado
  if (inicio && inicio <= hoy && (!fin || fin >= hoy)) return 1 // En marcha
  if (inicio && inicio > hoy) return 2 // Sin comenzar
  return 2
}

function onSave() {
  // Si estamos en el paso 1 y llaman a guardar, llevar al paso 2
  if (currentStep.value === 1) {
    goToStep2()
    return
  }

  // --- Estamos en el paso 2: finalizar sin volver a validar el formulario del paso 1 ---
  // Resetear errores visuales (por si acaso)
  mostrarErrorPaquete.value = false

  // Calcular estado automáticamente antes de emitir
  local.value.estado = computeEstado()

  // Preparar payload. Los entrenadores son opcionales — puede ser vacío.
  // sincronizar local.entrenadores con la selección actual (objetos)
  local.value.entrenadores = (selectedCoaches.value || []).map(c => ({ ...c }))
  const payload = { ...local.value }
  // ids para backend
  payload.entrenadores = (selectedCoaches.value || []).map(c => c.id || c)
  // incluir objetos completos para uso en la UI/lista local
  payload.entrenadores_obj = (selectedCoaches.value || []).map(c => ({ ...c }))
  delete payload.usuario_cancela

  emit('save', payload)
  modelValue.value = false

  // resetear estado interno para la próxima apertura
  currentStep.value = 1
  selectedCoaches.value = []
}

function onCancel() {
  emit('cancel')
  modelValue.value = false
}
</script>

<style scoped lang="scss">
/* Paleta de colores verde-marrón tierra/naturaleza con acentos naranja */
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-sage: #8bc34a;
$color-orange: #ff9800;
$color-orange-dark: #f57c00;
$color-orange-light: #ffb74d;
$color-bark: #5d4037;
$color-wood: #795548;
$color-earth: #8d6e63;
$color-clay: #a1887f;
$color-sand: #bcaaa4;

$pastel-mint: #c8e6c9;
$pastel-lime: #dcedc8;
$pastel-sage: #f1f8e9;
$pastel-orange: #ffe0b2;
$pastel-sand: #efebe9;
$pastel-clay: #d7ccc8;

/* Dialog Card */
.dialog-card {
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

/* Header */
.dialog-header {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  padding: 20px 24px;
  flex-shrink: 0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    color: white;
  }

  .header-icon {
    background: rgba(255, 255, 255, 0.2);
    padding: 12px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .header-title {
    font-size: 1.4rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .header-subtitle {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-top: 2px;
  }
}

/* Contenido */
.dialog-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  /* Scroll suave */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  /* Scrollbar personalizado */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: $pastel-sage;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-orange;
    border-radius: 4px;

    &:hover {
      background: $color-orange-dark;
    }
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: $color-forest;
  display: flex;
  align-items: center;
}

.packages-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.packages-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: $color-forest;
}

/* Inputs personalizados */
:deep(.q-field--outlined .q-field__control) {
  border-radius: 12px;
  transition: all 0.3s ease;

  &:before {
    border-color: rgba($color-forest, 0.3);
  }
}

:deep(.q-field--outlined.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 2px rgba($color-orange, 0.2);

  &:before {
    border-color: $color-orange;
    border-width: 2px;
  }
}

:deep(.q-field__label) {
  color: $color-moss;
  font-weight: 500;
}

:deep(.q-field--focused .q-field__label) {
  color: $color-orange-dark;
}

/* Paquetes scroll */
.packages-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px;
  border-radius: 8px;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: $pastel-sage;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-leaf;
    border-radius: 4px;

    &:hover {
      background: $color-moss;
    }
  }
}

.package-item-horizontal {
  position: relative;
  flex: 0 0 260px;
  min-width: 220px;
  border-radius: 16px;
  padding: 16px;
  background: white;
  border: 2px solid rgba($color-forest, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, $color-leaf 0%, $color-orange 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 12px 24px rgba($color-forest, 0.2);
    border-color: $color-orange;

    &::before {
      opacity: 1;
    }

    .pkg-icon {
      transform: scale(1.1) rotate(5deg);
      color: $color-orange;
    }
  }

  &.selected {
    border-color: $color-orange;
    background: linear-gradient(135deg, $pastel-orange 0%, $pastel-mint 100%);
    box-shadow: 0 12px 32px rgba($color-orange, 0.3);
    transform: translateY(-6px);

    &::before {
      opacity: 1;
    }

    .pkg-title {
      color: $color-orange-dark;
    }

    .pkg-icon {
      color: $color-orange;
      transform: scale(1.15);
    }
  }
}

.selected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: $color-orange;
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba($color-orange, 0.4);
  animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pkg-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.pkg-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: $color-forest;
  margin-bottom: 8px;
  line-height: 1.3;
}

.pkg-sub {
  font-size: 0.85rem;
  color: $color-wood;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.pkg-inscritos {
  font-size: 0.85rem;
  color: $color-orange-dark;
  font-weight: 600;
  margin-top: 8px;
  padding: 6px 12px;
  background: rgba($color-orange, 0.1);
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}

.error-border {
  border: 2px solid #f44336 !important;
  border-radius: 8px;
  padding: 4px;
  animation: shake 0.5s;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

/* Tooltip personalizado */
.custom-tooltip {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: 320px;
}

.tooltip-header {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.tooltip-item {
  font-size: 0.85rem;
  margin: 4px 0;
  display: flex;
  align-items: center;
  opacity: 0.95;
}

/* Tabla de entrenadores */
.coaches-table {
  border-radius: 12px;
  overflow: hidden;

  :deep(thead) {
    background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);

    th {
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  :deep(tbody tr:nth-child(even)) {
    background: rgba($color-leaf, 0.05);
  }

  :deep(tbody tr:hover) {
    background: rgba($color-leaf, 0.1);
  }
}

/* Card móvil de coaches */
.coach-mobile-card {
  border-radius: 16px;
  background: white;
  border: 2px solid rgba($color-forest, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: $color-orange;
    box-shadow: 0 4px 12px rgba($color-forest, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }

  &.selected {
    border-color: $color-orange;
    background: linear-gradient(135deg, $pastel-orange 0%, white 100%);
    box-shadow: 0 4px 16px rgba($color-orange, 0.2);
  }
}

.coach-avatar {
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
  color: white;
}

.coach-name {
  font-weight: 700;
  font-size: 1rem;
  color: $color-forest;
  margin-bottom: 4px;
}

.coach-info {
  font-size: 0.85rem;
  color: $color-wood;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
}

/* Acciones del dialog */
.dialog-actions {
  padding: 16px 24px;
  background: linear-gradient(135deg, white 0%, $pastel-sage 100%);
  flex-shrink: 0;
}

.btn-next,
.btn-save {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-dark 100%);
  font-weight: 700;
  padding: 10px 28px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba($color-orange, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: none;
  letter-spacing: 0.5px;

  &:hover {
    background: linear-gradient(135deg, $color-orange-dark 0%, $color-orange 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($color-orange, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-back {
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba($color-forest, 0.1);
  }
}

.btn-cancel {
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba($color-bark, 0.1);
  }
}

.btn-copy-dates {
  background: linear-gradient(135deg, $color-leaf 0%, $color-sage 100%);
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, $color-sage 0%, $color-leaf 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($color-leaf, 0.3);
  }
}

/* Responsivo */
@media (max-width: 768px) {
  .dialog-header {
    padding: 16px 20px;

    .header-icon {
      padding: 8px;
      width: 48px;
      height: 48px;

      .q-icon {
        font-size: 24px;
      }
    }

    .header-title {
      font-size: 1.1rem;
    }

    .header-subtitle {
      font-size: 0.85rem;
    }
  }

  .dialog-content {
    padding: 16px;
  }

  .packages-scroll {
    gap: 8px;
  }

  .package-item-horizontal {
    flex: 0 0 200px;
    min-width: 180px;
    padding: 10px;

    &.selected {
      transform: translateY(-2px);
    }
  }

  .pkg-title {
    font-size: 0.95rem;
  }

  .pkg-sub {
    font-size: 0.8rem;
  }
}

@media (max-width: 599px) {
  .dialog-card {
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }

  .dialog-content {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
  }

  .section-title {
    font-size: 1rem;
  }

  .packages-title {
    font-size: 1rem;
  }

  .package-item-horizontal {
    flex: 0 0 200px;
    min-width: 180px;
    padding: 14px;
  }

  .pkg-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 8px;
  }

  .dialog-actions {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 8px;

    .q-btn {
      flex: 1;
      min-width: 120px;
      font-size: 0.9rem;
      padding: 8px 16px;
    }
  }

  :deep(.q-field) {
    margin-bottom: 12px;
  }

  :deep(.q-input .q-field__control) {
    font-size: 0.95rem;
  }

  .coach-mobile-card {
    .coach-avatar {
      width: 44px;
      height: 44px;
    }

    .coach-name {
      font-size: 0.95rem;
    }

    .coach-info {
      font-size: 0.8rem;
    }
  }
}
</style>
