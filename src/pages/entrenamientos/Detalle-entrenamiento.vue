<template>
  <q-card style="min-width: 600px; max-width: 800px">
    <q-card-section>
      <div class="text-h6 q-ma-none">Detalles del Entrenamiento</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-y-md">
        <div class="col-12">
          <div class="text-h5">{{ training.nombre }}</div>
          <div class="text-subtitle1 text-grey-10">
            <q-icon size="lg" :name="training.paquete?.disciplina?.icono || 'sports'" class="q-mr-sm" />
            {{ training.paquete?.disciplina?.nombre || 'Sin disciplina' }}
          </div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Estado:</div>
          <div>
            <q-badge :color="getStatusColor(training.estado)" :label="getStatusLabel(training.estado)" />
          </div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Fecha Inicio:</div>
          <div>{{ formatDate(training.fecha_inicio) }}</div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Fecha Fin:</div>
          <div v-if="training.fecha_fin">{{ formatDate(training.fecha_fin) }}</div>
          <q-badge v-else color="info" label="Indefinido" />
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Paquete:</div>
          <div>{{ training.paquete?.nombre || 'Sin paquete' }}</div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Nivel:</div>
          <div>{{ training.paquete?.nivel?.nombre_nivel || 'Sin nivel' }}</div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Materiales incluidos:</div>
          <div>
            <q-badge :color="training.paquete?.materiales ? 'positive' : 'negative'"
              :label="training.paquete?.materiales ? 'Sí' : 'No'" />
          </div>
        </div>

        <!-- Horarios del paquete -->
        <div class="col-12" v-if="training.paquete?.horarios?.length">
          <div class="text-weight-bold q-mb-sm">Horarios:</div>
          <div class="row q-gutter-xs">
            <q-chip v-for="horario in training.paquete.horarios" :key="horario.id" color="primary" text-color="white"
              size="sm">
              {{ obtenerNombreDia(horario.dia) }}: {{ horario.hora_inicio }} - {{ horario.hora_fin }}
            </q-chip>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="col-12">
          <div class="text-weight-bold q-mb-sm">Ubicación:</div>
          <q-card bordered class="q-pa-md">
            <div class="text-subtitle1">{{ training.ubicacion?.nombre || 'Sin ubicación' }}</div>
            <div v-if="training.ubicacion?.descripcion" class="text-body2 text-grey q-mt-xs">
              {{ training.ubicacion.descripcion }}
            </div>
            <div class="row q-gutter-md q-mt-sm" v-if="training.ubicacion">
              <div>
                <q-badge :color="training.ubicacion.equipado ? 'positive' : 'negative'"
                  :label="training.ubicacion.equipado ? 'Equipado' : 'No equipado'" />
              </div>
              <div>
                <q-badge color="info" :label="`Capacidad: ${training.ubicacion.capacidad || 'N/A'}`" />
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-12" v-if="training.observacion">
          <div class="text-weight-bold">Observaciones:</div>
          <div class="q-pa-sm bg-grey-1 rounded-borders">{{ training.observacion }}</div>
        </div>

        <!-- Entrenadores asignados -->
        <div class="col-12" v-if="training.entrenadores && training.entrenadores.length">
          <div class="text-weight-bold q-mb-sm">Entrenadores asignados:</div>
          <q-list bordered>
            <q-item v-for="coach in training.entrenadores" :key="coach.id">
              <q-item-section>
                <q-item-label>{{ coach.nombres || coach.nombre || '' }} {{ coach.apellido_paterno || '' }} {{
                  coach.apellido_materno || '' }}</q-item-label>
                <q-item-label caption>
                  Tel: {{ coach.telefono || 'N/A' }} • Edad: {{ calcularEdad(coach.fecha_nacimiento) || 'N/D' }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Información de suspensión -->
        <div class="col-12" v-if="training.estado === -1 && training.usuario_cancela">
          <div class="text-weight-bold">Suspendido por:</div>
          <div class="q-pa-sm bg-orange-1 rounded-borders">
            <q-icon name="warning" color="orange" class="q-mr-sm" />
            {{ training.usuario_cancela.nombre || 'Usuario desconocido' }}
          </div>
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Tomar asistencia" color="primary" @click="asistenciaDialog = true" />
      <q-btn flat label="Ver asistencias" color="accent" @click="verAsistenciasDialog = true" />
      <q-btn flat label="Evaluar" color="secondary" @click="openEvaluateDialog" />
      <q-btn flat label="Cerrar" color="primary" v-close-popup />
    </q-card-actions>

    <!-- Componente dialog de evaluación (controlado por v-model) -->
    <EvaluarEntrenamiento v-model:modelValue="evaluateDialog" :personas="personas" :entrenamientos="[training]"
      :cualidades="cualidades" @save="onSaveEvaluaciones" @cancel="onCancelEvaluacion" />

    <!-- Dialog para tomar asistencia -->
    <TomarAsistencia v-model:modelValue="asistenciaDialog" :entrenamientoId="training.id" @save="onSaveAsistencias"
      @cancel="() => asistenciaDialog = false" />

    <!-- Dialog para ver asistencias -->
    <VerAsistencias v-model:modelValue="verAsistenciasDialog" :entrenamientoId="training.id" />
  </q-card>
</template>

<script setup>
import { defineProps, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import EvaluarEntrenamiento from './EvaluarEntrenamiento.vue'
import TomarAsistencia from './TomarAsistencia.vue'
import VerAsistencias from './VerAsistencias.vue'
import { guardarAsistencias } from 'stores/asistencia-store.js'
import { listar } from 'stores/persona-store.js'

// 1. Declara la prop “training” y su tipo
const { training } = defineProps({
  training: {
    type: Object,
    required: true
  }
})

const $q = useQuasar()

// Estado del diálogo de evaluación
const evaluateDialog = ref(false)

// Dialog estado para asistencia
const asistenciaDialog = ref(false)
const verAsistenciasDialog = ref(false)

// Listas necesarias para evaluar
const personas = ref([])
const cualidades = ref([])

// Intentar cargar cualidades desde un store dinámico; si no existe, usar ejemplos
const loadCualidades = async () => {
  try {
    const mod = await import('stores/cualidad-store.js')
    if (mod && typeof mod.listar === 'function') {
      const resp = await mod.listar()
      cualidades.value = Array.isArray(resp) ? resp : (resp?.data || [])
      return
    }
  } catch {
    // ignore - usar fallback
  }

  // Fallback: ejemplos básicos (reemplazar con tu store/endpoint real)
  cualidades.value = [
    { id: 1, nombre: 'Técnica' },
    { id: 2, nombre: 'Actitud' },
    { id: 3, nombre: 'Puntualidad' }
  ]
}

const loadPersonas = async () => {
  try {
    const resp = await listar()
    personas.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) {
    console.warn('No se pudieron cargar personas:', e)
    personas.value = []
  }
}

onMounted(async () => {
  await Promise.all([loadPersonas(), loadCualidades()])
})

// Abrir diálogo
const openEvaluateDialog = () => {
  evaluateDialog.value = true
}

// Manejar guardado desde el componente de evaluación
const onSaveEvaluaciones = async (payload) => {
  // Aquí puedes llamar a tu store o API para persistir
  console.log('Evaluaciones a guardar:', payload)
  evaluateDialog.value = false
  $q.notify({ type: 'positive', message: 'Evaluación enviada' })
}

const onCancelEvaluacion = () => {
  evaluateDialog.value = false
}

// Guardar asistencias: recibe payload { asistencias }
const onSaveAsistencias = async (payload) => {
  const asistencias = payload?.asistencias || []
  try {
    await guardarAsistencias(asistencias)
    $q.notify({ type: 'positive', message: 'Asistencias guardadas correctamente' })
  } catch (e) {
    console.error('Error guardando asistencias:', e)
    // guardarAsistencias ya notificó, aquí se puede manejar rollback si es necesario
  } finally {
    asistenciaDialog.value = false
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

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('es-ES', options)
}

// Obtener color para el estado (-1: suspendido, 0: terminado, 1: en marcha, 2: sin comenzar)
const getStatusColor = (status) => {
  const colors = {
    '-1': 'orange',   // Suspendido
    0: 'grey',        // Terminado
    1: 'positive',    // En marcha
    2: 'warning'      // Sin comenzar
  }
  return colors[status] || 'grey'
}

// Obtener texto para el estado
const getStatusLabel = (status) => {
  const labels = {
    '-1': 'Suspendido',
    0: 'Terminado',
    1: 'En marcha',
    2: 'Sin comenzar'
  }
  return labels[status] || 'Desconocido'
}

// Calcular edad desde fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
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

</script>
