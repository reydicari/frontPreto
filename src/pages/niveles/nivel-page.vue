<template>
  <q-page class="q-pa-md page-container" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header -->
    <q-card class="q-mb-lg header-card">
      <q-card-section class="row items-center justify-between header-section">
        <div>
          <h2 class="text-h4 q-ma-none page-title animated-title">
            <q-icon name="signal_cellular_alt" size="38px" class="q-mr-sm" />
            Gestión de Niveles
          </h2>
          <p class="header-subtitle q-mt-xs q-mb-none">Administra los niveles de clasificación del sistema</p>
        </div>
        <q-btn unelevated no-caps color="green-9" icon="add" label="Nuevo Nivel" class="btn-header-nuevo" @click="abrirNuevo">
          <q-tooltip>Registrar nuevo nivel</q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>

    <!-- Tabla principal -->
    <q-card class="list-card">
      <q-card-section class="list-header">
        <div class="row items-center">
          <q-icon name="list" size="24px" class="q-mr-sm" />
          <span class="text-h6">Niveles Registrados</span>
          <q-space />
          <q-badge color="orange" class="count-badge">
            {{ niveles.length }}
          </q-badge>
        </div>
      </q-card-section>
      <q-separator />

      <q-table :rows="niveles" :columns="columnas" row-key="id" :loading="cargando" flat
        :rows-per-page-options="[10, 20, 50]" rows-per-page-label="Filas por página"
        no-data-label="No hay niveles registrados" loading-label="Cargando niveles..." class="niveles-table">
        <!-- Columna #  -->
        <template #body-cell-index="props">
          <q-td :props="props" class="text-center">
            <q-avatar size="34px" :class="props.row.estado ? 'avatar-active' : 'avatar-inactive'">
              <span class="avatar-number">{{ props.rowIndex + 1 }}</span>
            </q-avatar>
          </q-td>
        </template>

        <!-- Columna nombre -->
        <template #body-cell-nombre_nivel="props">
          <q-td :props="props">
            <span class="item-title">{{ props.row.nombre_nivel }}</span>
          </q-td>
        </template>

        <!-- Columna estado -->
        <template #body-cell-estado="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="props.row.estado ? 'positive' : 'grey'" text-color="white" class="status-badge">
              <q-icon :name="props.row.estado ? 'check_circle' : 'block'" size="12px" class="q-mr-xs" />
              {{ props.row.estado ? 'Activo' : 'Inactivo' }}
            </q-badge>
          </q-td>
        </template>

        <!-- Columna estudiantes -->
        <template #body-cell-nroInscripciones="props">
          <q-td :props="props" class="text-center">
            <q-badge color="orange" text-color="white" class="students-badge">
              <q-icon name="people" size="12px" class="q-mr-xs" />
              {{ props.row.nroInscripciones || 0 }}
            </q-badge>
          </q-td>
        </template>

        <!-- Columna acciones -->
        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-center">
            <div class="row q-gutter-xs justify-center items-center">
              <q-btn flat round dense icon="edit" color="brown-7" @click="editarNivel(props.row)">
                <q-tooltip>Editar nivel</q-tooltip>
              </q-btn>
              <q-toggle dense :model-value="props.row.estado" @update:model-value="confirmToggle(props.row, $event)"
                @click.stop />
            </div>
          </q-td>
        </template>

        <!-- Sin datos -->
        <template #no-data>
          <div class="empty-state full-width">
            <q-icon name="signal_cellular_alt" size="80px" class="empty-icon" />
            <div class="empty-title">No hay niveles registrados</div>
            <p class="empty-text">Comienza agregando el primer nivel deportivo</p>
            <q-btn unelevated no-caps icon="add_circle" label="Nuevo Nivel" @click="abrirNuevo" class="btn-empty" />
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Modal Nuevo / Editar Nivel -->
    <q-dialog v-model="mostrarFormulario" persistent>
      <q-card style="min-width: 380px; max-width: 500px; width: 100%">
        <q-card-section class="form-header">
          <q-icon :name="esEdicion ? 'edit' : 'add_circle'" size="24px" class="q-mr-sm" />
          <span class="text-h6">{{ esEdicion ? 'Editar Nivel' : 'Nuevo Nivel' }}</span>
          <q-space />
          <q-btn flat round dense icon="close" @click="cerrarFormulario" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-input v-model="formulario.nombre_nivel" label="Nombre del Nivel *"
            placeholder="Ej: Principiante, Intermedio, Avanzado"
            :rules="[val => (attemptedSubmit ? (!!val || 'El nombre es requerido') : true)]" filled autofocus />
          <div class="q-mt-sm">
            <q-toggle v-model="formulario.estado" label="Nivel activo" color="positive" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="brown-7" @click="cerrarFormulario" />
          <q-btn :label="esEdicion ? 'Actualizar' : 'Guardar'" unelevated no-caps class="btn-save" @click="guardarNivel"
            :loading="guardando">
            <template #default>
              <q-icon :name="esEdicion ? 'save' : 'add'" class="q-mr-xs" />
              {{ esEdicion ? 'Actualizar' : 'Guardar' }}
            </template>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Notificaciones globales -->
    <q-notify />
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { agregarNivel, cambiarEstado, listarNiveles, modificarNivel } from 'src/stores/nivel'

const $q = useQuasar()

// Estado reactivo
const cargando = ref(false)
const guardando = ref(false)
const mostrarFormulario = ref(false)
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
const attemptedSubmit = ref(false)

// Columnas de la tabla
const columnas = [
  { name: 'index', label: '#', field: 'index', align: 'center', style: 'width: 60px' },
  { name: 'nombre_nivel', label: 'Nombre del Nivel', field: 'nombre_nivel', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center', sortable: true },
  { name: 'nroInscripciones', label: 'Estudiantes', field: 'nroInscripciones', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

// Cargar niveles
const cargarNiveles = async () => {
  cargando.value = true
  try {
    const response = await listarNiveles()
    niveles.value = response
  } catch (error) {
    console.error('Error cargando niveles:', error)
  } finally {
    cargando.value = false
  }
}

// Abrir modal para nuevo nivel
const abrirNuevo = () => {
  esEdicion.value = false
  nivelSeleccionado.value = null
  attemptedSubmit.value = false
  formulario.id = null
  formulario.nombre_nivel = ''
  formulario.estado = true
  mostrarFormulario.value = true
}

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
  mostrarFormulario.value = true
}

// Cerrar formulario
const cerrarFormulario = () => {
  mostrarFormulario.value = false
  attemptedSubmit.value = false
}

// Guardar nivel (crear o actualizar)
const guardarNivel = async () => {
  attemptedSubmit.value = true
  if (!formulario.nombre_nivel) return

  guardando.value = true
  try {
    if (esEdicion.value) {
      await modificarNivel({ ...formulario })
    } else {
      await agregarNivel({ ...formulario })
    }
    mostrarFormulario.value = false
    await cargarNiveles()
  } catch (error) {
    console.error('Error guardando nivel:', error)
    $q.notify({ type: 'negative', message: 'Error al guardar el nivel', position: 'top' })
  } finally {
    guardando.value = false
  }
}

// Confirmación y cambio de estado (toggle) con diálogo
const confirmToggle = (nivel, nuevoVal) => {
  const title = nuevoVal ? 'Activar nivel' : 'Desactivar nivel'
  const message = `${nuevoVal ? '¿Deseas activar' : '¿Deseas desactivar'} el nivel "${nivel.nombre_nivel}"?`
  $q.dialog({ title, message, cancel: true, persistent: true }).onOk(async () => {
    try {
      await cambiarEstado({ id: nivel.id, nuevoEstado: nuevoVal })
      cargarNiveles()
    } catch (err) {
      console.error('Error al cambiar estado:', err)
    }
  })
}

onMounted(() => {
  cargarNiveles()
})
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-bark: #5d4037;
$color-wood: #795548;
$color-earth: #8d6e63;
$color-orange: #ff6f00;
$color-orange-light: #ff8f00;

$pastel-lime: #dcedc8;
$pastel-sage: #f1f8e9;

.page-container {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  padding: 16px 0;
}

.header-title {
  display: flex;
  align-items: center;

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

// Tabla
.list-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.list-header {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
  padding: 16px 20px;
}

.count-badge {
  font-size: 1rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 12px;
}

.niveles-table {

  .q-table__top,
  .q-table__bottom {
    background: $pastel-sage;
  }
}

// Formulario (modal)
.form-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-lime 100%);
  color: $color-forest;
  font-weight: 600;
  display: flex;
  align-items: center;
  padding: 16px 20px;

  .q-icon {
    color: $color-orange;
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
  font-size: 0.95rem;
}

.item-title {
  font-weight: 700;
  font-size: 0.95rem;
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
}

@media (max-width: 599px) {
  .page-title {
    font-size: 1.5rem;
  }

  .header-title {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
