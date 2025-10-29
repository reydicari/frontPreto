<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h2 class="text-h4 q-ma-none">Gestión de Pagos</h2>
      <q-btn color="primary" icon="add" label="Nuevo Pago" @click="openDialog" />
    </div>

    <!-- Filtros -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar por detalle o comprobante" class="col-md-4">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Rango de fechas (popup) -->
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

          <!-- Persona (select con búsqueda) -->
          <q-select dense outlined class="col-md-4" v-model="filterPersona" :options="personOptions"
            option-label="displayName" option-value="id" use-input input-debounce="200" emit-value map-options
            label="Persona (o General)" clearable @filter="filterPerson">
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">No se encontró</q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Usuario -->
          <q-select dense outlined class="col-md-3" v-model="filterUsuario" :options="usuarioOptions"
            option-label="username" option-value="id" use-input input-debounce="300" emit-value map-options
            label="Usuario" clearable />

          <!-- Estado -->
          <q-select dense outlined class="col-md-2" v-model="filterEstado" :options="estadoOptions" label="Estado"
            clearable />

        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla -->
    <q-card>
      <q-table :rows="pagos" :columns="columns" row-key="id" :loading="loading">
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="estadoColor(props.row.estado)" :label="estadoLabel(props.row.estado)" text-color="white" />
          </q-td>
        </template>

        <template v-slot:body-cell-persona="props">
          <q-td :props="props">{{ personaLabel(props.row) }}</q-td>
        </template>

        <template v-slot:body-cell-comprobante="props">
          <q-td :props="props">
            <q-btn flat dense icon="image" @click="verComprobante(props.row)" />
            <span class="q-ml-sm">{{ props.row.comprobante || '-' }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-saldo="props">
          <q-td :props="props">{{ props.row.saldo ?? 0 }}</q-td>
        </template>

        <template v-slot:body-cell-descuento="props">
          <q-td :props="props">{{ props.row.descuento ?? 0 }}</q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat icon="visibility" color="primary" @click="verComprobante(props.row)" />
            <q-btn dense flat icon="cancel" color="negative" @click="anularPago(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialogo ver comprobante -->
    <q-dialog v-model="comprobanteDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Comprobante</div>
        </q-card-section>
        <q-card-section class="q-pa-md flex flex-center">
          <img v-if="selectedComprobanteUrl" :src="selectedComprobanteUrl" style="max-width:100%; max-height:60vh" />
          <div v-else class="bg-grey-3 q-pa-md">Sin comprobante</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: Nuevo/edit Pago (simplificado) -->
    <q-dialog v-model="dialogVisible" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Editar Pago' : 'Nuevo Pago' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.detalle" label="Detalle" outlined />
          <q-input v-model.number="form.monto" type="number" label="Monto" prefix="Bs " outlined />
          <q-input v-model.number="form.descuento" type="number" label="Descuento" prefix="Bs " outlined />
          <q-file v-model="form.comprobanteFile" accept="image/*" label="Comprobante (imagen)"
            @change="onFileSelected" />
          <q-select v-model="form.id_persona" :options="personOptions" option-label="displayName" option-value="id"
            label="Persona" outlined use-input input-debounce="200" @filter="filterPerson" />
          <q-select v-model="form.id_categoria" :options="categoriaOptions" option-label="label" option-value="value"
            label="Categoría" outlined />
          <q-select v-model="form.metodo_pago" :options="metodoOptions" label="Método" outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" @click="guardarPago" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { listarPagos } from 'src/stores/pago_store.js'
import { listar } from 'src/stores/persona-store.js'
import { listarUsuarios } from 'src/stores/usuario-store.js'

const $q = useQuasar()

// Estado
const pagos = ref([])
const loading = ref(false)

// Filtros
const searchTerm = ref('')
const filterDesde = ref(null)
const filterHasta = ref(null)
const filterPersona = ref(null)
const filterUsuario = ref(null)
const filterEstado = ref(null)

// Dialogos y formulario
const dialogVisible = ref(false)
const comprobanteDialog = ref(false)
const editMode = ref(false)
const selectedComprobanteUrl = ref(null)

const form = ref({
  comprobante: '',
  comprobanteFile: null,
  detalle: '',
  monto: null,
  descuento: 0,
  metodo_pago: null,
  id_categoria: null,
  id_persona: 0,
})

// Opciones
const personOptions = ref([])
const allPersonOptions = ref([])
const usuarioOptions = ref([])
const categoriaOptions = ref([])
const metodoOptions = ref(['Efectivo', 'Transferencia', 'Tarjeta', 'Depósito', 'Otro'])
const estadoOptions = [
  { label: 'Deuda', value: 0 },
  { label: 'Parcial', value: 1 },
  { label: 'Pagado', value: 2 }
]

// Columnas tabla
const columns = [
  { name: 'fecha', label: 'Fecha', field: 'fecha' },
  { name: 'comprobante', label: 'Comprobante', field: 'comprobante' },
  { name: 'detalle', label: 'Detalle', field: 'detalle' },
  { name: 'persona', label: 'Persona', field: 'persona' },
  { name: 'monto', label: 'Monto', field: 'monto', align: 'right' },
  { name: 'saldo', label: 'Saldo', field: 'saldo', align: 'right' },
  { name: 'descuento', label: 'Descuento', field: 'descuento', align: 'right' },
  { name: 'estado', label: 'Estado', field: 'estado' },
  { name: 'usuario_cobrador', label: 'Usuario', field: 'usuario_cobrador' },
  { name: 'categoria', label: 'Categoría', field: 'categoria' },
  { name: 'actions', label: 'Acciones', field: 'actions' }
]

// Utilidades
function estadoColor(estado) {
  switch (estado) {
    case 0: return 'negative' // deuda - rojo
    case 1: return 'orange' // parcial - naranja
    case 2: return 'positive' // pagado - verde
    default: return 'grey'
  }
}
function estadoLabel(estado) {
  switch (estado) {
    case 0: return 'Deuda'
    case 1: return 'Parcial'
    case 2: return 'Pagado'
    default: return 'Desconocido'
  }
}
function personaLabel(row) {
  if (row.id_persona && row.persona) return `${row.persona.nombres} ${row.persona.apellido_paterno}`
  return 'General'
}

// Cargar listas desde stores
async function loadLists() {
  try {
    const personas = await listar('estudiante')
    // Añadir opción General (id 0)
    allPersonOptions.value = [{ id: 0, displayName: 'General' }, ...personas.map(p => ({ ...p, displayName: `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno}` }))]
    personOptions.value = [...allPersonOptions.value]
  } catch (e) {
    console.error(e)
  }
  try {
    const usuarios = await listarUsuarios()
    usuarioOptions.value = usuarios
  } catch (e) {
    console.error(e)
  }
  // Categorías: intentar obtener desde persona-store.categoriasUnicas si existe
  try {
    // importar dinámicamente para no romper si no existe
    const { categoriasUnicas } = await import('src/stores/persona-store.js')
    const cats = await categoriasUnicas()
    if (Array.isArray(cats)) {
      categoriaOptions.value = cats.map(c => ({ label: c, value: c }))
    }
  } catch (e) {
    console.warn('No se pudo cargar categoriasUnicas', e)
  }
}

function filterPerson(val, update) {
  update(() => {
    if (!val) {
      // reset to full list
      personOptions.value = [...allPersonOptions.value]
      return
    }
    const needle = val.toLowerCase()
    personOptions.value = allPersonOptions.value.filter(p => (p.displayName || '').toLowerCase().includes(needle))
  })
}

function onFileSelected(files) {
  if (!files || !files.length) return
  form.value.comprobanteFile = files[0]
}

// Cargar pagos con filtros
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

// Watch filtros
watch([filterDesde, filterHasta, filterPersona, filterUsuario, filterEstado, searchTerm], () => {
  loadPagos()
})

onMounted(async () => {
  await loadLists()
  await loadPagos()
})

// Acciones
function openDialog() {
  editMode.value = false
  form.value = { comprobante: '', comprobanteFile: null, detalle: '', monto: null, descuento: 0, metodo_pago: null, id_categoria: null, id_persona: 0 }
  dialogVisible.value = true
}
function guardarPago() {
  // Implementación mínima: notificar y recargar
  $q.notify({ type: 'positive', message: 'Pago guardado (simulado)' })
  dialogVisible.value = false
  loadPagos()
}
function verComprobante(pago) {
  if (pago.comprobante) {
    // si comprobante es solo el nombre del archivo, construir url
    selectedComprobanteUrl.value = (pago.comprobante.startsWith('http') ? pago.comprobante : `${window.location.origin}/${pago.comprobante}`)
  } else {
    selectedComprobanteUrl.value = null
  }
  comprobanteDialog.value = true
}
function anularPago(pago) {
  // Simular anulación localmente
  pago.estado = 0
  $q.notify({ type: 'negative', message: 'Pago anulado (simulado)' })
}

// Computed: mostrar persona en tabla si viene como objeto
// (el store puede devolver `persona` o `inscripcion.persona`)
// No hacemos transformaciones complejas aquí para evitar suposiciones.

</script>
