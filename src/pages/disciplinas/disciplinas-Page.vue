<template>
  <q-page class="disciplines-page">
    <!-- Header con título y estadísticas integradas -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title-section">
          <div class="row items-center">
            <div class="col-12 col-sm-auto">
              <q-icon name="sports" size="48px" class="page-icon" />
              <h1 class="page-title">Gestión de Disciplinas</h1>
              <p class="header-subtitle">Administra disciplinas y paquetes deportivos</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="statistics-section">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <div class="stat-card stat-card-total">
            <div class="stat-content">
              <div class="stat-label">Total Disciplinas</div>
              <div class="stat-value">{{ disciplines.length }}</div>
            </div>
            <q-icon name="sports_soccer" class="stat-icon" />
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="stat-card stat-card-active">
            <div class="stat-content">
              <div class="stat-label">Activas</div>
              <div class="stat-value">{{ activeCount }}</div>
            </div>
            <q-icon name="check_circle" class="stat-icon" />
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="stat-card stat-card-students">
            <div class="stat-content">
              <div class="stat-label">Total Estudiantes</div>
              <div class="stat-value">{{ totalStudents }}</div>
            </div>
            <q-icon name="groups" class="stat-icon" />
          </div>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="stat-card stat-card-popular">
            <div class="stat-content">
              <div class="stat-label">Más Popular</div>
              <div class="stat-value">{{ mostPopularDiscipline?.nombre || '-' }}</div>
            </div>
            <q-icon name="trending_up" class="stat-icon" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-header" @click="showFilters = !showFilters">
        <div class="filters-title">
          <q-icon name="filter_list" size="20px" />
          <span>Filtros</span>
          <q-badge v-if="filterStatus !== null" :label="1" color="orange-7" class="q-ml-sm" />
        </div>
        <q-icon :name="showFilters ? 'expand_less' : 'expand_more'" size="24px" />
      </div>

      <q-slide-transition>
        <div v-show="showFilters" class="filters-content">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4">
              <q-select label="Ver por estados" emit-value map-options dense outlined v-model="filterStatus"
                :options="statusOptions" option-label="label" option-value="value" clearable class="filter-input">
                <template v-slot:prepend>
                  <q-icon name="toggle_on" color="green-7" />
                </template>
              </q-select>
            </div>
          </div>
        </div>
      </q-slide-transition>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Formulario estático (izquierda) -->
      <div class="col-12 col-lg-5">
        <q-card class="form-card">
          <q-card-section class="form-header">
            <div class="form-title">
              <q-icon :name="editing ? 'edit' : 'add_circle'" size="28px" class="q-mr-sm" />
              <div class="text-h6">{{ editing ? 'Editar Disciplina' : 'Nueva Disciplina' }}</div>
            </div>
          </q-card-section>

          <q-separator class="separator-gradient" />

          <q-card-section class="form-body">

            <q-form ref="formRef" @submit.prevent="onSubmit">
              <q-input v-model="form.nombre" label="Nombre de la disciplina *" outlined dense
                :rules="[val => !!val || 'Nombre requerido']" hint="Ej: Fútbol, Natación, Karate" autofocus
                class="form-input">
                <template v-slot:prepend>
                  <q-icon name="label" color="green-7" />
                </template>
              </q-input>

              <div class="q-mt-md">
                <div class="icon-selector-label">
                  <q-icon name="interests" size="20px" color="orange-7" />
                  <span>Selecciona un Icono</span>
                </div>
                <div class="icon-grid">
                  <q-btn v-for="icon in iconOptions" :key="icon" :flat="form.icono !== icon"
                    :unelevated="form.icono === icon" size="lg" round
                    :class="{ 'icon-btn-selected': form.icono === icon, 'icon-btn': true }"
                    @click.prevent="form.icono = icon">
                    <q-icon :name="icon" size="28px" />
                  </q-btn>
                </div>
                <div class="icon-hint">El icono representa visualmente la disciplina</div>
              </div>

              <div class="q-mt-md estado-section">
                <q-toggle v-model="form.estado" color="green-7" :label="form.estado ? 'Activa' : 'Inactiva'" left-label
                  class="estado-toggle">
                  <template v-slot:default>
                    <div class="row items-center no-wrap">
                      <q-icon :name="form.estado ? 'check_circle' : 'cancel'" :color="form.estado ? 'positive' : 'grey'"
                        size="20px" class="q-mr-sm" />
                      <span>{{ form.estado ? 'Activa' : 'Inactiva' }}</span>
                    </div>
                  </template>
                </q-toggle>
              </div>

              <div class="form-actions">
                <q-btn flat label="Limpiar" color="negative" icon="clear" @click="resetForm" class="btn-clear" />
                <q-btn :label="editing ? 'Actualizar' : 'Guardar'" :icon="editing ? 'update' : 'save'"
                  class="btn-submit" @click="onSubmit" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lista (derecha) -->
      <div class="col-12 col-lg-7">
        <div class="disciplines-list">
          <div v-for="discipline in filteredDisciplines" :key="discipline.id" class="discipline-card">
            <div class="card-header">
              <div class="card-icon-container">
                <q-avatar size="64px" class="discipline-avatar">
                  <q-icon :name="discipline.icono || 'sports'" size="36px" />
                </q-avatar>
              </div>

              <div class="card-info" @click="viewDiscipline(discipline.id)">
                <div class="discipline-name">{{ discipline.nombre }}</div>
                <div class="discipline-students">
                  <q-icon name="groups" size="18px" />
                  <span>{{ countStudents(discipline) }} estudiantes inscritos</span>
                </div>
              </div>

              <div class="card-status">
                <q-badge :color="discipline.estado ? 'positive' : 'grey-7'"
                  :label="discipline.estado ? 'Activa' : 'Inactiva'" class="status-badge" />
              </div>
            </div>

            <div class="card-footer">
              <q-btn flat dense icon="visibility" color="green-7" @click.stop="viewDiscipline(discipline.id)">
                <q-tooltip>Ver detalles</q-tooltip>
              </q-btn>

              <q-btn flat dense icon="edit" color="orange-7" @click.stop="editDiscipline(discipline)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-toggle dense :model-value="discipline.estado" @update:model-value="confirmToggle(discipline, $event)"
                @click.stop color="green-7" class="status-toggle">
                <q-tooltip>{{ discipline.estado ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-toggle>
            </div>
          </div>

          <div v-if="filteredDisciplines.length === 0" class="no-results">
            <q-icon name="sports" size="64px" color="grey-5" />
            <p>No se encontraron disciplinas</p>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { agregarDisciplina, cambiarEstado, listarDisciplinas, modificarDisciplina } from 'src/stores/disciplina-store';
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const router = useRouter();
const $q = useQuasar();

const editing = ref(false);
const form = ref({ id: null, nombre: '', icono: '', estado: true });
const formRef = ref(null)
const inscripciones = ref([])
const showFilters = ref(false)

// filtro de estado en el header
const filterStatus = ref(null)
const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Activos', value: true },
  { label: 'Inactivos', value: false }
]

const disciplines = ref([]);

const filteredDisciplines = computed(() => {
  if (!disciplines.value) return []
  if (filterStatus.value === null) return disciplines.value
  return disciplines.value.filter(d => Boolean(d.estado) === filterStatus.value)
})

const totalStudents = computed(() => inscripciones.value.length)

const mostPopularDiscipline = computed(() => {
  if (!disciplines.value || disciplines.value.length === 0) return null

  const disciplineWithCounts = disciplines.value.map(d => ({
    ...d,
    studentCount: countStudents(d)
  }))

  return disciplineWithCounts.reduce((max, current) =>
    current.studentCount > (max?.studentCount || 0) ? current : max
    , null)
})

const countStudents = (discipline) => {
  if (!discipline || !discipline.id) return 0
  const id = discipline.id
  return inscripciones.value.filter(ins => {
    // varios posibles campos donde la disciplina puede estar referenciada
    if (!ins) return false
    // direct field typos
    if (ins.id_disciplina && Number(ins.id_disciplina) === Number(id)) return true
    if (ins.id_diciplina && Number(ins.id_diciplina) === Number(id)) return true
    // nested disciplina in paquete
    if (ins.paquete && ins.paquete.disciplina) {
      const pd = ins.paquete.disciplina
      if ((pd.id && Number(pd.id) === Number(id)) || (pd === id)) return true
    }
    // nested disciplina object
    if (ins.disciplina) {
      const d = ins.disciplina
      if ((d.id && Number(d.id) === Number(id)) || (d === id)) return true
    }
    return false
  }).length
}

const iconOptions = [
  'sports_soccer', 'pool', 'fitness_center', 'self_improvement',
  'sports_tennis', 'sports_basketball', 'sports_martial_arts',
  'sports_gymnastics', 'sports_volleyball', 'sports_handball'
];

const activeCount = computed(() => disciplines.value.filter(d => d.estado).length);

const resetForm = () => {
  editing.value = false;
  form.value = { id: null, nombre: '', icono: '', estado: true };
  if (formRef.value) {
    formRef.value.resetValidation()
  }
}

const onSubmit = async () => {
  if (formRef.value && formRef.value.validate) {
    const ok = await formRef.value.validate()
    if (!ok) {
      $q.notify({
        type: 'negative',
        message: 'Por favor complete todos los campos requeridos'
      })
      return
    }
  } else {
    if (!form.value.nombre) {
      $q.notify({
        type: 'warning',
        message: 'El nombre es requerido'
      })
      return
    }
  }

  try {
    if (editing.value && form.value.id != null) {
      await modificarDisciplina(form.value);
      $q.notify({
        type: 'positive',
        message: 'Disciplina actualizada correctamente',
        icon: 'check_circle'
      })
    } else {
      await agregarDisciplina(form.value);
      $q.notify({
        type: 'positive',
        message: 'Disciplina creada correctamente',
        icon: 'check_circle'
      })
    }

    disciplines.value = await listarDisciplinas();
    resetForm();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al guardar la disciplina',
      caption: error.message
    })
  }
}

const editDiscipline = (discipline) => {
  editing.value = true;
  form.value = { id: discipline.id, nombre: discipline.nombre, icono: discipline.icono || '', estado: !!discipline.estado };
  // scroll to top of form on small screens
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const confirmToggle = (discipline, newVal) => {
  const title = newVal ? 'Activar disciplina' : 'Desactivar disciplina'
  const message = newVal ? `¿Desea activar "${discipline.nombre}"?` : `¿Desea desactivar "${discipline.nombre}"?`
  const dlg = $q.dialog({ title, message, cancel: true, persistent: true })
  dlg.onOk(async () => {
    discipline.estado = newVal
    await cambiarEstado({ id: discipline.id, nuevoEstado: newVal })
  })
  dlg.onCancel(() => {
    // si cancela, no hacemos nada (el toggle no cambiará porque usamos model-value controlado)
  })
}

const viewDiscipline = (id) => {
  router.push(`/disciplines/${id}`);
}

onMounted(async () => {
  disciplines.value = await listarDisciplinas();
});
</script>

<style scoped lang="scss">
/* Paleta de colores verdosos naturales con naranja y marrón */
$color-forest: #2d6a4f;
$color-green: #40916c;
$color-leaf: #52b788;
$color-sage: #74c69d;
$color-lime: #95d5b2;

$color-orange: #f97316;
$color-amber: #f59e0b;
$color-tangerine: #fb923c;

$color-brown: #92400e;
$color-wood: #78350f;
$color-earth: #a16207;

$pastel-forest: #d8f3dc;
$pastel-green: #b7e4c7;
$pastel-sage: #95d5b2;
$pastel-orange: #fed7aa;
$pastel-peach: #ffedd5;

.disciplines-page {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, $pastel-forest 100%);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease-in;
}

.header-content {
  background: linear-gradient(135deg, $pastel-forest 0%, $pastel-green 50%, $pastel-sage 100%);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.15);
  border: 2px solid $color-sage;
}

.page-icon {
  color: $color-forest;
  vertical-align: middle;
  margin-right: 12px;
}

.page-title {
  display: inline-block;
  font-size: 2em;
  font-weight: 700;
  color: $color-forest;
  margin: 0;
  vertical-align: middle;
}

.header-subtitle {
  color: $color-green;
  margin: 8px 0 0 60px;
  font-size: 1em;
}

.statistics-section {
  margin-bottom: 24px;
  animation: slideDown 0.6s ease-out;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
}

.stat-card-total {
  border-left-color: $color-forest;
  background: linear-gradient(135deg, white 0%, $pastel-forest 100%);
}

.stat-card-active {
  border-left-color: $color-leaf;
  background: linear-gradient(135deg, white 0%, $pastel-green 100%);
}

.stat-card-students {
  border-left-color: $color-orange;
  background: linear-gradient(135deg, white 0%, $pastel-orange 100%);
}

.stat-card-popular {
  border-left-color: $color-brown;
  background: linear-gradient(135deg, white 0%, $pastel-peach 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.85em;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.8em;
  font-weight: 700;
  color: $color-forest;
}

.stat-icon {
  font-size: 48px;
  color: $color-sage;
  opacity: 0.6;
}

.filters-section {
  background: white;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.filters-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: linear-gradient(135deg, $pastel-forest 0%, $pastel-sage 100%);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, $pastel-sage 0%, $pastel-green 100%);
  }
}

.filters-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: $color-forest;
  font-size: 1.1em;
}

.filters-content {
  padding: 20px;
  background: white;
}

.filter-input {
  :deep(.q-field__control) {
    border-radius: 12px;
  }
}

.form-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid $pastel-sage;
}

.form-header {
  background: linear-gradient(135deg, $pastel-forest 0%, $pastel-green 50%, $pastel-sage 100%);
  padding: 20px;
  border-bottom: 3px solid $color-sage;
}

.form-title {
  display: flex;
  align-items: center;
  color: $color-forest;
  font-weight: 700;
}

.separator-gradient {
  height: 3px;
  background: linear-gradient(90deg, $color-forest 0%, $color-green 50%, $color-leaf 100%);
}

.form-body {
  background: linear-gradient(135deg, #ffffff 0%, $pastel-forest 100%);
  padding: 24px;
}

.form-input {
  margin-bottom: 16px;

  :deep(.q-field__control) {
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      border-color: $color-green;
      box-shadow: 0 0 0 1px $pastel-sage;
    }
  }

  :deep(.q-field--focused .q-field__control) {
    border-color: $color-sage;
    box-shadow: 0 0 0 2px $pastel-green;
  }
}

.icon-selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: $color-forest;
  margin-bottom: 12px;
  font-size: 1em;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 2px dashed $pastel-sage;
}

.icon-btn {
  background: white;
  border: 2px solid $pastel-green;
  transition: all 0.3s ease;

  &:hover {
    border-color: $color-sage;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(64, 145, 108, 0.3);
  }

  :deep(.q-icon) {
    color: $color-green;
  }
}

.icon-btn-selected {
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
  border-color: $color-forest;
  box-shadow: 0 4px 16px rgba(45, 106, 79, 0.4);

  :deep(.q-icon) {
    color: white;
  }
}

.icon-hint {
  margin-top: 8px;
  font-size: 0.85em;
  color: #6b7280;
  font-style: italic;
}

.estado-section {
  background: white;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid $color-leaf;
}

.estado-toggle {
  font-weight: 600;
  font-size: 1em;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid $pastel-sage;
}

.btn-clear {
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
  padding: 10px 24px;
}

.btn-submit {
  background: linear-gradient(135deg, $color-orange 0%, $color-amber 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
  padding: 10px 24px;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
  }
}

.disciplines-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.discipline-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(45, 106, 79, 0.2);
    border-color: $color-sage;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid $pastel-green;
}

.card-icon-container {
  flex-shrink: 0;
}

.discipline-avatar {
  background: linear-gradient(135deg, $pastel-forest 0%, $pastel-sage 100%);
  border: 3px solid $color-sage;
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.25);

  :deep(.q-icon) {
    color: $color-forest;
  }
}

.card-info {
  flex: 1;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(4px);
  }
}

.discipline-name {
  font-size: 1.3em;
  font-weight: 700;
  color: $color-forest;
  margin-bottom: 4px;
}

.discipline-students {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $color-orange;
  font-weight: 600;
  font-size: 0.95em;

  .q-icon {
    color: $color-orange;
  }
}

.card-status {
  flex-shrink: 0;
}

.status-badge {
  font-weight: 600;
  padding: 6px 16px;
  font-size: 0.9em;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid $pastel-green;
}

.status-toggle {
  margin-left: 8px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;

  p {
    font-size: 1.2em;
    margin-top: 16px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
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

@media (max-width: 1023px) {
  .form-card {
    margin-bottom: 24px;
  }
}

@media (max-width: 959px) {
  .page-title {
    font-size: 1.6em;
  }

  .header-subtitle {
    font-size: 0.9em;
    margin-left: 0;
  }
}

@media (max-width: 599px) {
  .disciplines-page {
    padding: 12px;
  }

  .header-content {
    padding: 16px;
  }

  .page-title {
    font-size: 1.4em;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 1.5em;
  }

  .stat-icon {
    font-size: 36px;
  }

  .form-body {
    padding: 16px;
  }

  .icon-grid {
    gap: 8px;
    padding: 12px;
  }

  .icon-btn {
    :deep(.q-icon) {
      font-size: 24px;
    }
  }

  .form-actions {
    flex-direction: column;
    gap: 8px;

    .q-btn {
      width: 100%;
    }
  }

  .discipline-card {
    padding: 16px;
  }

  .card-header {
    flex-wrap: wrap;
  }

  .discipline-name {
    font-size: 1.1em;
  }

  .card-footer {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
