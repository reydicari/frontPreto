<template>
  <q-dialog v-model="isDialogVisible" :maximized="$q.screen.lt.sm">
    <q-card class="detalle-dialog">
      <!-- Header -->
      <q-card-section class="detalle-header">
        <div class="row items-center justify-between">
          <div class="detalle-title">
            <q-icon name="description" size="28px" class="q-mr-sm" />
            Detalles de Inscripción
          </div>
          <q-btn flat dense round icon="close" color="white" @click="closeDialog" />
        </div>
      </q-card-section>

      <!-- Content -->
      <q-card-section class="detalle-content">
        <div class="q-gutter-y-md">
          <!-- Estado de la inscripción -->
          <div class="info-card estado-card">
            <div class="info-card-header">
              <q-icon name="info" size="24px" class="q-mr-xs" />
              <span class="text-h6">Estado de Inscripción</span>
            </div>
            <div class="q-mt-md text-center">
              <q-badge :color="getEstadoColor()" :icon="getEstadoIcon()" class="estado-badge-large">
                {{ getEstadoLabel() }}
              </q-badge>
            </div>
          </div>

          <!-- Información del estudiante -->
          <div class="info-card">
            <div class="info-card-header">
              <q-icon name="person" size="24px" class="q-mr-xs" />
              <span class="text-h6">Estudiante</span>
            </div>
            <div class="q-mt-md">
              <div class="row items-center q-mb-md">
                <q-avatar size="64px" color="teal-7" text-color="white" class="q-mr-md">
                  <img v-if="inscripcion?.persona?.fotografia" :src="getPhotoUrl(inscripcion.persona.fotografia)" />
                  <span v-else class="text-h5">{{ getInitials() }}</span>
                </q-avatar>
                <div>
                  <div class="text-h6">{{ getEstudianteNombre() }}</div>
                  <div class="text-caption text-grey-7">
                    <q-icon name="badge" size="16px" class="q-mr-xs" />
                    CI: {{ inscripcion?.persona?.ci || '—' }}
                  </div>
                  <div class="text-caption text-grey-7" v-if="inscripcion?.persona?.telefono">
                    <q-icon name="phone" size="16px" class="q-mr-xs" />
                    {{ inscripcion.persona.telefono }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Información del paquete -->
          <div class="info-card">
            <div class="info-card-header">
              <q-icon name="inventory_2" size="24px" class="q-mr-xs" />
              <span class="text-h6">Paquete y Disciplina</span>
            </div>
            <div class="q-mt-md q-gutter-y-sm">
              <div class="info-row">
                <span class="info-label">Paquete:</span>
                <span class="info-value">{{ inscripcion?.paquete?.nombre || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Disciplina:</span>
                <q-chip :icon="getDisciplinaIcon()" color="teal-7" text-color="white" dense>
                  {{ inscripcion?.paquete?.disciplina?.nombre || '—' }}
                </q-chip>
              </div>
              <div class="info-row">
                <span class="info-label">Nivel:</span>
                <q-badge color="deep-orange-6" class="nivel-badge-detail">
                  {{ inscripcion?.nivel?.nombre_nivel || '—' }}
                </q-badge>
              </div>
            </div>
          </div>

          <!-- Horarios -->
          <div class="info-card" v-if="inscripcion?.paquete?.horarios?.length">
            <div class="info-card-header">
              <q-icon name="schedule" size="24px" class="q-mr-xs" />
              <span class="text-h6">Horarios</span>
            </div>
            <div class="q-mt-md">
              <div class="horarios-grid">
                <q-card v-for="(horario, idx) in inscripcion.paquete.horarios" :key="idx" class="horario-card" flat
                  bordered>
                  <q-card-section class="q-pa-sm text-center">
                    <div class="text-weight-bold text-teal-8">{{ getDiaLabel(horario.dia) }}</div>
                    <div class="text-caption text-grey-7">
                      {{ horario.hora_inicio }} - {{ horario.hora_fin }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Fechas -->
          <div class="info-card">
            <div class="info-card-header">
              <q-icon name="event" size="24px" class="q-mr-xs" />
              <span class="text-h6">Fechas</span>
            </div>
            <div class="q-mt-md q-gutter-y-sm">
              <div class="info-row">
                <span class="info-label">
                  <q-icon name="event_available" size="18px" class="q-mr-xs" />
                  Fecha de Inicio:
                </span>
                <span class="info-value">{{ formatDate(inscripcion?.fecha_inicio) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <q-icon name="event_busy" size="18px" class="q-mr-xs" />
                  Fecha de Fin:
                </span>
                <span class="info-value">{{ formatDate(inscripcion?.fecha_fin) || 'Indefinida' }}</span>
              </div>
              <div class="info-row" v-if="inscripcion?.fecha_fin">
                <span class="info-label">
                  <q-icon name="hourglass_empty" size="18px" class="q-mr-xs" />
                  Días restantes:
                </span>
                <span class="info-value" :class="getDiasRestantesClass()">
                  {{ getDiasRestantes() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Razón de suspensión si aplica -->
          <div class="info-card alert-card" v-if="inscripcion?.estado === 0 && inscripcion?.razon_anulacion">
            <div class="info-card-header">
              <q-icon name="report_problem" size="24px" class="q-mr-xs" />
              <span class="text-h6">Razón de Suspensión</span>
            </div>
            <div class="q-mt-md">
              <q-banner class="bg-red-1 text-red-9" rounded dense>
                <template v-slot:avatar>
                  <q-icon name="warning" color="red" />
                </template>
                {{ inscripcion.razon_anulacion }}
              </q-banner>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cerrar" color="grey-7" icon="close" @click="closeDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const host = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  inscripcion: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const isDialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const closeDialog = () => {
  emit('update:modelValue', false)
}

const getEstudianteNombre = () => {
  if (!props.inscripcion?.persona) return '—'
  const { nombres, apellido_paterno, apellido_materno } = props.inscripcion.persona
  return `${nombres || ''} ${apellido_paterno || ''} ${apellido_materno || ''}`.trim()
}

const getInitials = () => {
  if (!props.inscripcion?.persona) return '?'
  const { nombres, apellido_paterno } = props.inscripcion.persona
  const n = (nombres || '').charAt(0).toUpperCase()
  const a = (apellido_paterno || '').charAt(0).toUpperCase()
  return n && a ? (n + a) : (n || a || '?')
}

const getPhotoUrl = (photo) => {
  if (!photo) return ''
  if (photo.startsWith('http')) return photo
  return `${host}${photo}`
}

const getDisciplinaIcon = () => {
  const icono = props.inscripcion?.paquete?.disciplina?.icono
  if (!icono || String(icono).includes('/')) return 'sports'
  return icono
}

const formatDate = (dateInput) => {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d)) return String(dateInput)
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const mon = months[d.getMonth()] || ''
  const year = d.getFullYear()
  return `${day} ${mon} ${year}`
}

const parseDateLocal = (dateInput) => {
  if (!dateInput) return null
  if (dateInput instanceof Date) {
    const d = new Date(dateInput)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const str = String(dateInput)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, year, month, day] = match
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (isNaN(d)) return null
    d.setHours(0, 0, 0, 0)
    return d
  }
  const d = new Date(dateInput)
  if (isNaN(d)) return null
  d.setHours(0, 0, 0, 0)
  return d
}

const getDiasRestantes = () => {
  if (!props.inscripcion?.fecha_fin) return '—'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fin = parseDateLocal(props.inscripcion.fecha_fin)
  if (!fin) return '—'
  const diff = Math.floor((fin - hoy) / 86400000)
  if (diff < 0) return 'Vencida'
  if (diff === 0) return 'Hoy vence'
  if (diff === 1) return '1 día'
  return `${diff} días`
}

const getDiasRestantesClass = () => {
  if (!props.inscripcion?.fecha_fin) return ''
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fin = parseDateLocal(props.inscripcion.fecha_fin)
  if (!fin) return ''
  const diff = Math.floor((fin - hoy) / 86400000)
  if (diff < 0) return 'text-red-7 text-weight-bold'
  if (diff <= 7) return 'text-orange-7 text-weight-bold'
  return 'text-teal-7 text-weight-bold'
}

const getInscripcionStatus = () => {
  if (!props.inscripcion) return { label: 'Desconocido', color: 'grey', icon: 'help' }

  if (props.inscripcion.estado === 0) {
    return { label: 'Suspendida', color: 'negative', icon: 'block' }
  }

  if (props.inscripcion.estado === 1) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fin = parseDateLocal(props.inscripcion.fecha_fin)

    if (!fin) {
      return { label: 'En marcha', color: 'positive', icon: 'play_circle' }
    }

    const diffDays = Math.floor((fin - hoy) / 86400000)

    if (diffDays < 0) {
      return { label: 'Vencida', color: 'grey-7', icon: 'event_busy' }
    }

    if (diffDays <= 7) {
      return { label: 'Por vencer', color: 'warning', icon: 'warning_amber' }
    }

    return { label: 'En marcha', color: 'positive', icon: 'play_circle' }
  }

  return { label: 'Desconocido', color: 'grey', icon: 'help' }
}

const getEstadoLabel = () => getInscripcionStatus().label
const getEstadoColor = () => getInscripcionStatus().color
const getEstadoIcon = () => getInscripcionStatus().icon

const getDiaLabel = (v) => {
  const map = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
    5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
  }
  return map[v] || String(v || '')
}
</script>

<style scoped lang="scss">
.detalle-dialog {
  width: 100%;
  max-width: 700px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.detalle-header {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #558b2f 100%);
  color: white;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(27, 94, 32, 0.2);
}

.detalle-title {
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  color: white;
}

.detalle-content {
  max-height: calc(90vh - 140px);
  overflow-y: auto;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.info-card-header {
  display: flex;
  align-items: center;
  color: #1b5e20;
  border-bottom: 2px solid #e8f5e9;
  padding-bottom: 8px;
  margin-bottom: 12px;

  .q-icon {
    color: #2e7d32;
  }

  .text-h6 {
    font-weight: 600;
  }
}

.estado-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
}

.estado-badge-large {
  font-size: 1.1rem;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.alert-card {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 4px solid #f57c00;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-weight: 600;
  color: #424242;
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  margin-right: 16px;
}

.info-value {
  font-weight: 500;
  color: #1b5e20;
  text-align: right;
  flex: 1;
}

.nivel-badge-detail {
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.9rem;
}

.horarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.horario-card {
  border: 2px solid #e8f5e9;
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #2e7d32;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
  }
}

// Scrollbar personalizado
.detalle-content::-webkit-scrollbar {
  width: 6px;
}

.detalle-content::-webkit-scrollbar-track {
  background: rgba(46, 125, 50, 0.05);
  border-radius: 8px;
}

.detalle-content::-webkit-scrollbar-thumb {
  background: rgba(46, 125, 50, 0.2);
  border-radius: 8px;
}

.detalle-content::-webkit-scrollbar-thumb:hover {
  background: rgba(46, 125, 50, 0.35);
}

// Responsive
@media (max-width: 599px) {
  .detalle-dialog {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .detalle-header {
    padding: 16px 20px;
  }

  .detalle-title {
    font-size: 1.25rem;
  }

  .detalle-content {
    max-height: calc(100vh - 130px);
    padding: 16px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-value {
    text-align: left;
  }

  .horarios-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
