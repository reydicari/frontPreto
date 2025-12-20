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
        <q-badge :color="getStatusColor(training.estado)" :label="getStatusLabel(training.estado)"
          class="status-badge" />
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
          <q-btn unelevated class="action-btn primary-action" color="green-8" icon="how_to_reg" label="Tomar asistencia"
            @click="asistenciaDialog = true" />
          <q-btn flat class="action-btn secondary-action" color="brown-7" icon="visibility" label="Ver asistencias"
            @click="verAsistenciasDialog = true" />
          <q-btn outlined class="action-btn tertiary-action" color="amber-9" icon="star" label="Evaluar"
            @click="openEvaluateDialog" />
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
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 40%, $color-wood 65%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

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
    width: 64px;
    height: 64px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    flex-shrink: 0;

    .q-icon {
      color: white;
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
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
  background: linear-gradient(135deg, rgba($color-forest, 0.08) 0%, rgba($color-leaf, 0.04) 100%);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba($color-forest, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
}

.side-title {
  display: flex;
  align-items: center;
  color: $color-forest;
  font-weight: 800;
  font-size: 1rem;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid $color-leaf;

  .q-icon {
    font-size: 1.2rem;
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
  gap: 10px;

  .action-btn {
    width: 100%;
    font-weight: 700;
    padding: 10px 16px;
    transition: all 0.3s ease;
    text-transform: none;
    font-size: 0.95rem;

    &.primary-action {
      box-shadow: 0 2px 8px rgba($color-forest, 0.3);

      &:hover {
        box-shadow: 0 4px 12px rgba($color-forest, 0.4);
        transform: translateY(-2px);
      }
    }

    &.secondary-action:hover {
      background: rgba($color-wood, 0.1);
    }

    &.tertiary-action:hover {
      background: rgba($color-amber, 0.08);
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
