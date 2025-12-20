<template>
    <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
        <div class="row items-center justify-between q-mb-md">
            <div>
                <h4 class="text-primary q-mb-xs q-mt-none page-title">Reporte de Gastos</h4>
                <p class="text-grey-7">Generar reportes PDF y Excel de gastos registrados</p>
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
                        placeholder="Buscar por nombre, observación, usuario..." class="col-12 col-md-4">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>

                    <!-- Categoría -->
                    <q-select v-model="filters.categoria" :options="categoriaOptions" option-label="nombre"
                        option-value="id" label="Categoría" outlined dense clearable emit-value map-options
                        class="col-6 col-md-3" />

                    <!-- Estado -->
                    <q-select v-model="filters.estado" :options="estadoOptions" label="Estado" outlined dense clearable
                        emit-value map-options class="col-6 col-md-2" />

                    <!-- Con comprobante -->
                    <q-select v-model="filters.conComprobante" :options="comprobanteOptions" label="Comprobante"
                        outlined dense clearable emit-value map-options class="col-6 col-md-3" />

                    <!-- Rango de monto -->
                    <q-input v-model.number="filters.montoMin" type="number" outlined dense label="Monto mínimo (Bs)"
                        class="col-6 col-md-2" :min="0" prefix="Bs" />

                    <q-input v-model.number="filters.montoMax" type="number" outlined dense label="Monto máximo (Bs)"
                        class="col-6 col-md-2" :min="0" prefix="Bs" />

                    <!-- Usuario que registró -->
                    <q-input v-model="filters.usuario" outlined dense clearable label="Usuario que registró"
                        class="col-6 col-md-3" />

                    <!-- Rango de fechas -->
                    <div class="col-6 col-md-3">
                        <q-input dense outlined v-model="filters.fechaDesde" label="Fecha desde" readonly clearable>
                            <template v-slot:append>
                                <q-icon name="event" class="cursor-pointer">
                                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                                        <q-date v-model="filters.fechaDesde" mask="YYYY-MM-DD">
                                            <div class="row items-center justify-end">
                                                <q-btn v-close-popup label="Cerrar" color="primary" flat />
                                            </div>
                                        </q-date>
                                    </q-popup-proxy>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>

                    <div class="col-6 col-md-3">
                        <q-input dense outlined v-model="filters.fechaHasta" label="Fecha hasta" readonly clearable>
                            <template v-slot:append>
                                <q-icon name="event" class="cursor-pointer">
                                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                                        <q-date v-model="filters.fechaHasta" mask="YYYY-MM-DD">
                                            <div class="row items-center justify-end">
                                                <q-btn v-close-popup label="Cerrar" color="primary" flat />
                                            </div>
                                        </q-date>
                                    </q-popup-proxy>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>

                    <!-- Orden -->
                    <q-select v-model="filters.ordenar" :options="ordenOptions" label="Ordenar por" outlined dense
                        clearable emit-value map-options class="col-6 col-md-3" />
                </div>

                <div class="row justify-end q-mt-sm q-gutter-sm">
                    <q-btn label="Limpiar filtros" flat color="primary" icon="clear_all" @click="clearFilters" />
                    <q-btn label="Aplicar filtros" color="primary" icon="filter_list" @click="applyFilters" />
                </div>
            </q-card-section>
        </q-card>

        <!-- Resumen de totales -->
        <q-card class="q-mb-md bg-gradient-primary">
            <q-card-section class="row q-col-gutter-md">
                <div class="col-12 col-sm-4 text-center">
                    <div class="text-h6 text-white">Total de gastos</div>
                    <div class="text-h4 text-weight-bold text-white">{{ filteredGastos.length }}</div>
                </div>
                <div class="col-12 col-sm-4 text-center">
                    <div class="text-h6 text-white">Monto total</div>
                    <div class="text-h4 text-weight-bold text-white">Bs {{ montoTotal.toFixed(2) }}</div>
                </div>
                <div class="col-12 col-sm-4 text-center">
                    <div class="text-h6 text-white">Promedio</div>
                    <div class="text-h4 text-weight-bold text-white">Bs {{ montoPromedio.toFixed(2) }}</div>
                </div>
            </q-card-section>
        </q-card>

        <!-- Tabla -->
        <q-card>
            <q-table :rows="filteredGastos" :columns="columns" row-key="id" :loading="loading" :pagination="pagination"
                @request="onRequest" binary-state-sort :rows-per-page-options="[10, 25, 50, 100]" class="gastos-table">
                <template v-slot:body-cell-nombre="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">{{ props.row.nombre }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-categoria="props">
                    <q-td :props="props">
                        <q-badge color="primary">
                            {{ props.row.categoria?.nombre || 'Sin categoría' }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-monto="props">
                    <q-td :props="props">
                        <span class="text-weight-bold text-red-7 text-h6">Bs {{ formatMonto(props.row.monto) }}</span>
                    </q-td>
                </template>

                <template v-slot:body-cell-fecha="props">
                    <q-td :props="props">
                        {{ formatDate(props.row.fecha) }}
                    </q-td>
                </template>

                <template v-slot:body-cell-usuario="props">
                    <q-td :props="props">
                        <div class="text-caption text-grey-8">
                            <q-icon name="person" size="16px" class="q-mr-xs" />
                            {{ props.row.nombre_usuario || 'N/A' }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-comprobante="props">
                    <q-td :props="props">
                        <q-btn v-if="props.row.comprobante" flat dense round color="primary" icon="receipt" size="sm"
                            @click="verComprobante(props.row.comprobante)">
                            <q-tooltip>Ver comprobante</q-tooltip>
                        </q-btn>
                        <q-icon v-else name="cancel" color="grey" size="24px">
                            <q-tooltip>Sin comprobante</q-tooltip>
                        </q-icon>
                    </q-td>
                </template>

                <template v-slot:body-cell-observacion="props">
                    <q-td :props="props">
                        <div class="text-caption text-grey-7" style="max-width: 250px; white-space: normal;">
                            {{ props.row.observacion || '—' }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-estado="props">
                    <q-td :props="props">
                        <q-badge :color="props.row.estado ? 'positive' : 'negative'">
                            {{ props.row.estado ? 'Activo' : 'Anulado' }}
                        </q-badge>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- Dialog para ver comprobante -->
        <q-dialog v-model="comprobanteDialog" maximized>
            <q-card>
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">Comprobante</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-none" style="height: calc(100vh - 100px);">
                    <div class="fit row items-center justify-center">
                        <img v-if="isImage(currentComprobante)" :src="host + currentComprobante"
                            style="max-width: 100%; max-height: 100%;" />
                        <iframe v-else-if="isPdf(currentComprobante)" :src="host + currentComprobante"
                            style="width: 100%; height: 100%;" frameborder="0"></iframe>
                        <div v-else class="text-center text-grey-7">
                            <q-icon name="insert_drive_file" size="64px" />
                            <div class="q-mt-md">
                                <a :href="host + currentComprobante" target="_blank" class="text-primary">
                                    Descargar archivo
                                </a>
                            </div>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { reporteGastoPDF, reporteGastoExcel } from 'src/stores/reportes'
import { Notify } from 'quasar'

const host = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'

const loading = ref(false)
const gastos = ref([])
const categoriaOptions = ref([])
const comprobanteDialog = ref(false)
const currentComprobante = ref(null)

const filters = ref({
    search: '',
    categoria: null,
    estado: true,
    conComprobante: null,
    montoMin: null,
    montoMax: null,
    usuario: null,
    fechaDesde: null,
    fechaHasta: null,
    ordenar: 'fecha_desc'
})

const pagination = ref({
    sortBy: 'fecha',
    descending: true,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0
})

const estadoOptions = [
    { label: 'Activo', value: true },
    { label: 'Anulado', value: false }
]

const comprobanteOptions = [
    { label: 'Con comprobante', value: true },
    { label: 'Sin comprobante', value: false }
]

const ordenOptions = [
    { label: 'Fecha (más reciente)', value: 'fecha_desc' },
    { label: 'Fecha (más antiguo)', value: 'fecha_asc' },
    { label: 'Monto (mayor a menor)', value: 'monto_desc' },
    { label: 'Monto (menor a mayor)', value: 'monto_asc' },
    { label: 'Nombre (A-Z)', value: 'nombre_asc' }
]

const columns = [
    { name: 'fecha', label: 'Fecha', align: 'left', field: 'fecha', sortable: true },
    { name: 'nombre', label: 'Nombre del gasto', align: 'left', field: 'nombre', sortable: true },
    { name: 'categoria', label: 'Categoría', align: 'center', field: row => row.categoria?.nombre, sortable: true },
    { name: 'monto', label: 'Monto', align: 'right', field: 'monto', sortable: true },
    { name: 'usuario', label: 'Registrado por', align: 'left', field: 'nombre_usuario', sortable: true },
    { name: 'comprobante', label: 'Comprobante', align: 'center', field: 'comprobante', sortable: false },
    { name: 'observacion', label: 'Observación', align: 'left', field: 'observacion', sortable: false },
    { name: 'estado', label: 'Estado', align: 'center', field: 'estado', sortable: true }
]

const filteredGastos = computed(() => {
    let result = [...gastos.value]

    // Búsqueda general
    if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        result = result.filter(g =>
            (g.nombre?.toLowerCase().includes(searchLower)) ||
            (g.observacion?.toLowerCase().includes(searchLower)) ||
            (g.nombre_usuario?.toLowerCase().includes(searchLower))
        )
    }

    // Filtro por categoría
    if (filters.value.categoria) {
        result = result.filter(g => g.id_categoria === filters.value.categoria)
    }

    // Filtro por estado
    if (filters.value.estado !== null) {
        result = result.filter(g => g.estado === filters.value.estado)
    }

    // Filtro por comprobante
    if (filters.value.conComprobante !== null) {
        result = result.filter(g => filters.value.conComprobante
            ? (g.comprobante !== null && g.comprobante !== '')
            : (!g.comprobante || g.comprobante === '')
        )
    }

    // Filtro por rango de monto
    if (filters.value.montoMin !== null && filters.value.montoMin !== '') {
        result = result.filter(g => g.monto >= filters.value.montoMin)
    }
    if (filters.value.montoMax !== null && filters.value.montoMax !== '') {
        result = result.filter(g => g.monto <= filters.value.montoMax)
    }

    // Filtro por usuario
    if (filters.value.usuario) {
        const usuarioLower = filters.value.usuario.toLowerCase()
        result = result.filter(g => g.nombre_usuario?.toLowerCase().includes(usuarioLower))
    }

    // Filtro por rango de fechas
    if (filters.value.fechaDesde) {
        result = result.filter(g => g.fecha >= filters.value.fechaDesde)
    }
    if (filters.value.fechaHasta) {
        result = result.filter(g => g.fecha <= filters.value.fechaHasta)
    }

    // Ordenar
    if (filters.value.ordenar) {
        switch (filters.value.ordenar) {
            case 'fecha_desc':
                result.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                break
            case 'fecha_asc':
                result.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                break
            case 'monto_desc':
                result.sort((a, b) => b.monto - a.monto)
                break
            case 'monto_asc':
                result.sort((a, b) => a.monto - b.monto)
                break
            case 'nombre_asc':
                result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
                break
        }
    }

    pagination.value.rowsNumber = result.length
    return result
})

const montoTotal = computed(() => {
    return filteredGastos.value.reduce((sum, g) => sum + (g.monto || 0), 0)
})

const montoPromedio = computed(() => {
    if (filteredGastos.value.length === 0) return 0
    return montoTotal.value / filteredGastos.value.length
})

function formatMonto(monto) {
    return (monto || 0).toFixed(2)
}

function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function verComprobante(comprobante) {
    currentComprobante.value = comprobante
    comprobanteDialog.value = true
}

function isImage(filename) {
    if (!filename) return false
    const ext = filename.split('.').pop().toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
}

function isPdf(filename) {
    if (!filename) return false
    return filename.toLowerCase().endsWith('.pdf')
}

async function cargarGastos() {
    loading.value = true
    try {
        // Simulación de datos - reemplazar con llamada real a API
        // const response = await listarGastos()
        // gastos.value = Array.isArray(response) ? response : (response?.data || [])

        // Datos de ejemplo:
        gastos.value = [
            {
                id: 1,
                nombre: 'Compra de materiales deportivos',
                monto: 1250.50,
                estado: true,
                comprobante: '/uploads/comprobante1.pdf',
                observacion: 'Balones de fútbol y conos de entrenamiento',
                id_categoria: 1,
                categoria: { id: 1, nombre: 'Materiales' },
                nombre_usuario: 'Juan Pérez',
                fecha: '2025-11-20'
            },
            {
                id: 2,
                nombre: 'Pago de alquiler de local',
                monto: 3500.00,
                estado: true,
                comprobante: null,
                observacion: 'Alquiler mensual noviembre 2025',
                id_categoria: 2,
                categoria: { id: 2, nombre: 'Servicios' },
                nombre_usuario: 'María González',
                fecha: '2025-11-15'
            },
            {
                id: 3,
                nombre: 'Mantenimiento de equipos',
                monto: 450.00,
                estado: true,
                comprobante: '/uploads/comprobante3.jpg',
                observacion: 'Reparación de máquinas de gimnasio',
                id_categoria: 3,
                categoria: { id: 3, nombre: 'Mantenimiento' },
                nombre_usuario: 'Carlos Rodríguez',
                fecha: '2025-11-18'
            }
        ]

        // Cargar categorías únicas
        const uniqueCategorias = [...new Map(
            gastos.value
                .filter(g => g.categoria)
                .map(g => [g.categoria.id, g.categoria])
        ).values()]
        categoriaOptions.value = uniqueCategorias

        pagination.value.rowsNumber = gastos.value.length
    } catch (error) {
        console.error('Error al cargar gastos:', error)
        Notify.create({
            type: 'negative',
            message: 'Error al cargar gastos',
            position: 'bottom'
        })
    } finally {
        loading.value = false
    }
}

function clearFilters() {
    filters.value = {
        search: '',
        categoria: null,
        estado: true,
        conComprobante: null,
        montoMin: null,
        montoMax: null,
        usuario: null,
        fechaDesde: null,
        fechaHasta: null,
        ordenar: 'fecha_desc'
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
        const gastosIds = filteredGastos.value.map(g => g.id)
        await reporteGastoPDF({ gastos_ids: gastosIds })
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
        const gastosIds = filteredGastos.value.map(g => g.id)
        await reporteGastoExcel({ gastos_ids: gastosIds })
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
    await cargarGastos()
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

.gastos-table {
    .q-table__top {
        padding: 12px 16px;
    }

    .q-table th {
        font-weight: 600;
        font-size: 0.875rem;
    }
}

.bg-gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
