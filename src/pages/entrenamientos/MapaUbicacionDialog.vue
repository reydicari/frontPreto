<template>
  <q-dialog v-model="isVisible" :maximized="$q.screen.lt.md" @before-show="onBeforeShow">
    <q-card class="mapa-dialog-card">
      <q-card-section class="dialog-header">
        <div class="dialog-title">
          <q-icon name="place" size="28px" class="q-mr-sm" />
          <div>
            <div class="text-h6">{{ ubicacion?.nombre || 'Ubicación' }}</div>
            <div class="text-caption">{{ ubicacion?.descripcion || 'Ver ubicación en el mapa' }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" color="white" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <div class="map-container" ref="mapContainer"></div>
      </q-card-section>

      <q-card-section class="ubicacion-info">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="info-item">
              <q-icon name="my_location" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Coordenadas</div>
                <div class="info-value">{{ coordenadasFormateadas }}</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6" v-if="ubicacion?.capacidad">
            <div class="info-item">
              <q-icon name="groups" size="20px" class="info-icon" />
              <div class="info-content">
                <div class="info-label">Capacidad</div>
                <div class="info-value">{{ ubicacion.capacidad }} personas</div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cerrar" color="brown-7" icon="close" v-close-popup />
        <q-btn unelevated label="Ver en Google Maps" color="green-7" icon="map" @click="abrirEnGoogleMaps"
          v-if="latitud && longitud" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const $q = useQuasar()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  ubicacion: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const isVisible = ref(props.modelValue)
const mapContainer = ref(null)
let map = null
let marker = null

// Convertir coordenadas a números (vienen como strings del backend)
const latitud = computed(() => {
  if (!props.ubicacion) return -12.046374
  const lat = props.ubicacion.latitud
  if (lat === null || lat === undefined) return -12.046374
  return typeof lat === 'string' ? parseFloat(lat) : Number(lat)
})

const longitud = computed(() => {
  if (!props.ubicacion) return -77.042793
  const lng = props.ubicacion.longitud
  if (lng === null || lng === undefined) return -77.042793
  return typeof lng === 'string' ? parseFloat(lng) : Number(lng)
})

const coordenadasFormateadas = computed(() => {
  return `${latitud.value.toFixed(6)}, ${longitud.value.toFixed(6)}`
})

// Sincronizar con v-model
watch(() => props.modelValue, (val) => {
  isVisible.value = val
})

watch(isVisible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    limpiarMapa()
  }
})

// Fix para iconos de Leaflet (similar a ubicacion-page.vue)
const fixLeafletIcons = () => {
  if (L.Icon.Default.prototype._getIconUrl) {
    delete L.Icon.Default.prototype._getIconUrl
  }
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

const onBeforeShow = () => {
  // Esperar a que el DOM esté listo antes de inicializar el mapa
  nextTick(() => {
    setTimeout(() => {
      inicializarMapa()
    }, 100)
  })
}

const inicializarMapa = () => {
  // Validaciones
  if (!mapContainer.value) {
    console.warn('MapContainer no está disponible')
    return
  }

  if (map) {
    console.log('Mapa ya inicializado, actualizando vista')
    map.setView([latitud.value, longitud.value], 16)
    return
  }

  try {
    fixLeafletIcons()

    // Crear mapa centrado en la ubicación (igual que ubicacion-page.vue)
    map = L.map(mapContainer.value).setView([latitud.value, longitud.value], 16)

    // Capa de OpenStreetMap (igual que ubicacion-page.vue)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    // Agregar marcador rojo en la ubicación (similar a ubicacion-page.vue)
    marker = L.marker([latitud.value, longitud.value], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(map)

    // Agregar popup con el nombre
    const popupContent = `<b>${props.ubicacion?.nombre || 'Ubicación'}</b>${props.ubicacion?.descripcion ? '<br>' + props.ubicacion.descripcion : ''}`
    marker.bindPopup(popupContent).openPopup()

    // Forzar redimensionamiento del mapa (importante para que se renderice correctamente)
    setTimeout(() => {
      if (map) {
        map.invalidateSize()
      }
    }, 200)
  } catch (error) {
    console.error('Error al inicializar el mapa:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar el mapa',
      position: 'top'
    })
  }
}

const limpiarMapa = () => {
  if (marker) {
    marker.remove()
    marker = null
  }
  if (map) {
    map.remove()
    map = null
  }
}

const abrirEnGoogleMaps = () => {
  const url = `https://www.google.com/maps/search/?api=1&query=${latitud.value},${longitud.value}`
  window.open(url, '_blank')
}

onUnmounted(() => {
  limpiarMapa()
})
</script>

<style scoped lang="scss">
.mapa-dialog-card {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;

  @media (max-width: 959px) {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #ff6f00 0%, #f57c00 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.map-container {
  width: 100%;
  height: 500px;

  @media (max-width: 959px) {
    height: calc(100vh - 280px);
  }

  @media (max-width: 599px) {
    height: calc(100vh - 320px);
  }
}

.ubicacion-info {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  padding: 16px 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-icon {
  color: #ff6f00;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 0.75em;
  color: #757575;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.95em;
  color: #212121;
  font-weight: 500;
  margin-top: 2px;
}

@media (max-width: 599px) {
  .dialog-header {
    padding: 12px 16px;
  }

  .dialog-title .text-h6 {
    font-size: 1.1rem;
  }

  .dialog-title .text-caption {
    font-size: 0.75rem;
  }

  .ubicacion-info {
    padding: 12px 16px;
  }

  .info-item {
    padding: 6px;
  }
}
</style>
