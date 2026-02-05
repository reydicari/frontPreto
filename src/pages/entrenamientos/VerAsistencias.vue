<template>
  <q-dialog v-model="show" persistent>
    <q-card class="ver-asistencias-card">
      <!-- Header mejorado con degradado verde -->
      <q-card-section class="ver-header">
        <div class="header-content">
          <div class="header-icon">
            <q-icon name="fact_check" size="32px" />
          </div>
          <div class="header-titles">
            <div class="header-title">Asistencias del Entrenamiento</div>
            <div class="header-subtitle">
              <q-icon name="people" size="16px" class="q-mr-xs" />
              Total: {{ asistencias.length }} registros
            </div>
          </div>
        </div>
        <q-btn flat round dense icon="close" class="close-btn" v-close-popup @click="closeDialog" />
      </q-card-section>

      <q-separator />

      <q-card-section class="asistencias-section">
        <div class="section-label">
          <q-icon name="check_circle" size="20px" class="q-mr-xs" />
          Listado de asistencias
        </div>
        <q-list bordered class="asistencias-list">
          <q-item v-for="a in asistencias" :key="a.id || `${a.id_persona}-${a.fecha}`" class="asistencia-item">
            <q-item-section avatar>
              <q-avatar :color="a.es_entrenador ? 'amber-7' : 'green-7'" text-color="white" size="42px">
                <q-icon :name="a.es_entrenador ? 'sports' : 'person'" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="persona-name">{{ personaLabel(a) }}</q-item-label>
              <q-item-label caption class="persona-info">
                <q-icon name="event" size="14px" class="q-mr-xs" />{{ a.fecha }} •
                <q-badge :color="a.es_entrenador ? 'amber-7' : 'green-7'"
                  :label="a.es_entrenador ? 'Entrenador' : 'Estudiante'" class="q-ml-xs" />
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn unelevated dense color="amber-8" icon="trending_up" @click="openProgressDialog(a)"
                class="progreso-btn">
                <span class="progreso-btn-label">Progreso</span>
                <q-tooltip>Ver progreso</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-item v-if="!asistencias.length" class="empty-item">
            <q-item-section class="text-center">
              <q-icon name="event_busy" size="48px" color="grey-4" />
              <q-item-label caption class="empty-text">No hay registros de asistencia para este
                entrenamiento</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <!-- Lista de progresos locales -->
      <q-card-section class="progresos-section">
        <div class="section-label">
          <q-icon name="bar_chart" size="20px" class="q-mr-xs" />
          Progresos agregados
        </div>
        <q-list bordered class="progresos-list">
          <q-item v-for="p in progresos" :key="p.id_persona + '-' + p.id_cualidad + '-' + p.fecha"
            class="progreso-item">
            <q-item-section avatar>
              <q-avatar color="amber-7" text-color="white" size="38px">
                <q-icon name="stars" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="progreso-name">{{ personaNameById(p.id_persona) }}</q-item-label>
              <q-item-label caption class="progreso-details">
                <q-badge color="green-7" :label="cualidadNameById(p.id_cualidad)" class="q-mr-xs" />
                <q-rating :model-value="p.valor" readonly max="5" size="14px" color="amber-7" />
                <span class="q-ml-xs">• {{ p.fecha }}</span>
              </q-item-label>
              <q-item-label caption v-if="p.comentario" class="progreso-comment">{{ p.comentario }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn round dense flat color="red-7" icon="close" @click="removeProgreso(p)" class="remove-btn">
                <q-tooltip>Eliminar progreso</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-item v-if="!progresos.length" class="empty-item">
            <q-item-section class="text-center">
              <q-icon name="insights" size="42px" color="grey-4" />
              <q-item-label caption class="empty-text">No hay progresos agregados aún</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="footer-actions">
        <q-btn flat label="Generar progresos" color="amber-8" icon="auto_awesome" @click="generateProgresos"
          class="generate-btn" />
        <q-btn unelevated label="Cerrar" color="green-7" icon="check" v-close-popup @click="closeDialog"
          class="close-action-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog para capturar progreso por estudiante -->
  <q-dialog v-model="progressDialog">
    <q-card class="progreso-dialog-card">
      <q-card-section class="progreso-dialog-header">
        <div class="header-content">
          <div class="header-icon-small">
            <q-icon name="trending_up" size="24px" />
          </div>
          <div>
            <div class="dialog-title">Agregar Progreso</div>
            <div class="dialog-subtitle">{{ personaLabel(selectedAsistencia) }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" @click="progressDialog = false" class="close-btn-small" />
      </q-card-section>

      <q-separator />

      <q-card-section class="progreso-form">
        <div class="form-label">Cualidad a evaluar</div>
        <q-select v-model="selectedCualidad" map-options emit-value :options="cualidades" option-value="id"
          option-label="nombre" label="Selecciona una cualidad" outlined dense class="cualidad-select" />

        <div class="form-label q-mt-md">Calificación</div>
        <div class="rating-container">
          <q-rating v-model="progresoValor" max="5" color="amber-7" size="36px" icon="star" icon-selected="star" />
          <div class="rating-value">{{ progresoValor }}/5</div>
        </div>

        <div class="form-label q-mt-md">Comentario</div>
        <q-input v-model="progresoComentario" type="textarea" rows="3" outlined dense
          placeholder="Escribe un comentario sobre el progreso del estudiante..." class="comentario-input" />
      </q-card-section>

      <q-card-actions align="right" class="progreso-dialog-actions">
        <q-btn flat label="Cancelar" color="brown-7" @click="progressDialog = false" />
        <q-btn unelevated label="Agregar" color="green-7" icon="add" @click="addProgreso" :disable="!canAddProgreso"
          class="add-progreso-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { listarAsistenciasPorEntrenamiento } from 'stores/asistencia-store.js'
import { listar as listarCualidades } from 'stores/cualidad-store.js'
import { agregarProgresos } from 'stores/progreso-store.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  entrenamientoId: { type: [Number, String], required: true }
})
const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const show = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const asistencias = ref([])

// progresos locales antes de persistir en store
const progresos = ref([])

// dialog y campos para agregar progreso
const progressDialog = ref(false)
const selectedAsistencia = ref(null)
const selectedCualidad = ref(null)
const progresoValor = ref(3)
const progresoComentario = ref('')
const cualidades = ref([])

const fetchAsistencias = async () => {
  try {
    const resp = await listarAsistenciasPorEntrenamiento(props.entrenamientoId)
    asistencias.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) {
    console.error('Error cargando asistencias:', e)
    asistencias.value = []
  }
}

const loadCualidades = async () => {
  try {
    const resp = await listarCualidades()
    cualidades.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) {
    console.error('Error cargando cualidades:', e)
    cualidades.value = []
  }
}

watch(() => show.value, (v) => { if (v) { fetchAsistencias(); loadCualidades() } })

const personaLabel = (a) => {
  if (!a) return ''
  if (a.persona && (a.persona.nombre || a.persona.nombres)) return a.persona.nombre || a.persona.nombres
  if (a.nombre_persona) return a.nombre_persona
  if (a.id_persona) return `Persona ${a.id_persona}`
  return ''
}

const openProgressDialog = (a) => {
  selectedAsistencia.value = a
  selectedCualidad.value = null
  progresoValor.value = 3
  progresoComentario.value = ''
  progressDialog.value = true
}

const canAddProgreso = computed(() => !!selectedCualidad.value && selectedAsistencia.value)

const getBoliviaNowString = () => {
  const d = new Date()
  // convertir a UTC y luego aplicar -4 horas (Bolivia UTC-4)
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000)
  const boliviaMs = utcMs - (4 * 60 * 60 * 1000)
  const bd = new Date(boliviaMs)
  const y = bd.getFullYear()
  const m = String(bd.getMonth() + 1).padStart(2, '0')
  const day = String(bd.getDate()).padStart(2, '0')
  const hh = String(bd.getHours()).padStart(2, '0')
  const mm = String(bd.getMinutes()).padStart(2, '0')
  const ss = String(bd.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
}

const addProgreso = () => {
  if (!canAddProgreso.value) return
  const fecha = getBoliviaNowString()

  // Obtener id del usuario logueado
  let idUsuario = null
  try {
    const raw = sessionStorage.getItem('user')
    if (raw) {
      const parsed = JSON.parse(raw)
      idUsuario = parsed?.id ?? parsed?.id_usuario ?? null
    }
  } catch (e) {
    console.error('Error obteniendo usuario:', e)
  }

  const p = {
    id: null,
    id_persona: selectedAsistencia.value.id_persona,
    id_cualidad: selectedCualidad.value,
    id_usuario_califica: idUsuario,
    valor: progresoValor.value,
    fecha,
    comentario: progresoComentario.value || ''
  }
  progresos.value.push(p)
  progressDialog.value = false
  $q.notify({ type: 'positive', message: 'Progreso agregado (local)' })
}

const personaNameById = (id) => {
  const a = asistencias.value.find(x => x.id_persona === id || (x.persona && (x.persona.id === id || x.persona.id_persona === id)))
  return a ? personaLabel(a) : `Persona ${id}`
}

const cualidadNameById = (id) => {
  const q = cualidades.value.find(c => c.id === id)
  return q ? (q.nombre || q.nombre_cualidad || q.descripcion || `Cualidad ${id}`) : `Cualidad ${id}`
}

const removeProgreso = (p) => {
  const idx = progresos.value.indexOf(p)
  if (idx !== -1) progresos.value.splice(idx, 1)
}

const generateProgresos = async () => {
  if (!progresos.value.length) {
    $q.notify({ type: 'warning', message: 'No hay progresos para enviar' })
    return
  }

  console.log('Progresos a enviar:', JSON.parse(JSON.stringify(progresos.value)))

  try {
    await agregarProgresos(progresos.value)
    $q.notify({ type: 'positive', message: `${progresos.value.length} progresos guardados correctamente`, icon: 'check_circle' })
    progresos.value = [] // Limpiar array local después de guardar
  } catch (e) {
    console.error('Error guardando progresos:', e)
    $q.notify({ type: 'negative', message: 'Error al guardar progresos', icon: 'error' })
  }
}

const closeDialog = () => { show.value = false }

</script>

<style scoped lang="scss">
$color-forest-dark: #1a5e3f;
$color-forest: #2e7d52;
$color-leaf: #3d9970;
$color-lime: #4caf7d;
$color-amber: #ffa726;

.ver-asistencias-card {
  min-width: 560px;
  max-width: 950px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.ver-header {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 40%, $color-leaf 100%);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    position: relative;
    z-index: 1;
  }

  .header-icon {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

    .q-icon {
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
  }

  .header-titles {
    color: white;

    .header-title {
      font-size: 1.3rem;
      font-weight: 800;
      line-height: 1.2;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .header-subtitle {
      font-size: 0.9rem;
      opacity: 0.95;
      margin-top: 4px;
      display: flex;
      align-items: center;
    }
  }

  .close-btn {
    color: white;
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.1) rotate(90deg);
    }
  }
}

.asistencias-section,
.progresos-section {
  padding: 20px 24px;

  .section-label {
    font-size: 1rem;
    font-weight: 700;
    color: $color-forest-dark;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 3px solid transparent;
    border-image: linear-gradient(90deg, $color-forest 0%, $color-leaf 50%, transparent 100%);
    border-image-slice: 1;
  }

  .asistencias-list,
  .progresos-list {
    max-height: 350px;
    overflow-y: auto;
    border-radius: 12px;
    border: 2px solid rgba($color-forest, 0.12);

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba($color-forest, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba($color-forest, 0.2);
      border-radius: 4px;

      &:hover {
        background: rgba($color-forest, 0.3);
      }
    }

    .asistencia-item,
    .progreso-item {
      transition: all 0.3s ease;
      border-bottom: 1px solid rgba($color-forest, 0.08);

      &:hover {
        background: linear-gradient(90deg, rgba($color-forest, 0.04) 0%, transparent 100%);
      }

      .persona-name,
      .progreso-name {
        font-weight: 700;
        color: $color-forest-dark;
        font-size: 1rem;
      }

      .persona-info,
      .progreso-details {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: #666;
        margin-top: 4px;
      }

      .progreso-comment {
        font-style: italic;
        color: #777;
        margin-top: 6px;
      }

      .progreso-btn {
        font-weight: 600;
        padding: 6px 16px;
        border-radius: 8px;
        transition: all 0.3s ease;

        .progreso-btn-label {
          margin-left: 6px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba($color-amber, 0.3);
        }
      }

      .remove-btn {
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.2) rotate(90deg);
        }
      }
    }

    .empty-item {
      padding: 48px 24px;

      .empty-text {
        margin-top: 12px;
        font-size: 0.9rem;
        color: #999;
      }
    }
  }
}

.footer-actions {
  padding: 16px 24px;
  background: rgba($color-forest, 0.03);
  gap: 12px;

  .generate-btn {
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      background: rgba($color-amber, 0.1);
    }
  }

  .close-action-btn {
    font-weight: 700;
    padding: 10px 24px;
    border-radius: 10px;
    background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
    box-shadow: 0 4px 12px rgba($color-forest, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 6px 20px rgba($color-forest, 0.4);
      transform: translateY(-2px);
    }
  }
}

// Dialog de agregar progreso
.progreso-dialog-card {
  min-width: 460px;
  max-width: 600px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.progreso-dialog-header {
  background: linear-gradient(135deg, $color-amber 0%, #ffb74d 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-content {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
  }

  .header-icon-small {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;

    .q-icon {
      color: white;
    }
  }

  .dialog-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  .dialog-subtitle {
    font-size: 0.9rem;
    color: white;
    opacity: 0.95;
    margin-top: 4px;
  }

  .close-btn-small {
    color: white;
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.1) rotate(90deg);
    }
  }
}

.progreso-form {
  padding: 24px;

  .form-label {
    font-size: 0.9rem;
    font-weight: 700;
    color: $color-forest-dark;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cualidad-select :deep(.q-field__control) {
    border-radius: 8px;
    border: 2px solid rgba($color-forest, 0.15);
  }

  .rating-container {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: linear-gradient(135deg, rgba($color-amber, 0.08) 0%, rgba($color-amber, 0.04) 100%);
    border-radius: 12px;
    border: 2px solid rgba($color-amber, 0.15);

    .rating-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: $color-amber;
    }
  }

  .comentario-input :deep(.q-field__control) {
    border-radius: 8px;
    background: rgba($color-forest, 0.02);
  }
}

.progreso-dialog-actions {
  padding: 16px 24px;
  background: rgba($color-forest, 0.03);
  gap: 12px;

  .add-progreso-btn {
    font-weight: 700;
    padding: 10px 20px;
    border-radius: 10px;
    background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
    box-shadow: 0 4px 12px rgba($color-forest, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba($color-forest, 0.4);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.5;
    }
  }
}

@media (max-width: 768px) {

  .ver-asistencias-card,
  .progreso-dialog-card {
    min-width: unset;
    width: 100%;
    border-radius: 0;
  }

  .ver-header {
    padding: 20px;

    .header-icon {
      width: 50px;
      height: 50px;

      .q-icon {
        font-size: 28px;
      }
    }

    .header-titles .header-title {
      font-size: 1.1rem;
    }
  }

  .asistencias-section .asistencias-list {
    .asistencia-item .progreso-btn {
      padding: 8px;
      min-width: 40px;

      .progreso-btn-label {
        display: none;
      }
    }
  }
}

.body--dark {

  .ver-asistencias-card,
  .progreso-dialog-card {
    background: #1e1e1e;
  }

  .asistencias-section,
  .progresos-section {
    .section-label {
      color: $color-lime;
    }

    .asistencias-list,
    .progresos-list {
      border-color: rgba($color-lime, 0.2);
      background: #2a2a2a;

      .asistencia-item,
      .progreso-item {
        border-bottom-color: rgba($color-lime, 0.1);

        &:hover {
          background: linear-gradient(90deg, rgba($color-lime, 0.08) 0%, transparent 100%);
        }

        .persona-name,
        .progreso-name {
          color: $color-lime;
        }

        .persona-info,
        .progreso-details {
          color: #b0b0b0;
        }

        .progreso-comment {
          color: #999;
        }
      }

      .empty-text {
        color: #808080;
      }
    }
  }

  .footer-actions,
  .progreso-dialog-actions {
    background: rgba($color-forest, 0.1);
  }

  .progreso-form {
    .form-label {
      color: $color-lime;
    }

    .rating-container {
      background: linear-gradient(135deg, rgba($color-amber, 0.15) 0%, rgba($color-amber, 0.08) 100%);
      border-color: rgba($color-amber, 0.25);
    }

    .comentario-input :deep(.q-field__control) {
      background: rgba($color-forest, 0.1);
    }
  }
}
</style>
