<template>
  <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <div class="q-mb-md">
      <h2 class="text-h4 q-ma-none page-title">Gestión de Entrenadores</h2>
    </div>

    <!-- Barra de herramientas -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <!-- Buscador -->
          <q-input v-model="searchInput" clearable @update:model-value="handleSearchInput" outlined dense
            placeholder="Buscar personas..." class="col-md-4" :debounce="500">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <!-- Botón para agregar persona -->
          <q-btn color="primary" icon="add" label="Agregar Entrenador" @click="showPersonaDialog" />


        </div>

        <!-- Filtros avanzados -->
        <q-expansion-item v-model="filtersExpanded" label="Filtros avanzados" class="q-mt-sm">
          <div class="row q-col-gutter-md q-pt-md">

            <q-select v-model="filterStatus" :options="statusOptions" option-label="label" option-value="value"
              emit-value map-options label="Estado" outlined dense clearable class="col-md-3 col-sm-6 col-xs-12" />

            <q-select v-model="filterType" :options="typeOptions" label="Tipo de Persona" outlined dense clearable
              class="col-md-3 col-sm-6 col-xs-12" />

          </div>
          <div class="row justify-end q-mt-sm">
            <q-btn label="Limpiar filtros" flat color="primary" @click="clearFilters" />
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

        <div v-for="(persona, index) in filteredPersonas" :key="persona.id"
          class="col-xs-12 col-sm-6 col-md-4 col-lg-3">
          <q-card class="my-card" height="100px">
            <q-card-section class="q-pa-sm" @click="viewPersonaDetails(persona)">
              <div class="row items-start">
                <!-- Columna de la imagen -->
                <div class="col-4">
                  <div class="image-container">
                    <q-img v-if="persona.fotografia" :src="host + persona.fotografia" class="card-img"
                      style="width: 100%; height: 100%; object-fit: cover;" />
                    <div v-else class="flex flex-center bg-primary text-white" style="width: 100%; height: 100%;">
                      <q-avatar size="60px" color="secondary" text-color="white" font-size="24px">
                        {{ getInitials(persona.nombres, persona.apellido_paterno) }}
                      </q-avatar>
                    </div>
                  </div>
                  <p class="text-subtitle2 text-weight-medium" style="font-size: 30px">{{ index + 1 }}</p>
                </div>

                <!-- Columna de la información -->
                <div class="col-8 q-pl-md">
                  <div class="text-subtitle2 text-weight-medium">
                    {{ persona.nombres }} {{ persona.apellido_paterno }} {{ persona.apellido_materno }}
                  </div>
                  <div class="text-caption">
                    <div><strong>CI:</strong> {{ persona.ci }} {{ persona.complemento }}</div>
                    <div><strong>Teléfono:</strong> {{ persona.telefono || '' }}</div>
                    <div v-if="persona.tipo_persona === 'entrenador'"><strong>Categoría:</strong> {{ persona.categoria
                      ||
                      ''
                      }}</div>
                    <div><strong>Edad:</strong> {{ persona.fecha_nacimiento ? calcularEdad(persona.fecha_nacimiento) +
                      ' años' : 'N/A' }}</div>
                    <div v-if="persona.experiencia"><strong>Experiencia:</strong> {{ persona.experiencia }} año{{
                      persona.experiencia !== 1 ? 's' :
                        ''
                    }}</div>
                  </div>

                  <div class="q-mt-xs">
                    <q-badge :color="getStatusColor(persona.estado)" class="q-mr-xs">
                      {{ getStatusLabel(persona.estado) }}
                    </q-badge>
                    <!-- <q-badge :color="persona.tipo_persona === 'entrenador' ? 'primary' : 'info'" text-color="white">
                      {{ persona.tipo_persona }}
                    </q-badge> -->
                  </div>
                </div>
              </div>
            </q-card-section>

            <!-- Acciones
          <q-card-actions align="right" class="q-px-md q-pb-md">

            <div class="text-body2 text-center q-mt-sm">
              Experiencia: <strong>{{ persona.experiencia }} años</strong>
            </div>
          </q-card-actions>
-->

            <!-- Acciones -->
            <q-separator />

            <q-card-actions align="around">
              <q-btn icon="edit" color="primary" flat dense @click="editPersona(persona)" />
              <q-btn :icon="persona.estado ? 'delete' : 'restore_from_trash'"
                :color="!persona.estado ? 'positive' : 'negative'" flat dense @click="confirmDeletePersona(persona)">
                <q-tooltip>
                  {{ persona.estado ? 'Eliminar persona' : 'Restaurar persona' }}
                </q-tooltip>
              </q-btn>
              <q-btn icon="visibility" color="info" flat dense @click="viewPersonaDetails(persona)" />
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
import { agregar, listar, categoriasUnicas, modificar, cambiarEstado } from 'src/stores/persona-store.js'

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
let searchTimeout = null

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
    estado: 1,
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
function clearFilters() {
  searchTerm.value = ''
  searchInput.value = ''
  filterCategory.value = null
  filterStatus.value = null
}

// Obtener color para el estado
function getStatusColor(status) {
  return status ? 'positive' : 'negative'
}

// Obtener texto para el estado
function getStatusLabel(status) {
  return status ? 'Activo' : 'Inactivo'
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
watch([filterType, filterStatus, filterCategory, searchTerm], () => {
  currentPage.value = 1
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
  }
  loadStudents(1, false)
})
// Cargar datos iniciales
onMounted(async () => {
  try {
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
    console.error('Error al cargar categorías:', error)
  }
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

/* Estilos personalizados */
.my-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.my-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.image-container {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Estilos para la información de la tarjeta */
.text-subtitle2 {
  line-height: 1.2;
  margin-bottom: 4px;
}

.text-caption {
  line-height: 1.4;
}

.text-caption div {
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Ajustes para los badges */
.q-badge {
  font-size: 10px;
  padding: 2px 6px;
  margin-bottom: 2px;
}

/* Ajustes para el contenedor de la tarjeta */
.q-card__section {
  flex-grow: 1;
  padding: 12px;
}

/* Ajustes para las acciones de la tarjeta */
.q-card__actions {
  padding: 8px 12px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* Ajustes para pantallas pequeñas */
@media (max-width: 599px) {
  .image-container {
    width: 60px;
    height: 60px;
  }

  .text-caption div {
    font-size: 11px;
  }
}
</style>
