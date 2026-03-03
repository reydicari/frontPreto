<template>
  <q-page class="q-pa-md page-container" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <div class="row items-center justify-between q-mb-lg page-header">
      <div class="header-content">
        <div class="header-title">
          <q-icon name="inventory_2" size="42px" class="q-mr-sm" />
          <h4 class="page-title">Paquetes</h4>
        </div>
        <p class="header-subtitle">Crea y gestiona paquetes educativos con horarios personalizados</p>
      </div>

    </div>

    <!-- Filtros y Botón -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row q-gutter-sm items-center col-auto">
        <q-select v-model="estadoFilter" :options="[
          { label: 'Activos', value: true },
          { label: 'Todos', value: null },
          { label: 'Inactivos', value: false }
        ]" option-label="label" option-value="value" emit-value map-options dense outlined style="min-width: 120px;"
          label="Estado">
          <template v-slot:prepend>
            <q-icon name="filter_list" />
          </template>
        </q-select>

        <q-input v-model="nameFilter" dense outlined placeholder="Buscar por nombre" debounce="300"
          style="min-width: 200px;">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select v-model="orderOption" :options="[
          { label: 'Por precio', value: 'precio' },
          { label: 'Por horarios', value: 'horarios' }
        ]" option-label="label" option-value="value" emit-value map-options dense outlined clearable label="Ordenar"
          style="min-width: 150px;">
          <template v-slot:prepend>
            <q-icon name="sort" />
          </template>
        </q-select>
      </div>

      <q-btn unelevated rounded icon="add_circle" label="Nuevo Paquete" color="teal-8" size="md" @click="openAddDialog"
        class="btn-add-package" />
    </div>

    <!-- Grid de paquetes -->
    <div class="paquetes-grid">
      <q-card v-for="(pkg, index) in filteredList" :key="pkg.id" class="paquete-card"
        :style="{ animationDelay: (index * 50) + 'ms' }">
        <div class="card-ribbon" :class="pkg.estado ? 'ribbon-active' : 'ribbon-inactive'">
          {{ pkg.estado ? 'ACTIVO' : 'INACTIVO' }}
        </div>

        <q-card-section class="card-header">
          <div class="package-title">
            <q-icon name="inventory_2" size="24px" class="title-icon" />
            <span>{{ pkg.nombre }}</span>
          </div>
          <div class="package-meta">
            <q-chip size="sm" class="chip-disciplina" dense icon="sports_soccer">
              {{ getDisciplinaName(pkg.id_disciplina) }}
            </q-chip>
            <q-chip size="sm" class="chip-nivel" dense icon="school">
              {{ getNivelName(pkg.id_nivel) }}
            </q-chip>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <q-icon name="people" class="info-icon text-teal-7" size="20px" />
              <div class="info-content">
                <div class="info-label">Edad</div>
                <div class="info-value">{{ pkg.edad_minima }}-{{ pkg.edad_maxima }} años</div>
              </div>
            </div>

            <div class="info-item">
              <q-icon name="group" class="info-icon text-green-7" size="20px" />
              <div class="info-content">
                <div class="info-label">Cupo</div>
                <div class="info-value">{{ pkg.max_estudiantes }}</div>
              </div>
            </div>

            <div class="info-item">
              <q-icon name="payments" class="info-icon text-green-8" size="20px" />
              <div class="info-content">
                <div class="info-label">Mensualidad</div>
                <div class="info-value">Bs {{ pkg.mensualidad }}</div>
              </div>
            </div>

            <div class="info-item">
              <q-icon name="receipt" class="info-icon text-light-green-7" size="20px" />
              <div class="info-content">
                <div class="info-label">Registro</div>
                <div class="info-value">Bs {{ pkg.costo_registro }}</div>
              </div>
            </div>
          </div>

          <div class="date-range q-mt-sm">
            <div class="date-item">
              <q-icon name="event" size="16px" class="text-green-6" />
              <span>{{ formatDate(pkg.fecha_inicio) }}</span>
            </div>
            <q-icon name="arrow_forward" size="14px" class="text-grey-5" />
            <div class="date-item">
              <q-icon name="event_busy" size="16px" class="text-teal-6" />
              <span>{{ formatDate(pkg.fecha_vencimiento) || '—' }}</span>
            </div>
          </div>

          <q-chip v-if="pkg.materiales" size="sm" class="chip-materiales-si q-mt-sm" icon="inventory" dense>
            Materiales
          </q-chip>
        </q-card-section>

        <q-separator />

        <q-card-section class="card-actions">
          <div class="action-buttons">
            <q-btn class="btn-edit-card" round icon="edit" @click.stop="editPackage(pkg)"
              :disable="!canEditPackage(pkg)">
              <q-tooltip v-if="!canEditPackage(pkg)">No se puede editar: horarios con errores</q-tooltip>
              <q-tooltip v-else>Editar paquete</q-tooltip>
            </q-btn>
            <q-btn v-if="pkg.estado" class="btn-delete-card" round icon="delete_forever"
              @click.stop.prevent="openDeleteDialog(pkg)">
              <q-tooltip>Desactivar paquete</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="card-horarios">
          <div class="horarios-title">
            <q-icon name="schedule" size="20px" />
            <span>Horarios</span>
            <q-badge class="horarios-count">{{ pkg.horarios?.length || 0 }}</q-badge>
          </div>
          <div class="horarios-list">
            <div v-for="(h, hIndex) in pkg.horarios" :key="h.id" class="horario-chip-modern"
              :class="`horario-color-${hIndex % 6}`" @click.stop.prevent="openHorarioDialog(pkg.id, h)">
              <div class="horario-day">{{ getDiaLabel(h.dia) }}</div>
              <div class="horario-time">
                <q-icon name="access_time" size="14px" />
                {{ h.hora_inicio }} - {{ h.hora_fin }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Paquete Dialog -->
    <PaqueteDialog v-model="paqueteDialogOpen" :editing-package="editingPaquete" :discipline-options="disciplineOptions"
      :nivel-options="nivelOptions" :dias-options="diasOptions" :paquetes="paquetes" @save="onPaqueteDialogSave" />

    <!-- Horario dialog -->
    <HorarioDialog v-model="horarioDialogOpen" :horario="editingHorario" :dias-options="diasOptions"
      @save="onSaveHorario" @remove="onRemoveHorario" />

    <!-- Delete dialog -->
    <q-dialog v-model="deleteDialogOpen" persistent>
      <q-card style="min-width: 320px; max-width: 560px;">
        <q-card-section class="row items-center">
          <q-avatar size="56px" class="bg-negative text-white">
            <q-icon name="delete_forever" />
          </q-avatar>
          <div class="col q-pl-sm">
            <div class="text-h6">Confirmar desactivación</div>
            <div class="text-subtitle2 q-pt-xs">
              ¿Deseas desactivar el paquete <strong>{{ paqueteToDelete ? paqueteToDelete.nombre : '' }}</strong>?
              <br><small class="text-grey-7">Para reactivarlo, deberás editarlo y cambiar su estado.</small>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" @click="cancelDelete" />
          <q-btn flat label="Desactivar" color="negative" @click="doConfirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { listarDisciplinas } from 'src/stores/disciplina-store'
import { listarNiveles } from 'src/stores/nivel'
import { actualizarPaquete, crearPaquete, eliminarPaquete, listarPaquetes } from 'src/stores/paquete-store'
import { onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import PaqueteDialog from './PaqueteDialog.vue'
import HorarioDialog from './HorarioDialog.vue'
const $q = useQuasar();

const today = new Date().toISOString().slice(0, 10)

const paquetes = ref([])

// Dialog state
const paqueteDialogOpen = ref(false)
const editingPaquete = ref(null)

// filtros y orden
const estadoFilter = ref(true) // por defecto mostrar solo activos
const nameFilter = ref('')
const orderOption = ref(null) // 'precio' | 'horarios' | null

// filtered list managed via watch (reactive array)
const filteredList = ref([])

const parseEstado = (v) => {
  if (v === null || v === undefined) return null
  if (v === true || v === 'true') return true
  if (v === false || v === 'false') return false
  return null
}

const applyFilters = () => {
  let list = Array.isArray(paquetes.value) ? paquetes.value.slice() : []
  const estadoVal = parseEstado(estadoFilter.value)
  if (estadoVal !== null) {
    list = list.filter(p => {
      const pe = p && (p.estado === true || p.estado === false) ? p.estado : !!p.estado
      return pe === estadoVal
    })
  }

  if (nameFilter.value && nameFilter.value.trim() !== '') {
    const q = nameFilter.value.trim().toLowerCase()
    list = list.filter(p => (p.nombre || '').toLowerCase().includes(q))
  }

  if (orderOption.value === 'precio') {
    list.sort((a, b) => (Number(b.mensualidad) || 0) - (Number(a.mensualidad) || 0))
  } else if (orderOption.value === 'horarios') {
    list.sort((a, b) => ((b.horarios || []).length) - ((a.horarios || []).length))
  }

  filteredList.value = list
}

// re-aplicar filtros cuando cambien los criterios o la fuente
watch([estadoFilter, nameFilter, orderOption, paquetes], () => {
  applyFilters()
}, { immediate: true })

// Opciones de datos
const disciplineOptions = ref([])
const nivelOptions = ref([])
const diasOptions = ref([
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
  { label: 'Domingo', value: 7 }
])
onMounted(async () => {
  // paquetes.value = await listarPaquetes()
  disciplineOptions.value = await listarDisciplinas()
  const niveles = await listarNiveles({ estado: true })
  nivelOptions.value = niveles.map(n => ({ label: n.nombre_nivel, value: n.id }))
  listar()
})
const listar = async () => {
  paquetes.value = await listarPaquetes()
}

const openAddDialog = () => {
  editingPaquete.value = null
  paqueteDialogOpen.value = true
}

const onPaqueteDialogSave = async (packageData) => {
  try {
    if (packageData.id) {
      await actualizarPaquete(packageData)
    } else {
      packageData.fecha_creacion = today
      await crearPaquete(packageData)
    }
    await listar()
    $q.notify({ type: 'positive', message: 'Paquete guardado exitosamente', position: 'top' })
  } catch (err) {
    console.error('Error al guardar paquete:', err)
    $q.notify({ type: 'negative', message: 'Error al guardar el paquete', position: 'top' })
  }
}



const editPackage = (pkg) => {
  editingPaquete.value = JSON.parse(JSON.stringify(pkg))
  paqueteDialogOpen.value = true
}

const getDisciplinaName = (id) => {
  const d = disciplineOptions.value.find(x => x.id === id)
  return d ? d.nombre : 'Sin disciplina'
}

const getNivelName = (id) => {
  if (id == null || nivelOptions.value == null) return 'Sin nivel'
  const n = nivelOptions.value.find(x => x.value === id || x.value == id)
  return n ? n.label : 'Sin nivel'
}

const formatDate = (d) => {
  if (!d) return ''
  // expect YYYY-MM-DD; try to be permissive
  try {
    const t = new Date(d)
    if (isNaN(t.getTime())) return d
    return t.toLocaleDateString()
  } catch {
    return d
  }
}

const getDiaLabel = (v) => {
  const d = diasOptions.value.find(x => x.value == v)
  return d ? d.label : ''
}

// Horario dialog state & handlers
const horarioDialogOpen = ref(false)
const editingHorario = ref(null)
const editingHorarioPaqueteId = ref(null)

const openHorarioDialog = (paqueteId, horario) => {
  editingHorarioPaqueteId.value = paqueteId
  // clone to avoid mutating until saved
  editingHorario.value = horario ? JSON.parse(JSON.stringify(horario)) : { id: Date.now(), dia: 1, hora_inicio: '08:00', hora_fin: '09:00', estado: true }
  horarioDialogOpen.value = true
}

const onSaveHorario = async (h) => {
  const pkgIdx = paquetes.value.findIndex(p => p.id === editingHorarioPaqueteId.value)
  if (pkgIdx === -1) return
  const pkg = paquetes.value[pkgIdx]
  const idx = pkg.horarios.findIndex(x => x.id === h.id)
  if (idx === -1) {
    pkg.horarios.push(h)
  } else {
    pkg.horarios.splice(idx, 1, h)
  }
  try {
    await actualizarPaquete(pkg)
    await listar()
    $q.notify({ type: 'positive', message: 'Horario guardado', position: 'top' })
  } catch (err) {
    console.error('Error al guardar horario:', err)
    $q.notify({ type: 'negative', message: 'Error al guardar el horario', position: 'top' })
  }
  horarioDialogOpen.value = false
}

const onRemoveHorario = async (h) => {
  const pkgIdx = paquetes.value.findIndex(p => p.id === editingHorarioPaqueteId.value)
  if (pkgIdx === -1) return
  const pkg = paquetes.value[pkgIdx]
  pkg.horarios = pkg.horarios.filter(x => x.id !== h.id)
  try {
    await actualizarPaquete(pkg)
    await listar()
    $q.notify({ type: 'positive', message: 'Horario eliminado', position: 'top' })
  } catch (err) {
    console.error('Error al eliminar horario:', err)
    $q.notify({ type: 'negative', message: 'Error al eliminar el horario', position: 'top' })
  }
  horarioDialogOpen.value = false
}



// Confirmación de eliminación
const deleteDialogOpen = ref(false)
const paqueteToDelete = ref(null)

const openDeleteDialog = (pkg) => {
  paqueteToDelete.value = pkg
  deleteDialogOpen.value = true
}

const cancelDelete = () => {
  deleteDialogOpen.value = false
  paqueteToDelete.value = null
}

const doConfirmDelete = async () => {
  if (!paqueteToDelete.value) return

  // Solo desactivar (eliminar lógicamente)
  await eliminarPaquete(paqueteToDelete.value.id)

  await listar()
  deleteDialogOpen.value = false
  paqueteToDelete.value = null
}

// Detectar duplicidad de disciplina+nivel: si existe otro paquete con misma disciplina y mismo nivel
const hasDuplicateDisciplina = (pkg) => {
  if (!pkg || pkg.id_disciplina == null) return false
  return paquetes.value.some(p => p.id !== pkg.id && p.id_disciplina === pkg.id_disciplina && (p.id_nivel == pkg.id_nivel))
}

// Determina si el paquete puede editarse: no debe tener horarios con mensajes de error ni duplicidad de disciplina
const canEditPackage = (pkg) => {
  if (!pkg) return false
  const hasHorarioErrors = pkg.horarios && pkg.horarios.some(h => h._invalidMessage && h._invalidMessage.length > 0)
  const duplicate = hasDuplicateDisciplina(pkg)
  return !hasHorarioErrors && !duplicate
}


</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

/* Paleta de colores verdosa unificada - Limpia y profesional */
$color-primary: #1b5e20;
$color-primary-light: #2e7d32;
$color-primary-medium: #43a047;
$color-accent: #558b2f;
$color-accent-light: #7cb342;
$color-highlight: #ef6c00;

// Fondos y superficies
$bg-light: #f5f7fa;
$bg-surface: #ffffff;
$bg-hover: #e8f5e9;
$border-color: rgba(27, 94, 32, 0.12);

/* Animaciones suaves */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
  }
}

/* Layout principal */
.page-container {
  animation: fadeIn 0.5s ease;
  background: linear-gradient(to bottom, $bg-light 0%, #e8f5e9 100%);
}

.body--dark .page-container {
  background: $grey-10;
}

/* Header */
.page-header {
  animation: slideDown 0.6s ease;
}

.header-content {
  flex: 1;
}

.header-title {
  display: flex;
  align-items: center;
  color: $color-primary;

  .q-icon {
    color: $color-primary;
  }
}

.page-title {
  font-size: 2.5em;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  color: $color-primary;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
}

.header-subtitle {
  color: #546e7a;
  font-size: 1.1em;
  margin: 8px 0 0 0;
  font-weight: 500;
}

/* Botón nuevo paquete */
.btn-add-package {
  font-weight: 700;
  padding: 10px 24px;
  background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
  box-shadow: 0 4px 16px rgba(27, 94, 32, 0.3);
  transition: all 0.3s ease;
}

.btn-add-package:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(27, 94, 32, 0.4);
}

/* Grid de paquetes */
.paquetes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  animation: fadeIn 0.8s ease;
}

@media (max-width: 599px) {
  .paquetes-grid {
    grid-template-columns: 1fr;
  }
}

/* Tarjetas de paquetes - Diseño limpio */
.paquete-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid $border-color;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  opacity: 0;
  animation: cardFadeIn 0.6s ease forwards;
  background: $bg-surface;
}

.body--dark .paquete-card {
  background: $grey-9;
  border-color: rgba(67, 160, 71, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.paquete-card:hover {
  transform: translateY(-4px);
  border-color: $color-primary-light;
  box-shadow: 0 8px 24px rgba(27, 94, 32, 0.15);
}

.body--dark .paquete-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

/* Ribbon de estado */
.card-ribbon {
  position: absolute;
  top: 12px;
  right: -28px;
  padding: 4px 36px;
  font-size: 0.65em;
  font-weight: 700;
  letter-spacing: 0.5px;
  transform: rotate(45deg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.ribbon-active {
  background: $color-primary-medium;
  color: white;
}

.ribbon-inactive {
  background: #757575;
  color: white;
}

/* Header de la card */
.card-header {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  padding: 14px 16px;
  border-bottom: 1px solid $border-color;
}

.body--dark .card-header {
  background: rgba(27, 94, 32, 0.12);
  border-bottom-color: rgba(67, 160, 71, 0.2);
}

.package-title {
  display: flex;
  align-items: center;
  font-size: 1.15em;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: 8px;
}

.body--dark .package-title {
  color: $color-accent-light;
}

.title-icon {
  margin-right: 8px;
  color: $color-primary-light;
}

.package-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-disciplina {
  background: $color-primary-light;
  color: white;
  font-weight: 600;
  font-size: 0.75em;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(27, 94, 32, 0.2);
}

.chip-nivel {
  background: $color-accent;
  color: white;
  font-weight: 600;
  font-size: 0.75em;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(85, 139, 47, 0.2);
}

/* Body de la card */
.card-body {
  padding: 14px 16px;
  background: $bg-surface;
}

.body--dark .card-body {
  background: $grey-9;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: $bg-hover;
  border-radius: 8px;
  transition: all 0.3s ease;
  border-left: 3px solid $color-primary-light;
}

.info-item:hover {
  background: #c8e6c9;
  transform: translateX(2px);
}

.body--dark .info-item {
  background: rgba(27, 94, 32, 0.1);
  border-left-color: $color-primary-medium;
}

.body--dark .info-item:hover {
  background: rgba(27, 94, 32, 0.2);
}

.info-icon {
  font-size: 20px;
  color: $color-primary-light;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: 0.7em;
  color: #607d8b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1;
}

.body--dark .info-label {
  color: #90a4ae;
}

.info-value {
  font-size: 0.9em;
  font-weight: 700;
  color: #263238;
  margin-top: 2px;
  line-height: 1.2;
}

.body--dark .info-value {
  color: #cfd8dc;
}

/* Rango de fechas */
.date-range {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: $bg-hover;
  border-radius: 8px;
  border-left: 3px solid $color-accent;
  margin-top: 10px;
}

.body--dark .date-range {
  background: rgba(85, 139, 47, 0.12);
  border-left-color: $color-accent-light;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75em;
  font-weight: 600;
  color: #37474f;
}

.body--dark .date-item {
  color: #b0bec5;
}

/* Badge de materiales */
.materials-badge {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.chip-materiales-si {
  background: $color-primary-medium;
  color: white;
  font-weight: 600;
  font-size: 0.75em;
  padding: 4px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(67, 160, 71, 0.2);
}

.chip-materiales-no {
  background: #e0e0e0;
  color: #616161;
  font-weight: 600;
  font-size: 0.75em;
  padding: 4px 12px;
  border-radius: 12px;
}

/* Acciones de la card */
.card-actions {
  background: #fafafa;
  padding: 12px 16px;
  border-top: 1px solid $border-color;
}

.body--dark .card-actions {
  background: rgba(0, 0, 0, 0.2);
  border-top-color: rgba(67, 160, 71, 0.2);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-edit-card {
  background: $color-primary-light;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(46, 125, 50, 0.3);
}

.btn-edit-card:hover {
  background: $color-primary;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(27, 94, 32, 0.4);
}

.btn-delete-card {
  background: #d32f2f;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(211, 47, 47, 0.3);
}

.btn-delete-card:hover {
  background: #b71c1c;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(183, 28, 28, 0.4);
}

/* Sección de horarios */
.card-horarios {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  padding: 12px 16px;
  border-top: 2px solid $color-primary-light;
}

.body--dark .card-horarios {
  background: rgba(27, 94, 32, 0.12);
  border-top-color: $color-primary-medium;
}

.horarios-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 0.9em;
  color: $color-primary;
  margin-bottom: 10px;
}

.body--dark .horarios-title {
  color: $color-accent-light;
}

.horarios-count {
  background: $color-primary-light;
  color: white;
  font-weight: 700;
  font-size: 0.7em;
  padding: 2px 8px;
  border-radius: 10px;
}

.horarios-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.horario-chip-modern {
  padding: 8px 12px;
  border-radius: 8px;
  background: white;
  border-left: 3px solid $color-primary-light;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  min-width: 110px;
}

.horario-chip-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(27, 94, 32, 0.15);
  background: $bg-hover;
}

.body--dark .horario-chip-modern {
  background: rgba(27, 94, 32, 0.15);
  border-left-color: $color-accent-light;
}

.horario-day {
  font-weight: 700;
  font-size: 0.75em;
  color: $color-primary;
  margin-bottom: 2px;
  line-height: 1;
}

.body--dark .horario-day {
  color: $color-accent-light;
}

.horario-time {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7em;
  color: #546e7a;
  font-weight: 600;
  line-height: 1;
}

.body--dark .horario-time {
  color: #90a4ae;
}

/* Variación de colores para horarios (sutil) */
.horario-color-0 {
  border-left-color: #1b5e20;
}

.horario-color-1 {
  border-left-color: #2e7d32;
}

.horario-color-2 {
  border-left-color: #43a047;
}

.horario-color-3 {
  border-left-color: #558b2f;
}

.horario-color-4 {
  border-left-color: #689f38;
}

.horario-color-5 {
  border-left-color: #7cb342;
}

/* Responsive */
@media (max-width: 959px) {
  .page-title {
    font-size: 2em;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.6em;
  }

  .header-subtitle {
    font-size: 0.95em;
  }

  .horarios-list {
    flex-direction: column;
  }

  .horario-chip-modern {
    width: 100%;
  }

  .action-buttons {
    justify-content: center;
  }
}

/* Modo oscuro mejorado */
.body--dark .info-icon {
  color: $color-accent-light;
}

.body--dark .horario-chip-modern:hover {
  background: rgba(27, 94, 32, 0.25);
}
</style>
