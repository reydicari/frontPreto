<template>
  <q-card class="detail-card">
    <q-card-section class="detail-header">
      <div class="header-left">
        <div class="icon-circle">
          <q-icon :name="training.paquete?.disciplina?.icono || 'sports'" size="32px" />
        </div>
        <div class="titles">
          <div class="title">{{ training.nombre }}</div>
          <div class="subtitle">{{ training.paquete?.disciplina?.nombre || 'Sin disciplina' }}</div>
        </div>
      </div>
      <div class="header-right">
        <q-badge :color="getStatusColor(training)" :label="getStatusLabel(training)" class="status-badge" />
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="detail-grid">
      <main class="detail-main">
        <div class="section-title">
          <q-icon name="info" />
          Información General
        </div>
        <div class="row q-col-gutter-md">

          <div class="col-md-6">
            <div class="info-label">Fecha Inicio</div>
            <div class="info-value">{{ formatDate(training.fecha_inicio) }}</div>
          </div>

          <div class="col-md-6">
            <div class="info-label">Fecha Fin</div>
            <div class="info-value" v-if="training.fecha_fin">{{ formatDate(training.fecha_fin) }}</div>
            <q-badge v-else color="amber-8" label="Indefinido" />
          </div>

          <div class="col-md-6">
            <div class="info-label">Paquete</div>
            <div class="info-value">{{ training.paquete?.nombre || 'Sin paquete' }}</div>
          </div>

          <div class="col-md-6">
            <div class="info-label">Nivel</div>
            <div class="info-value">{{ training.paquete?.nivel?.nombre_nivel || 'Sin nivel' }}</div>
          </div>

          <div class="col-md-6">
            <div class="info-label">Materiales incluidos</div>
            <div>
              <q-badge :color="training.paquete?.materiales ? 'green-8' : 'brown-5'"
                :label="training.paquete?.materiales ? 'Sí' : 'No'" />
            </div>
          </div>

          <!-- Horarios del paquete -->
          <div class="col-12" v-if="training.paquete?.horarios?.length">
            <div class="info-label">Horarios</div>
            <div class="row q-gutter-xs">
              <q-chip v-for="horario in training.paquete.horarios" :key="horario.id" color="green-8" text-color="white"
                size="sm" icon="schedule">
                {{ obtenerNombreDia(horario.dia) }}: {{ horario.hora_inicio }} - {{ horario.hora_fin }}
              </q-chip>
            </div>
          </div>

          <div class="col-12" v-if="training.observacion">
            <div class="info-label">Observaciones</div>
            <div class="obs-box">{{ training.observacion }}</div>
          </div>

          <!-- Información de suspensión -->
          <div class="col-12" v-if="training.estado === -1 && training.usuario_cancela">
            <q-card class="warning-card">
              <q-card-section class="row items-center q-pa-md">
                <q-icon name="warning" color="orange-8" size="md" class="q-mr-md" />
                <div>
                  <div class="text-weight-bold">Suspendido por:</div>
                  <div>{{ training.usuario_cancela.nombre || 'Usuario desconocido' }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </main>

      <aside class="detail-side">
        <!-- Ubicación -->
        <div class="side-card location-card">
          <div class="side-title">
            <q-icon name="place" class="q-mr-xs" />
            Ubicación
          </div>
          <div class="side-content">
            <div class="loc-name">{{ training.ubicacion?.nombre || 'Sin ubicación' }}</div>
            <div v-if="training.ubicacion?.descripcion" class="loc-desc">{{ training.ubicacion.descripcion }}</div>
            <div class="loc-meta q-mt-sm" v-if="training.ubicacion">
              <q-badge :color="training.ubicacion.equipado ? 'green-8' : 'brown-5'"
                :label="training.ubicacion.equipado ? 'Equipado' : 'No equipado'" />
              <q-badge class="q-ml-xs" color="amber-8" :label="`Capacidad: ${training.ubicacion.capacidad || 'N/A'}`" />
            </div>
          </div>
        </div>

        <!-- Entrenadores asignados -->
        <div class="side-card coaches-card" v-if="training.entrenadores && training.entrenadores.length">
          <div class="side-title">
            <q-icon name="person" class="q-mr-xs" />
            Entrenadores
          </div>
          <div class="side-content">
            <q-list dense class="coaches-list">
              <q-item v-for="coach in training.entrenadores" :key="coach.id" class="coach-item">
                <q-item-section avatar>
                  <q-avatar color="green-8" text-color="white" size="36px">
                    <q-icon name="sports" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="coach-name">{{ coach.nombres || coach.nombre || '' }} {{ coach.apellido_paterno
                    || '' }}</q-item-label>
                  <q-item-label caption class="coach-info">
                    <q-icon name="phone" size="xs" /> {{ coach.telefono || 'N/A' }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>

        <!-- Acciones -->
        <div class="side-actions">
          <q-btn unelevated class="action-btn primary-action" :color="puedeTomarAsistencia ? 'green-8' : 'grey-6'"
            icon="how_to_reg" label="Tomar asistencia" :disable="!puedeTomarAsistencia"
            @click="intentarTomarAsistencia">
            <q-tooltip v-if="!puedeTomarAsistencia" class="bg-negative">
              {{ razonNoAsistencia }}
            </q-tooltip>
          </q-btn>
          <q-btn flat class="action-btn secondary-action" color="white" icon="visibility" label="Ver asistencias"
            @click="verAsistenciasDialog = true" />
          <q-btn outlined class="action-btn tertiary-action" color="amber-9" icon="star" label="Evaluar entrenamiento"
            @click="openEvaluateDialog" />
          <q-btn flat class="action-btn quaternary-action" color="white" icon="list" label="Ver evaluaciones"
            @click="verEvaluacionesDialog = true" />
        </div>
      </aside>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right" class="footer-actions">
      <q-btn flat label="Cerrar" color="brown-7" icon="close" v-close-popup />
    </q-card-actions>

    <!-- Componente dialog de evaluación (controlado por v-model) -->
    <EvaluarEntrenamiento v-model:modelValue="evaluateDialog" :personas="personas" :entrenamientos="[training]"
      :cualidades="cualidades" @save="onSaveEvaluaciones" @cancel="onCancelEvaluacion" />

    <!-- Dialog para tomar asistencia -->
    <TomarAsistencia v-model:modelValue="asistenciaDialog" :entrenamientoId="training.id" @save="onSaveAsistencias"
      @cancel="() => asistenciaDialog = false" />

    <!-- Dialog para ver asistencias -->
    <VerAsistencias v-model:modelValue="verAsistenciasDialog" :entrenamientoId="training.id" />

    <!-- Dialog para ver evaluaciones -->
    <VerEvaluaciones v-model:modelValue="verEvaluacionesDialog" :entrenamientoId="training.id" />
  </q-card>
</template>

<script setup>
import { defineProps, ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import EvaluarEntrenamiento from './EvaluarEntrenamiento.vue'
import TomarAsistencia from './TomarAsistencia.vue'
import VerAsistencias from './VerAsistencias.vue'
import VerEvaluaciones from './VerEvaluaciones.vue'
import { guardarAsistencias } from 'stores/asistencia-store.js'
import { listar } from 'stores/persona-store.js'
import { agregarEvaluaciones } from 'src/stores/evaluacion-store'

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
const verEvaluacionesDialog = ref(false)

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
  console.log('=== EVALUACIÓN DE ENTRENAMIENTO ===')
  console.log('Payload completo:', payload)

  // Filtrar solo evaluaciones con calificación > 0
  const evaluacionesFiltradas = payload.evaluaciones.filter(ev => ev.valor !== null && ev.valor !== 0 && ev.valor > 0)

  console.log('Evaluaciones filtradas (solo con calificación):', evaluacionesFiltradas)
  console.log('Total a enviar:', evaluacionesFiltradas.length, 'de', payload.evaluaciones.length)

  // TODO: Descomentar cuando tengas el store listo
  const res = await agregarEvaluaciones(evaluacionesFiltradas)

  if (res.ok) { evaluateDialog.value = false }
}

const onCancelEvaluacion = () => {
  evaluateDialog.value = false
}

// Guardar asistencias: recibe payload { asistencias }
const onSaveAsistencias = async (payload) => {
  const asistencias = payload?.asistencias || []

  console.log('=== ASISTENCIAS REGISTRADAS ===')
  console.log('Total de asistencias:', asistencias.length)


  try {
    await guardarAsistencias(asistencias)
    $q.notify({ type: 'positive', message: 'Asistencias guardadas correctamente', icon: 'check_circle' })
  } catch (e) {
    console.error('❌ Error guardando asistencias:', e)
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

// Obtener fecha en zona horaria de Bolivia (UTC-4)
const obtenerFechaBolivia = (fechaString) => {
  if (!fechaString) return null
  const fecha = new Date(fechaString + 'T00:00:00-04:00')
  return fecha
}

// Obtener fecha actual en Bolivia
const obtenerHoyBolivia = () => {
  const ahora = new Date()
  const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000)
  const boliviaTime = new Date(utc + (3600000 * -4)) // UTC-4
  boliviaTime.setHours(0, 0, 0, 0)
  return boliviaTime
}

// Calcular estado real basado en fechas
const calcularEstadoReal = (entrenamiento) => {
  // Si estado es 0, está suspendido
  if (entrenamiento.estado === 0) {
    return { estado: 'suspendido', color: 'negative', label: 'Suspendido', puedeTomarAsistencia: false, razon: 'El entrenamiento está suspendido' }
  }

  // Si estado es 1, revisar fechas
  if (entrenamiento.estado === 1) {
    const hoy = obtenerHoyBolivia()
    const fechaInicio = obtenerFechaBolivia(entrenamiento.fecha_inicio)
    const fechaFin = obtenerFechaBolivia(entrenamiento.fecha_fin)

    if (!fechaInicio) {
      return { estado: 'sin-comenzar', color: 'warning', label: 'Sin comenzar', puedeTomarAsistencia: false, razon: 'El entrenamiento no ha comenzado aún' }
    }

    // Sin comenzar: hoy < fecha_inicio
    if (hoy < fechaInicio) {
      return { estado: 'sin-comenzar', color: 'warning', label: 'Sin comenzar', puedeTomarAsistencia: false, razon: 'El entrenamiento no ha comenzado aún' }
    }

    // Terminado: hoy > fecha_fin
    if (fechaFin && hoy > fechaFin) {
      return { estado: 'terminado', color: 'grey', label: 'Terminado', puedeTomarAsistencia: false, razon: 'El entrenamiento ya finalizó' }
    }

    // En marcha: hoy >= fecha_inicio && hoy <= fecha_fin
    return { estado: 'en-marcha', color: 'positive', label: 'En marcha', puedeTomarAsistencia: true, razon: '' }
  }

  // Otros estados (por compatibilidad)
  return { estado: 'desconocido', color: 'grey', label: 'Desconocido', puedeTomarAsistencia: false, razon: 'Estado desconocido' }
}

// Obtener color para el estado
const getStatusColor = (entrenamiento) => {
  return calcularEstadoReal(entrenamiento).color
}

// Obtener texto para el estado
const getStatusLabel = (entrenamiento) => {
  return calcularEstadoReal(entrenamiento).label
}

// Verificar si se puede tomar asistencia
const puedeTomarAsistencia = computed(() => {
  return calcularEstadoReal(training).puedeTomarAsistencia
})

// Obtener razón por la cual no se puede tomar asistencia
const razonNoAsistencia = computed(() => {
  return calcularEstadoReal(training).razon
})

// Manejar click en botón de asistencia cuando está deshabilitado
const intentarTomarAsistencia = () => {
  if (!puedeTomarAsistencia.value) {
    $q.notify({
      type: 'warning',
      message: razonNoAsistencia.value,
      icon: 'warning',
      position: 'top'
    })
  } else {
    asistenciaDialog.value = true
  }
}

// Calcular edad desde fecha de nacimiento
// const calcularEdad = (fechaNacimiento) => {
//   if (!fechaNacimiento) return ''
//   const hoy = new Date()
//   const nacimiento = new Date(fechaNacimiento)
//   let edad = hoy.getFullYear() - nacimiento.getFullYear()
//   const m = hoy.getMonth() - nacimiento.getMonth()
//   if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
//     edad--
//   }
//   return edad
// }

</script>

<style scoped lang="scss">
// Paleta de Colores Verde Bosque y Marrón
$color-forest-dark: #1b5e20;
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-bark: #5d4037;
$color-wood: #795548;
$color-amber: #ffb300;

.detail-card {
  min-width: 680px;
  max-width: 1000px;
  border-radius: 14px;
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.detail-header {
  background: linear-gradient(135deg, #1a5e3f 0%, #2e7d52 30%, #3d9970 60%, #4caf7d 100%);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
  }

  .icon-circle {
    width: 70px;
    height: 70px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
    border: 3px solid rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;

    &:hover {
      transform: scale(1.05) rotate(-5deg);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .q-icon {
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
  }

  .titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: white;

    .title {
      font-size: 1.3rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 0.95rem;
      opacity: 0.9;
      font-weight: 500;
    }
  }

  .status-badge {
    font-size: 0.8rem;
    padding: 8px 18px;
    border-radius: 24px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
    }
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-main {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $color-forest;
    font-size: 1.1rem;
    font-weight: 800;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid $color-leaf;

    .q-icon {
      font-size: 1.3rem;
    }
  }

  .row {
    gap: 16px 20px;
  }
}

.info-label {
  color: $color-bark;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.info-value {
  color: #333;
  font-size: 1rem;
  font-weight: 500;
}

.obs-box {
  background: linear-gradient(135deg, #f5f5dc 0%, #f0ead6 100%);
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid $color-moss;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.5;
}

.warning-card {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 4px solid #ff9800;
  border-radius: 8px;
}

.detail-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  background: linear-gradient(135deg, rgba($color-forest, 0.06) 0%, rgba($color-leaf, 0.03) 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5);
  border: 1.5px solid rgba($color-forest, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), inset 0 1px 3px rgba(255, 255, 255, 0.6);
    transform: translateY(-4px) scale(1.01);
    border-color: rgba($color-forest, 0.25);
  }
}

.side-title {
  display: flex;
  align-items: center;
  color: $color-forest;
  font-weight: 800;
  font-size: 1.05rem;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 3px solid transparent;
  border-image: linear-gradient(90deg, $color-forest 0%, $color-leaf 50%, transparent 100%);
  border-image-slice: 1;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 40px;
    height: 3px;
    background: $color-leaf;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .q-icon {
    font-size: 1.3rem;
    margin-right: 8px;
    padding: 6px;
    background: linear-gradient(135deg, rgba($color-forest, 0.1) 0%, rgba($color-leaf, 0.05) 100%);
    border-radius: 8px;
  }
}

.side-content {
  .loc-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: $color-forest-dark;
    margin-bottom: 6px;
  }

  .loc-desc {
    font-size: 0.9rem;
    color: #666;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .loc-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.coaches-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba($color-forest, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($color-forest, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba($color-forest, 0.3);
    }
  }

  .coach-item {
    padding: 8px 0;
    border-bottom: 1px solid rgba($color-forest, 0.08);

    &:last-child {
      border-bottom: none;
    }
  }

  .coach-name {
    font-weight: 700;
    color: $color-forest-dark;
    font-size: 0.95rem;
  }

  .coach-info {
    color: #666;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.side-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .action-btn {
    width: 100%;
    font-weight: 700;
    padding: 14px 20px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    text-transform: none;
    font-size: 0.95rem;
    border-radius: 12px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    &:hover::before {
      width: 300px;
      height: 300px;
    }

    &.primary-action {
      background: linear-gradient(135deg, #2e7d52 0%, #3d9970 100%);
      box-shadow: 0 4px 15px rgba(46, 125, 82, 0.4);
      border: none;

      &:hover {
        box-shadow: 0 6px 25px rgba(46, 125, 82, 0.5);
        transform: translateY(-3px) scale(1.02);
      }

      &:active {
        transform: translateY(-1px) scale(0.98);
      }
    }

    &.secondary-action {
      background: linear-gradient(135deg, #6d4c41 0%, #8d6e63 100%);
      color: white;
      box-shadow: 0 3px 12px rgba(109, 76, 65, 0.3);

      &:hover {
        background: linear-gradient(135deg, #5d4037 0%, #6d4c41 100%);
        box-shadow: 0 5px 20px rgba(109, 76, 65, 0.4);
        transform: translateY(-3px) scale(1.02);
      }
    }

    &.tertiary-action {
      background: linear-gradient(135deg, #ffa726 0%, #ffb74d 100%);
      color: white;
      box-shadow: 0 3px 12px rgba(255, 167, 38, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.3);

      &:hover {
        background: linear-gradient(135deg, #ff9800 0%, #ffa726 100%);
        box-shadow: 0 5px 20px rgba(255, 167, 38, 0.5);
        transform: translateY(-3px) scale(1.02);
      }
    }

    &.quaternary-action {
      background: linear-gradient(135deg, #ffca28 0%, #ffd54f 100%);
      color: white;
      box-shadow: 0 3px 12px rgba(255, 202, 40, 0.3);

      &:hover {
        background: linear-gradient(135deg, #ffb300 0%, #ffca28 100%);
        box-shadow: 0 5px 20px rgba(255, 202, 40, 0.5);
        transform: translateY(-3px) scale(1.02);
      }
    }

    .q-icon {
      transition: transform 0.3s ease;
    }

    &:hover .q-icon {
      transform: scale(1.1) rotate(-5deg);
    }
  }
}

.footer-actions {
  padding: 12px 16px;
  background: rgba($color-forest, 0.02);
}

// Responsive Breakpoints
@media (max-width: 992px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-side {
    order: 2;
  }

  .detail-main {
    order: 1;
  }
}

@media (max-width: 768px) {
  .detail-card {
    border-radius: 0;
    min-width: unset;
    max-width: unset;
    width: 100%;
    height: 100vh;
  }

  .detail-header {
    padding: 16px 20px;

    .icon-circle {
      width: 52px;
      height: 52px;

      .q-icon {
        font-size: 28px;
      }
    }

    .titles .title {
      font-size: 1.15rem;
    }

    .titles .subtitle {
      font-size: 0.9rem;
    }
  }

  .detail-grid {
    padding: 16px;
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;

    .header-right {
      align-self: flex-start;
    }
  }

  .side-card {
    padding: 12px;
  }

  .side-title {
    font-size: 0.95rem;
  }
}

// Dark Mode Support
.body--dark {
  .detail-card {
    background: #1e1e1e;
  }

  .info-value {
    color: #e0e0e0;
  }

  .obs-box {
    background: linear-gradient(135deg, rgba($color-leaf, 0.15) 0%, rgba($color-moss, 0.1) 100%);
    color: #e0e0e0;
  }

  .warning-card {
    background: linear-gradient(135deg, rgba(#ff9800, 0.2) 0%, rgba(#ff9800, 0.1) 100%);
    border-left-color: #ffb74d;
  }

  .side-card {
    background: linear-gradient(135deg, rgba($color-forest, 0.15) 0%, rgba($color-leaf, 0.08) 100%);
    border-color: rgba($color-lime, 0.2);
  }

  .side-title {
    color: $color-lime;
    border-bottom-color: rgba($color-lime, 0.3);
  }

  .side-content {
    .loc-name {
      color: $color-lime;
    }

    .loc-desc {
      color: #b0b0b0;
    }
  }

  .coach-name {
    color: $color-lime;
  }

  .coach-info {
    color: #b0b0b0;
  }

  .footer-actions {
    background: rgba($color-forest, 0.08);
  }
}
</style>
