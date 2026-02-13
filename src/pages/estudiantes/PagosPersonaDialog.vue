<template>
    <q-dialog v-model="show" persistent maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card class="pagos-persona-dialog">
            <!-- Header del diálogo -->
            <q-card-section class="dialog-header">
                <div class="row items-center justify-between">
                    <div class="col-auto">
                        <div class="header-title-section">
                            <q-icon name="account_balance_wallet" size="38px" class="q-mr-sm" />
                            <div>
                                <h2 class="dialog-title q-ma-none">Pagos de {{ persona?.nombres }} {{
                                    persona?.apellido_paterno }}</h2>
                                <p class="dialog-subtitle q-ma-none">Historial completo de pagos realizados</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <q-btn flat round dense icon="close" @click="show = false" size="md" class="btn-close">
                            <q-tooltip>Cerrar</q-tooltip>
                        </q-btn>
                    </div>
                </div>
            </q-card-section>

            <q-separator />

            <!-- Toolbar con controles -->
            <q-card-section class="toolbar-section">
                <div class="row q-col-gutter-md items-center">
                    <div class="col-12 col-sm-4">
                        <q-select v-model="limitPagos" :options="limitOptions" label="Cantidad de registros" outlined
                            dense emit-value map-options class="limit-select" @update:model-value="cargarPagos">
                            <template v-slot:prepend>
                                <q-icon name="format_list_numbered" color="green-8" />
                            </template>
                        </q-select>
                    </div>
                    <div class="col-12 col-sm-4">
                        <div class="total-info">
                            <q-icon name="receipt_long" size="24px" class="q-mr-sm" />
                            <span class="total-label">Total Registros:</span>
                            <span class="total-value">{{ pagos.length }}</span>
                        </div>
                    </div>
                    <div class="col-12 col-sm-4 text-right">
                        <q-btn color="primary" icon="picture_as_pdf" label="Generar PDF" unelevated class="btn-pdf"
                            @click="generarReportePDF">
                            <q-tooltip>Descargar reporte en PDF</q-tooltip>
                        </q-btn>
                    </div>
                </div>
            </q-card-section>

            <q-separator />

            <!-- Contenido principal -->
            <q-card-section class="dialog-content">
                <!-- Loading -->
                <div v-if="loading" class="loading-section">
                    <q-spinner-dots color="green-8" size="60px" />
                    <p class="loading-text">Cargando pagos...</p>
                </div>

                <!-- Sin datos -->
                <div v-else-if="pagos.length === 0" class="empty-section">
                    <q-icon name="inbox" size="80px" color="grey-5" />
                    <p class="empty-text">No hay pagos registrados para esta persona</p>
                </div>

                <!-- Lista de pagos -->
                <div v-else class="pagos-lista">
                    <div v-for="(pago, index) in pagos" :key="pago.id" class="pago-card"
                        :style="{ animationDelay: (index * 50) + 'ms' }">
                        <!-- Header del pago -->
                        <div class="pago-header">
                            <div class="pago-date">
                                <q-icon name="event" size="18px" />
                                <span>{{ formatDate(pago.fecha) }}</span>
                                <span v-if="extractTime(pago.fecha)" class="pago-time">, {{ extractTime(pago.fecha)
                                    }}</span>
                            </div>
                            <q-badge :color="getEstadoColor(pago.estado)" :label="getEstadoLabel(pago.estado)">
                                <q-icon :name="getEstadoIcon(pago.estado)" size="14px" class="q-ml-xs" />
                            </q-badge>
                        </div>

                        <!-- Body del pago -->
                        <div class="pago-body">
                            <!-- Detalle -->
                            <div class="pago-detail" v-if="pago.detalle">
                                <q-icon name="description" size="20px" />
                                <div class="detail-content">
                                    <span class="detail-label">Detalle</span>
                                    <span class="detail-value">{{ pago.detalle }}</span>
                                </div>
                            </div>

                            <!-- Categoría -->
                            <div class="pago-detail" v-if="pago.categorium">
                                <q-icon name="category" size="20px" />
                                <div class="detail-content">
                                    <span class="detail-label">Categoría</span>
                                    <span class="detail-value">{{ pago.categorium.nombre || pago.categorium }}</span>
                                </div>
                            </div>

                            <!-- Método de pago -->
                            <div class="pago-detail" v-if="pago.metodo">
                                <q-icon name="credit_card" size="20px" />
                                <div class="detail-content">
                                    <span class="detail-label">Método de Pago</span>
                                    <span class="detail-value">{{ pago.metodo.nombre || pago.metodo }}</span>
                                </div>
                            </div>

                            <!-- Inscripción -->
                            <div class="pago-detail" v-if="pago.inscripcion">
                                <q-icon name="school" size="20px" />
                                <div class="detail-content">
                                    <span class="detail-label">Inscripción</span>
                                    <span class="detail-value">{{ formatDate(pago.inscripcion.fecha_inicio) }}</span>
                                </div>
                            </div>

                            <!-- Usuario cobrador -->
                            <div class="pago-detail" v-if="pago.usuario_cobrador">
                                <q-icon name="person" size="20px" />
                                <div class="detail-content">
                                    <span class="detail-label">Cobrador</span>
                                    <span class="detail-value">{{ pago.usuario_cobrador }}</span>
                                </div>
                            </div>

                            <!-- Montos - Caso con descuento -->
                            <template v-if="pago.descuento && pago.descuento > 0">
                                <div class="montos-row">
                                    <div class="monto-small">
                                        <div class="monto-small-label">Monto</div>
                                        <div class="monto-small-value">Bs {{ Number(pago.monto).toFixed(2) }}</div>
                                    </div>
                                    <div class="descuento-small">
                                        <div class="descuento-small-label">Descuento</div>
                                        <div class="descuento-small-value">Bs {{ Number(pago.descuento).toFixed(2) }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Total o Saldo -->
                                <div v-if="pago.saldo > 0" class="pago-saldo">
                                    <div class="saldo-label">Saldo Pendiente</div>
                                    <div class="saldo-value">Bs {{ Number(pago.saldo).toFixed(2) }}</div>
                                </div>
                                <div v-else class="pago-total">
                                    <div class="total-label">{{ pago.estado === 2 && pago.saldo === 0 ? 'Monto Pagado' :
                                        'Total Pagado' }}</div>
                                    <div class="total-value">Bs {{ (Number(pago.monto) -
                                        Number(pago.descuento)).toFixed(2) }}</div>
                                </div>
                            </template>

                            <!-- Montos - Caso sin descuento -->
                            <template v-else>
                                <div v-if="pago.estado === 1" class="pago-total">
                                    <div class="total-label">Total Pagado</div>
                                    <div class="total-value">Bs {{ Number(pago.monto).toFixed(2) }}</div>
                                </div>
                                <div v-else-if="pago.estado === 2 && pago.saldo > 0" class="pago-saldo">
                                    <div class="saldo-label">Saldo Pendiente</div>
                                    <div class="saldo-value">Bs {{ Number(pago.saldo).toFixed(2) }}</div>
                                </div>
                                <div v-else-if="pago.estado === 2 && pago.saldo === 0" class="pago-total">
                                    <div class="total-label">Monto Pagado</div>
                                    <div class="total-value">Bs {{ Number(pago.monto).toFixed(2) }}</div>
                                </div>
                                <div v-else class="pago-monto">
                                    <div class="monto-label">Monto</div>
                                    <div class="monto-value">Bs {{ Number(pago.monto).toFixed(2) }}</div>
                                </div>
                            </template>
                        </div>

                        <!-- Footer del pago con comprobante -->
                        <div class="pago-footer" v-if="pago.comprobante">
                            <q-btn flat dense icon="image" label="Ver Comprobante" color="green-8"
                                @click="verComprobante(pago)">
                                <q-tooltip>Ver comprobante de pago</q-tooltip>
                            </q-btn>
                        </div>
                    </div>
                </div>
            </q-card-section>

            <!-- Footer del diálogo -->
            <q-card-actions class="dialog-footer">
                <q-btn flat label="Cerrar" icon="close" color="grey-8" v-close-popup class="btn-close-footer" />
            </q-card-actions>
        </q-card>

        <!-- Dialog para ver comprobante -->
        <q-dialog v-model="showComprobante" maximized>
            <q-card>
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">Comprobante de Pago</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>
                <q-card-section class="q-pt-none">
                    <q-img v-if="comprobanteSeleccionado" :src="host + comprobanteSeleccionado" fit="contain"
                        style="max-height: 80vh" />
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { listarPagos } from 'src/stores/pago_store.js'
import { reportePagosPersona } from 'src/stores/reportes'

const props = defineProps({
    modelValue: Boolean,
    persona: Object
})

const emit = defineEmits(['update:modelValue'])

const host = process.env.API_URL + '/uploads/'
const show = ref(props.modelValue)
const pagos = ref([])
const loading = ref(false)
const limitPagos = ref(20)
const showComprobante = ref(false)
const comprobanteSeleccionado = ref(null)

const limitOptions = [
    { label: '10 registros', value: 10 },
    { label: '20 registros', value: 20 },
    { label: '50 registros', value: 50 },
    { label: '100 registros', value: 100 },
    { label: 'Todos', value: 999999 }
]

// Watchers
watch(() => props.modelValue, async (val) => {
    show.value = val
    if (val && props.persona?.id) {
        await cargarPagos()
    }
})

watch(show, (val) => {
    emit('update:modelValue', val)
})

watch(() => props.persona, async (persona) => {
    if (show.value && persona?.id) {
        await cargarPagos()
    }
})

// Métodos
async function cargarPagos() {
    if (!props.persona?.id) return

    loading.value = true
    try {
        const params = {
            id_persona: props.persona.id,
            limit: limitPagos.value
        }
        const result = await listarPagos(params)
        pagos.value = Array.isArray(result) ? result : []
    } catch (error) {
        console.error('Error al cargar pagos:', error)
        pagos.value = []
    } finally {
        loading.value = false
    }
}

async function generarReportePDF() {
    try {
        const params = {
            id_persona: props.persona.id
        }
        await reportePagosPersona(params)
    } catch (error) {
        console.error('Error al generar reporte:', error)
    }
}

function verComprobante(pago) {
    comprobanteSeleccionado.value = pago.comprobante
    showComprobante.value = true
}

function formatDate(date) {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

function extractTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
}

function getEstadoColor(estado) {
    switch (estado) {
        case 0: return 'grey-7'
        case 1: return 'green-7'
        case 2: return 'orange-7'
        default: return 'grey-5'
    }
}

function getEstadoLabel(estado) {
    switch (estado) {
        case 0: return 'Anulado'
        case 1: return 'Pagado'
        case 2: return 'Deuda'
        default: return 'Desconocido'
    }
}

function getEstadoIcon(estado) {
    switch (estado) {
        case 0: return 'cancel'
        case 1: return 'check_circle'
        case 2: return 'error'
        default: return 'help'
    }
}
</script>

<style scoped lang="scss">
// Paleta de colores de inscripciones (verde-naranja)
$color-primary-dark: #1b5e20;
$color-primary: #2e7d32;
$color-primary-light: #43a047;
$color-secondary: #558b2f;
$color-secondary-light: #7cb342;
$color-accent-dark: #ef6c00;
$color-accent: #f57c00;
$color-accent-light: #ff9800;

$pastel-green: #e8f5e9;
$pastel-lime: #f1f8e9;
$pastel-orange: #fff3e0;

// Dialog principal
.pagos-persona-dialog {
    border-radius: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%);
}

// Header del diálogo
.dialog-header {
    background: linear-gradient(135deg, $color-primary-dark 0%, $color-primary 100%);
    color: white;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);
}

.header-title-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

.dialog-title {
    font-size: 1.8em;
    font-weight: 700;
    line-height: 1.2;
}

.dialog-subtitle {
    font-size: 0.9em;
    opacity: 0.9;
    margin-top: 4px;
}

.btn-close {
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: rotate(90deg);
    }
}

// Toolbar
.toolbar-section {
    background: white;
    padding: 20px;
    border-bottom: 2px solid $pastel-green;
}

.limit-select {
    :deep(.q-field__control) {
        transition: all 0.3s ease;

        &:hover {
            border-color: $color-primary;
        }
    }
}

.total-info {
    display: flex;
    align-items: center;
    background: $pastel-green;
    padding: 12px 16px;
    border-radius: 12px;
    border-left: 4px solid $color-primary;
}

.total-label {
    font-weight: 600;
    color: $color-primary-dark;
    margin-right: 8px;
}

.total-value {
    font-size: 1.3em;
    font-weight: 700;
    color: $color-primary;
}

.btn-pdf {
    background: linear-gradient(135deg, $color-accent-dark 0%, $color-accent 100%);
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(239, 108, 0, 0.3);
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(239, 108, 0, 0.4);
    }
}

// Contenido principal
.dialog-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    background: transparent;
}

// Loading
.loading-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 16px;
}

.loading-text {
    font-size: 1.1em;
    font-weight: 600;
    color: $color-primary;
}

// Empty state
.empty-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 16px;
}

.empty-text {
    font-size: 1.1em;
    font-weight: 600;
    color: #9e9e9e;
}

// Lista de pagos
.pagos-lista {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 900px;
    margin: 0 auto;
}

// Card de pago (alargado vertical)
.pago-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: all 0.3s ease;
    border-left: 4px solid $color-primary;
    opacity: 0;
    animation: slideInUp 0.5s ease forwards;

    &:hover {
        transform: translateX(4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-left-color: $color-accent;
    }
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// Header del pago
.pago-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, $pastel-green 0%, $pastel-lime 100%);
    border-bottom: 2px solid $color-primary-light;
}

.pago-date {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: $color-primary-dark;
    font-size: 0.95em;
}

.pago-time {
    color: $color-secondary;
    font-weight: 500;
}

// Body del pago
.pago-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.pago-detail {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
        background: $pastel-lime;
    }

    .q-icon {
        color: $color-primary;
        flex-shrink: 0;
        margin-top: 2px;
    }
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
}

.detail-label {
    font-size: 0.8em;
    font-weight: 600;
    color: #757575;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.detail-value {
    font-size: 0.95em;
    font-weight: 500;
    color: #424242;
}

// Montos
.montos-row {
    display: flex;
    gap: 12px;
    margin-top: 8px;
}

.monto-small,
.descuento-small {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    text-align: center;
}

.monto-small {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border: 2px solid #64b5f6;
}

.descuento-small {
    background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
    border: 2px solid #ffb74d;
}

.monto-small-label,
.descuento-small-label {
    font-size: 0.75em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}

.monto-small-label {
    color: #1976d2;
}

.descuento-small-label {
    color: #f57c00;
}

.monto-small-value,
.descuento-small-value {
    font-size: 1.2em;
    font-weight: 700;
}

.monto-small-value {
    color: #1565c0;
}

.descuento-small-value {
    color: #ef6c00;
}

// Total y Saldo
.pago-total,
.pago-saldo,
.pago-monto {
    padding: 16px;
    border-radius: 12px;
    text-align: center;
    margin-top: 8px;
}

.pago-total {
    background: linear-gradient(135deg, $color-primary-dark 0%, $color-primary 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
}

.pago-saldo {
    background: linear-gradient(135deg, $color-accent-dark 0%, $color-accent 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(239, 108, 0, 0.3);
}

.pago-monto {
    background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(66, 165, 245, 0.3);
}

.total-label,
.saldo-label,
.monto-label {
    font-size: 0.8em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.95;
    margin-bottom: 4px;
}

.total-value,
.saldo-value,
.monto-value {
    font-size: 1.6em;
    font-weight: 700;
}

// Footer del pago
.pago-footer {
    padding: 12px 20px;
    background: $pastel-lime;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
}

// Footer del diálogo
.dialog-footer {
    background: white;
    padding: 16px 24px;
    border-top: 2px solid $pastel-green;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.btn-close-footer {
    font-weight: 600;
    padding: 8px 24px;
}

// Responsive
@media (max-width: 599px) {
    .dialog-title {
        font-size: 1.3em;
    }

    .dialog-subtitle {
        font-size: 0.8em;
    }

    .toolbar-section {
        padding: 16px;
    }

    .total-info {
        justify-content: center;
    }

    .btn-pdf {
        width: 100%;
    }

    .pago-card {
        border-radius: 12px;
    }

    .pago-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
    }

    .montos-row {
        flex-direction: column;
    }

    .total-value,
    .saldo-value,
    .monto-value {
        font-size: 1.3em;
    }
}
</style>
