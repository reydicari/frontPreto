<template>
  <q-card style="min-width: 600px">
    <q-card-section>
      <div class="text-h6 q-ma-none">Detalles del Entrenamiento</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-y-md">
        <div class="col-12">
          <div class="text-h5">{{ training.nombre }}</div>
          <div class="text-subtitle1 text-grey">{{ training.disciplina }}</div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Horario:</div>
          <div>{{ training.hora_inicio }} ({{ training.horas }} horas)</div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Días:</div>
          <div>
            <q-chip
              v-for="dia in training.dias.split(',')"
              :key="dia"
              size="sm"
              color="primary"
              text-color="white"
            >
              {{ dia }}
            </q-chip>
          </div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Fecha Inicio:</div>
          <div>{{ formatDate(training.fecha_inicio) }}</div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Fecha Fin:</div>
          <div>{{ formatDate(training.fecha_fin) }}</div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Duración:</div>
          <div>{{ training.duracion_meses }} meses</div>
        </div>

        <div class="col-md-6">
          <div class="text-weight-bold">Estado:</div>
          <div>
            <q-badge
              :color="getStatusColor(training.estado)"
              :label="getStatusLabel(training.estado)"
            />
          </div>
        </div>

        <div class="col-12" v-if="training.observacion">
          <div class="text-weight-bold">Observaciones:</div>
          <div>{{ training.observacion }}</div>
        </div>

        <div class="col-12 q-mt-md">
          <div class="text-h6 q-mb-sm">Entrenadores Asignados</div>
          <q-list bordered separator>
            <q-item
              v-for="coach in training.entrenadores"
              :key="coach.id"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  {{ coach.nombre.charAt(0) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ coach.nombre }}</q-item-label>
                <q-item-label caption>{{ coach.especialidad }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Cerrar" color="primary" v-close-popup />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { defineProps } from 'vue'
import { defineEmits } from 'vue'

// 1. Declaro el evento que voy a emitir
const emit = defineEmits(['completed'])

// 2. Función async que hace el trabajo y al final emite
async function handleProcess() {
  // … aquí haces tu proceso …
  const resultado = await doSomeHeavyWork()
  // cuando terminas, le devuelvo el payload al padre
  emit('completed', resultado)
}

async function doSomeHeavyWork() {
  // ejemplo: valida campos, calcula algo, formatea datos...
  await new Promise(r => setTimeout(r, 500))
  return { foo: 42, bar: 'ok' }
}

// 1. Declara la prop “training” y su tipo
const { training } = defineProps({
  training: {
    type: Object,
    required: true
  }
})

    // Formatear fecha
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('es-ES', options)
    }

    // Obtener color para el estado
    const getStatusColor = (status) => {
      const colors = {
        0: 'negative', // Inactivo
        1: 'positive', // Activo
        2: 'info'      // Completado
      }
      return colors[status] || 'grey'
    }

    // Obtener texto para el estado
    const getStatusLabel = (status) => {
      const labels = {
        0: 'Inactivo',
        1: 'Activo',
        2: 'Completado'
      }
      return labels[status] || 'Desconocido'
    }

</script>
