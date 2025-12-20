<template>
  <q-page class="q-pa-md page-container" :class="$q.dark.isActive ? '' : 'bg-grey-3'">
    <!-- Header modernizado -->
    <div class="page-header ">
      <div class="header-content">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-sm-auto">
            <div class="header-title">
              <q-icon name="signal_cellular_alt" size="42px" class="q-mr-sm" />
              <h2 class="page-title">Gestión de Niveles</h2>
            </div>
            <p class="header-subtitle">Administra los niveles deportivos del sistema</p>
          </div>
        </div>
      </div>

      <!-- Estadísticas
      <div class="stats-container row q-gutter-md q-mt-md">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <q-icon name="signal_cellular_alt" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ niveles.length }}</div>
            <div class="stat-label">Total Niveles</div>
          </div>
        </div>

        <div class="stat-card stat-card-active">
          <div class="stat-icon">
            <q-icon name="check_circle" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{niveles.filter(n => n.estado).length}}</div>
            <div class="stat-label">Activos</div>
          </div>
        </div>

        <div class="stat-card stat-card-inactive">
          <div class="stat-icon">
            <q-icon name="block" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{niveles.filter(n => !n.estado).length}}</div>
            <div class="stat-label">Inactivos</div>
          </div>
        </div>
      </div> -->
    </div>

    <!-- Filtro de estado -->
    <q-card class="q-mb-md filter-card">
      <q-card-section>
        <div class="row items-center q-gutter-md">
          <q-icon name="tune" size="24px" class="text-brown-7" />
          <span class="text-weight-medium">Filtrar por estado:</span>
          <q-select v-model="filterStatus" :options="statusOptions" outlined dense emit-value map-options
            option-label="label" option-value="value" style="min-width:170px">
            <template v-slot:prepend>
              <q-icon name="filter_list" />
            </template>
          </q-select>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <!-- Formulario estático (izquierda) -->
      <div class="col-12 col-md-5">
        <q-card class="form-card">
          <q-card-section class="form-header">
            <q-icon :name="esEdicion ? 'edit' : 'add_circle'" size="24px" class="q-mr-sm" />
            <span class="text-h6">{{ esEdicion ? 'Editar Nivel' : 'Agregar Nuevo Nivel' }}</span>
          </q-card-section>
          <q-separator />
          <q-card-section>

            <q-input v-model="formulario.nombre_nivel" label="Nombre del Nivel *"
              placeholder="Ej: Principiante, Intermedio, Avanzado"
              :rules="[val => (attemptedSubmit ? (!!val || 'El nombre es requerido') : true)]" filled autofocus />

            <div class="q-mt-sm">
              <q-toggle v-model="formulario.estado" label="Nivel activo" color="positive" />
            </div>

            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn flat label="Limpiar" color="brown-7" @click="resetForm" class="btn-clear" />
              <q-btn :label="esEdicion ? 'Actualizar' : 'Guardar'" unelevated no-caps class="btn-save"
                @click="guardarNivel" :loading="guardando">
                <q-icon :name="esEdicion ? 'save' : 'add'" class="q-mr-xs" />
              </q-btn>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lista (derecha) -->
      <div class="col-12 col-md-7">
        <q-card class="list-card">
          <q-card-section class="list-header">
            <div class="row items-center">
              <q-icon name="list" size="24px" class="q-mr-sm" />
              <span class="text-h6">Niveles Registrados</span>
              <q-space />
              <q-badge color="orange" class="count-badge">
                {{ filteredNiveles.length }}
              </q-badge>
            </div>
          </q-card-section>
          <q-separator />

          <!-- Estado de carga -->
          <q-inner-loading :showing="cargando">
            <q-spinner-gears size="50px" color="green-7" />
            <div class="q-mt-md">Cargando niveles...</div>
          </q-inner-loading>

          <!-- Lista de niveles -->
          <q-list v-if="!cargando && filteredNiveles.length > 0" class="niveles-list">
            <q-item v-for="(nivel, index) in filteredNiveles" :key="nivel.id" class="nivel-item">
              <q-item-section avatar>
                <q-avatar size="42px" :class="nivel.estado ? 'avatar-active' : 'avatar-inactive'">
                  <span class="avatar-number">{{ index + 1 }}</span>
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="item-title">
                  {{ nivel.nombre_nivel }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs">
                  <q-badge :color="nivel.estado ? 'positive' : 'grey'" text-color="white" class="status-badge">
                    <q-icon :name="nivel.estado ? 'check_circle' : 'block'" size="12px" class="q-mr-xs" />
                    {{ nivel.estado ? 'Activo' : 'Inactivo' }}
                  </q-badge>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row q-gutter-xs items-center">
                  <q-btn flat round dense icon="edit" color="brown-7" @click="editarNivel(nivel)">
                    <q-tooltip>Editar nivel</q-tooltip>
                  </q-btn>
                  <q-toggle dense :model-value="nivel.estado" @update:model-value="confirmToggle(nivel, $event)"
                    @click.stop />
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Estado vacío -->
          <div v-else-if="!cargando" class="empty-state">
            <q-icon name="signal_cellular_alt" size="80px" class="empty-icon" />
            <div class="empty-title">No hay niveles registrados</div>
            <p class="empty-text">Comienza agregando el primer nivel deportivo</p>
            <q-btn unelevated no-caps icon="add_circle" label="Agregar Primer Nivel" @click="resetForm"
              class="btn-empty" />
          </div>
        </q-card>
      </div>
    </div>

    <!-- Diálogo de confirmación para eliminar -->
    <q-dialog v-model="mostrarConfirmacionEliminar">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">¿Estás seguro de eliminar este nivel?</span>
        </q-card-section>

        <q-card-section>
          <div class="text-weight-medium">"{{ nivelSeleccionado?.nombre_nivel }}"</div>
          <div class="text-caption text-grey">Esta acción no se puede deshacer</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="eliminarNivel" :loading="eliminando" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Notificaciones globales -->
    <q-notify />
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useQuasar } from 'quasar'
import { agregarNivel, cambiarEstado, listarNiveles, modificarNivel } from 'src/stores/nivel'

// Quasar utils
const $q = useQuasar()

// Estado reactivo
const cargando = ref(false)
const guardando = ref(false)
const eliminando = ref(false)
// ya no usamos diálogo; el formulario es estático en la izquierda
const mostrarConfirmacionEliminar = ref(false)
const esEdicion = ref(false)

// Datos
const niveles = ref([])
const nivelSeleccionado = ref(null)

// Formulario
const formulario = reactive({
  id: null,
  nombre_nivel: '',
  estado: true
})
const qForm = ref(null)
const attemptedSubmit = ref(false)

// (qForm ref is available if needed)

// Simulación de API - Reemplaza con tu llamada real
const simularApiCall = (data, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data })
    }, delay)
  })
}

// Cargar niveles
const cargarNiveles = async () => {
  cargando.value = true
  try {
    // Reemplaza esto con tu llamada real a la API
    const response = await listarNiveles()
    niveles.value = response
  } catch (error) {
    console.error('Error cargando niveles:', error)
  } finally {
    cargando.value = false
  }
}

// (opcional) cargar estudiantes para contar por nivel
const estudiantes = ref([])



// filtro de estado para niveles
const filterStatus = ref(null)
const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Activos', value: true },
  { label: 'Inactivos', value: false }
]

const filteredNiveles = computed(() => {
  if (!niveles.value) return []
  if (filterStatus.value === null) return niveles.value
  return niveles.value.filter(n => Boolean(n.estado) === filterStatus.value)
})

// Editar nivel
const editarNivel = (nivel) => {
  esEdicion.value = true
  nivelSeleccionado.value = nivel
  attemptedSubmit.value = false
  Object.assign(formulario, {
    id: nivel.id,
    nombre_nivel: nivel.nombre_nivel,
    estado: nivel.estado
  })
  // scroll to top where the static form is
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (qForm.value && qForm.value.resetValidation) qForm.value.resetValidation()
}

// Guardar nivel (crear o actualizar)
const resetForm = () => {
  attemptedSubmit.value = false
  formulario.nombre_nivel = ''
  formulario.estado = true
  nivelSeleccionado.value = null
  esEdicion.value = false
  if (qForm.value && qForm.value.resetValidation) qForm.value.resetValidation()
}

// Guardar nivel (crear o actualizar)
const guardarNivel = async () => {
  attemptedSubmit.value = true
  if (!formulario.nombre_nivel) {
    if (qForm.value && qForm.value.validate) qForm.value.validate()
    return
  }

  guardando.value = true
  try {
    if (esEdicion.value) {
      await modificarNivel({ ...formulario })
      cargarNiveles()

    } else {
      await agregarNivel({ ...formulario })
      await cargarNiveles()
    }

    resetForm()
    await cargarNiveles() // Recargar la lista
  } catch (error) {
    console.error('Error guardando nivel:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el nivel',
      position: 'top'
    })
  } finally {
    guardando.value = false
  }
}

// Eliminar nivel (mantengo la función pero se usa el diálogo existente)
const eliminarNivel = async () => {
  eliminando.value = true
  try {
    await simularApiCall(null)
    $q.notify({ type: 'positive', message: 'Nivel eliminado correctamente', position: 'top' })
    mostrarConfirmacionEliminar.value = false
    await cargarNiveles()
  } catch (error) {
    console.error('Error eliminando nivel:', error)
    $q.notify({ type: 'negative', message: 'Error al eliminar el nivel', position: 'top' })
  } finally {
    eliminando.value = false
    nivelSeleccionado.value = null
  }
}

// Confirmación y cambio de estado (toggle) con diálogo
const confirmToggle = (nivel, nuevoVal) => {
  const title = nuevoVal ? 'Activar nivel' : 'Desactivar nivel'
  const message = `${nuevoVal ? '¿Deseas activar' : '¿Deseas desactivar'} el nivel "${nivel.nombre_nivel}"?`
  const d = $q.dialog({ title, message, cancel: true, persistent: true })
  d.onOk(async () => {
    try {
      await cambiarEstado({ id: nivel.id, nuevoEstado: nuevoVal })
      cargarNiveles()
      // d.hide()
    } catch (err) {
      console.error('Error al cambiar estado:', err)
    }
  })
}

// contar estudiantes por nivel
const countStudents = (nivel) => {
  if (!nivel || !estudiantes.value) return 0
  return estudiantes.value.filter(s => Number(s.nivel_id) === Number(nivel.id)).length
}

// Cargar datos al montar el componente
onMounted(() => {
  // await Promise.all([cargarNiveles(), cargarEstudiantes()])
  cargarNiveles()
})
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

// Variables de color (Paleta Verde-Naranja-Marrón)
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-sage: #8bc34a;
$color-bark: #5d4037;
$color-wood: #795548;
$color-earth: #8d6e63;
$color-orange: #ff6f00;
$color-orange-light: #ff8f00;

$pastel-mint: #c8e6c9;
$pastel-lime: #dcedc8;
$pastel-sage: #f1f8e9;
$pastel-sand: #efebe9;

.page-container {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  .q-icon {
    color: $color-moss;
  }
}

.page-title {
  color: $color-forest;
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  color: $color-wood;
  font-size: 1rem;
  margin: 0;
  margin-left: 58px;
  opacity: 0.9;
}

// Estadísticas
.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.stat-card {
  flex: 1 1 auto;
  min-width: 200px;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.stat-card-total {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
}

.stat-card-active {
  background: linear-gradient(135deg, $color-leaf 0%, $color-lime 100%);
  color: white;
}

.stat-card-inactive {
  background: linear-gradient(135deg, $color-bark 0%, $color-earth 100%);
  color: white;
}

.stat-card-students {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.95;
  font-weight: 500;
}

// Filtro
.filter-card {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

// Formulario
.form-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.form-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-lime 100%);
  color: $color-forest;
  font-weight: 600;
  display: flex;
  align-items: center;

  .q-icon {
    color: $color-orange;
  }
}

.btn-clear {
  font-weight: 600;

  &:hover {
    background: rgba(93, 64, 55, 0.1);
  }
}

.btn-save {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(85, 139, 47, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(85, 139, 47, 0.4);
  }
}

// Lista
.list-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.list-header {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
  padding: 20px;
}

.count-badge {
  font-size: 1rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 12px;
}

.niveles-list {
  padding: 8px;
}

.nivel-item {
  border-radius: 12px;
  margin-bottom: 8px;
  padding: 12px;
  transition: all 0.3s ease;
  background: white;
  border: 2px solid transparent;

  &:hover {
    background: $pastel-sage;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
    border-color: $color-leaf;
  }
}

.avatar-active {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  box-shadow: 0 3px 10px rgba(85, 139, 47, 0.3);
  font-weight: 700;
}

.avatar-inactive {
  background: linear-gradient(135deg, #757575 0%, #9e9e9e 100%);
  color: white;
  font-weight: 700;
}

.avatar-number {
  font-size: 1.1rem;
}

.item-title {
  font-weight: 700;
  font-size: 1rem;
  color: $color-forest;
}

.status-badge {
  font-weight: 600;
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}

.students-badge {
  font-weight: 600;
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}

// Estado vacío
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  color: $color-lime;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $color-forest;
  margin-top: 20px;
}

.empty-text {
  color: $color-earth;
  margin-top: 8px;
  margin-bottom: 24px;
}

.btn-empty {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  box-shadow: 0 4px 12px rgba(85, 139, 47, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(85, 139, 47, 0.4);
  }
}

/* Animación suave */
.nivel-item {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1023px) {
  .stats-container {
    .stat-card {
      min-width: calc(50% - 8px);
    }
  }
}

@media (max-width: 959px) {
  .page-title {
    font-size: 1.8rem;
  }

  .stat-number {
    font-size: 1.75rem;
  }
}

@media (max-width: 599px) {
  .stats-container {
    .stat-card {
      min-width: 100%;
    }
  }

  .page-title {
    font-size: 1.5rem;
  }

  .header-subtitle {
    margin-left: 0;
    margin-top: 8px;
  }

  .header-title {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
