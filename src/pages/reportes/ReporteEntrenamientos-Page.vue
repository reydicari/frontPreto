<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h2 class="text-h4 q-ma-none">Reporte de Entrenamientos</h2>
      <div>
        <q-btn color="orange" icon="picture_as_pdf" label="Generar PDF" @click="generarReporte" class="q-mr-sm" />
        <q-btn color="secondary" icon="file_download" label="Generar Excel" @click="generarReporteExcel" />
      </div>
    </div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar" class="col-md-4">
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

          <q-select dense outlined class="col-md-4" v-model="filterEntrenamiento" :options="entrenamientos"
            option-label="nombre" option-value="id" use-input input-debounce="200" emit-value map-options
            label="Entrenamiento" clearable />

          <q-select dense outlined class="col-md-4" v-model="filterPersona" :options="personOptions"
            option-label="displayName" option-value="id" use-input input-debounce="200" emit-value map-options
            label="Persona (o General)" clearable @filter="filterPerson">
          </q-select>

        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-table :rows="asistencias" :columns="columns" row-key="id" :loading="loading">
        <template v-slot:body-cell-persona="props">
          <q-td :props="props">{{ props.row.persona?.nombres || props.row.nombre_persona || 'Persona ' +
            props.row.id_persona }}</q-td>
        </template>
        <template v-slot:body-cell-fecha="props">
          <q-td :props="props">{{ props.row.fecha }}</q-td>
        </template>
      </q-table>
    </q-card>

  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { reporteAsistenciasEntrenamiento, reporteAsistenciasEntrenamientoExcel } from 'src/stores/reportes.js'
import { listarEntrenamientos } from 'src/stores/entrenamientos-store.js'
import { listarAsistenciasPorEntrenamiento } from 'src/stores/asistencia-store.js'

const $q = useQuasar()

const asistencias = ref([])
const loading = ref(false)

// filtros
const searchTerm = ref('')
const filterDesde = ref(null)
const filterHasta = ref(null)
const filterEntrenamiento = ref(null)
const filterPersona = ref(null)

const entrenamientos = ref([])
const personOptions = ref([])

const columns = [
  { name: 'fecha', label: 'Fecha', field: 'fecha' },
  { name: 'persona', label: 'Persona', field: 'persona' },
  { name: 'actions', label: 'Acciones', field: 'actions' }
]

async function loadEntrenamientos() {
  try {
    const resp = await listarEntrenamientos()
    entrenamientos.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) { console.error(e) }
}

function filterPerson(val, update) {
  update(() => {
    if (!val) {
      personOptions.value = []
      return
    }
    // simple filter: this page doesn't pre-load persons; backend report will filter
  })
}

async function loadAsistencias() {
  loading.value = true
  try {
    if (!filterEntrenamiento.value) {
      asistencias.value = []
      return
    }
    const resp = await listarAsistenciasPorEntrenamiento(filterEntrenamiento.value)
    asistencias.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error cargando asistencias' })
  } finally { loading.value = false }
}

watch([filterEntrenamiento], () => {
  loadAsistencias()
})

onMounted(async () => {
  await loadEntrenamientos()
})

async function generarReporte() {
  const params = {
    desde: filterDesde.value,
    hasta: filterHasta.value,
    id_entrenamiento: filterEntrenamiento.value,
    id_persona: filterPersona.value,
    search: searchTerm.value
  }
  await reporteAsistenciasEntrenamiento(params)
}

async function generarReporteExcel() {
  const params = {
    desde: filterDesde.value,
    hasta: filterHasta.value,
    id_entrenamiento: filterEntrenamiento.value,
    id_persona: filterPersona.value,
    search: searchTerm.value
  }
  await reporteAsistenciasEntrenamientoExcel(params)
}
</script>
