<!-- eslint-disable vue/require-v-for-key -->
<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card style="min-width: 600px">
      <q-card-section>
        <div class="text-h6 q-ma-none">Detalles de la Persona</div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="!persona" class="text-center q-pa-lg">
        <q-spinner color="primary" size="3em" />
        <div class="q-mt-md">Cargando información de la persona...</div>
      </q-card-section>

      <q-card-section v-else>
        <div class="row q-col-gutter-y-md">
          <div class="col-12">
            <div class="row items-center">
              <q-avatar size="80px" class="q-mr-md">
                <img v-if="persona.fotografia" :src="host + persona.fotografia">
                <div v-else class="flex flex-center bg-primary text-white" style="width: 100%; height: 100%;">
                  <q-avatar size="60px" color="secondary" text-color="white" font-size="24px">
                    {{ getInitials(persona.nombres, persona.apellido_paterno) }}
                  </q-avatar>
                </div>
              </q-avatar>

              <div>
                <div class="text-h4">{{ persona.nombres }} {{ persona.apellido_paterno }} {{ persona.apellido_materno }}
                </div>
                <div class="text-subtitle1 text-grey">{{ persona.tipo_persona || 'Sin tipo especificado' }}</div>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="row items-center">
              <div class="text-weight-bold">CI: </div>
              <div>{{ persona.ci }} {{ persona.complemento }}</div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="row items-center">
              <div class="text-weight-bold">Teléfono:</div>
              <div>{{ persona.telefono }}</div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="row items-center">
              <div class="text-weight-bold">Fecha de Nacimiento: </div>
              <div>{{ formatDate(persona.fecha_nacimiento) }}</div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="row items-center">
              <div class="text-weight-bold">Categoría:</div>
              <div>{{ persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento).getFullYear() : 'N/A' }}</div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="row items-center">
              <div class="text-weight-bold q-mr-sm">Nivel:</div>
              <q-badge class="q-pa-sm" color="info">
                {{ persona.nivel.nombre_nivel }}
              </q-badge>
            </div>
          </div>

          <div class="col-md-6">
            <div class="row items-center">
              <div class="text-weight-bold">Estado:</div>
              <div>
                <q-badge :color="persona.estado ? 'positive' : 'negative'">
                  {{ persona.estado ? 'Activo' : 'Inactivo' }}
                </q-badge>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="row items-center">
              <div class="text-weight-bold">Género:</div>
              <div>{{ persona.genero == 0 ? 'Masculino' : persona.genero == 1 ? 'Femenino' : 'No registrado' }}</div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="row items-center">
              <div class="text-weight-bold">Registrado por:</div>
              <div>{{ persona.usuario_registro }}</div>
            </div>
          </div>

          <div class="col-12" v-if="!!persona.biografia">
            <div class="row items-center">
              <div class="text-weight-bold">Biografía:</div>
              <div class="">{{ persona.biografia }}</div>
            </div>
          </div>
        </div>
        <div v-if="persona.reconocimientos && persona.reconocimientos.length > 0" class="row text-weight-bold">
          Reconocimientos:</div>
        <div class="row" v-if="persona.reconocimientos && persona.reconocimientos.length > 0">
          <div class="col-4" v-for="reconocimiento in persona.reconocimientos" :key="reconocimiento.id">
            <div @click="abrirVista(reconocimiento)" class="image-container flex flex-center bg-primary text-white">
              <q-img v-if="esImagen(reconocimiento.archivo)" :src="host + reconocimiento.archivo" class="card-img"
                style="width: 100%; height: 100%; object-fit: cover;" />
              <!-- Si no es imagen, mostrar avatar con extensión -->
              <q-avatar v-else size="80px" color="secondary" text-color="white" class="flex flex-center"
                style="width: 100%; height: 100%; font-size: 24px;">
                {{ obtenerExtension(reconocimiento.archivo).toUpperCase() }}
              </q-avatar>

            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- Dialog de vista previa -->
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 600px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h6">Vista previa de reconocimiento</div>
      </q-card-section>

      <q-card-section>
        <q-img v-if="reconocimientoActual && esImagen(reconocimientoActual.archivo)"
          :src="host + reconocimientoActual.archivo" style="max-height: 70vh; object-fit: contain;" />
        <iframe v-else-if="reconocimientoActual" :src="host + reconocimientoActual.archivo"
          style="width: 100%; height: 70vh;"></iframe>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-if="reconocimientoActual" :href="host + reconocimientoActual.archivo" target="_blank" download
          label="Abrir" color="primary" icon="computer" />
        <q-btn flat label="Cerrar" color="negative" v-close-popup />
      </q-card-actions>
    </q-card>

  </q-dialog>

</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  persona: {
    type: Object,
    required: true
  }
})
const host = 'http://localhost:3001/uploads/'
const emit = defineEmits(['update:modelValue'])
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dialogVisible = ref(false)
const reconocimientoActual = ref(null)
function abrirVista(reconocimiento) {
  console.log('RECONOCIMIENTO xxxxxxxxxxxxxxxxxxxxxxxxxxxx:', reconocimiento);

  reconocimientoActual.value = reconocimiento
  dialogVisible.value = true
  console.log('RECONOCIMIENTO:', reconocimientoActual.value);

}

function getInitials(nombres, apellido) {
  return `${nombres.charAt(0)}${apellido.charAt(0)}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('es-ES', options)
}
function esImagen(nombreArchivo) {
  const ext = obtenerExtension(nombreArchivo)
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
}
function obtenerExtension(nombreArchivo) {
  return nombreArchivo.split('.').pop().toLowerCase()
}

</script>
<style scoped>
.image-container {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
