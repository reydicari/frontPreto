<template>
  <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header con título y botón de agregar -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <h1 class="text-h4 text-primary q-ma-none page-title">Gestión de Niveles Deportivos</h1>
        <p class="text-grey-6 q-mt-sm">Administra los niveles deportivos del sistema</p>
      </div>

      <div class="col">
        <q-card>
          <q-card-section>
            <q-select label="Ver por estados" emit-value map-options dense outlined hide-dropdown-icon
              v-model="filterStatus" :options="statusOptions" option-label="label" option-value="value"
              style="min-width:170px" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Formulario estático (izquierda) -->
      <div class="col-12 col-md-5">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-sm">{{ esEdicion ? 'Editar Nivel' : 'Agregar Nuevo Nivel' }}</div>

            <q-input v-model="formulario.nombre_nivel" label="Nombre del Nivel *"
              placeholder="Ej: Principiante, Intermedio, Avanzado"
              :rules="[val => (attemptedSubmit ? (!!val || 'El nombre es requerido') : true)]" filled autofocus />

            <div class="q-mt-sm">
              <q-toggle v-model="formulario.estado" label="Nivel activo" color="positive" />
            </div>

            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn flat label="Limpiar" color="secondary" @click="resetForm" />
              <q-btn :label="esEdicion ? 'Actualizar' : 'Guardar'" :color="esEdicion ? 'info' : 'primary'"
                class="q-ml-sm" @click="guardarNivel" :loading="guardando" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lista (derecha) -->
      <div class="col-12 col-md-7">
        <q-card class="shadow-1">
          <!-- Estado de carga -->
          <q-inner-loading :showing="cargando">
            <q-spinner-gears size="50px" color="primary" />
            <div class="q-mt-md">Cargando niveles...</div>
          </q-inner-loading>

          <!-- Lista de niveles -->
          <q-list v-if="!cargando && filteredNiveles.length > 0" class="rounded-borders">
            <q-item v-for="(nivel, index) in filteredNiveles" :key="nivel.id" class="q-my-xs">
              <q-item-section avatar>
                <q-badge color="primary" class="q-pa-sm">
                  {{ index + 1 }}
                </q-badge>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ nivel.nombre_nivel }}
                  <span class="text-caption text-grey q-ml-sm">Estudiantes: <strong>{{ countStudents(nivel)
                  }}</strong></span>
                </q-item-label>
                <q-item-label caption>
                  <q-badge :color="nivel.estado ? 'positive' : 'grey'" text-color="white">
                    {{ nivel.estado ? 'Activo' : 'Inactivo' }}
                  </q-badge>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat round icon="edit" color="primary" @click="editarNivel(nivel)">
                    <q-tooltip>Editar nivel</q-tooltip>
                  </q-btn>
                  <q-toggle dense :model-value="nivel.estado" @update:model-value="confirmToggle(nivel, $event)"
                    @click.stop label="" />

                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Estado vacío -->
          <div v-else-if="!cargando" class="text-center q-pa-xl">
            <q-icon name="sports" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No hay niveles registrados</div>
            <p class="text-grey-5">Comienza agregando el primer nivel deportivo</p>
            <q-btn color="primary" icon="add" label="Agregar Primer Nivel" @click="resetForm" class="q-mt-md" />
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

.page-title {
  border-left: 6px solid $orange-8;
  padding-left: 12px;
  color: $secondary;
  font-size: 2.2em;
  font-weight: 800;
  line-height: 1.2;
}

.q-item {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.q-item:hover {
  background-color: #f5f5f5;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.q-badge {
  font-size: 0.9em;
  min-width: 32px;
  justify-content: center;
}

/* Animación suave para los elementos de la lista */
.q-item {
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
</style>
