<template>
  <q-dialog v-model="internalDialog" :maximized="$q.screen.lt.md" persistent>
    <q-card class="evaluaciones-card" :style="$q.screen.lt.md ? '' : 'min-width: 700px; max-width: 900px;'">
      <!-- Header -->
      <q-card-section class="eval-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="star" size="32px" class="header-icon" />
            <div>
              <div class="header-title">Evaluaciones del Entrenamiento</div>
              <div class="header-subtitle">Historial de calificaciones</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Contenido -->
      <q-card-section class="eval-content">
        <!-- Loading -->
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner color="green-8" size="50px" />
          <div class="q-mt-md text-grey-7">Cargando evaluaciones...</div>
        </div>

        <!-- Sin evaluaciones -->
        <div v-else-if="!evaluaciones || evaluaciones.length === 0" class="empty-state">
          <q-icon name="star_border" size="80px" color="grey-5" />
          <div class="empty-title">No hay evaluaciones</div>
          <div class="empty-subtitle">Este entrenamiento aún no tiene evaluaciones registradas</div>
        </div>

        <!-- Lista de evaluaciones -->
        <div v-else>
          <!-- Estadísticas generales -->
          <div class="stats-section q-mb-md">
            <q-card flat bordered class="stat-card">
              <q-card-section class="row q-col-gutter-md">
                <div class="col-4 text-center">
                  <div class="stat-value">{{ evaluaciones.length }}</div>
                  <div class="stat-label">Total Evaluaciones</div>
                </div>

                <div class="col-4 text-center">
                  <div class="stat-value">{{ promedioGeneral }}</div>
                  <div class="stat-label">Promedio General</div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Tabla de evaluaciones -->
          <q-table :rows="evaluaciones" :columns="columns" row-key="id" :pagination="pagination" flat bordered
            :grid="$q.screen.lt.sm" class="evaluaciones-table">
            <!-- Columna de persona -->
            <template v-slot:body-cell-persona="props">
              <q-td :props="props">
                <div class="persona-cell">
                  <q-avatar size="32px" color="green-8" text-color="white">
                    <q-icon name="person" />
                  </q-avatar>
                  <div class="persona-info">
                    <div v-if="esAdministrador" class="persona-nombre">
                      {{ props.row.persona?.nombres }}
                      {{ props.row.persona?.apellido_paterno }}
                      {{ props.row.persona?.apellido_materno }}
                    </div>
                    <div v-else class="persona-nombre text-grey-6">
                      <q-icon name="lock" size="14px" class="q-mr-xs" />
                      Información privada
                    </div>
                    <div v-if="esAdministrador && props.row.persona?.fecha_nacimiento" class="persona-edad">
                      {{ calcularEdad(props.row.persona.fecha_nacimiento) }} años
                    </div>
                  </div>
                </div>
              </q-td>
            </template>

            <!-- Columna de cualidad -->
            <template v-slot:body-cell-cualidad="props">
              <q-td :props="props">
                <q-chip color="amber-8" text-color="white" size="sm" icon="emoji_events">
                  {{ props.row.cualidad?.nombre || 'N/A' }}
                </q-chip>
              </q-td>
            </template>

            <!-- Columna de calificación -->
            <template v-slot:body-cell-valor="props">
              <q-td :props="props">
                <div class="rating-cell">
                  <q-rating :model-value="props.row.valor" max="10" size="18px" color="amber-8" readonly />
                  <span class="rating-value">{{ props.row.valor }}/10</span>
                </div>
              </q-td>
            </template>

            <!-- Columna de fecha -->
            <template v-slot:body-cell-fecha="props">
              <q-td :props="props">
                <div class="fecha-cell">
                  <div class="fecha-info">
                    <div class="fecha-date">
                      <q-icon name="event" size="14px" class="q-mr-xs" />
                      {{ formatearSoloFecha(props.row.fecha) }}
                    </div>
                    <div class="fecha-time">
                      <q-icon name="access_time" size="14px" class="q-mr-xs" />
                      {{ extraerHora(props.row.fecha) }}
                    </div>
                  </div>
                </div>
              </q-td>
            </template>

            <!-- Columna de comentarios -->
            <template v-slot:body-cell-comentario="props">
              <q-td :props="props">
                <div v-if="props.row.comentario" class="obs-cell">
                  {{ props.row.comentario }}
                </div>
                <div v-else class="text-grey-5 text-italic">Sin comentario</div>
              </q-td>
            </template>

            <!-- Template para vista grid en móviles -->
            <template v-slot:item="props">
              <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4">
                <q-card flat bordered class="eval-mobile-card">
                  <q-card-section class="q-pa-md">
                    <!-- Persona -->
                    <div class="mobile-row q-mb-sm">
                      <div class="persona-cell">
                        <q-avatar size="32px" color="green-8" text-color="white">
                          <q-icon name="person" />
                        </q-avatar>
                        <div class="persona-info">
                          <div v-if="esAdministrador" class="persona-nombre">
                            {{ props.row.persona?.nombres }}
                            {{ props.row.persona?.apellido_paterno }}
                          </div>
                          <div v-else class="persona-nombre text-grey-6">
                            <q-icon name="lock" size="12px" class="q-mr-xs" />
                            Privado
                          </div>
                          <div v-if="esAdministrador && props.row.persona?.fecha_nacimiento" class="persona-edad">
                            {{ calcularEdad(props.row.persona.fecha_nacimiento) }} años
                          </div>
                        </div>
                      </div>
                    </div>

                    <q-separator class="q-my-sm" />

                    <!-- Cualidad y calificación -->
                    <div class="mobile-row q-mb-sm">
                      <div class="row items-center justify-between">
                        <q-chip color="amber-8" text-color="white" size="sm" icon="emoji_events">
                          {{ props.row.cualidad?.nombre || 'N/A' }}
                        </q-chip>
                        <div class="rating-mobile">
                          <q-rating :model-value="props.row.valor" max="10" size="14px" color="amber-8" readonly />
                          <div class="rating-value-mobile">{{ props.row.valor }}/10</div>
                        </div>
                      </div>
                    </div>

                    <!-- Fecha y hora -->
                    <div class="mobile-row q-mb-sm">
                      <div class="fecha-mobile">
                        <div class="fecha-item">
                          <q-icon name="event" size="14px" class="q-mr-xs" color="grey-7" />
                          <span class="text-caption">{{ formatearSoloFecha(props.row.fecha) }}</span>
                        </div>
                        <div class="fecha-item">
                          <q-icon name="access_time" size="14px" class="q-mr-xs" color="grey-7" />
                          <span class="text-caption">{{ extraerHora(props.row.fecha) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Comentario -->
                    <div v-if="props.row.comentario" class="mobile-row">
                      <div class="comentario-label text-caption text-grey-7">Comentario:</div>
                      <div class="comentario-text text-body2">{{ props.row.comentario }}</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </template>
          </q-table>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Footer -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cerrar" color="brown-7" icon="close" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { listarEvaluaciones } from 'stores/evaluacion-store.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  entrenamientoId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Estado
const loading = ref(false)
const evaluaciones = ref([])
const userData = ref(null)
const esAdministrador = ref(false)

// Verificar si es administrador
const verificarAdministrador = () => {
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    console.log('usuario actual: ', current)
    userData.value = current

    if (current && current.rols && Array.isArray(current.rols)) {
      esAdministrador.value = current.rols.some(rol =>
        rol.nombre === 'Administrador' && rol.id === 4
      )
    }
  } catch (error) {
    console.error('Error verificando administrador:', error)
    esAdministrador.value = false
  }
}

onMounted(() => {
  verificarAdministrador()
})

// Configuración de paginación
const pagination = ref({
  page: 1,
  rowsPerPage: 10
})

// Columnas de la tabla
const columns = [
  {
    name: 'persona',
    label: 'Persona',
    field: row => row.persona,
    align: 'left',
    sortable: true
  },
  {
    name: 'cualidad',
    label: 'Cualidad',
    field: row => row.cualidad,
    align: 'center',
    sortable: true
  },
  {
    name: 'valor',
    label: 'Calificación',
    field: 'valor',
    align: 'center',
    sortable: true
  },
  {
    name: 'fecha',
    label: 'Fecha/Hora',
    field: 'fecha',
    align: 'center',
    sortable: true
  },
  {
    name: 'comentario',
    label: 'Comentario',
    field: 'comentario',
    align: 'left'
  }
]

// Computadas


const promedioGeneral = computed(() => {
  if (!evaluaciones.value || evaluaciones.value.length === 0) return '0.0'
  const suma = evaluaciones.value.reduce((acc, e) => acc + (e.valor || 0), 0)
  const promedio = suma / evaluaciones.value.length
  return promedio.toFixed(1)
})

// Métodos
const cargarEvaluaciones = async () => {
  if (!props.entrenamientoId) return

  loading.value = true
  try {
    const response = await listarEvaluaciones({ id_entrenamiento: props.entrenamientoId })
    evaluaciones.value = Array.isArray(response) ? response : (response?.data || [])
    console.log('Evaluaciones cargadas:', evaluaciones.value)
  } catch (error) {
    console.error('Error cargando evaluaciones:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar las evaluaciones',
      icon: 'error',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// Formatear solo la fecha: "1 dic 2026"
const formatearSoloFecha = (fechaHora) => {
  if (!fechaHora) return ''
  // fechaHora viene como "2026-01-12 20:36:35"
  const fecha = new Date(fechaHora.replace(' ', 'T'))
  const opciones = { day: 'numeric', month: 'short', year: 'numeric' }
  return fecha.toLocaleDateString('es-ES', opciones)
}

// Extraer solo la hora: "20:36:35"
const extraerHora = (fechaHora) => {
  if (!fechaHora) return ''
  // Extraer la parte de la hora de "2026-01-12 20:36:35"
  const partes = fechaHora.split(' ')
  return partes.length > 1 ? partes[1] : ''
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

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    cargarEvaluaciones()
  }
})
</script>

<style scoped lang="scss">
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-amber: #ffb300;
$color-bark: #5d4037;

.evaluaciones-card {
  border-radius: 16px;
  overflow: hidden;
}

.eval-header {
  background: linear-gradient(135deg, #ffa726 0%, #ffb74d 100%);
  padding: 20px 24px;

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

.eval-content {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;

  .empty-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #333;
    margin-top: 16px;
  }

  .empty-subtitle {
    color: #666;
    margin-top: 8px;
  }
}

.stats-section {
  .stat-card {
    border-radius: 12px;
    background: linear-gradient(135deg, rgba($color-amber, 0.08) 0%, rgba($color-amber, 0.03) 100%);
    border: 2px solid rgba($color-amber, 0.2);
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: $color-amber;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #666;
    margin-top: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }
}

.evaluaciones-table {
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

.persona-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .persona-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .persona-nombre {
      font-weight: 600;
      color: #333;
    }

    .persona-edad {
      font-size: 0.8rem;
      color: #666;
      font-style: italic;
    }
  }
}

.rating-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .rating-value {
    font-weight: 700;
    color: $color-amber;
    font-size: 1.1rem;
  }
}

.fecha-cell {
  .fecha-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;

    .fecha-date {
      display: flex;
      align-items: center;
      color: #333;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .fecha-time {
      display: flex;
      align-items: center;
      color: #666;
      font-size: 0.85rem;
    }
  }
}

.obs-cell {
  font-size: 0.9rem;
  color: #555;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .eval-header {
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

  .eval-content {
    padding: 16px;
  }

  .stats-section {
    .stat-card {
      .q-card-section {
        padding: 12px;
      }
    }

    .stat-value {
      font-size: 1.5rem;
    }

    .stat-label {
      font-size: 0.75rem;
    }
  }

  .evaluaciones-table {
    font-size: 0.85rem;

    :deep(th),
    :deep(td) {
      padding: 8px 4px;
    }
  }

  .persona-cell {
    .persona-info {
      .persona-nombre {
        font-size: 0.85rem;
      }

      .persona-edad {
        font-size: 0.75rem;
      }
    }
  }

  .rating-cell {
    flex-direction: column;
    gap: 4px;

    .rating-value {
      font-size: 0.9rem;
    }
  }

  .fecha-cell {
    .fecha-info {

      .fecha-date,
      .fecha-time {
        font-size: 0.75rem;
      }
    }
  }

  .obs-cell {
    max-width: 150px;
    font-size: 0.8rem;
  }
}

@media (max-width: 599px) {
  .evaluaciones-card {
    border-radius: 0;
    height: 100vh;
  }

  .stats-section {
    .row {
      gap: 8px;
    }

    .col-4 {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }

  // Estilos para vista grid móvil
  .eval-mobile-card {
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
    }
  }

  .mobile-row {
    width: 100%;
  }

  .rating-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .rating-value-mobile {
    font-weight: 700;
    color: $color-amber;
    font-size: 0.9rem;
  }

  .fecha-mobile {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    .fecha-item {
      display: flex;
      align-items: center;
    }
  }

  .comentario-label {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .comentario-text {
    color: #555;
    line-height: 1.4;
  }
}
</style>
