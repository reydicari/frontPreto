<template>
  <q-dialog :model-value="modelValue" @update:model-value="val => $emit('update:modelValue', val)" persistent>
    <q-card class="dialog-card responsive-dialog scrollable-dialog">
      <q-card-section class="dialog-header">
        <div class="header-content-dialog">
          <q-icon name="school" size="32px" class="q-mr-sm" />
          <div class="text-h5 text-weight-bold">
            {{ editMode ? 'Editar Estudiante' : 'Nuevo Estudiante' }}
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <q-stepper v-model="step" ref="stepper" color="primary" animated header-nav :contracted="$q.screen.lt.md">
          <!-- Paso 1: Información básica y foto de perfil -->
          <q-step name="first" title="Información Personal" icon="person" :done="step > 'first'"
            :header-nav="step > 'first'">
            <q-form ref="formStep1">
              <div class="row q-col-gutter-md">
                <!-- Columna izquierda - Datos personales -->
                <div class="col-12 col-md-8">
                  <!-- <div class="row q-col-gutter-md">
                    <q-alert icon="warning" text-color="dark" class="q-pa-md" style="
                    background-color: #fdecea;       /* rojo suave */
                    border: 2px solid #f44336;       /* rojo fuerte */
                    border-radius: 8px;              /* bordes redondeados */
                    margin-bottom: 16px;             /* separación extra */
  ">
                      ⚠️ Los campos con * son obligatorios.
                    </q-alert>

                  </div> -->


                  <div class="row q-col-gutter-md">
                    <q-input v-model="localPersona.nombres" label="Nombres *" outlined dense class="col-md-6" :rules="[
                      val => !!val || 'Campo requerido',
                      rules.onlyLetters,
                      rules.minLength(3),
                      rules.maxLength(30),
                      rules.noConsecutiveSpaces,
                      (val) => rules.numberWords(val, 3)
                    ]" />

                    <q-input v-model="localPersona.apellido_paterno" label="Apellido Paterno *" outlined dense
                      class="col-md-6" :rules="[
                        rules.required,
                        rules.onlyLetters,
                        rules.minLength(3),
                        rules.maxLength(30),
                        val => rules.numberWords(val, 1)
                      ]" />

                    <q-input v-model="localPersona.apellido_materno" label="Apellido Materno" outlined dense
                      class="col-md-6" :rules="[
                        rules.onlyLetters,
                        rules.maxLength(30),
                        (val) => rules.numberWords(val, 1)
                      ]" />

                    <q-input type="number" v-model="localPersona.ci" label="Carnet de Identidad *" outlined dense
                      class="col-md-3" :rules="[
                        rules.required,
                        rules.onlyNumbers,
                        rules.minLength(6),
                        rules.maxLength(10),
                        rules.existCi
                      ]" />

                    <q-input v-model="localPersona.complemento" label="Complemento" outlined dense class="col-md-3"
                      :rules="[
                        rules.maxLength(3),
                        rules.noSpaceInString
                      ]" />

                    <q-input v-model="localPersona.telefono" label="Teléfono" outlined dense class="col-md-6" mask=""
                      fill-mask hint="7 dígitos" :rules="[
                        val => !val || (val.length <= 20) || 'No se permiten mas de 20 digitos',
                        val => (val.length >= 7 || !val) || '7 minimante dígitos'
                      ]" />
                    <q-input v-model="localPersona.fecha_nacimiento" label="Fecha de Nacimiento" type="date" outlined
                      dense class="col-md-6" :rules="[
                        rules.required,
                      ]" />
                    <q-select emit-value option-value="value" map-options option-label="label"
                      v-model="localPersona.genero" :options="generoOptions" label="Género" outlined dense
                      class="col-md-4 col-6" :rules="[rules.required]" />
                    <!-- Nivel removed: backend no longer provides nivel object -->

                  </div>
                </div>
                <!-- Columna derecha - Foto de perfil -->
                <div class="col-12 col-md-4">
                  <div class="column items-center q-gutter-md">
                    <q-uploader ref="uploader" label="Foto de perfil *" accept=".jpg,.jpeg,.png" max-file-size="5242880"
                      max-files="1" @added="onProfilePhotoAdded" @removed="profilePhoto = null" style="width: 100%"
                      bordered hide-upload-btn>
                    </q-uploader>
                  </div>
                </div>
              </div>
            </q-form>
            <q-stepper-navigation>
              <q-btn v-if="props.inscripcion" @click="prepareAndSave" color="positive" label="Guardar Estudiante" />
              <q-btn v-else @click="validateFirstStep" color="primary" label="Continuar" />
              <q-btn flat @click="closeDialog" color="negative" label="Cancelar" class="q-ml-sm" />
            </q-stepper-navigation>
          </q-step>

          <!-- Paso 2: Documentos adicionales -->
          <q-step name="second" title="Respaldos" icon="description" :done="step > 'second'"
            :header-nav="step > 'second'">
            <div class="q-mb-md">
              <div class="q-mt-md row col-gutter-md">
                <q-input v-model="localPersona.biografia" label="Descripcion" type="textarea" outlined
                  class="col-md-7  biografia-textarea" :input-style="{ resize: 'none' }" rows="5" maxlength="500"
                  counter>

                </q-input>

              </div>
              <div class="text-subtitle1 q-mb-sm">Documentos adicionales (máx. 3 archivos)</div>
              <q-uploader label="Arrastra archivos aquí o haz clic para seleccionar" multiple
                accept=".pdf,.jpg,.jpeg,.png" max-file-size="10485760" max-files="3" :filter="checkFileType"
                @added="onFilesAdded" @removed="onFilesRemoved" style="width: 100%" flat bordered hide-upload-btn>

              </q-uploader>
              <q-list bordered separator class="q-mt-md" v-if="additionalFiles.length > 0">
                <q-item v-for="(file, index) in additionalFiles" :key="index">
                  <q-item-section avatar>
                    <q-icon :name="getFileIcon(file.type)" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ file.name }}</q-item-label>
                    <q-item-label caption>{{ formatFileSize(file.size) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn icon="delete" color="negative" flat dense @click="onFilesRemoved(file)" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <q-stepper-navigation>
              <q-btn @click="nextStep" color="primary" label="Continuar" />
              <q-btn @click="step = 'first'" flat color="primary" label="Atrás" class="q-ml-sm" />
              <q-btn flat @click="closeDialog" color="negative" label="Cancelar" class="q-ml-sm" />
            </q-stepper-navigation>
          </q-step>

          <!-- Paso 3: Confirmación -->
          <q-step name="third" title="Confirmación" icon="assignment_turned_in" :done="step > 'third'"
            :header-nav="step > 'third'">
            <div class="q-pa-none">
              <div class="row q-col-gutter-md">
                <div class="col-md-6">
                  <q-card flat bordered>
                    <q-card-section>
                      <div class="text-h6">Información Personal</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                      <div class="row q-col-gutter-y-sm">
                        <div class="col-6 text-weight-bold">Nombres:</div>
                        <div class="col-6">{{ localPersona.nombres }}</div>

                        <div class="col-6 text-weight-bold">Apellidos:</div>
                        <div class="col-6">{{ localPersona.apellido_paterno }} {{ localPersona.apellido_materno }}</div>

                        <div class="col-6 text-weight-bold">CI:</div>
                        <div class="col-6">{{ localPersona.ci }} {{ localPersona.complemento }}</div>

                        <div class="col-6 text-weight-bold">Teléfono:</div>
                        <div class="col-6">{{ localPersona.telefono }}</div>

                        <div class="col-6 text-weight-bold">Fecha Nacimiento:</div>
                        <div class="col-6">{{ formatDate(localPersona.fecha_nacimiento) }}</div>

                        <div class="col-6 text-weight-bold">Categoría:</div>
                        <div class="col-6">{{ localPersona.fecha_nacimiento ? new
                          Date(localPersona.fecha_nacimiento).getFullYear() : 'N/A' }}</div>

                        <div class="col-6 text-weight-bold">Tipo:</div>
                        <div class="col-6">{{ localPersona.tipo_persona }}</div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-md-6">
                  <q-card flat bordered>
                    <q-card-section>
                      <div class="text-h6">Respaldos</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                      <div class="row q-col-gutter-y-sm">
                        <div class="col-6 text-weight-bold">Años de experiencia:</div>
                        <div class="col-6">{{ localPersona.experiencia }}</div>
                      </div>
                      <div class="row q-col-gutter-y-sm">
                        <div class="col-6 text-weight-bold">Foto de perfil:</div>
                        <div class="col-6">
                          <q-avatar size="60px">
                            <img v-if="profilePhoto" :src="profilePhoto">
                            <q-icon v-else name="person" size="30px" />
                          </q-avatar>
                        </div>

                        <div class="col-6 text-weight-bold">Documentos adjuntos:</div>
                        <div class="col-6">
                          <div v-if="additionalFiles.length === 0">Ningún documento adjunto</div>
                          <q-chip v-for="(file, index) in additionalFiles" :key="index" size="sm" color="primary"
                            text-color="white" icon="description">
                            {{ file.name }}
                          </q-chip>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <q-stepper-navigation>
              <q-btn @click="prepareAndSave" color="positive" label="Guardar Estudiante" />
              <q-btn @click="step = 'second'" flat color="primary" label="Atrás" class="q-ml-sm" />
              <q-btn flat @click="closeDialog" color="negative" label="Cancelar" class="q-ml-sm" />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useValidation } from 'src/composables/useValidation'
const $q = useQuasar()
const rules = useValidation()
const props = defineProps({
  modelValue: Boolean,
  persona: {
    type: Object,
    required: true
  },
  editMode: Boolean,
  student: Boolean,
  inscripcion: Boolean
})

const emit = defineEmits(['update:modelValue', 'save', 'close'])

const step = ref('first')
const localPersona = ref({ ...props.persona })
const profilePhoto = ref(null)
const additionalFiles = ref([])
const profilePhotoFile = ref(null)
const formStep1 = ref(null)
// nivel removed: no options required
const generoOptions = ref([
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' },
  { label: 'Otro', value: 'O' }
])

watch(() => props.persona, (newVal) => {
  localPersona.value = { ...newVal }
  // Valor por defecto para género si no viene establecido (asegurar en ambos watchers)
  if (!localPersona.value.genero) localPersona.value.genero = 'M'
})
const host = 'http://localhost:3001/uploads/'

onMounted(() => {
  // Llamá esta función con tu URL

  // cargarImagenDesdeUrl(host + localPersona.value.fotografia);
})
watch(() => props.persona, async (newVal) => {
  localPersona.value = { ...newVal }
  // Valor por defecto para género si no viene establecido
  if (!localPersona.value.genero) localPersona.value.genero = 'M'
  if (localPersona.value.fotografia) {
    // Aquí cargas la imagen en el uploader o en tu variable de preview
    console.log('Cargando imagen de perfil:', profilePhoto.value)
    cargarImagenDesdeUrl(host + localPersona.value.fotografia);
  } else {
    profilePhoto.value = null
  }
}, { immediate: true })
function checkFileType(files) {
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
  return files.filter(file => validTypes.includes(file.type))
}
function onProfilePhotoAdded(files) {
  if (files.length > 0) {
    const file = files[0]
    if (file.size > 5242880) {
      $q.notify({
        type: 'negative',
        message: 'La foto de perfil no debe exceder los 5MB'
      })
      return false
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      profilePhoto.value = e.target.result
      profilePhotoFile.value = file
    }
    reader.readAsDataURL(file)
  }
  return true
}

function onFilesAdded(files) {
  const validFiles = checkFileType(files)

  // Verificar tamaño máximo
  const oversizedFiles = validFiles.filter(file => file.size > 10485760)
  if (oversizedFiles.length > 0) {
    $q.notify({
      type: 'negative',
      message: 'Algunos archivos exceden el tamaño máximo de 10MB'
    })
  }

  // Filtrar solo los archivos válidos y que no excedan el límite
  const newFiles = validFiles
    .filter(file => file.size <= 10485760)
    .slice(0, 3 - additionalFiles.value.length)

  additionalFiles.value = [...additionalFiles.value, ...newFiles]
}

function onFilesRemoved(files) {
  // Permitir tanto un solo archivo como un array
  let removedFileNames = []
  if (Array.isArray(files)) {
    removedFileNames = files.map(f => f.name)
  } else if (files && files.name) {
    removedFileNames = [files.name]
  }
  additionalFiles.value = additionalFiles.value.filter(
    file => !removedFileNames.includes(file.name)
  )
}

function getFileIcon(fileType) {
  if (fileType.includes('image')) return 'image'
  if (fileType === 'application/pdf') return 'picture_as_pdf'
  return 'insert_drive_file'
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function validateFirstStep() {
  const valid = await formStep1.value.validate()
  if (!valid) {
    $q.notify({
      type: 'negative',
      message: 'Complete correctamente los campos obligatorios y corrija los errores.'
    })
    return
  }
  step.value = 'second'
}

function nextStep() {
  step.value = 'third'
}

async function prepareAndSave() {
  // Validar el primer formulario antes de continuar
  try {
    if (formStep1.value) {
      const valid = await formStep1.value.validate()
      if (!valid) {
        $q.notify({ type: 'negative', message: 'Complete correctamente los campos obligatorios.' })
        return
      }
    }
  } catch (e) {
    // Si hay algún error al validar, no continuar
    console.error('Error validando formulario:', e)
    $q.notify({ type: 'negative', message: 'Error al validar el formulario.' })
    return
  }

  localPersona.value.categoria = localPersona.value.fecha_nacimiento ? new Date(localPersona.value.fecha_nacimiento).getFullYear() : ''
  const formData = new FormData()
  // Agregar datos de la persona como JSON
  localPersona.value.tipo_persona = props.student ? 'estudiante' : 'ninguno'
  formData.append('persona', JSON.stringify(localPersona.value))
  console.log('Datos de la persona:----------------------------------', localPersona.value)

  // Si está activo el toggle, crear credenciales y anexarlas al form
  const nombres = (localPersona.value.nombres || '').trim()
  const primerNombre = nombres.split(' ')[0] || ''
  const ci = (localPersona.value.ci || '').toString()
  const usuario = `${primerNombre}${ci}`
  const clave = `${ci}`
  // Loguear credenciales
  console.log('Credenciales creadas -> usuario:', usuario, 'clave:', clave)
  // Añadir al formData como objeto usuario
  const usuarioObj = { usuario, clave, rol: 'Estudiante' }
  formData.append('usuario', JSON.stringify(usuarioObj))
  // Agregar foto de perfil
  if (profilePhotoFile.value) {
    console.log('poniendote la fotooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo', profilePhotoFile.value);

    formData.append('foto', profilePhotoFile.value)
  } //y archivos adjuntos
  if (additionalFiles.value.length > 0) {
    additionalFiles.value.forEach(file => {
      formData.append('archivos', file) // ✅ cada archivo por separado
    })
  }

  emit('save', formData)
  //closeDialog()
  setTimeout(() => {
    step.value = 'first'
    profilePhoto.value = null
    profilePhotoFile.value = null
    additionalFiles.value = []
    localPersona.value = { ...props.persona }
  }, 300)
}

const closeDialog = () => {
  console.log('emitinedo closeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
  emit('update:v-model', false)
  emit('close')

  // Resetear el estado para la próxima vez que se abra
  setTimeout(() => {
    step.value = 'first'
    profilePhoto.value = null
    profilePhotoFile.value = null
    additionalFiles.value = []
  }, 300)
}

function formatDate(dateString) {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('es-ES', options)
}
const uploader = ref(null);
const cargarImagenDesdeUrl = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    // Inferir nombre y tipo
    const tipo = blob.type || 'image/jpeg';
    const nombre = url.split('/').pop() || 'imagen.jpg';

    const archivo = new File([blob], nombre, { type: tipo });
    console.log(archivo);

    // Asegurarse que el uploader está montado
    setTimeout(() => {
      if (uploader.value) {
        uploader.value.addFiles([archivo]);
      } else {
        console.error('El componente Q-Uploader no está montado aún.');
      }
    }, 500); // Ajusta el tiempo según sea necesario

  } catch (error) {
    console.error('Error al cargar imagen desde URL:', error);
  }
}
async function cargarReconocimientosDesdeUrl(reconocimientos) {
  if (!Array.isArray(reconocimientos)) return
  const archivos = []
  for (const rec of reconocimientos) {
    if (rec.archivo) {
      try {
        const url = host + rec.archivo
        const response = await fetch(url)
        const blob = await response.blob()
        const tipo = blob.type || 'application/octet-stream'
        const nombre = url.split('/').pop() || 'archivo'
        const file = new File([blob], nombre, { type: tipo })
        archivos.push(file)
      } catch (e) {
        console.error('Error al cargar reconocimiento:', rec.archivo, e)
      }
    }
  }
  // Limita a 3 archivos como el uploader
  additionalFiles.value = archivos.slice(0, 3)
}

function capitalizeWords(str) {//hacer mayus los primeros caracteres
  if (!str) return ''
  return str.replace(/\b\w/g, c => c.toUpperCase())
}
watch(() => props.persona, async (newVal) => {
  localPersona.value = { ...newVal }
  if (localPersona.value.fotografia) {
    cargarImagenDesdeUrl(host + localPersona.value.fotografia)
  } else {
    profilePhoto.value = null
  }
  // Solo si es edición y hay reconocimientos
  if (props.editMode && Array.isArray(localPersona.value.reconocimientos) && localPersona.value.reconocimientos.length > 0) {
    await cargarReconocimientosDesdeUrl(localPersona.value.reconocimientos)
  } else {
    additionalFiles.value = []
  }
}, { immediate: true })

watch(() => localPersona.value.nombres, (val) => {
  if (!val) return
  const capitalized = capitalizeWords(val)
  if (val !== capitalized) localPersona.value.nombres = capitalized
})

watch(() => localPersona.value.apellido_paterno, (val) => {
  if (!val) return
  const capitalized = capitalizeWords(val)
  if (val !== capitalized) localPersona.value.apellido_paterno = capitalized
})

watch(() => localPersona.value.apellido_materno, (val) => {
  if (!val) return
  const capitalized = capitalizeWords(val)
  if (val !== capitalized) localPersona.value.apellido_materno = capitalized
})
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

.dialog-card {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 50%, $pastel-lime 100%);
  padding: 24px;
  border-bottom: 3px solid $color-leaf;
}

.header-content-dialog {
  display: flex;
  align-items: center;
  color: $color-forest;
}

.q-stepper :deep(.q-stepper__header) {
  background: $pastel-sage;
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 16px;
}

.q-stepper :deep(.q-stepper__tab--active) {
  background: linear-gradient(135deg, $color-leaf 0%, $color-moss 100%);
  color: white;
  border-radius: 8px;
}

.q-stepper :deep(.q-stepper__tab--done) {
  background: $pastel-mint;
  color: $color-forest;
  border-radius: 8px;
}

.q-stepper :deep(.q-stepper__dot) {
  background: $color-leaf;
}

.q-uploader__file {
  padding: 8px;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.q-field--outlined .q-field__control:hover) {
  border-color: $color-moss;
  box-shadow: 0 0 0 1px $pastel-mint;
}

:deep(.q-field--outlined.q-field--focused .q-field__control) {
  border-color: $color-leaf;
  box-shadow: 0 0 0 2px $pastel-mint;
}

:deep(.q-btn) {
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
}

:deep(.q-btn.bg-positive) {
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
}

:deep(.q-btn.bg-primary) {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
}

:deep(.q-btn.text-negative) {
  color: $color-wood;
}

:deep(.q-uploader) {
  border: 2px dashed $color-moss;
  border-radius: 12px;
  background: $pastel-sage;
}

:deep(.q-list) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.q-item) {
  background: $pastel-sand;
  margin-bottom: 4px;
  border-radius: 8px;
}

/* Estilos responsivos */
.responsive-dialog {
  width: 90vw;
  max-width: 900px;
}

.scrollable-dialog {
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  :deep(.q-card__section) {
    &:not(.dialog-header) {
      overflow-y: auto;
      flex: 1;
    }
  }
}

@media (max-width: 599px) {
  .responsive-dialog {
    width: 95vw;
    margin: 8px;
  }

  .scrollable-dialog {
    max-height: 95vh;
  }

  .dialog-header {
    padding: 16px;
  }

  .header-content-dialog {
    flex-direction: row;

    .q-icon {
      font-size: 24px !important;
    }

    .text-h5 {
      font-size: 1.2em;
    }
  }

  :deep(.q-stepper__header) {
    padding: 4px;
  }

  :deep(.q-stepper__tab) {
    min-height: 48px;
    padding: 8px 12px;
  }

  :deep(.q-card-section) {
    padding: 12px;
  }

  .row.q-col-gutter-md {
    margin-left: -8px;
    margin-right: -8px;

    >div {
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  :deep(.q-field__label) {
    font-size: 0.9em;
  }

  :deep(.q-btn) {
    padding: 8px 12px;
    font-size: 0.9em;
  }

  :deep(.q-stepper-navigation) {
    flex-wrap: wrap;
    gap: 8px;

    .q-btn {
      flex: 1;
      min-width: 120px;
    }
  }
}
</style>
