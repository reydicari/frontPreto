<!-- eslint-disable vue/require-v-for-key -->
<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="details-card responsive-details scrollable-details">
      <q-card-section class="details-header">
        <div class="header-title-details">
          <q-icon name="account_circle" size="32px" class="q-mr-sm" />
          <div class="text-h5 text-weight-bold">Detalles de la Persona</div>
        </div>
      </q-card-section>

      <q-separator class="separator-gradient" />

      <q-card-section v-if="!persona" class="text-center q-pa-lg">
        <q-spinner color="primary" size="3em" />
        <div class="q-mt-md">Cargando información de la persona...</div>
      </q-card-section>

      <q-card-section v-else class="details-body">
        <div class="row q-col-gutter-y-md">
          <div class="col-12">
            <div class="person-header">
              <q-avatar size="100px" class="person-avatar">
                <img v-if="persona.fotografia" :src="host + persona.fotografia">
                <div v-else class="avatar-placeholder-details">
                  {{ getInitials(persona.nombres, persona.apellido_paterno) }}
                </div>
              </q-avatar>

              <div class="person-info">
                <div class="person-name">{{ persona.nombres }} {{ persona.apellido_paterno }} {{
                  persona.apellido_materno }}
                </div>
                <div class="person-type">
                  <q-chip :icon="persona.tipo_persona === 'estudiante' ? 'school' : 'sports'"
                    :color="persona.tipo_persona === 'estudiante' ? 'green-6' : 'brown-6'" text-color="white"
                    class="chip-type">
                    {{ persona.tipo_persona || 'Sin tipo especificado' }}
                  </q-chip>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-12">
            <div class="info-item">
              <q-icon name="badge" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">CI</div>
                <div class="info-value">{{ persona.ci }} {{ persona.complemento }}</div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-12">
            <div class="info-item">
              <q-icon name="phone" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Teléfono</div>
                <div class="info-value">{{ persona.telefono || 'N/A' }}</div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-12">
            <div class="info-item">
              <q-icon name="cake" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Fecha de Nacimiento</div>
                <div class="info-value">{{ formatDate(persona.fecha_nacimiento) }}</div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-12">
            <div class="info-item">
              <q-icon name="category" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Categoría</div>
                <div class="info-value">{{ persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento).getFullYear() :
                  'N/A' }}</div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-12">
            <div class="info-item">
              <q-icon name="toggle_on" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Estado</div>
                <div class="info-value">
                  <q-badge :color="persona.estado ? 'green-6' : 'brown-7'" class="status-badge">
                    {{ persona.estado ? 'Activo' : 'Inactivo' }}
                  </q-badge>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-12">
            <div class="info-item">
              <q-icon name="wc" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Género</div>
                <div class="info-value">{{ persona.genero == 'M' ? 'Masculino' : persona.genero == 'F' ? 'Femenino' :
                  'Otro' }}</div>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-12">
            <div class="info-item">
              <q-icon name="person" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Registrado por</div>
                <div class="info-value">{{ persona.usuario_registro || 'N/A' }}</div>
              </div>
            </div>
          </div>

          <div class="col-12" v-if="!!persona.biografia">
            <div class="info-item biografia-item">
              <q-icon name="description" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Biografía</div>
                <div class="info-value">{{ persona.biografia }}</div>
              </div>
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
    <q-card class="preview-dialog">
      <q-card-section class="preview-header">
        <div class="text-h6">Vista previa de reconocimiento</div>
      </q-card-section>

      <q-card-section class="preview-content">
        <q-img v-if="reconocimientoActual && esImagen(reconocimientoActual.archivo)"
          :src="host + reconocimientoActual.archivo" class="preview-image" />
        <iframe v-else-if="reconocimientoActual" :src="host + reconocimientoActual.archivo"
          class="preview-iframe"></iframe>
      </q-card-section>

      <q-card-actions align="right" class="preview-actions">
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
<style scoped lang="scss">
/* Paleta pastel verde-marrón */
$pastel-mint: #c8e6c9;
$pastel-lime: #dcedc8;
$pastel-sage: #f1f8e9;
$pastel-sand: #efebe9;
$pastel-clay: #d7ccc8;
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-wood: #795548;
$color-earth: #8d6e63;

.details-card {
  border-radius: 16px;
  overflow: hidden;
}

.details-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 50%, $pastel-lime 100%);
  padding: 20px 24px;
  border-bottom: 3px solid $color-leaf;
}

.header-title-details {
  display: flex;
  align-items: center;
  color: $color-forest;
}

.separator-gradient {
  height: 3px;
  background: linear-gradient(90deg, $color-forest 0%, $color-leaf 50%, $color-moss 100%);
}

.details-body {
  background: linear-gradient(135deg, #ffffff 0%, $pastel-sage 100%);
  padding: 24px;
}

.person-header {
  display: flex;
  align-items: center;
  gap: 24px;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  border: 2px solid $pastel-mint;
}

.person-avatar {
  border: 4px solid $color-leaf;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
}

.avatar-placeholder-details {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-size: 2em;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.person-info {
  flex: 1;
}

.person-name {
  font-size: 1.8em;
  font-weight: 700;
  color: $color-forest;
  line-height: 1.2;
  margin-bottom: 8px;
}

.person-type {
  margin-top: 8px;
}

.chip-type {
  font-weight: 600;
  font-size: 0.9em;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border-left: 4px solid $pastel-mint;
}

.info-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left-color: $color-leaf;
}

.biografia-item {
  border-left-color: $color-moss;
}

.info-icon {
  color: $color-leaf;
  margin-top: 2px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 0.85em;
  font-weight: 600;
  color: $color-wood;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.info-value {
  font-size: 1em;
  font-weight: 500;
  color: #424242;
}

.status-badge {
  font-weight: 600;
  padding: 4px 12px;
}

.image-container {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid $pastel-mint;
  transition: all 0.3s ease;
}

.image-container:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: $color-leaf;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.q-btn) {
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
}

/* Estilos responsivos */
.responsive-details {
  width: 90vw;
  max-width: 800px;
}

.scrollable-details {
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  .details-body {
    overflow-y: auto;
    flex: 1;
  }

  :deep(.q-card-actions) {
    flex-shrink: 0;
  }
}

@media (max-width: 599px) {
  .responsive-details {
    width: 95vw;
    margin: 8px;
  }

  .scrollable-details {
    max-height: 95vh;
  }

  .details-header {
    padding: 16px;
  }

  .header-title-details {
    .q-icon {
      font-size: 24px !important;
    }

    .text-h5 {
      font-size: 1.2em;
    }
  }

  .details-body {
    padding: 16px;
  }

  .person-header {
    flex-direction: column;
    text-align: center;
    padding: 16px;
    gap: 16px;
  }

  .person-avatar {
    margin: 0 auto;
  }

  .person-name {
    font-size: 1.4em;
  }

  .info-item {
    padding: 12px;
  }

  .info-icon {
    font-size: 18px !important;
  }

  .info-label {
    font-size: 0.8em;
  }

  .info-value {
    font-size: 0.95em;
  }

  :deep(.q-card-actions) {
    padding: 12px;

    .q-btn {
      padding: 8px 16px;
      font-size: 0.9em;
    }
  }

  .image-container {
    width: 100%;
    height: 120px;
  }

  .preview-dialog {
    width: 95vw !important;
    max-width: 95vw !important;
    margin: 8px;
  }

  .preview-header {
    padding: 12px 16px;

    .text-h6 {
      font-size: 1.1em;
    }
  }

  .preview-content {
    padding: 12px;
    max-height: 60vh;
    overflow: auto;
  }

  .preview-image {
    max-height: 60vh !important;
    width: 100%;
    object-fit: contain;
  }

  .preview-iframe {
    width: 100%;
    height: 50vh;
    border: none;
  }

  .preview-actions {
    padding: 8px 12px;
    flex-wrap: wrap;
    gap: 8px;

    .q-btn {
      padding: 8px 12px;
      font-size: 0.9em;
      flex: 1;
      min-width: 100px;
    }
  }
}

/* Estilos para el diálogo de vista previa en desktop */
.preview-dialog {
  width: 90vw;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  .preview-header {
    background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 50%, $pastel-lime 100%);
    border-bottom: 2px solid $color-leaf;
    flex-shrink: 0;
  }

  .preview-content {
    overflow-y: auto;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
  }

  .preview-image {
    max-height: 70vh;
    max-width: 100%;
    object-fit: contain;
  }

  .preview-iframe {
    width: 100%;
    height: 70vh;
    border: none;
  }

  .preview-actions {
    flex-shrink: 0;
    border-top: 1px solid $pastel-mint;
  }
}
</style>
