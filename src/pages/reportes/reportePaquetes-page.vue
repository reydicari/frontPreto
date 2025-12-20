<template>
    <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
        <div class="row items-center justify-between q-mb-md">
            <div>
                <h4 class="text-primary q-mb-xs q-mt-none page-title">Reporte de Paquetes</h4>
                <p class="text-grey-7">Generar reportes PDF y Excel de paquetes de entrenamiento</p>
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
                        placeholder="Buscar por nombre de paquete..." class="col-12 col-md-4">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>

                    <!-- Disciplina -->
                    <q-select v-model="filters.disciplina" :options="disciplinaOptions" option-label="nombre"
                        option-value="id" label="Disciplina" outlined dense clearable emit-value map-options
                        class="col-6 col-md-3" />

                    <!-- Nivel -->
                    <q-select v-model="filters.nivel" :options="nivelOptions" option-label="label" option-value="value"
                        label="Nivel" outlined dense clearable emit-value map-options class="col-6 col-md-2" />

                    <!-- Estado -->
                    <q-select v-model="filters.estado" :options="estadoOptions" label="Estado" outlined dense clearable
                        emit-value map-options class="col-6 col-md-2" />

                    <!-- Materiales incluidos -->
                    <q-select v-model="filters.materiales" :options="booleanOptions" label="Materiales incluidos"
                        outlined dense clearable emit-value map-options class="col-6 col-md-3" />

                    <!-- Rango de mensualidad -->
                    <q-input v-model.number="filters.mensualidadMin" type="number" outlined dense
                        label="Mensualidad mínima (Bs)" class="col-6 col-md-2" :min="0" prefix="Bs" />

                    <q-input v-model.number="filters.mensualidadMax" type="number" outlined dense
                        label="Mensualidad máxima (Bs)" class="col-6 col-md-2" :min="0" prefix="Bs" />

                    <!-- Rango de edad -->
                    <q-input v-model.number="filters.edadMin" type="number" outlined dense label="Edad mínima"
                        class="col-6 col-md-2" :min="0" :max="99" />

                    <q-input v-model.number="filters.edadMax" type="number" outlined dense label="Edad máxima"
                        class="col-6 col-md-2" :min="0" :max="99" />

                    <!-- Rango de cupo -->
                    <q-input v-model.number="filters.cupoMin" type="number" outlined dense label="Cupo mínimo"
                        class="col-6 col-md-2" :min="0" />

                    <q-input v-model.number="filters.cupoMax" type="number" outlined dense label="Cupo máximo"
                        class="col-6 col-md-2" :min="0" />

                    <!-- Fecha de inicio -->
                    <div class="col-6 col-md-3">
                        <q-input dense outlined v-model="filters.fechaInicio" label="Fecha inicio desde" readonly
                            clearable>
                            <template v-slot:append>
                                <q-icon name="event" class="cursor-pointer">
                                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                                        <q-date v-model="filters.fechaInicio" mask="YYYY-MM-DD">
                                            <div class="row items-center justify-end">
                                                <q-btn v-close-popup label="Cerrar" color="primary" flat />
                                            </div>
                                        </q-date>
                                    </q-popup-proxy>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>

                    <!-- Cantidad de horarios -->
                    <q-input v-model.number="filters.horariosMin" type="number" outlined dense label="Horarios mínimos"
                        class="col-6 col-md-2" :min="0" />
                </div>

                <div class="row justify-end q-mt-sm q-gutter-sm">
                    <q-btn label="Limpiar filtros" flat color="primary" icon="clear_all" @click="clearFilters" />
                    <q-btn label="Aplicar filtros" color="primary" icon="filter_list" @click="applyFilters" />
                </div>
            </q-card-section>
        </q-card>

        <!-- Tabla -->
        <q-card>
            <q-table :rows="filteredPaquetes" :columns="columns" row-key="id" :loading="loading"
                :pagination="pagination" @request="onRequest" binary-state-sort
                :rows-per-page-options="[10, 25, 50, 100]" class="paquetes-table">
                <template v-slot:body-cell-nombre="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">{{ props.row.nombre }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-disciplina="props">
                    <q-td :props="props">
                        <q-badge color="primary">
                            {{ getDisciplinaName(props.row.id_disciplina) }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-nivel="props">
                    <q-td :props="props">
                        <q-badge color="secondary">
                            {{ getNivelName(props.row.id_nivel) || 'N/A' }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-rango_edad="props">
                    <q-td :props="props">
                        {{ props.row.edad_minima }} - {{ props.row.edad_maxima }} años
                    </q-td>
                </template>

                <template v-slot:body-cell-mensualidad="props">
                    <q-td :props="props">
                        <span class="text-weight-bold text-green-7">Bs {{ props.row.mensualidad }}</span>
                    </q-td>
                </template>

                <template v-slot:body-cell-costo_registro="props">
                    <q-td :props="props">
                        Bs {{ props.row.costo_registro || 0 }}
                    </q-td>
                </template>

                <template v-slot:body-cell-cupo="props">
                    <q-td :props="props">
                        <q-badge color="info">
                            {{ props.row.max_estudiantes }} estudiantes
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-materiales="props">
                    <q-td :props="props">
                        <q-icon :name="props.row.materiales ? 'check_circle' : 'cancel'"
                            :color="props.row.materiales ? 'positive' : 'grey'" size="24px" />
                    </q-td>
                </template>

                <template v-slot:body-cell-horarios="props">
                    <q-td :props="props">
                        <q-badge color="purple">
                            {{ props.row.horarios?.length || 0 }} horario{{ props.row.horarios?.length !== 1 ? 's' : ''
                            }}
                        </q-badge>
                        <div v-if="props.row.horarios && props.row.horarios.length > 0"
                            class="q-mt-xs text-caption text-grey-7">
                            <div v-for="h in props.row.horarios.slice(0, 2)" :key="h.id">
                                {{ getDiaLabel(h.dia) }}: {{ h.hora_inicio }} - {{ h.hora_fin }}
                            </div>
                            <div v-if="props.row.horarios.length > 2" class="text-italic">
                                +{{ props.row.horarios.length - 2 }} más...
                            </div>
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-fechas="props">
                    <q-td :props="props">
                        <div class="text-caption">
                            <div><strong>Inicio:</strong> {{ formatDate(props.row.fecha_inicio) }}</div>
                            <div><strong>Fin:</strong> {{ formatDate(props.row.fecha_vencimiento) || '—' }}</div>
                        </div>
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
import { listarPaquetes } from 'src/stores/paquete-store'
import { listarDisciplinas } from 'src/stores/disciplina-store'
import { listarNiveles } from 'src/stores/nivel'
import { reportePaquetePDF, reportePaqueteExcel } from 'src/stores/reportes'
import { Notify } from 'quasar'

const loading = ref(false)
const paquetes = ref([])
const disciplinaOptions = ref([])
const nivelOptions = ref([])

const filters = ref({
    search: '',
    disciplina: null,
    nivel: null,
    estado: true,
    materiales: null,
    mensualidadMin: null,
    mensualidadMax: null,
    edadMin: null,
    edadMax: null,
    cupoMin: null,
    cupoMax: null,
    fechaInicio: null,
    horariosMin: null
})

const pagination = ref({
    sortBy: 'nombre',
    descending: false,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0
})

const estadoOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
]

const booleanOptions = [
    { label: 'Sí', value: true },
    { label: 'No', value: false }
]

const diasSemana = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
}

const columns = [
    { name: 'nombre', label: 'Nombre del paquete', align: 'left', field: 'nombre', sortable: true },
    { name: 'disciplina', label: 'Disciplina', align: 'center', field: 'id_disciplina', sortable: true },
    { name: 'nivel', label: 'Nivel', align: 'center', field: 'id_nivel', sortable: true },
    { name: 'rango_edad', label: 'Rango de edad', align: 'center', field: 'edad_minima', sortable: true },
    { name: 'mensualidad', label: 'Mensualidad', align: 'right', field: 'mensualidad', sortable: true },
    { name: 'costo_registro', label: 'Costo registro', align: 'right', field: 'costo_registro', sortable: true },
    { name: 'cupo', label: 'Cupo', align: 'center', field: 'max_estudiantes', sortable: true },
    { name: 'materiales', label: 'Materiales', align: 'center', field: 'materiales', sortable: true },
    { name: 'horarios', label: 'Horarios', align: 'left', field: 'horarios', sortable: false },
    { name: 'fechas', label: 'Fechas', align: 'left', field: 'fecha_inicio', sortable: true },
    { name: 'estado', label: 'Estado', align: 'center', field: 'estado', sortable: true }
]

const filteredPaquetes = computed(() => {
    let result = [...paquetes.value]

    // Búsqueda general
    if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        result = result.filter(p =>
            p.nombre?.toLowerCase().includes(searchLower)
        )
    }

    // Filtro por disciplina
    if (filters.value.disciplina) {
        result = result.filter(p => p.id_disciplina === filters.value.disciplina)
    }

    // Filtro por nivel
    if (filters.value.nivel) {
        result = result.filter(p => p.id_nivel === filters.value.nivel)
    }

    // Filtro por estado
    if (filters.value.estado !== null) {
        result = result.filter(p => p.estado === filters.value.estado)
    }

    // Filtro por materiales
    if (filters.value.materiales !== null) {
        result = result.filter(p => p.materiales === filters.value.materiales)
    }

    // Filtro por rango de mensualidad
    if (filters.value.mensualidadMin !== null && filters.value.mensualidadMin !== '') {
        result = result.filter(p => p.mensualidad >= filters.value.mensualidadMin)
    }
    if (filters.value.mensualidadMax !== null && filters.value.mensualidadMax !== '') {
        result = result.filter(p => p.mensualidad <= filters.value.mensualidadMax)
    }

    // Filtro por rango de edad
    if (filters.value.edadMin !== null && filters.value.edadMin !== '') {
        result = result.filter(p => p.edad_maxima >= filters.value.edadMin)
    }
    if (filters.value.edadMax !== null && filters.value.edadMax !== '') {
        result = result.filter(p => p.edad_minima <= filters.value.edadMax)
    }

    // Filtro por rango de cupo
    if (filters.value.cupoMin !== null && filters.value.cupoMin !== '') {
        result = result.filter(p => p.max_estudiantes >= filters.value.cupoMin)
    }
    if (filters.value.cupoMax !== null && filters.value.cupoMax !== '') {
        result = result.filter(p => p.max_estudiantes <= filters.value.cupoMax)
    }

    // Filtro por fecha de inicio
    if (filters.value.fechaInicio) {
        result = result.filter(p => p.fecha_inicio >= filters.value.fechaInicio)
    }

    // Filtro por cantidad de horarios
    if (filters.value.horariosMin !== null && filters.value.horariosMin !== '') {
        result = result.filter(p => (p.horarios?.length || 0) >= filters.value.horariosMin)
    }

    pagination.value.rowsNumber = result.length
    return result
})

function getDisciplinaName(id) {
    const disciplina = disciplinaOptions.value.find(d => d.id === id)
    return disciplina?.nombre || 'N/A'
}

function getNivelName(id) {
    const nivel = nivelOptions.value.find(n => n.value === id)
    return nivel?.label || ''
}

function getDiaLabel(dia) {
    return diasSemana[dia] || `Día ${dia}`
}

function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function cargarPaquetes() {
    loading.value = true
    try {
        const response = await listarPaquetes()
        paquetes.value = Array.isArray(response) ? response : (response?.data || [])
        pagination.value.rowsNumber = paquetes.value.length
    } catch (error) {
        console.error('Error al cargar paquetes:', error)
        Notify.create({
            type: 'negative',
            message: 'Error al cargar paquetes',
            position: 'bottom'
        })
    } finally {
        loading.value = false
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

async function cargarNiveles() {
    try {
        const response = await listarNiveles()
        nivelOptions.value = Array.isArray(response) ? response : (response?.data || [])
    } catch (error) {
        console.error('Error al cargar niveles:', error)
    }
}

function clearFilters() {
    filters.value = {
        search: '',
        disciplina: null,
        nivel: null,
        estado: true,
        materiales: null,
        mensualidadMin: null,
        mensualidadMax: null,
        edadMin: null,
        edadMax: null,
        cupoMin: null,
        cupoMax: null,
        fechaInicio: null,
        horariosMin: null
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
        const paquetesIds = filteredPaquetes.value.map(p => p.id)
        await reportePaquetePDF({ paquetes_ids: paquetesIds })
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
        const paquetesIds = filteredPaquetes.value.map(p => p.id)
        await reportePaqueteExcel({ paquetes_ids: paquetesIds })
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
        cargarPaquetes(),
        cargarDisciplinas(),
        cargarNiveles()
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

.paquetes-table {
    .q-table__top {
        padding: 12px 16px;
    }

    .q-table th {
        font-weight: 600;
        font-size: 0.875rem;
    }
}
</style>
