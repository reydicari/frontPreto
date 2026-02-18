<template>
  <q-page class="q-pa-md disciplines-page">
    <!-- Header mejorado con animación -->
    <div class="row items-center justify-between q-mb-lg header-section">
      <div>
        <h2 class="text-h4 q-ma-none page-title animated-title">
          <q-icon name="sports" size="38px" class="q-mr-sm" />
          Gestión de Disciplinas
        </h2>
        <p class="text-grey-7 q-mt-xs q-mb-none">Administra y monitorea todas las disciplinas deportivas</p>
      </div>
      <q-btn color="primary" icon="add_circle" label="Nueva Disciplina" size="md" unelevated
        class="btn-nueva-disciplina" @click="openDialog()">
        <q-tooltip>Registrar nueva disciplina</q-tooltip>
      </q-btn>
    </div>

    <!-- Tabla de disciplinas -->
    <q-card class="table-card">
      <q-card-section class="q-pa-none">
        <q-table :rows="disciplines" :columns="columns" row-key="id" :loading="loading" flat class="disciplines-table"
          :rows-per-page-options="[0]" hide-pagination>
          <template v-slot:loading>
            <q-inner-loading showing color="primary" />
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" @click="viewDiscipline(props.row.id)" class="cursor-pointer">
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'no'">
                  <div class="row-number-simple">{{ props.rowIndex + 1 }}</div>
                </template>
                <template v-else-if="col.name === 'nombre'">
                  <div class="row items-center">
                    <q-avatar size="36px" color="teal-7" text-color="white" class="q-mr-sm">
                      <q-icon :name="props.row.icono || 'sports'" size="22px" />
                    </q-avatar>
                    <div>
                      <div class="text-weight-medium">{{ col.value }}</div>
                    </div>
                  </div>
                </template>
                <template v-else-if="col.name === 'estudiantes'">
                  <div class="estudiantes-cell">
                    <q-icon name="groups" size="18px" class="q-mr-xs text-teal-7" />
                    <span>{{ col.value }}</span>
                  </div>
                </template>
                <template v-else-if="col.name === 'estado'">
                  <q-badge :color="props.row.estado ? 'positive' : 'grey-7'"
                    :label="props.row.estado ? 'Activa' : 'Inactiva'" class="estado-badge" />
                </template>
                <template v-else-if="col.name === 'actions'">
                  <div class="row items-center justify-center q-gutter-xs" @click.stop>
                    <q-btn size="sm" flat dense round icon="visibility" color="teal-7"
                      @click.stop="viewDiscipline(props.row.id)">
                      <q-tooltip>Ver detalles</q-tooltip>
                    </q-btn>
                    <q-btn size="sm" flat dense round icon="edit" color="orange-7"
                      @click.stop="editDiscipline(props.row)">
                      <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                    <q-toggle dense :model-value="props.row.estado"
                      @update:model-value="confirmToggle(props.row, $event)" @click.stop color="teal-7"
                      class="status-toggle">
                      <q-tooltip>{{ props.row.estado ? 'Desactivar' : 'Activar' }}</q-tooltip>
                    </q-toggle>
                  </div>
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Diálogo de formulario -->
    <q-dialog v-model="dialogVisible" persistent>
      <q-card class="form-dialog">
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
                <q-icon name="label" color="teal-7" />
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
              <q-toggle v-model="form.estado" color="teal-7" :label="form.estado ? 'Activa' : 'Inactiva'" left-label
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
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancelar" color="grey-7" @click="closeDialog" />
          <q-btn unelevated label="Limpiar" color="negative" icon="clear" @click="resetForm" />
          <q-btn unelevated :label="editing ? 'Actualizar' : 'Guardar'" :icon="editing ? 'update' : 'save'"
            color="primary" @click="onSubmit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { agregarDisciplina, cambiarEstado, listarDisciplinas, modificarDisciplina } from 'src/stores/disciplina-store';
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const router = useRouter();
const $q = useQuasar();

const loading = ref(false);
const dialogVisible = ref(false);
const editing = ref(false);
const form = ref({ id: null, nombre: '', icono: '', estado: true });
const formRef = ref(null);
const inscripciones = ref([]);
const disciplines = ref([]);

// Configuración de tabla
const columns = [
  {
    name: 'no',
    label: '#',
    field: () => '',
    align: 'center',
    style: 'width: 50px'
  },
  {
    name: 'nombre',
    label: 'Disciplina',
    field: 'nombre',
    align: 'left',
    sortable: true
  },
  {
    name: 'estudiantes',
    label: 'Estudiantes',
    field: row => countStudents(row),
    align: 'center',
    sortable: true
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'center',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Acciones',
    align: 'center',
    style: 'width: 150px'
  }
];

const countStudents = (discipline) => {
  if (!discipline || !discipline.id) return 0;
  const id = discipline.id;
  return inscripciones.value.filter(ins => {
    if (!ins) return false;
    if (ins.id_disciplina && Number(ins.id_disciplina) === Number(id)) return true;
    if (ins.id_diciplina && Number(ins.id_diciplina) === Number(id)) return true;
    if (ins.paquete && ins.paquete.disciplina) {
      const pd = ins.paquete.disciplina;
      if ((pd.id && Number(pd.id) === Number(id)) || (pd === id)) return true;
    }
    if (ins.disciplina) {
      const d = ins.disciplina;
      if ((d.id && Number(d.id) === Number(id)) || (d === id)) return true;
    }
    return false;
  }).length;
};

const iconOptions = [
  'sports_soccer', 'pool', 'fitness_center', 'self_improvement',
  'sports_tennis', 'sports_basketball', 'sports_martial_arts',
  'sports_gymnastics', 'sports_volleyball', 'sports_handball'
];

const openDialog = () => {
  editing.value = false;
  resetForm();
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  resetForm();
};

const resetForm = () => {
  editing.value = false;
  form.value = { id: null, nombre: '', icono: '', estado: true };
  if (formRef.value) {
    formRef.value.resetValidation();
  }
};

const onSubmit = async () => {
  if (formRef.value && formRef.value.validate) {
    const ok = await formRef.value.validate();
    if (!ok) {
      $q.notify({
        type: 'negative',
        message: 'Por favor complete todos los campos requeridos'
      });
      return;
    }
  } else {
    if (!form.value.nombre) {
      $q.notify({
        type: 'warning',
        message: 'El nombre es requerido'
      });
      return;
    }
  }

  try {
    if (editing.value && form.value.id != null) {
      await modificarDisciplina(form.value);
      $q.notify({
        type: 'positive',
        message: 'Disciplina actualizada correctamente',
        icon: 'check_circle'
      });
    } else {
      await agregarDisciplina(form.value);
      $q.notify({
        type: 'positive',
        message: 'Disciplina creada correctamente',
        icon: 'check_circle'
      });
    }

    disciplines.value = await listarDisciplinas();
    closeDialog();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al guardar la disciplina',
      caption: error.message
    });
  }
};

const editDiscipline = (discipline) => {
  editing.value = true;
  form.value = {
    id: discipline.id,
    nombre: discipline.nombre,
    icono: discipline.icono || '',
    estado: !!discipline.estado
  };
  dialogVisible.value = true;
};

const confirmToggle = (discipline, newVal) => {
  const title = newVal ? 'Activar disciplina' : 'Desactivar disciplina';
  const message = newVal ? `¿Desea activar "${discipline.nombre}"?` : `¿Desea desactivar "${discipline.nombre}"?`;
  const dlg = $q.dialog({ title, message, cancel: true, persistent: true });
  dlg.onOk(async () => {
    discipline.estado = newVal;
    await cambiarEstado({ id: discipline.id, nuevoEstado: newVal });
  });
  dlg.onCancel(() => {
    // si cancela, no hacemos nada
  });
};

const viewDiscipline = (id) => {
  router.push(`/disciplines/${id}`);
};

onMounted(async () => {
  loading.value = true;
  try {
    disciplines.value = await listarDisciplinas();
  } catch (error) {
    console.error('Error al cargar disciplinas:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
// Paleta de colores similar a inscripciones
$color-primary: #1b5e20;
$color-primary-light: #2e7d32;
$color-primary-lighter: #43a047;
$color-accent: #558b2f;
$color-accent-light: #7cb342;
$color-orange: #ef6c00;
$color-orange-light: #f57c00;

// Animaciones
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// Página principal
.disciplines-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

// Encabezado
.header-section {
  animation: fadeInUp 0.6s ease-out;
}

.page-title {
  background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.2em;
  font-weight: 900;
  line-height: 1.2;
  display: flex;
  align-items: center;

  .q-icon {
    -webkit-text-fill-color: $color-primary-light;
  }
}

.animated-title {
  animation: slideInRight 0.8s ease-out;
}

.btn-nueva-disciplina {
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 14px 0 rgba(27, 94, 32, 0.39);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px 0 rgba(27, 94, 32, 0.5);
  }
}

// Tarjeta de tabla
.table-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: fadeInUp 1.2s ease-out 0.6s backwards;
  border: none;
  overflow: hidden;
}

// Tabla mejorada
.disciplines-table {
  :deep(.q-table__top) {
    padding: 16px;
    background: linear-gradient(135deg, #1b5e2015 0%, #2e7d3215 100%);
  }

  :deep(.q-table thead tr) {
    background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
  }

  :deep(.q-table thead th) {
    color: white;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
  }

  :deep(.q-table tbody tr) {
    transition: all 0.3s ease;

    &:hover {
      background: rgba($color-primary, 0.05);
      transform: scale(1.01);
    }
  }

  :deep(.q-table tbody td) {
    padding: 16px 12px;
    font-size: 0.95rem;
  }
}

// Componentes específicos de tabla
.row-number-simple {
  color: $color-primary-light;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
}

.estudiantes-cell {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  justify-content: center;
}

.estado-badge {
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 100px;
  display: inline-block;
  text-align: center;
}

// Diálogo de formulario
.form-dialog {
  min-width: 500px;
  max-width: 600px;
  border-radius: 16px;
  overflow: hidden;
}

.form-header {
  background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 50%, $color-primary-lighter 100%);
  padding: 20px;
  color: white;
}

.form-title {
  display: flex;
  align-items: center;
  font-weight: 700;
}

.separator-gradient {
  height: 3px;
  background: linear-gradient(90deg, $color-primary 0%, $color-primary-light 50%, $color-primary-lighter 100%);
}

.form-body {
  background: white;
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-input {
  margin-bottom: 16px;

  :deep(.q-field__control) {
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      border-color: $color-primary-light;
      box-shadow: 0 0 0 1px rgba($color-primary, 0.2);
    }
  }

  :deep(.q-field--focused .q-field__control) {
    border-color: $color-primary-lighter;
    box-shadow: 0 0 0 2px rgba($color-primary, 0.15);
  }
}

.icon-selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: $color-primary;
  margin-bottom: 12px;
  font-size: 1em;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
  border: 2px dashed rgba($color-primary, 0.3);
}

.icon-btn {
  background: white;
  border: 2px solid rgba($color-primary-light, 0.4);
  transition: all 0.3s ease;

  &:hover {
    border-color: $color-primary-lighter;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba($color-primary, 0.3);
  }

  :deep(.q-icon) {
    color: $color-primary-light;
  }
}

.icon-btn-selected {
  background: linear-gradient(135deg, $color-primary 0%, $color-primary-lighter 100%);
  border-color: $color-primary;
  box-shadow: 0 4px 16px rgba($color-primary, 0.4);

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
  background: #f5f7fa;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid $color-primary-lighter;
}

.estado-toggle {
  font-weight: 600;
  font-size: 1em;
}

.status-toggle {
  margin-left: 8px;
}

// Responsividad
@media (max-width: 768px) {
  .page-title {
    font-size: 1.8em;
  }

  .form-dialog {
    min-width: 95vw;
  }
}

// Utilidades
.cursor-pointer {
  cursor: pointer;
}
</style>
