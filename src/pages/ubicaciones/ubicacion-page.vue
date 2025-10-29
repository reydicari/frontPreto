<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h1 class="text-h4 text-primary q-ma-none">Gestión de Ubicaciones</h1>
        <p class="text-grey-6 q-mt-sm">Administra las ubicaciones deportivas</p>
      </div>
      <div class="row items-center q-gutter-sm">
        <div class="text-caption text-grey-7">💡 Haz clic en el mapa para seleccionar una ubicación</div>
        <q-btn color="primary" icon="add" label="Crear Ubicación" :disable="!ubicacionSeleccionada"
          @click="mostrarDialogoNuevo" />
      </div>
    </div>

    <!-- Contenedor principal: Mapa + Lista -->
    <div class="row q-col-gutter-md">
      <!-- Mapa - 2/3 del ancho -->
      <div class="col-12 col-md-8">
        <q-card class="shadow-1">
          <q-card-section class="q-pa-none">
            <div id="map" ref="mapContainer" class="map-container"></div>
          </q-card-section>
          <!-- moved helper text and create button to header for better UX -->
        </q-card>
      </div>

      <!-- Lista de ubicaciones - 1/3 del ancho -->
      <div class="col-12 col-md-4">
        <q-card class="shadow-1 sticky-card">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">Lista de Ubicaciones</div>
            <div class="text-caption">
              {{ ubicaciones.length }} ubicación{{ ubicaciones.length !== 1 ? 'es' : '' }} registrada{{
                ubicaciones.length !== 1 ? 's' : '' }}
            </div>
          </q-card-section>

          <!-- Estado de carga -->
          <q-inner-loading :showing="cargando">
            <q-spinner-gears size="50px" color="primary" />
          </q-inner-loading>

          <!-- Lista -->
          <q-list v-if="!cargando" class="rounded-borders">
            <q-item v-for="ubicacion in ubicaciones" :key="ubicacion.id" class="q-my-xs" clickable
              @click="centrarEnUbicacion(ubicacion)"
              :class="{ 'bg-blue-1': ubicacionSeleccionadaLista === ubicacion.id }">
              <q-item-section avatar>
                <q-icon name="place" :color="ubicacion.estado ? 'primary' : 'grey'" />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ ubicacion.nombre }}
                </q-item-label>
                <q-item-label caption lines="2">
                  {{ ubicacion.descripcion }}
                </q-item-label>
                <q-item-label caption>
                  <div class="row items-center q-gutter-xs">
                    <q-badge :color="ubicacion.estado ? 'positive' : 'grey'" text-color="white">
                      {{ ubicacion.estado ? 'Activo' : 'Inactivo' }}
                    </q-badge>
                    <q-badge v-if="ubicacion.equipado" color="info" text-color="white">
                      Equipado
                    </q-badge>
                    <q-badge color="secondary">
                      Cap: {{ ubicacion.capacidad }}
                    </q-badge>
                  </div>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat round icon="edit" color="primary" @click.stop="editarUbicacion(ubicacion)">
                    <q-tooltip>Editar ubicación</q-tooltip>
                  </q-btn>
                  <q-btn flat round :icon="ubicacion.estado ? 'toggle_on' : 'toggle_off'"
                    :color="ubicacion.estado ? 'positive' : 'grey'" @click.stop="toggleEstado(ubicacion)">
                    <q-tooltip>
                      {{ ubicacion.estado ? 'Desactivar' : 'Activar' }}
                    </q-tooltip>
                  </q-btn>
                  <q-btn flat round icon="delete" color="negative" @click.stop="confirmarEliminacion(ubicacion)">
                    <q-tooltip>Eliminar ubicación</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Estado vacío -->
          <div v-if="!cargando && ubicaciones.length === 0" class="text-center q-pa-lg">
            <q-icon name="explore" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No hay ubicaciones</div>
            <p class="text-grey-5">Selecciona un punto en el mapa para crear la primera</p>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Diálogo para crear/editar ubicación -->
    <q-dialog v-model="mostrarDialogo" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ esEdicion ? 'Editar Ubicación' : 'Crear Nueva Ubicación' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="guardarUbicacion" class="q-gutter-md">
            <!-- Coordenadas seleccionadas -->
            <div class="q-pa-sm bg-blue-1 rounded-borders">
              <div class="text-caption text-weight-medium">Coordenadas:</div>
              <div class="text-caption">
                Lat: {{ formulario.latitud?.toFixed(6) }},
                Lng: {{ formulario.longitud?.toFixed(6) }}
              </div>
            </div>

            <q-input v-model="formulario.nombre" label="Nombre de la ubicación *"
              placeholder="Ej: Cancha Central, Gimnasio Principal" :rules="[val => !!val || 'El nombre es requerido']"
              filled autofocus />

            <q-input v-model="formulario.descripcion" label="Descripción" placeholder="Describe la ubicación..."
              type="textarea" rows="2" filled />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input v-model="formulario.capacidad" label="Capacidad máxima *" type="number" min="1"
                  :rules="[val => val > 0 || 'La capacidad debe ser mayor a 0']" filled />
              </div>
              <div class="col-6">
                <q-toggle v-model="formulario.equipado" label="Equipado" color="positive" />
              </div>
            </div>

            <q-toggle v-model="formulario.estado" label="Ubicación activa" color="positive" />

            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn label="Cancelar" color="grey" v-close-popup flat />
              <q-btn :label="esEdicion ? 'Actualizar' : 'Crear'" color="primary" type="submit" :loading="guardando" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Diálogo de confirmación para eliminar -->
    <q-dialog v-model="mostrarConfirmacionEliminar">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">¿Estás seguro de eliminar esta ubicación?</span>
        </q-card-section>

        <q-card-section>
          <div class="text-weight-medium">"{{ ubicacionAEliminar?.nombre }}"</div>
          <div class="text-caption text-grey">Esta acción no se puede deshacer</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="eliminarUbicacion" :loading="eliminando" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'

// Instalar Leaflet primero: npm install leaflet
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const $q = useQuasar()

// Estado reactivo
const cargando = ref(false)
const guardando = ref(false)
const eliminando = ref(false)
const mostrarDialogo = ref(false)
const mostrarConfirmacionEliminar = ref(false)
const esEdicion = ref(false)
const ubicacionSeleccionada = ref(false)
const ubicacionSeleccionadaLista = ref(null)
const mapContainer = ref(null)

// Variables para Leaflet
let map = null
let markers = []
let selectedMarker = null

// Datos
const ubicaciones = ref([])
const ubicacionEditando = ref(null)
const ubicacionAEliminar = ref(null)

// Formulario
const formulario = reactive({
  nombre: '',
  descripcion: '',
  capacidad: 1,
  equipado: false,
  estado: true,
  latitud: null,
  longitud: null
})

// Fix para iconos de Leaflet (problema común con Webpack)
const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

// Inicializar mapa
const inicializarMapa = async () => {
  await nextTick()
  fixLeafletIcons()

  // Centro por defecto (Lima, Perú)
  const defaultCenter = [-12.046374, -77.042793]

  map = L.map(mapContainer.value).setView(defaultCenter, 12)

  // Capa de OpenStreetMap - COMPLETAMENTE GRATIS
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map)

  // Listener para clicks en el mapa
  map.on('click', (event) => {
    seleccionarUbicacionEnMapa(event.latlng)
  })

  // Cargar ubicaciones existentes
  cargarUbicaciones()
}

const seleccionarUbicacionEnMapa = (latlng) => {
  // Limpiar marcador anterior
  if (selectedMarker) {
    map.removeLayer(selectedMarker)
  }

  // Crear nuevo marcador de selección (azul)
  selectedMarker = L.marker(latlng, {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    zIndexOffset: 1000
  }).addTo(map)

  // Agregar popup al marcador seleccionado
  selectedMarker.bindPopup('📍 Ubicación seleccionada').openPopup()

  // Actualizar formulario con coordenadas
  formulario.latitud = latlng.lat
  formulario.longitud = latlng.lng
  ubicacionSeleccionada.value = true

  // Centrar mapa en la ubicación seleccionada
  map.setView(latlng, 15)
}

const cargarUbicaciones = async () => {
  cargando.value = true
  try {
    // Simular llamada a API - reemplaza con tu endpoint real
    const response = await simularApiCall([
      {
        id: 1,
        nombre: 'Cancha Central',
        descripcion: 'Cancha principal de fútbol con césped natural',
        capacidad: 50,
        equipado: true,
        estado: true,
        latitud: -12.046374,
        longitud: -77.042793
      },
      {
        id: 2,
        nombre: 'Gimnasio Polideportivo',
        descripcion: 'Gimnasio para múltiples deportes indoor',
        capacidad: 100,
        equipado: true,
        estado: true,
        latitud: -12.056374,
        longitud: -77.032793
      },
      {
        id: 3,
        nombre: 'Piscina Olímpica',
        descripcion: 'Piscina semiolímpica para entrenamiento',
        capacidad: 30,
        equipado: false,
        estado: false,
        latitud: -12.036374,
        longitud: -77.052793
      }
    ])

    ubicaciones.value = response.data
    marcarUbicacionesEnMapa()
  } catch (error) {
    console.error('Error cargando ubicaciones:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar las ubicaciones',
      position: 'top'
    })
  } finally {
    cargando.value = false
  }
}

const marcarUbicacionesEnMapa = () => {
  // Limpiar marcadores anteriores (excepto el seleccionado)
  markers.forEach(marker => {
    if (marker !== selectedMarker) {
      map.removeLayer(marker)
    }
  })
  markers = selectedMarker ? [selectedMarker] : []

  // Crear marcadores para cada ubicación
  ubicaciones.value.forEach(ubicacion => {
    if (ubicacion.latitud && ubicacion.longitud) {
      const iconColor = ubicacion.estado ? 'green' : 'red'

      const marker = L.marker([ubicacion.latitud, ubicacion.longitud], {
        icon: L.icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map)

      // Popup con información
      const popupContent = `
        <div style="min-width: 200px">
          <strong>${ubicacion.nombre}</strong><br/>
          <small>${ubicacion.descripcion}</small><br/>
          <small>🏟 Capacidad: ${ubicacion.capacidad} personas</small><br/>
          <small>${ubicacion.equipado ? '✅ Equipado' : '❌ No equipado'}</small><br/>
          <small>Estado: <strong>${ubicacion.estado ? '🟢 Activo' : '🔴 Inactivo'}</strong></small>
        </div>
      `

      marker.bindPopup(popupContent)

      // Evento click para centrar y destacar
      marker.on('click', () => {
        ubicacionSeleccionadaLista.value = ubicacion.id
        map.setView([ubicacion.latitud, ubicacion.longitud], 15)
      })

      markers.push(marker)
    }
  })
}

const centrarEnUbicacion = (ubicacion) => {
  if (ubicacion.latitud && ubicacion.longitud) {
    ubicacionSeleccionadaLista.value = ubicacion.id
    map.setView([ubicacion.latitud, ubicacion.longitud], 15)

    // Abrir popup del marcador
    markers.forEach(marker => {
      const latLng = marker.getLatLng()
      if (latLng.lat === ubicacion.latitud && latLng.lng === ubicacion.longitud) {
        marker.openPopup()
      }
    })
  }
}

const mostrarDialogoNuevo = () => {
  esEdicion.value = false
  ubicacionEditando.value = null
  Object.assign(formulario, {
    nombre: '',
    descripcion: '',
    capacidad: 1,
    equipado: false,
    estado: true
    // latitud y longitud ya están establecidas desde el mapa
  })
  mostrarDialogo.value = true
}

const editarUbicacion = (ubicacion) => {
  esEdicion.value = true
  ubicacionEditando.value = ubicacion
  Object.assign(formulario, {
    nombre: ubicacion.nombre,
    descripcion: ubicacion.descripcion,
    capacidad: ubicacion.capacidad,
    equipado: ubicacion.equipado,
    estado: ubicacion.estado,
    latitud: ubicacion.latitud,
    longitud: ubicacion.longitud
  })

  // Centrar en la ubicación editada
  if (ubicacion.latitud && ubicacion.longitud) {
    map.setView([ubicacion.latitud, ubicacion.longitud], 15)
  }

  mostrarDialogo.value = true
}

const guardarUbicacion = async () => {
  guardando.value = true
  try {
    console.log('formulario de ubicacion', formulario);

    if (esEdicion.value) {
      // Actualizar ubicación existente
      await simularApiCall({ ...formulario, id: ubicacionEditando.value.id })
      $q.notify({
        type: 'positive',
        message: 'Ubicación actualizada correctamente',
        position: 'top'
      })
    } else {
      // Crear nueva ubicación
      await simularApiCall({ ...formulario, id: Date.now() })
      $q.notify({
        type: 'positive',
        message: 'Ubicación creada correctamente',
        position: 'top'
      })

      // Limpiar selección del mapa
      if (selectedMarker) {
        map.removeLayer(selectedMarker)
        selectedMarker = null
      }
      ubicacionSeleccionada.value = false
    }

    mostrarDialogo.value = false
    await cargarUbicaciones() // Recargar la lista y marcadores
  } catch (error) {
    console.error('Error guardando ubicación:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar la ubicación',
      position: 'top'
    })
  } finally {
    guardando.value = false
  }
}

const confirmarEliminacion = (ubicacion) => {
  ubicacionAEliminar.value = ubicacion
  mostrarConfirmacionEliminar.value = true
}

const eliminarUbicacion = async () => {
  eliminando.value = true
  try {
    await simularApiCall(null)
    $q.notify({
      type: 'positive',
      message: 'Ubicación eliminada correctamente',
      position: 'top'
    })
    mostrarConfirmacionEliminar.value = false
    await cargarUbicaciones() // Recargar para actualizar marcadores
  } catch (error) {
    console.error('Error eliminando ubicación:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al eliminar la ubicación',
      position: 'top'
    })
  } finally {
    eliminando.value = false
    ubicacionAEliminar.value = null
  }
}

const toggleEstado = async (ubicacion) => {
  try {
    const nuevoEstado = !ubicacion.estado
    await simularApiCall({ estado: nuevoEstado })

    $q.notify({
      type: 'positive',
      message: `Ubicación ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`,
      position: 'top'
    })

    await cargarUbicaciones() // Recargar para actualizar marcadores
  } catch (error) {
    console.error('Error cambiando estado:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cambiar el estado',
      position: 'top'
    })
  }
}

// Simulación de API
const simularApiCall = (data, delay = 800) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data })
    }, delay)
  })
}

// Lifecycle hooks
onMounted(() => {
  inicializarMapa()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<style scoped>
.map-container {
  height: 600px;
  width: 100%;
  border-radius: 8px;
  z-index: 1;
}

.sticky-card {
  position: sticky;
  top: 20px;
  max-height: 600px;
  overflow-y: auto;
}

.q-item {
  border-radius: 8px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.q-item:hover {
  background-color: #f5f5f5;
  transform: translateY(-1px);
  border-left-color: var(--q-primary);
}

/* Mejoras para Leaflet */
:deep(.leaflet-popup-content) {
  margin: 12px 15px;
  line-height: 1.4;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .map-container {
    height: 400px;
  }

  .sticky-card {
    position: relative;
    top: 0;
  }
}
</style>
