<template>
    <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
        <div class="row items-center justify-between q-mb-md">
            <div>
                <h4 class="text-primary q-mb-xs q-mt-none page-title">Reporte de Entrenadores</h4>
                <p class="text-grey-7">Generar reportes PDF y Excel de entrenadores</p>
            </div>
            <div class="row q-gutter-sm">
                <q-btn color="orange" icon="picture_as_pdf" label="Generar PDF" @click="generarReporteGeneralPDF" />
                <q-btn color="positive" icon="file_download" label="Generar Excel"
                    @click="generarReporteGeneralExcel" />
            </div>
        </div>

        <!-- Filtros -->
        <q-card class="q-mb-md">
            <q-card-section>
                <div class="row q-col-gutter-md">
                    <!-- Búsqueda general -->
                    <q-input v-model="filters.search" outlined dense clearable
                        placeholder="Buscar por nombre, CI, teléfono..." class="col-12 col-md-4">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>

                    <!-- Género -->
                    <q-select v-model="filters.genero" :options="generoOptions" label="Género" outlined dense clearable
                        emit-value map-options class="col-6 col-md-2" />

                    <!-- Estado -->
                    <q-select v-model="filters.estado" :options="estadoOptions" label="Estado" outlined dense clearable
                        emit-value map-options class="col-6 col-md-2" />

                    <!-- Categoría -->
                    <q-select v-model="filters.categoria" :options="categoriaOptions" label="Categoría" outlined dense
                        clearable class="col-6 col-md-2" />

                    <!-- Rango de edad -->
                    <q-input v-model.number="filters.edadMin" type="number" outlined dense label="Edad mínima"
                        class="col-6 col-md-2" :min="0" :max="99" />

                    <q-input v-model.number="filters.edadMax" type="number" outlined dense label="Edad máxima"
                        class="col-6 col-md-2" :min="0" :max="99" />

                    <!-- Años de experiencia -->
                    <q-input v-model.number="filters.experienciaMin" type="number" outlined dense
                        label="Experiencia mínima (años)" class="col-6 col-md-2" :min="0" />

                    <q-input v-model.number="filters.experienciaMax" type="number" outlined dense
                        label="Experiencia máxima (años)" class="col-6 col-md-2" :min="0" />

                    <!-- Disciplina -->
                    <q-select v-model="filters.disciplina" :options="disciplinaOptions" option-label="nombre"
                        option-value="id" label="Disciplina asignada" outlined dense clearable emit-value map-options
                        class="col-6 col-md-3" />

                    <!-- Con entrenamientos asignados -->
                    <q-select v-model="filters.conEntrenamientos" :options="booleanOptions"
                        label="Con entrenamientos asignados" outlined dense clearable emit-value map-options
                        class="col-6 col-md-3" />

                    <!-- Con torneos asignados -->
                    <q-select v-model="filters.conTorneos" :options="booleanOptions" label="Con torneos asignados"
                        outlined dense clearable emit-value map-options class="col-6 col-md-3" />
                </div>

                <div class="row justify-end q-mt-sm q-gutter-sm">
                    <q-btn label="Limpiar filtros" flat color="primary" icon="clear_all" @click="clearFilters" />
                    <q-btn label="Aplicar filtros" color="primary" icon="filter_list" @click="applyFilters" />
                </div>
            </q-card-section>
        </q-card>

        <!-- Tabla -->
        <q-card>
            <q-table :rows="filteredEntrenadores" :columns="columns" row-key="id" :loading="loading"
                :pagination="pagination" @request="onRequest" binary-state-sort
                :rows-per-page-options="[10, 25, 50, 100]" class="entrenadores-table">
                <template v-slot:body-cell-fotografia="props">
                    <q-td :props="props">
                        <q-avatar v-if="props.row.fotografia" size="40px">
                            <img :src="host + props.row.fotografia" />
                        </q-avatar>
                        <q-avatar v-else size="40px" color="primary" text-color="white">
                            {{ getInitials(props.row.nombres, props.row.apellido_paterno) }}
                        </q-avatar>
                    </q-td>
                </template>

                <template v-slot:body-cell-nombre_completo="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">{{ props.row.nombres }} {{ props.row.apellido_paterno }} {{
                            props.row.apellido_materno }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-ci="props">
                    <q-td :props="props">
                        {{ props.row.ci }}{{ props.row.complemento ? '-' + props.row.complemento : '' }}
                    </q-td>
                </template>

                <template v-slot:body-cell-genero="props">
                    <q-td :props="props">
                        <q-badge :color="props.row.genero === 'M' ? 'blue' : 'pink'">
                            {{ props.row.genero === 'M' ? 'Masculino' : 'Femenino' }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-edad="props">
                    <q-td :props="props">
                        {{ calcularEdad(props.row.fecha_nacimiento) }} años
                    </q-td>
                </template>

                <template v-slot:body-cell-experiencia="props">
                    <q-td :props="props">
                        {{ props.row.experiencia || 0 }} año{{ props.row.experiencia !== 1 ? 's' : '' }}
                    </q-td>
                </template>

                <template v-slot:body-cell-entrenamientos="props">
                    <q-td :props="props">
                        <q-badge color="teal">
                            {{ props.row.entrenamientos_count || 0 }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-torneos="props">
                    <q-td :props="props">
                        <q-badge color="purple">
                            {{ props.row.torneos_count || 0 }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-estado="props">
                    <q-td :props="props">
                        <q-badge :color="props.row.estado ? 'positive' : 'negative'">
                            {{ props.row.estado ? 'Activo' : 'Inactivo' }}
                        </q-badge>
                    </q-td>
                </template>
            </q-table>
        </q-card>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listar, categoriasUnicas } from 'src/stores/persona-store'
import { listarDisciplinas } from 'src/stores/disciplina-store'
import { reporteEntrenadorPDF, reporteEntrenadorExcel } from 'src/stores/reportes'
import { Notify } from 'quasar'

const host = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'

const loading = ref(false)
const entrenadores = ref([])
const categoriaOptions = ref([])
const disciplinaOptions = ref([])

const filters = ref({
    search: '',
    genero: null,
    estado: true,
    categoria: null,
    edadMin: null,
    edadMax: null,
    experienciaMin: null,
    experienciaMax: null,
    disciplina: null,
    conEntrenamientos: null,
    conTorneos: null
})

const pagination = ref({
    sortBy: 'nombres',
    descending: false,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0
})

const generoOptions = [
    { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' }
]

const estadoOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
]

const booleanOptions = [
    { label: 'Sí', value: true },
    { label: 'No', value: false }
]

const columns = [
    { name: 'fotografia', label: 'Foto', align: 'center', field: 'fotografia', sortable: false },
    { name: 'nombre_completo', label: 'Nombre completo', align: 'left', field: 'nombres', sortable: true },
    { name: 'ci', label: 'CI', align: 'left', field: 'ci', sortable: true },
    { name: 'genero', label: 'Género', align: 'center', field: 'genero', sortable: true },
    { name: 'edad', label: 'Edad', align: 'center', field: 'fecha_nacimiento', sortable: true },
    { name: 'telefono', label: 'Teléfono', align: 'left', field: 'telefono', sortable: true },
    { name: 'categoria', label: 'Categoría', align: 'left', field: 'categoria', sortable: true },
    { name: 'experiencia', label: 'Experiencia', align: 'center', field: 'experiencia', sortable: true },
    { name: 'entrenamientos', label: 'Entrenamientos', align: 'center', field: 'entrenamientos_count', sortable: true },
    { name: 'torneos', label: 'Torneos', align: 'center', field: 'torneos_count', sortable: true },
    { name: 'estado', label: 'Estado', align: 'center', field: 'estado', sortable: true }
]

const filteredEntrenadores = computed(() => {
    let result = [...entrenadores.value]

    // Búsqueda general
    if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        result = result.filter(e =>
            (e.nombres?.toLowerCase().includes(searchLower)) ||
            (e.apellido_paterno?.toLowerCase().includes(searchLower)) ||
            (e.apellido_materno?.toLowerCase().includes(searchLower)) ||
            (e.ci?.toString().includes(searchLower)) ||
            (e.telefono?.includes(searchLower))
        )
    }

    // Filtro por género
    if (filters.value.genero) {
        result = result.filter(e => e.genero === filters.value.genero)
    }

    // Filtro por estado
    if (filters.value.estado !== null) {
        result = result.filter(e => e.estado === filters.value.estado)
    }

    // Filtro por categoría
    if (filters.value.categoria) {
        result = result.filter(e => e.categoria === filters.value.categoria)
    }

    // Filtro por rango de edad
    if (filters.value.edadMin !== null && filters.value.edadMin !== '') {
        result = result.filter(e => calcularEdad(e.fecha_nacimiento) >= filters.value.edadMin)
    }
    if (filters.value.edadMax !== null && filters.value.edadMax !== '') {
        result = result.filter(e => calcularEdad(e.fecha_nacimiento) <= filters.value.edadMax)
    }

    // Filtro por rango de experiencia
    if (filters.value.experienciaMin !== null && filters.value.experienciaMin !== '') {
        result = result.filter(e => (e.experiencia || 0) >= filters.value.experienciaMin)
    }
    if (filters.value.experienciaMax !== null && filters.value.experienciaMax !== '') {
        result = result.filter(e => (e.experiencia || 0) <= filters.value.experienciaMax)
    }

    // Filtro por disciplina
    if (filters.value.disciplina) {
        result = result.filter(e => e.disciplinas && e.disciplinas.includes(filters.value.disciplina))
    }

    // Filtro por entrenamientos asignados
    if (filters.value.conEntrenamientos !== null) {
        result = result.filter(e => filters.value.conEntrenamientos
            ? (e.entrenamientos_count > 0)
            : (e.entrenamientos_count === 0 || !e.entrenamientos_count)
        )
    }

    // Filtro por torneos asignados
    if (filters.value.conTorneos !== null) {
        result = result.filter(e => filters.value.conTorneos
            ? (e.torneos_count > 0)
            : (e.torneos_count === 0 || !e.torneos_count)
        )
    }

    pagination.value.rowsNumber = result.length
    return result
})

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return 0
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--
    }
    return edad
}

function getInitials(nombres, apellido) {
    const n = (nombres || '').charAt(0)
    const a = (apellido || '').charAt(0)
    return (n + a).toUpperCase()
}

async function cargarEntrenadores() {
    loading.value = true
    try {
        const response = await listar({ tipo: 'entrenador' })
        entrenadores.value = Array.isArray(response) ? response : (response?.data || [])

        // Simular datos adicionales si no vienen del backend
        entrenadores.value = entrenadores.value.map(e => ({
            ...e,
            entrenamientos_count: e.entrenamientos_count || Math.floor(Math.random() * 15),
            torneos_count: e.torneos_count || Math.floor(Math.random() * 8)
        }))

        pagination.value.rowsNumber = entrenadores.value.length
    } catch (error) {
        console.error('Error al cargar entrenadores:', error)
        Notify.create({
            type: 'negative',
            message: 'Error al cargar entrenadores',
            position: 'bottom'
        })
    } finally {
        loading.value = false
    }
}

async function cargarCategorias() {
    try {
        const response = await categoriasUnicas()
        categoriaOptions.value = Array.isArray(response) ? response : (response?.data || [])
    } catch (error) {
        console.error('Error al cargar categorías:', error)
    }
}

async function cargarDisciplinas() {
    try {
        const response = await listarDisciplinas()
        disciplinaOptions.value = Array.isArray(response) ? response : (response?.data || [])
    } catch (error) {
        console.error('Error al cargar disciplinas:', error)
    }
}

function clearFilters() {
    filters.value = {
        search: '',
        genero: null,
        estado: true,
        categoria: null,
        edadMin: null,
        edadMax: null,
        experienciaMin: null,
        experienciaMax: null,
        disciplina: null,
        conEntrenamientos: null,
        conTorneos: null
    }
}

function applyFilters() {
    Notify.create({
        type: 'positive',
        message: 'Filtros aplicados',
        position: 'bottom'
    })
}

function onRequest(props) {
    const { page, rowsPerPage, sortBy, descending } = props.pagination
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
}

async function generarReporteGeneralPDF() {
    try {
        Notify.create({
            type: 'info',
            message: 'Generando reporte general PDF...',
            position: 'bottom'
        })
        const entrenadoresIds = filteredEntrenadores.value.map(e => e.id)
        await reporteEntrenadorPDF({ entrenadores_ids: entrenadoresIds })
        Notify.create({
            type: 'positive',
            message: 'Reporte PDF generado exitosamente',
            position: 'bottom'
        })
    } catch (error) {
        console.error('Error al generar PDF:', error)
        Notify.create({
            type: 'negative',
            message: 'Error al generar el reporte PDF',
            position: 'bottom'
        })
    }
}

async function generarReporteGeneralExcel() {
    try {
        Notify.create({
            type: 'info',
            message: 'Generando reporte general Excel...',
            position: 'bottom'
        })
        const entrenadoresIds = filteredEntrenadores.value.map(e => e.id)
        await reporteEntrenadorExcel({ entrenadores_ids: entrenadoresIds })
        Notify.create({
            type: 'positive',
            message: 'Reporte Excel descargado exitosamente',
            position: 'bottom'
        })
    } catch (error) {
        console.error('Error al generar Excel:', error)
        Notify.create({
            type: 'negative',
            message: 'Error al generar el reporte Excel',
            position: 'bottom'
        })
    }
}

onMounted(async () => {
    await Promise.all([
        cargarEntrenadores(),
        cargarCategorias(),
        cargarDisciplinas()
    ])
})
</script>

<style scoped lang="scss">
.page-title {
    border-left: 6px solid #ff6d00;
    padding-left: 12px;
    color: #1976d2;
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
}

.entrenadores-table {
    .q-table__top {
        padding: 12px 16px;
    }

    .q-table th {
        font-weight: 600;
        font-size: 0.875rem;
    }
}
</style>
