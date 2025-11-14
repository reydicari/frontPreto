<template>
  <q-page class="q-pa-md">
    <!-- Reportes principales con gráficas -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Reporte de Inscripciones -->

      <!-- Reporte de Pagos -->
      <q-card class="col-12 col-md-6">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-h6">Reporte de Pagos</div>
              <div class="text-caption text-grey">Por mes actual</div>
            </div>
            <div class="col-auto">
              <q-btn flat color="primary" icon="visibility" label="Vista previa" @click="verReporte('pagos')" />
              <q-btn flat color="red" icon="picture_as_pdf" label="Generar PDF" @click="generarPDF('pagos')"
                class="q-ml-sm" />
            </div>
          </div>
        </q-card-section>
        <q-card-section>
          <div style="height: 250px;">
            <!-- Espacio para gráfica de pagos <PagosChart />-->

          </div>
        </q-card-section>
      </q-card>

      <!-- Reporte de Gastos -->
      <q-card class="col-12 col-md-6">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-h6">Reporte de Gastos</div>
              <div class="text-caption text-grey">Por mes actual</div>
            </div>
            <div class="col-auto">
              <q-btn flat color="primary" icon="visibility" label="Vista previa" @click="verReporte('gastos')" />
              <q-btn flat color="red" icon="picture_as_pdf" label="Generar PDF" @click="generarPDF('gastos')"
                class="q-ml-sm" />
            </div>
          </div>
        </q-card-section>
        <q-card-section>
          <div style="height: 250px;">
            <!-- Espacio para gráfica de gastos -->
            <GastosChart />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Reportes secundarios sin gráficas -->
    <div class="row q-col-gutter-md">
      <!-- Reporte de Estudiantes -->
      <q-card class="col-6 col-sm-4 col-md-3">
        <q-card-section class="text-center">
          <q-icon name="people" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">Estudiantes</div>
          <div class="text-caption text-grey">Total: {{ totalEstudiantes }}</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn flat color="primary" icon="visibility" label="Vista" @click="verReporte('estudiantes')" />
          <q-btn flat color="red" icon="picture_as_pdf" @click="generarPDF('estudiantes')" />
        </q-card-actions>
      </q-card>

      <!-- Reporte de Entrenadores -->
      <q-card class="col-6 col-sm-4 col-md-3">
        <q-card-section class="text-center">
          <q-icon name="sports" size="xl" color="secondary" />
          <div class="text-h6 q-mt-sm">Entrenadores</div>
          <div class="text-caption text-grey">Total: {{ totalEntrenadores }}</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn flat color="primary" icon="visibility" label="Vista" @click="verReporte('entrenadores')" />
          <q-btn flat color="red" icon="picture_as_pdf" @click="generarPDF('entrenadores')" />
        </q-card-actions>
      </q-card>

      <!-- Reporte de Torneos -->
      <q-card class="col-6 col-sm-4 col-md-3">
        <q-card-section class="text-center">
          <q-icon name="emoji_events" size="xl" color="amber" />
          <div class="text-h6 q-mt-sm">Torneos</div>
          <div class="text-caption text-grey">Activos: {{ torneosActivos }}</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn flat color="primary" icon="visibility" label="Vista" @click="verReporte('torneos')" />
          <q-btn flat color="red" icon="picture_as_pdf" @click="generarPDF('torneos')" />
        </q-card-actions>
      </q-card>

      <!-- Reporte de Entrenamientos -->
      <q-card class="col-6 col-sm-4 col-md-3">
        <q-card-section class="text-center">
          <q-icon name="fitness_center" size="xl" color="green" />
          <div class="text-h6 q-mt-sm">Entrenamientos</div>
          <div class="text-caption text-grey">Semanal: {{ entrenamientosSemana }}</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn flat color="primary" icon="visibility" label="Vista" @click="verReporte('entrenamientos')" />
          <q-btn flat color="red" icon="picture_as_pdf" @click="generarPDF('entrenamientos')" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// import InscripcionesChart from 'components/graficas/InscripcionesChart.vue'
// import PagosChart from 'components/graficas/PagosChart.vue'
import GastosChart from 'components/graficas/GastosChart.vue'
import { reportePagos, reportePersonas } from "stores/reportes.js";

const router = useRouter()

// Datos de ejemplo - reemplazar con datos reales
const totalEstudiantes = ref(125)
const totalEntrenadores = ref(8)
const torneosActivos = ref(3)
const entrenamientosSemana = ref(15)

// Métodos
const verReporte = (tipo) => {
  router.push(`/reportes/${tipo}`)
}

const generarPDF = async (tipo) => {
  console.log(`Generando PDF para ${tipo}`)
  if (tipo === 'pagos') {
    const res = await reportePagos()
    console.log('res', res)
  }
  if (tipo === 'estudiantes') {
    const res = await reportePersonas()
    console.log('res', res)
  }
}

// Cargar datos iniciales
onMounted(() => {
  // Aquí podrías cargar los datos reales desde tu API
})
</script>

<style scoped>
.q-card {
  transition: transform 0.3s;
}

.q-card:hover {
  transform: translateY(-5px);
}
</style>
