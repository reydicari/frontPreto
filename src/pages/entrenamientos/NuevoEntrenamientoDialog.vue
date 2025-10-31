<template>
  <q-dialog v-model:modelValue="modelValue" persistent>
    <q-card style="min-width: 720px; max-width: 920px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento' }}</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSave" class="q-gutter-md q-ml-xs" ref="formRef">
          <div class="row q-col-gutter-md">
            <q-input v-model="local.nombre" label="Nombre" outlined dense class="col-md-6"
              :rules="[v => !!v || 'Requerido']" ref="nombreRef" />

            <!-- El toggle "requiere_confirmacion" fue eliminado porque ya no es necesario -->

            <q-input v-model="local.fecha_inicio" label="Fecha inicio" type="date" outlined dense class="col-md-4"
              :rules="[v => !!v || 'Fecha inicio requerida']" ref="fechaInicioRef" />
            <q-select v-model="local.id_ubicacion" :options="ubicacionesFormateadas" option-label="label"
              option-value="value" label="Ubicación" outlined dense class="col-md-6" emit-value map-options
              :rules="[v => !!v || 'Ubicación requerida']" ref="ubicacionRef">
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

            <q-input v-model="local.fecha_fin" label="Fecha fin (opcional)" type="date" outlined dense class="col-md-4"
              :rules="[validarFechaFin]" ref="fechaFinRef"
              :hint="local.fecha_fin ? 'La fecha de fin es opcional' : 'Sin fecha fin, el entrenamiento estará activo hasta que se suspenda manualmente'" />

            <!-- Paquete se elige mediante las tarjetas disponibles más abajo -->

            <div class="col-md-12">
              <q-input v-model="local.observacion" label="Observación" type="textarea" outlined dense
                :rules="[validarObservacion]" counter maxlength="500" hint="Máximo 100 palabras" />
            </div>


            <!-- usuario_cancela es gestionado automáticamente al cancelar; no se muestra aquí -->

            <div class="col-md-12 q-mt-sm">
              <div class="text-subtitle2 q-mb-sm">
                Paquetes disponibles *
                <span v-if="!local.id_paquete && mostrarErrorPaquete" class="text-red text-caption"> (Requerido)</span>
              </div>
              <div class="packages-scroll" ref="packagesContainer"
                :class="{ 'error-border': !local.id_paquete && mostrarErrorPaquete }">
                <div v-for="p in paquetesList" :key="p.id" class="package-item-horizontal "
                  :class="{ selected: local.id_paquete === p.id }" @click="selectPaqueteCard(p)">

                  <!-- Tooltip con horarios en hover -->
                  <q-tooltip v-if="p.horarios && p.horarios.length" class="bg-white text-black shadow-4"
                    max-width="300px">
                    <div class="text-subtitle2 q-mb-sm">Horarios de {{ p.nombre }}</div>
                    <div v-for="h in p.horarios" :key="h.id" class="text-caption">
                      {{ h.dia }}: {{ h.hora_inicio }} - {{ h.hora_fin }}
                    </div>
                  </q-tooltip>

                  <div class="pkg-title">{{ p.nombre }}</div>
                  <div class="pkg-sub">Cupo: {{ p.max_estudiantes }} · {{ p.edad_minima }}-{{ p.edad_maxima }} años
                  </div>
                  <div class="pkg-inscritos">Inscritos: {{ p.inscritos || 0 }}</div>
                </div>
              </div>

              <!-- Botón copiar fechas del paquete seleccionado -->
              <div v-if="local.id_paquete && selectedPaquete" class="q-mt-sm">
                <q-btn flat icon="content_copy" label="Copiar fechas del paquete" color="white" class="bg-accent"
                  size="sm" @click="copiarFechasPaquete" />
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
import { ref, watch, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { listarPaquetes } from 'src/stores/paquete-store'
import { listarUbicaciones } from 'src/stores/ubicacion-store'

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

// Cargar paquetes desde el store y popular el carrusel
async function loadPaquetes() {
  try {
    const res = await listarPaquetes()
    paquetesList.value = Array.isArray(res) ? res : (res && res.data ? res.data : [])
    // preseleccionar el primer paquete si no hay ninguno seleccionado
    if (paquetesList.value.length && !local.value.id_paquete) {
      local.value.id_paquete = paquetesList.value[0].id
    }
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

onMounted(() => {
  loadPaquetes()
  loadUbicaciones()
})



function selectPaqueteCard(p) {
  local.value.id_paquete = p.id
  mostrarErrorPaquete.value = false // Limpiar error al seleccionar
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
  // Resetear errores visuales
  mostrarErrorPaquete.value = false

  // Validar formulario primero
  const isFormValid = formRef.value?.validate()

  // Validar paquete seleccionado
  if (!local.value.id_paquete) {
    mostrarErrorPaquete.value = true
    $q.notify({ type: 'negative', message: 'El paquete es requerido' })
    return
  }

  // Si el formulario no es válido, no continuar
  if (!isFormValid) {
    $q.notify({ type: 'negative', message: 'Por favor completa todos los campos requeridos' })
    return
  }

  // calcular estado automáticamente antes de emitir
  local.value.estado = computeEstado()
  // no enviar usuario_cancela desde el diálogo (se gestionará automáticamente si corresponde)
  const payload = { ...local.value }
  delete payload.usuario_cancela
  emit('save', payload)
  modelValue.value = false
} function onCancel() {
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

.packages-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px;
}

.package-item-horizontal {
  flex: 0 0 240px;
  min-width: 200px;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
}

.package-item-horizontal.selected {
  border-color: #1976D2;
  box-shadow: 0 10px 30px rgba(25, 118, 210, 0.12);
  transform: translateY(-4px);
}

.pkg-title {
  font-weight: 600
}

.pkg-sub {
  font-size: 12px;
  color: #6b7280
}

.pkg-inscritos {
  font-size: 11px;
  color: #059669;
  font-weight: 500;
  margin-top: 2px;
}

.error-border {
  border: 2px solid #f44336 !important;
  border-radius: 8px;
  padding: 4px;
}
</style>
