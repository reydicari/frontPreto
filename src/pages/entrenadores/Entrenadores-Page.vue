<!-- eslint-disable no-unused-vars -->
<template>
  <q-page class="q-pa-md page-container" :class="$q.dark.isActive ? '' : 'bg-gradient'">
    <!-- Header con estadísticas -->
    <div class="page-header q-mb-lg">
      <div class="header-content">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-sm-auto">
            <div class="header-title">
              <q-icon name="sports" size="42px" class="q-mr-sm" />
              <h2 class="page-title">Gestión de Entrenadores</h2>
            </div>
            <p class="header-subtitle">Administra el equipo de entrenadores y su carga de trabajo</p>
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn class="btn-add-header" icon="person_add" label="Agregar Entrenador" @click="showPersonaDialog"
              unelevated no-caps />
          </div>
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="stats-container row q-gutter-md q-mt-md">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <q-icon name="groups" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticasPrincipales.totalEntrenadores }}</div>
            <div class="stat-label">Total Entrenadores</div>
          </div>
        </div>

        <div v-if="esAdministrador" class="stat-card stat-card-total">
          <div class="stat-icon">
            <q-icon name="groups" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticasPrincipales.totalAdministradores }}</div>
            <div class="stat-label">Total Administradores</div>
          </div>
        </div>
        <!-- <div class="stat-card stat-card-active">
          <div class="stat-icon">
            <q-icon name="person_check" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.activos }}</div>
            <div class="stat-label">Activos</div>
          </div>
        </div>

        <div class="stat-card stat-card-inactive">
          <div class="stat-icon">
            <q-icon name="person_off" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.inactivos }}</div>
            <div class="stat-label">Inactivos</div>
          </div>
        </div> -->

        <!-- <div class="stat-card stat-card-experience">
          <div class="stat-icon">
            <q-icon name="workspace_premium" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.experienciaPromedio }}</div>
            <div class="stat-label">Experiencia Promedio</div>
          </div>
        </div> -->

        <div class="stat-card stat-card-birthday">
          <div class="stat-icon">
            <q-icon name="celebration" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticasPrincipales.cumpleanosEsteMes }}</div>
            <div class="stat-label">Cumpleaños este Mes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de herramientas -->
    <q-card class="q-mb-md toolbar-card">
      <q-card-section>
        <div class="row items-center q-col-gutter-sm">
          <!-- Buscador -->
          <q-input v-model="searchInput" clearable @update:model-value="handleSearchInput" outlined dense
            placeholder="Buscar por nombre, CI, teléfono..." class="col-12 search-input" :debounce="500">
            <template v-slot:prepend>
              <q-icon name="search" class="text-brown-7" />
            </template>
          </q-input>
        </div> <!-- Filtros avanzados -->
        <q-expansion-item v-model="filtersExpanded" class="q-mt-md filters-expansion" icon="filter_list">
          <template v-slot:header>
            <div class="filters-header">
              <q-icon name="tune" size="24px" class="q-mr-sm" />
              <span class="filters-title">Filtros Avanzados</span>
              <q-badge v-if="activeFiltersCount > 0" color="brown-7" class="q-ml-sm">
                {{ activeFiltersCount }}
              </q-badge>
            </div>
          </template>

          <div class="filters-body q-pt-md">
            <div class="row q-col-gutter-md">
              <q-select v-model="filterStatus" :options="statusOptions" option-label="label" option-value="value"
                emit-value map-options label="Estado" outlined dense clearable
                class="col-12 col-sm-4 col-md-3 filter-input">
                <template v-slot:prepend>
                  <q-icon name="toggle_on" class="text-brown-6" />
                </template>
              </q-select>

              <q-select v-model="filterType" :options="typeOptions" label="Tipo de Persona" outlined dense clearable
                emit-value map-options class="col-12 col-sm-4 col-md-3 filter-input">
                <template v-slot:prepend>
                  <q-icon name="category" class="text-green-8" />
                </template>
              </q-select>

              <!-- <q-input v-model="filterExperienciaMin" type="number" label="Experiencia Mínima (años)" outlined dense
                clearable class="col-12 col-sm-6 col-md-3 filter-input" :min="0">
                <template v-slot:prepend>
                  <q-icon name="timeline" class="text-light-green-8" />
                </template>
              </q-input>

              <q-input v-model="filterSalarioMin" type="number" label="Salario Mínimo" outlined dense clearable
                class="col-12 col-sm-6 col-md-3 filter-input" :min="0">
                <template v-slot:prepend>
                  <q-icon name="payments" class="text-amber-8" />
                </template>
              </q-input> -->

              <q-select v-model="filterGenero" :options="generoOptions" label="Género" outlined dense clearable
                emit-value map-options class="col-12 col-sm-4 col-md-3 filter-input">
                <template v-slot:prepend>
                  <q-icon name="wc" class="text-green-6" />
                </template>
              </q-select>
            </div>

            <!-- <div class="row justify-end q-mt-md q-gutter-sm">
              <q-btn label="Limpiar filtros" outline class="btn-clear-filters" icon="clear_all" @click="clearFilters" />
              <q-btn label="Aplicar filtros" class="btn-apply-filters" icon="check" @click="applyFilters" unelevated />
            </div> -->
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>

    <!--
    <q-card> <q-table :rows="filteredPersonas" :columns="columns" row-key="id" :loading="loading" :pagination="pagination" :rows-per-page-options="[5, 10, 20, 50]" >  <template v-slot:body-cell-estado="props"> <q-td :props="props"> <q-badge :color="getStatusColor(props.row.estado)" :label="getStatusLabel(props.row.estado)" /> </q-td> </template>  <template v-slot:body-cell-categoria="props"> <q-td :props="props"> {{ props.row.fecha_nacimiento ? new Date(props.row.fecha_nacimiento).getFullYear() : 'N/A' }} </q-td> </template>  <template v-slot:body-cell-experiencia="props"> <q-td :props="props"> {{ props.row.experiencia }} años </q-td> </template> <template v-slot:body-cell-fotografia="props"> <q-td :props="props"> <q-avatar v-if="props.row.fotografia"> <img :src='host+props.row.fotografia'> </q-avatar> <q-avatar v-else color="primary" text-color="white"> {{ getInitials(props.row.nombres, props.row.apellido_paterno) }} </q-avatar> </q-td> </template><template v-slot:body-cell-actions="props"> <q-td :props="props"> <q-btn icon="edit" color="primary" flat dense @click="editPersona(props.row)" /> <q-btn icon="delete" color="negative" flat dense @click="confirmDeletePersona(props.row)" /> <q-btn icon="visibility" color="info" flat dense @click="viewPersonaDetails(props.row)" /> </q-td> </template> </q-table> </q-card>
    -->


    <!-- Tabla de personas -->
    <q-infinite-scroll ref="infiniteScrollRef" class="product-list-scroll" @load="loadMore" :offset="250"
      :disable="!hasMoreData || loadingMore">
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
      <div class="row q-col-gutter-md">

        <div v-for="(persona, index) in filteredPersonas" :key="persona.id" class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
          :style="{ animationDelay: (index * 30) + 'ms' }">
          <q-card class="trainer-card">
            <div class="card-number">{{ index + 1 }}</div>

            <div class="card-ribbon" :class="persona.estado ? 'ribbon-active' : 'ribbon-inactive'">
              {{ persona.estado ? 'ACTIVO' : 'INACTIVO' }}
            </div>

            <q-card-section class="card-header" @click="viewPersonaDetails(persona)">
              <div class="avatar-container">
                <q-avatar size="80px" class="avatar-trainer">
                  <q-img v-if="persona.fotografia" :src="host + persona.fotografia" />
                  <div v-else class="avatar-placeholder">
                    {{ getInitials(persona.nombres, persona.apellido_paterno) }}
                  </div>
                </q-avatar>
              </div>

              <div class="trainer-name">
                {{ persona.nombres }} {{ persona.apellido_paterno }}
              </div>
              <div class="trainer-lastname">
                {{ persona.apellido_materno }}
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="card-body">
              <div class="info-row">
                <q-icon name="badge" size="18px" class="info-icon text-brown-7" />
                <span class="info-label">CI:</span>
                <span class="info-value">{{ persona.ci }} {{ persona.complemento }}</span>
              </div>

              <div class="info-row">
                <q-icon name="phone" size="18px" class="info-icon text-green-7" />
                <span class="info-label">Teléfono:</span>
                <span class="info-value">{{ persona.telefono || 'N/A' }}</span>
              </div>

              <div v-if="persona.fecha_nacimiento" class="info-row">
                <q-icon name="cake" size="18px" class="info-icon text-pink-7" />
                <span class="info-label">Edad:</span>
                <span class="info-value">{{ calcularEdad(persona.fecha_nacimiento) }} años</span>
              </div>

              <div v-if="persona.experiencia" class="info-row">
                <q-icon name="workspace_premium" size="18px" class="info-icon text-amber-8" />
                <span class="info-label">Experiencia:</span>
                <span class="info-value">{{ persona.experiencia }} año{{ persona.experiencia !== 1 ? 's' : '' }}</span>
              </div>

              <div v-if="persona.salario && esAdministrador" class="info-row">
                <q-icon name="payments" size="18px" class="info-icon text-green-8" />
                <span class="info-label">Salario:</span>
                <span class="info-value">Bs. {{ persona.salario }}</span>
              </div>

              <div v-if="persona.grupos_maximo" class="info-row">
                <q-icon name="groups_3" size="18px" class="info-icon text-light-green-8" />
                <span class="info-label">Grupos máx.:</span>
                <span class="info-value">{{ persona.grupos_maximo }}</span>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions class="card-actions">
              <q-btn class="btn-action btn-edit" round icon="edit" @click="editPersona(persona)">
                <q-tooltip>Editar entrenador</q-tooltip>
              </q-btn>
              <q-btn class="btn-action btn-toggle" round :icon="persona.estado ? 'person_remove' : 'person_add_alt'"
                @click="confirmDeletePersona(persona)">
                <q-tooltip>
                  {{ persona.estado ? 'Dar de baja' : 'Restaurar' }}
                </q-tooltip>
              </q-btn>
              <q-btn class="btn-action btn-view" round icon="visibility" @click="viewPersonaDetails(persona)">
                <q-tooltip>Ver detalles</q-tooltip>
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>


        <!-- Spinner de carga -->
        <div class="col-12 text-center q-my-md">



        </div>

      </div>
      <template v-if="!hasMoreData && personas.length > 0">
        <div class="text-caption text-grey-7 q-my-md">
          <q-icon name="info" class="q-mr-xs" /> No hay más datos para mostrar
        </div>
      </template>
    </q-infinite-scroll>

    <!-- Diálogo para crear/editar persona -->
    <PersonaDialog v-model="personaDialog" :persona="currentPersona" :edit-mode="editMode" @save="savePersona"
      @close="closeDialogAdd" :student="false" />

    <!-- Diálogo de detalles -->
    <PersonaDetails v-model="detailsDialog" :persona="selectedPersona" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useQuasar } from 'quasar'
import PersonaDialog from '../entrenadores/PersonaDialog.vue'
import PersonaDetails from '../estudiantes/PersonaDetails.vue'
import { agregar, listar, categoriasUnicas, modificar, cambiarEstado, datosEntrenadoresAdministradores } from 'src/stores/persona-store.js'

const $q = useQuasar()
const host = 'http://localhost:3001/uploads/'
// Datos de ejemplo

// Estado del componente
const personas = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMoreData = ref(true)
const currentPage = ref(1)
const itemsPerPage = 10
const searchInput = ref('')
const searchTerm = ref('')
const filterCategory = ref(null)
const filterStatus = ref(true)
const filterType = ref('')
const filterExperienciaMin = ref(null)
const filterSalarioMin = ref(null)
const filterGenero = ref(null)
const filtersExpanded = ref(false)
let searchTimeout = null

// Opciones de género
const generoOptions = [
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' },
  { label: 'Otro', value: 'O' }
]

// Computed para contar filtros activos
const activeFiltersCount = computed(() => {
  let count = 0
  if (filterStatus.value !== null && filterStatus.value !== true) count++
  if (filterType.value) count++
  if (filterExperienciaMin.value) count++
  if (filterSalarioMin.value) count++
  if (filterGenero.value) count++
  return count
})

// Estadísticas principales desde el backend
const estadisticasPrincipales = ref({
  totalEntrenadores: 0,
  totalAdministradores: 0,
  cumpleanosEsteMes: 0
})

const cargarEstadisticas = async () => {
  try {
    const datos = await datosEntrenadoresAdministradores()
    estadisticasPrincipales.value = datos
    console.log('estadistica principales:-------------------------', datos);

  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  }
}

// Computed para verificar si el usuario actual es administrador
const esAdministrador = computed(() => {
  const idRol = parseInt(sessionStorage.getItem('selectedRoleId') || 0)
  return idRol === 4
})

// Función para manejar la búsqueda con debounce
const handleSearchInput = (value) => {
  // Limpiar el timeout anterior si existe
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  // Configurar un nuevo timeout
  searchTimeout = setTimeout(() => {
    searchTerm.value = value
    console.log('Término de búsqueda después de 2 segundos:', value)
    // Aquí puedes agregar la lógica de búsqueda que desees ejecutar
    loadStudents(1, false)
  }, 0) // 2000ms = 2 segundos
}
const personaDialog = ref(false)
const detailsDialog = ref(false)
const editMode = ref(false)
const currentPersona = ref(createEmptyPersona())
const selectedPersona = ref(null)

const infiniteScrollRef = ref(null)

// Opciones para filtros
const statusOptions = [
  { label: 'Activo', value: true },
  { label: 'Inactivo', value: false }
]
const typeOptions = ['entrenador', 'administrador']
const categoryOptions = ref([])

// Columnas de la tabla
// eslint-disable-next-line no-unused-vars
const columns = [
  {
    name: 'fotografia',
    label: 'Foto',
    align: 'center'
  },
  {
    name: 'nombres',
    label: 'Nombres',
    field: row => `${row.nombres} ${row.apellido_paterno} ${row.apellido_materno}`,
    align: 'left',
    sortable: true
  },
  {
    name: 'ci',
    label: 'CI',
    field: row => `${row.ci} ${row.complemento}`,
    align: 'center'
  },
  {
    name: 'categoria',
    label: 'Categoría',
    field: 'categoria',
    align: 'center'
  },
  {
    name: 'tipo_persona',
    label: 'Tipo',
    field: 'tipo_persona',
    align: 'center',
    sortable: true
  },
  {
    name: 'experiencia',
    label: 'Experiencia',
    field: 'experiencia',
    align: 'center'
  },
  {
    name: 'estado',
    label: 'Estado',
    align: 'center'
  },
  {
    name: 'actions',
    label: 'Acciones',
    align: 'center'
  }
]

// Paginación
// eslint-disable-next-line no-unused-vars
const pagination = ref({
  sortBy: 'nombres',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

// Función para calcular la edad a partir de la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}

// Función para crear una persona vacía
function createEmptyPersona() {
  return {
    id: null,
    ci: '',
    complemento: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    categoria: '',
    estado: true,
    fotografia: null,
    telefono: '',
    fecha_nacimiento: '',
    biografia: '',
    experiencia: 0,
    tipo_persona: ''
  }
}

// Obtener iniciales para avatar
function getInitials(nombres, apellido) {
  // Verificar si los parámetros son válidos
  const firstChar = nombres && typeof nombres === 'string' && nombres.length > 0 ? nombres.charAt(0).toUpperCase() : ''
  const lastChar = apellido && typeof apellido === 'string' && apellido.length > 0 ? apellido.charAt(0).toUpperCase() : ''
  return firstChar + lastChar || '?'
}

const closeDialogAdd = () => {
  console.log('cerrando modal de persona ya en la lista de cards')
  // Primero limpia los datos
  currentPersona.value = createEmptyPersona()
  editMode.value = false

  // Luego cierra el diálogo
  // Usando nextTick para asegurar que las actualizaciones de estado anteriores se completen
  nextTick(() => {
    personaDialog.value = false
  })
}
// Filtrar personas
const filteredPersonas = computed(() => {
  let result = personas.value

  // Filtro de búsqueda general
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    console.log('term-----------------------------', term)
  }

  return result
})

// Mostrar diálogo para crear persona
function showPersonaDialog() {
  editMode.value = false
  currentPersona.value = createEmptyPersona()
  personaDialog.value = true
}

// Editar persona
function editPersona(persona) {
  editMode.value = true
  currentPersona.value = { ...persona }
  personaDialog.value = true
}

// Guardar persona
const savePersona = async (personaData) => {
  console.log('Guardando persona:', personaData)
  if (editMode.value) {
    // Actualizar persona existente
    await modificar(personaData)
    closeDialogAdd()
    $q.notify({
      type: 'positive',
      message: 'Persona actualizada correctamente'
    })
  } else {
    // Crear nueva persona
    await agregar(personaData)
    createEmptyPersona()
    $q.notify({
      type: 'positive',
      message: 'Persona creada correctamente'
    })
  }
  currentPage.value = 1
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
  }
  loadStudents()
}

// Confirmar eliminación de persona
function confirmDeletePersona(persona) {
  $q.dialog({
    title: 'Confirmar baja',
    message: `¿Estás seguro de dar de baja a ${persona.nombres} ${persona.apellido_paterno}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    persona.estado = !persona.estado
    await cambiarEstado(persona)
    $q.notify({
      type: `${persona.estado ? 'positive' : 'negative'}`,
      message: `Persona ${!persona.estado ? 'eliminada' : 'restaurada'} correctamente`
    })
  })
}

// Ver detalles de persona
function viewPersonaDetails(persona) {
  selectedPersona.value = persona
  detailsDialog.value = true
}

// Limpiar filtros
// eslint-disable-next-line no-unused-vars
function clearFilters() {
  searchTerm.value = ''
  searchInput.value = ''
  filterCategory.value = null
  filterStatus.value = true
  filterType.value = ''
  filterExperienciaMin.value = null
  filterSalarioMin.value = null
  filterGenero.value = null
  loadStudents(1, false)
}

// Aplicar filtros
// eslint-disable-next-line no-unused-vars
function applyFilters() {
  loadStudents(1, false)
}


const loadStudents = async (page = 1, append = false) => {
  try {
    if (append) loadingMore.value = true
    else {
      loading.value = true
      personas.value = [] // Reinicia la lista si no es append
      currentPage.value = page
      hasMoreData.value = true
    }

    // Prepara los parámetros de filtros y búsqueda
    const params = {
      tipo_persona: filterType.value,
      estado: filterStatus.value,
      categoria: filterCategory.value,
      genero: filterGenero.value,
      search: searchTerm.value,
      page,
      limit: itemsPerPage,
      entrenadores: true
    }

    // Consulta al backend
    const response = await listar(params)
    if (response && Array.isArray(response.data)) {
      console.log('response.data-----------------------------', response.data);

      if (append && page > 1) {
        personas.value.push(...response.data)
      } else {
        personas.value = response.data
      }
      hasMoreData.value = response.data.length === itemsPerPage
      currentPage.value++
    } else {
      hasMoreData.value = false
    }
  } catch (error) {
    console.log(error);
    hasMoreData.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async (index, done) => {
  console.log('indexxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', index)
  if (!hasMoreData.value || loadingMore.value) {
    done()
    return
  }
  setTimeout(async () => {
    await loadStudents(index, true)
    done()
  }, 1000)
}

// Cuando cambian los filtros o búsqueda
watch([filterType, filterStatus, filterCategory, filterGenero, searchTerm], () => {
  currentPage.value = 1
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
  }
  loadStudents(1, false)
})
// Cargar datos iniciales
onMounted(async () => {
  try {
    await cargarEstadisticas()
    await loadStudents()
    const response = await categoriasUnicas()
    // Asegurarse de que la respuesta sea un array
    if (Array.isArray(response)) {
      // Mapear las categorías al formato esperado por q-select
      categoryOptions.value = response.map(categoria => ({
        label: categoria,
        value: categoria
      }))
      console.log('Categorías cargadas:', categoryOptions.value)
    }
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error)
  }
})
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

/* Paleta de colores verde-marrón tierra/naturaleza */
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-sage: #8bc34a;
$color-bark: #5d4037;
$color-wood: #795548;
$color-earth: #8d6e63;
$color-clay: #a1887f;
$color-sand: #bcaaa4;

$pastel-mint: #c8e6c9;
$pastel-lime: #dcedc8;
$pastel-sage: #f1f8e9;
$pastel-sand: #efebe9;
$pastel-clay: #d7ccc8;

/* Fondo degradado tierra */
.bg-gradient {
  background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 50%, #efebe9 100%);
}

.page-container {
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Header principal */
.page-header {
  animation: slideDown 0.6s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-content {
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 50%, $color-bark 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title {
  font-size: 2.5em;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
}

.header-subtitle {
  color: #5d4037;
  font-size: 1.1em;
  margin: 8px 0 0 0;
  font-weight: 500;
}

/* Tarjetas de estadísticas */
.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.stat-card {
  flex: 1;
  min-width: 180px;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.stat-card-total {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
}

.stat-card-active {
  background: linear-gradient(135deg, $color-leaf 0%, $color-sage 100%);
  color: white;
}

.stat-card-inactive {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
}

.stat-card-experience {
  background: linear-gradient(135deg, #ffa726 0%, #ffb74d 100%);
  color: white;
}

.stat-card-birthday {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
  color: white;
}

.stat-icon {
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 2.5em;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 0.85em;
  opacity: 0.95;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Toolbar */
.toolbar-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-left: 4px solid $color-forest;
}

.search-input :deep(.q-field__control) {
  transition: all 0.3s ease;
}

.search-input:hover :deep(.q-field__control) {
  border-color: $color-moss;
}

.search-input:focus-within :deep(.q-field__control) {
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
}

.btn-add-header {
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-add-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(46, 125, 50, 0.4);
}

/* Filtros */
.filters-expansion {
  background: $pastel-sage;
  border-radius: 12px;
  border-left: 4px solid $color-moss;
}

.filters-header {
  display: flex;
  align-items: center;
  font-weight: 700;
  color: $color-forest;
  width: 100%;
}

.filters-title {
  font-size: 1.1em;
}

.filters-body {
  background: white;
  padding: 20px;
  border-radius: 0 0 12px 12px;
}

.filter-input :deep(.q-field__control) {
  transition: all 0.3s ease;
}

.filter-input:hover :deep(.q-field__control) {
  border-color: $color-moss;
}

.btn-clear-filters {
  border: 2px solid $color-earth;
  color: $color-earth;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-clear-filters:hover {
  background: $color-earth;
  color: white;
}

.btn-apply-filters {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(85, 139, 47, 0.3);
  transition: all 0.3s ease;
}

.btn-apply-filters:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(85, 139, 47, 0.4);
}

/* Tarjetas de entrenadores */
.trainer-card {
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  opacity: 0;
  animation: cardFadeIn 0.6s ease forwards;
  border: 2px solid $pastel-mint;
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
  }
}

.trainer-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: $color-leaf;
}

.card-number {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9em;
  box-shadow: 0 2px 8px rgba(93, 64, 55, 0.3);
  z-index: 10;
}

.card-ribbon {
  position: absolute;
  top: 16px;
  right: -32px;
  padding: 4px 40px;
  font-size: 0.65em;
  font-weight: 800;
  letter-spacing: 1px;
  transform: rotate(45deg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.ribbon-active {
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
  color: white;
}

.ribbon-inactive {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
}

.card-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 100%);
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-header:hover {
  background: linear-gradient(135deg, $pastel-mint 0%, $pastel-lime 100%);
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.avatar-trainer {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-placeholder {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-size: 1.6em;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.trainer-name {
  font-size: 1.1em;
  font-weight: 700;
  color: $color-forest;
  line-height: 1.2;
  margin-bottom: 4px;
}

.trainer-lastname {
  font-size: 0.95em;
  font-weight: 600;
  color: $color-wood;
  line-height: 1.2;
}

.card-body {
  padding: 16px;
  background: white;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid $pastel-mint;
  transition: all 0.3s ease;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row:hover {
  background: $pastel-sage;
  padding-left: 8px;
  margin: 0 -8px;
  padding-right: 8px;
  border-radius: 8px;
}

.info-icon {
  flex-shrink: 0;
}

.info-label {
  font-size: 0.85em;
  font-weight: 600;
  color: $color-bark;
  min-width: 80px;
}

.info-value {
  font-size: 0.9em;
  font-weight: 500;
  color: #424242;
  flex: 1;
}

.card-actions {
  background: $pastel-sand;
  padding: 12px;
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.btn-action {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-action:hover {
  transform: scale(1.15);
}

.btn-edit {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
}

.btn-edit:hover {
  box-shadow: 0 4px 12px rgba(85, 139, 47, 0.4);
}

.btn-toggle {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
}

.btn-toggle:hover {
  box-shadow: 0 4px 12px rgba(121, 85, 72, 0.4);
}

.btn-view {
  background: linear-gradient(135deg, $color-lime 0%, #c5e1a5 100%);
  color: #33691e;
}

.btn-view:hover {
  box-shadow: 0 4px 12px rgba(156, 204, 101, 0.4);
}

/* Responsive */
@media (max-width: 959px) {
  .page-title {
    font-size: 2em;
  }

  .stats-container {
    flex-direction: column;
  }

  .stat-card {
    width: 100%;
  }

  .btn-add-header {
    width: 100%;
    margin-top: 12px;
  }
}

@media (max-width: 599px) {
  .page-header {
    flex-direction: column;
  }

  .page-title {
    font-size: 1.6em;
  }

  .header-subtitle {
    font-size: 0.9em;
    margin-bottom: 8px;
  }

  .header-title {
    margin-bottom: 8px;
  }

  .stat-card {
    min-width: 100%;
    padding: 16px;
  }

  .stat-number {
    font-size: 1.8em;
  }

  .card-number {
    width: 28px;
    height: 28px;
    font-size: 0.8em;
  }

  .trainer-name {
    font-size: 1em;
  }

  .info-label {
    min-width: 70px;
    font-size: 0.8em;
  }

  .info-value {
    font-size: 0.85em;
  }
}
</style>
