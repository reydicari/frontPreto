<template>
    <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
        <div class="row items-center justify-between q-mb-md">
            <div>
                <h4 class="text-primary q-mb-xs q-mt-none page-title">Reporte de Inscripciones</h4>
                <p class="text-grey-7">Generar reportes PDF y Excel de inscripciones</p>
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
                    <q-select v-model="filterDisciplina" :options="disciplinasOptions" label="Disciplina"
                        option-label="nombre" option-value="id" emit-value map-options outlined dense clearable
                        class="col-md-3" />

                    <!-- Filtro por nivel -->
                    <q-select v-model="filterNivel" :options="nivelOptions" label="Nivel" option-label="nombre_nivel"
                        option-value="id" emit-value map-options outlined dense clearable class="col-md-2" />

                    <!-- Filtro por vencimiento -->
                    <q-select v-model="filterVencimiento" :options="vencimientoOptions" label="Vencimiento"
                        option-label="label" option-value="value" emit-value map-options outlined dense clearable
                        class="col-md-2" />
                </div>
            </q-card-section>
        </q-card>

        <!-- Tabla de inscripciones -->
        <q-card>
            <q-table :rows="filteredInscripciones" :columns="columns" row-key="id" :loading="loading"
                :pagination="pagination" @request="onRequest">
                <!-- Columna número (contador 1,2,3...) -->
                <template v-slot:body-cell-no="props">
                    <q-td :props="props" style="width:48px; text-align:center;">
                        {{filteredInscripciones.findIndex(r => r.id === props.row.id) - ((pagination.page - 1) *
                            pagination.rowsPerPage) + 1 }}
                    </q-td>
                </template>

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

                <!-- Columna del icono de disciplina -->
                <template v-slot:body-cell-disciplina_icon="props">
                    <q-td :props="props" style="text-align:center; width:48px;">
                        <q-icon
                            v-if="props.row.paquete?.disciplina?.icono && !String(props.row.paquete.disciplina.icono).includes('/')"
                            :name="props.row.paquete.disciplina.icono" />
                        <q-img
                            v-else-if="props.row.paquete?.disciplina?.icono && String(props.row.paquete.disciplina.icono).includes('/')"
                            :src="props.row.paquete.disciplina.icono" style="width:24px; height:24px;" />
                    </q-td>
                </template>

                <!-- Columna de nombre de disciplina como badge con borde púrpura -->
                <template v-slot:body-cell-disciplina_nombre="props">
                    <q-td :props="props">
                        <q-badge class="disciplina-badge" align="left">
                            {{ props.row.paquete?.disciplina?.nombre || props.row.disciplina?.nombre || '—' }}
                        </q-badge>
                    </q-td>
                </template>

            </q-table>
        </q-card>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listar } from 'src/stores/inscripcion-store'
import { listarDisciplinas } from 'src/stores/disciplina-store.js'
import { reporteInscripcionPDF, reporteInscripcionExcel } from 'src/stores/reportes'
import { Notify } from 'quasar'

// Estado principal
const loading = ref(false)
const inscripciones = ref([])
const searchTerm = ref('')
const filterEstado = ref(null)
const filterDisciplina = ref(null)
const filterVencimiento = ref(null)
const disciplinasOptions = ref([])
const filterNivel = ref(null)
const nivelOptions = ref([])

// Configuración de tabla
const columns = [
    {
        name: 'no',
        label: '#',
        field: () => '',
        align: 'center'
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
        label: 'Teléfono',
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
        name: 'disciplina_icon',
        label: '',
        field: row => row.paquete?.disciplina?.icono || '',
        align: 'center'
    },
    {
        name: 'disciplina_nombre',
        label: 'Disciplina',
        field: row => row.paquete?.disciplina?.nombre || '',
        align: 'left',
        sortable: true
    },
    {
        name: 'nivel',
        label: 'Nivel',
        field: row => row.nivel?.nombre_nivel || '—',
        align: 'left',
        sortable: true
    },
    {
        name: 'fecha_inicio',
        label: 'Inicio',
        field: row => row.fecha_inicio ? formatDate(row.fecha_inicio) : '—',
        align: 'left',
        sortable: true
    },
    {
        name: 'fecha_fin',
        label: 'Fin',
        field: row => row.fecha_fin ? formatDate(row.fecha_fin) : 'Indefinida',
        align: 'left',
        sortable: true
    },
    {
        name: 'estado',
        label: 'Estado',
        field: 'estado',
        align: 'center',
        sortable: true
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
    { label: 'Por vencer (15 días)', value: 'pv15' },
    { label: 'Por vencer (30 días)', value: 'pv30' },
    { label: 'Vencidas', value: 'vencidas' },
    { label: 'Indefinidas', value: 'indefinidas' }
]

// Cargar datos iniciales
onMounted(async () => {
    await loadInscripciones()
    // cargar opciones de disciplinas desde store
    disciplinasOptions.value = await listarDisciplinas()
    // construir lista única de niveles a partir de inscripciones
    const niveles = []
    const seen = new Set()
    for (const ins of inscripciones.value || []) {
        const n = ins.nivel
        if (n && !seen.has(n.id)) {
            seen.add(n.id)
            niveles.push({ id: n.id, nombre_nivel: n.nombre_nivel })
        }
    }
    nivelOptions.value = niveles
})

const loadInscripciones = async () => {
    loading.value = true
    try {
        inscripciones.value = await listar()
        console.log('inscripciones', inscripciones.value)
    } catch (error) {
        console.error('Error al cargar inscripciones:', error)
        Notify.create({
            type: 'negative',
            message: 'Error al cargar inscripciones',
            position: 'bottom'
        })
    } finally {
        loading.value = false
    }
}

// Filtrado local
const filteredInscripciones = computed(() => {
    let result = inscripciones.value || []

    // Filtro por vencimiento local
    if (filterVencimiento.value !== null) {
        result = result.filter(ins => estaPorVencer(ins, filterVencimiento.value))
    }

    // Filtro por estado
    if (filterEstado.value !== null) {
        result = result.filter(ins => ins.estado === filterEstado.value)
    }

    // Filtro por disciplina
    if (filterDisciplina.value) {
        result = result.filter(ins => (ins.paquete?.disciplina?.id || ins.disciplina?.id) === filterDisciplina.value)
    }

    // Filtro por nivel
    if (filterNivel.value) {
        result = result.filter(ins => ins.nivel && ins.nivel.id === filterNivel.value)
    }

    // Filtro por término de búsqueda
    const term = (searchTerm.value || '').toString().trim().toLowerCase()
    if (term) {
        result = result.filter(ins => {
            const nombres = (ins.persona?.nombres || '') + ' ' + (ins.persona?.apellido_paterno || '') + ' ' + (ins.persona?.apellido_materno || '')
            const telefono = ins.persona?.telefono || ''
            const paquete = ins.paquete?.nombre || ''
            const disciplina = ins.paquete?.disciplina?.nombre || ins.disciplina?.nombre || ''
            const nivel = ins.nivel?.nombre_nivel || ''
            return (`${nombres} ${telefono} ${paquete} ${disciplina} ${nivel}`).toLowerCase().includes(term)
        })
    }

    return result
})

// Lógica de vencimiento
function estaPorVencer(inscripcion, mode) {
    if (!mode) return false

    // Indefinidas = no tienen fecha_fin
    if (mode === 'indefinidas') {
        return !inscripcion.fecha_fin
    }

    // Para los demás modos necesitamos fecha_fin
    if (!inscripcion.fecha_fin) return false

    const hoy = new Date()
    const fechaFin = new Date(inscripcion.fecha_fin)
    const diffDays = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24))

    if (mode === 'vencidas') {
        return diffDays < 0
    }

    if (mode === 'pv15') {
        return inscripcion.estado === 1 && diffDays > 0 && diffDays <= 15
    }

    if (mode === 'pv30') {
        return inscripcion.estado === 1 && diffDays > 0 && diffDays <= 30
    }

    return false
}

function diasParaVencer(inscripcion) {
    const hoy = new Date()
    const fechaFin = new Date(inscripcion.fecha_fin)
    return Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24))
}

// Formato de fecha: dd Mes(Abreviado en español) aaaa
function formatDate(dateInput) {
    if (!dateInput) return ''
    const d = new Date(dateInput)
    if (isNaN(d)) return String(dateInput)
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const mon = months[d.getMonth()] || ''
    const year = d.getFullYear()
    return `${day} ${mon} ${year}`
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

// Manejo de paginación
function onRequest(props) {
    const { page, rowsPerPage, sortBy, descending } = props.pagination
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
}

// Generar reportes generales
async function generarReporteGeneralPDF() {
    try {
        Notify.create({
            type: 'info',
            message: 'Generando reporte general PDF...',
            position: 'bottom'
        })
        // Enviar filtros aplicados o todas las inscripciones
        const inscripcionesIds = filteredInscripciones.value.map(ins => ins.id)
        await reporteInscripcionPDF({ inscripciones_ids: inscripcionesIds })
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
        // Enviar filtros aplicados o todas las inscripciones
        const inscripcionesIds = filteredInscripciones.value.map(ins => ins.id)
        await reporteInscripcionExcel({ inscripciones_ids: inscripcionesIds })
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

.disciplina-badge {
    background-color: transparent;
    color: #8b5cf6;
    border: 1px solid #8b5cf6;
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 600;
    display: inline-block;
}
</style>
