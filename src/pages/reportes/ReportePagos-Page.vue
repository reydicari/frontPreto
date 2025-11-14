<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h2 class="text-h4 q-ma-none">Reporte de Pagos</h2>
      <div>
        <q-btn color="orange" icon="picture_as_pdf" label="Generar PDF" @click="generarReporte" class="q-mr-sm" />
        <q-btn color="secondary" icon="file_download" label="Generar Excel" @click="generarReporteExcel" />
      </div>
    </div>

    <!-- Filtros (copiados de pagos-page) -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar por detalle" class="col-md-4">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-input dense outlined class="col-md-3" label="Desde" v-model="filterDesde" readonly>
            <template v-slot:prepend>
              <q-icon name="event" />
            </template>
            <q-popup-proxy transition-show="scale" transition-hide="scale">
              <q-date v-model="filterDesde" mask="YYYY-MM-DD" />
            </q-popup-proxy>
          </q-input>
          <q-input dense outlined class="col-md-3" label="Hasta" v-model="filterHasta" readonly>
            <template v-slot:prepend>
              <q-icon name="event" />
            </template>
            <q-popup-proxy transition-show="scale" transition-hide="scale">
              <q-date v-model="filterHasta" mask="YYYY-MM-DD" />
            </q-popup-proxy>
          </q-input>

          <q-select dense outlined class="col-md-4" v-model="filterPersona" :options="personOptions"
            option-label="displayName" option-value="id" use-input input-debounce="200" emit-value map-options
            label="Persona (o General)" clearable @filter="filterPerson">
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">No se encontró</q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select dense outlined class="col-md-3" v-model="filterUsuario" :options="usuarioOptions"
            option-label="username" option-value="id" use-input input-debounce="300" emit-value map-options
            label="Usuario" clearable />

          <q-select dense outlined class="col-md-2" v-model="filterEstado" :options="estadoOptions" label="Estado"
            clearable />

        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla (preview de pagos filtrados) -->
    <q-card>
      <q-table :rows="pagos" :columns="columns" row-key="id" :loading="loading">
        <template v-slot:body-cell-persona="props">
          <q-td :props="props">{{ personaLabel(props.row) }}</q-td>
        </template>
        <template v-slot:body-cell-comprobante="props">
          <q-td :props="props">
            <q-icon :name="props.row.comprobante ? 'image' : 'image_not_supported'" />
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat icon="visibility" color="primary" @click="verPago(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="detalleDialog">
      <q-card style="min-width: 700px; max-width: 1000px">
        <q-card-section>
          <div class="text-h6">Detalle del Pago</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="row items-start q-gutter-md">
          <div class="col-6">
            <div v-if="selectedPago && selectedPago.comprobante">
              <img :src="comprobanteUrl(selectedPago.comprobante)"
                style="width:100%; max-height:60vh; object-fit:contain" />
            </div>
            <div v-else class="bg-grey-3 q-pa-md">Sin comprobante</div>
          </div>
          <div class="col-6">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Detalle</q-item-label>
                  <q-item-label>{{ selectedPago?.detalle || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Fecha</q-item-label>
                  <q-item-label>{{ selectedPago?.fecha || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Persona</q-item-label>
                  <q-item-label>{{ personaLabel(selectedPago || {}) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Monto</q-item-label>
                  <q-item-label>{{ selectedPago?.monto ?? '-' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup @click="detalleDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Este módulo es exclusivamente para reportes: no mostrar dialog Nuevo Pago -->

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { listarPagos } from 'src/stores/pago_store.js'
import { reportePagosParams, reportePagosExcel } from 'src/stores/reportes.js'

const $q = useQuasar()

const pagos = ref([])
const loading = ref(false)

// Filtros
const searchTerm = ref('')
const filterDesde = ref(null)
const filterHasta = ref(null)
const filterPersona = ref(null)
const filterUsuario = ref(null)
const filterEstado = ref(null)

const detalleDialog = ref(false)
const selectedPago = ref(null)

const personOptions = ref([])
const usuarioOptions = ref([])

const estadoOptions = [
  { label: 'Anulado', value: 0 },
  { label: 'Pagado', value: 1 },
  { label: 'Parcial', value: 2 }
]

const columns = [
  { name: 'fecha', label: 'Fecha', field: 'fecha' },
  { name: 'comprobante', label: 'Comprobante', field: 'comprobante' },
  { name: 'detalle', label: 'Detalle', field: 'detalle' },
  { name: 'persona', label: 'Persona', field: 'persona' },
  { name: 'monto', label: 'Monto', field: 'monto', align: 'right' },
  { name: 'descuento', label: 'Descuento', field: 'descuento', align: 'right' },
  { name: 'estado', label: 'Estado', field: 'estado' },
  { name: 'actions', label: 'Acciones', field: 'actions' }
]

function personaLabel(row) {
  if (row && row.id_persona && row.persona) return `${row.persona.nombres} ${row.persona.apellido_paterno}`
  return 'General'
}

async function loadPagos() {
  loading.value = true
  try {
    const params = {
      desde: filterDesde.value,
      hasta: filterHasta.value,
      id_persona: filterPersona.value,
      id_usuario: filterUsuario.value,
      estado: filterEstado.value,
      search: searchTerm.value
    }
    const response = await listarPagos(params)
    pagos.value = Array.isArray(response) ? response : (response.data || [])
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error cargando pagos' })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadPagos()
})

// onPagoSaved eliminado: esta página es sólo para reportes

const comprobanteUrl = (name) => {
  if (!name) return null
  if (name.startsWith('http')) return name
  return `http://localhost:3001/uploads/${name}`
}

function verPago(pago) {
  selectedPago.value = pago
  detalleDialog.value = true
}

async function generarReporte() {
  const params = {
    desde: filterDesde.value,
    hasta: filterHasta.value,
    persona: { nombres: 'angel', apellidos: 'perez' },
    usuario: 'yo xd',
    nombreSistema: 'TarijaSport',
    estado: filterEstado.value,
    pagosLista: pagos.value
  }
  await reportePagosParams(params)
}

async function generarReporteExcel() {
  const params = {
    desde: filterDesde.value,
    hasta: filterHasta.value,
    persona: { nombres: 'angel', apellidos: 'perez' },
    usuario: 'yo xd',
    nombreSistema: 'TarijaSport',
    estado: filterEstado.value,
    pagosLista: pagos.value
  }
  await reportePagosExcel(params)
}
</script>
