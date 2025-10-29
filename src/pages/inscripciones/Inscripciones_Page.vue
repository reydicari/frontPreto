<template>
  <q-page class="q-pa-md">
    <!-- Encabezado y botón nuevo -->
    <div class="row items-center justify-between q-mb-md">
      <h2 class="text-h4 q-ma-none">Gestión de Inscripciones</h2>
      <q-btn color="primary" icon="add" label="Nueva Inscripción" @click="openDialog()" />
    </div>

    <!-- Filtros -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Filtro rápido -->
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar..." class="col-md-4">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Filtro por estado -->
          <q-select v-model="filterEstado" :options="estadoOptions" label="Estado" outlined dense clearable
            class="col-md-3" />

          <!-- Filtro por disciplina -->
          <q-select v-model="filterDisciplina" :options="disciplinasOptions" label="Disciplina" option-label="nombre"
            option-value="id" outlined dense clearable class="col-md-3" />

          <!-- Filtro por vencimiento -->
          <q-select v-model="filterVencimiento" :options="vencimientoOptions" label="Vencimiento" outlined dense
            clearable class="col-md-2" />
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla de inscripciones -->
    <q-card>
      <q-table :rows="filteredInscripciones" :columns="columns" row-key="id" :loading="loading" :pagination="pagination"
        @request="onRequest">
        <!-- Columna de estado -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="estadoColor(props.row.estado)" :label="estadoLabel(props.row.estado)" />
            <q-tooltip v-if="estaPorVencer(props.row) && props.row.fecha_fin">
              Por vencer en {{ diasParaVencer(props.row) }} días
            </q-tooltip>
            <q-icon v-if="estaPorVencer(props.row) && props.row.fecha_fin" name="warning" color="orange"
              class="q-ml-xs" />
          </q-td>
        </template>

        <!-- Columna de acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn icon="edit" color="primary" flat dense @click="showDialog(props.row)" />
            <q-btn icon="receipt" color="secondary" flat dense @click="verPagos(props.row)"
              v-if="props.row.pagos?.length > 0" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Diálogo de inscripción -->
    <nueva-inscripcion-dialog v-model="dialogVisible" :current-inscripcion="currentInscripcion" :edit-mode="editMode"
      @saved="handleSaved" />

    <!-- Diálogo de pagos -->
    <PagosDialog v-model="pagosDialogVisible" :inscripcion="selectedInscripcion" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PagosDialog from './PagosDialog.vue'

import { listar } from 'src/stores/inscripcion-store'
import NuevaInscripcionDialog from "pages/inscripciones/NuevaInscripcionDialog.vue";
import { listarDisciplinas } from 'src/stores/disciplina-store.js'
// Estado principal
const loading = ref(false)
const inscripciones = ref([])
const searchTerm = ref('')
const filterEstado = ref(null)
const filterDisciplina = ref(null)
const filterVencimiento = ref(null)
const disciplinasOptions = ref([])
// Configuración de tabla
const columns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    sortable: true
  },
  {
    name: 'estudiante',
    label: 'Estudiante',
    field: row => row.persona?.nombres + ' ' + row.persona?.apellido_paterno + ' ' + row.persona?.apellido_materno || 'N/A',
    align: 'left',
    sortable: true
  },
  {
    name: 'telefono',
    label: 'Telefono',
    field: row => row.persona?.telefono || 'N/A',
    align: 'left',
    sortable: true
  },
  {
    name: 'paquete',
    label: 'Paquete',
    field: row => row.paquete?.nombre || '',
    align: 'left',
    sortable: true
  },
  {
    name: 'fecha_inicio',
    label: 'Inicio',
    field: 'fecha_inicio',
    align: 'left',
    sortable: true
  },
  {
    name: 'fecha_fin',
    label: 'Fin',
    field: row => row.fecha_fin || 'Indefinida',
    align: 'left',
    sortable: true
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'center',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Acciones',
    align: 'center'
  }
]

const pagination = ref({
  sortBy: 'fecha_inicio',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

// Opciones para filtros
const estadoOptions = [
  { label: 'Terminada', value: 0 },
  { label: 'En marcha', value: 1 },
  { label: 'Sin comenzar', value: 2 }
]

const vencimientoOptions = [
  { label: 'Por vencer (15 días)', value: 15 },
  { label: 'Por vencer (30 días)', value: 30 },
  { label: 'Vencidas', value: 0 }
]

// Cargar datos iniciales
onMounted(async () => {
  loadInscripciones()
  disciplinasOptions.value = await listarDisciplinas()
})
const loadInscripciones = async () => {
  inscripciones.value = await listar() //loadInscripciones ()
  console.log('inscripciones', inscripciones.value)
}
// Abrir diálogo (nuevo o edición)
function openDialog(inscripcion = null) {
  editMode.value = inscripcion !== null
  currentInscripcion.value = inscripcion ? { ...inscripcion } : null
  dialogVisible.value = true
}

// Manejar guardado exitoso
function handleSaved() {
  dialogVisible.value = false
  loadInscripciones()
}

// Filtrado local (opcional)
const filteredInscripciones = computed(() => {
  let result = inscripciones.value

  // Filtro por vencimiento local (si no se usa API)
  if (filterVencimiento.value !== null) {
    result = result.filter(ins => estaPorVencer(ins, filterVencimiento.value))
  }

  return result
})

// Lógica de vencimiento
function estaPorVencer(inscripcion, dias = 15) {
  // Sólo aplica si la inscripción está en marcha (1) y tiene fecha de fin
  if (!inscripcion.fecha_fin || inscripcion.estado !== 1) return false

  const hoy = new Date()
  const fechaFin = new Date(inscripcion.fecha_fin)
  const diffTime = fechaFin - hoy
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return dias === 0
    ? diffDays < 0
    : diffDays > 0 && diffDays <= dias
}

function diasParaVencer(inscripcion) {
  const hoy = new Date()
  const fechaFin = new Date(inscripcion.fecha_fin)
  return Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24))
}

// Utilidades para mostrar etiqueta y color según estado (0/1/2)
function estadoLabel(e) {
  if (e === 0) return 'Terminada'
  if (e === 1) return 'En marcha'
  if (e === 2) return 'Sin comenzar'
  return String(e ?? '')
}

function estadoColor(e) {
  if (e === 0) return 'grey'
  if (e === 1) return 'positive'
  if (e === 2) return 'warning'
  return 'dark'
}

// Gestión de diálogo
const dialogVisible = ref(false)
const editMode = ref(false)
const step = ref('estudiante')
const inscripcionIndefinida = ref(false)
const registrarPago = ref(false)

const currentInscripcion = ref({
  id: null,
  id_persona: null,
  id_diciplina: null,
  fecha_inicio: '',
  fecha_fin: '',
  estado: 1
})

const nuevoPago = ref({
  monto: 0,
  meses_cubiertos: 1,
  metodo: 'Efectivo',
  observaciones: ''
})

const currentEstudiante = ref(null)
const currentDisciplina = ref(null)

function showDialog(inscripcion) {
  editMode.value = !!inscripcion

  if (inscripcion) {
    currentInscripcion.value = { ...inscripcion }
    currentEstudiante.value = inscripcion.persona
    currentDisciplina.value = inscripcion.disciplina
    inscripcionIndefinida.value = !inscripcion.fecha_fin
  } else {
    resetCurrentInscripcion()
  }

  step.value = 'estudiante'
  dialogVisible.value = true
}

function resetCurrentInscripcion() {
  currentInscripcion.value = {
    id: null,
    id_persona: null,
    id_diciplina: null,
    fecha_inicio: '',
    fecha_fin: '',
    estado: 1
  }
  nuevoPago.value = {
    monto: 0,
    meses_cubiertos: 1,
    metodo: 'Efectivo',
    observaciones: ''
  }
  currentEstudiante.value = null
  currentDisciplina.value = null
  inscripcionIndefinida.value = false
  registrarPago.value = false
}


// Diálogo de pagos
const pagosDialogVisible = ref(false)
const selectedInscripcion = ref(null)

function verPagos(inscripcion) {
  selectedInscripcion.value = inscripcion
  pagosDialogVisible.value = true
}

// Manejo de paginación

</script>
