<template>
  <div id="contenedor">
    <div class="login-box">
      <div class="social-icons">
        <a href="https://wa.me/74545587" target="_blank" class="whatsapp-icon">
          <i class="bi bi-whatsapp"></i>
        </a>
        <a href="https://www.facebook.com/clubpetrotarija?locale=es_LA" target="_blank" class="facebook-icon">
          <q-icon name="facebook" />
        </a>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="logo-container">
            <img src="~assets/quasar-logo-vertical.svg" alt="Logo" class="logo">
          </div>
          <h2>Bienvenido</h2>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <div class="card-body">
          <q-form @submit="onSubmit">
            <div class="form-group">
              <div class="input-with-icon">
                <q-input class="full-width input-field" filled label="Usuario"
                  hint="No se olvide de las mayusculas o signos" id="username" v-model="form.usuario" outlined hide-hint
                  dense :rules="[rules.required]" />
              </div>
            </div>

            <div class="form-group">
              <div class=" q-gutter-y-md">
                <div class="password-input">
                  <q-input class="full-width input-field" id="password" v-model="form.clave"
                    :type="showPassword ? 'text' : 'password'" filled label="Contraseña" outlined
                    hint="No se olvide de las mayusculas o signos" bottom-slots dense :rules="[rules.required]">
                    <i size="lg" class="material-icons cursor-pointer" @click="showPassword = !showPassword" style="
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 1000;
      cursor: pointer;
      color: #666;

    ">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </i>
                  </q-input>
                </div>

              </div>
            </div>

            <div class="alert alert-warning" v-if="fallaUsu">
              <q-icon name="bi-exclamation-triangle-fill" />
              {{ mensaje }}
            </div>

            <q-btn type="submit" class="btn-login" :label="entrando ? 'Espere' : 'Iniciar sesión'" :loading="entrando">
            </q-btn>

            <div class="additional-options">
              <a href="#" class="forgot-password">¿Olvidaste tu contraseña?</a>
            </div>
          </q-form>
        </div>
      </div>
    </div>

    <div class="bg-animation">
      <div class="bg"></div>
      <div class="bg bg2"></div>
      <div class="bg bg3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation.js'
import { loguear } from 'src/stores/authentication/auth-store.js';

const $q = useQuasar();
const rules = useValidation();
const router = useRouter(); // Obtiene la instancia de Vue Routers

const form = ref({
  usuario: 'angel1',
  clave: 'looneytunes'
});
const showPassword = ref(false);
const entrando = ref(false);
const fallaUsu = ref(false);
const mensaje = ref('');

const onSubmit = async () => {
  try {
    entrando.value = true
    const data = await loguear(form.value)
    if (data.token) {
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      $q.notify({
        type: 'positive',
        message: data.mensaje,
        position: 'top',
      })
      router.push('/main');
    } else {
      entrando.value = false
      $q.notify({
        type: 'negative',
        message: 'Usuario y contraseña incorrectos',//data.error,
        position: 'top',
      })
    }
  } catch (error) {
    console.log(error)
    //   showErrorDialog({
    //   title: 'Acceso Denegado',
    // message: "Usuario o contraseña incorrectos. Por favor, intente de nuevo."
    //});
  }
  //finally {
  //$q.notify({
  //type: 'negative',
  //message: 'Error al iniciar sesión. Verifica tus credenciales.'
  //});
  //}
};

</script>

<style scoped>
/* Estilos generales */
#contenedor {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
}

.login-box {
  width: 100%;
  max-width: 420px;
  z-index: 10;
  position: relative;
}

/* Card styles */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.card-header {
  padding: 30px;
  text-align: center;
  background: linear-gradient(135deg, #4CAF50, #1f5021);
  color: white;
}

.card-header h2 {
  margin: 15px 0 5px;
  font-size: 24px;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.card-body {
  padding: 30px;
}

/* Logo */
.logo-container {
  display: flex;
  justify-content: center;
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* Form styles */
.form-group {
  margin-bottom: 20px;
}


/* Button styles */
.btn-login {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4CAF50, #1f5522);
  color: white;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-login:hover {
  background: linear-gradient(135deg, #43A047, #1B5E20);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
}

.btn-login.loading {
  background: #2E7D32;
  opacity: 0.8;
}

/* Additional options */
.additional-options {
  margin-top: 20px;
  text-align: center;
}

.forgot-password {
  color: #777;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.3s;
}

.forgot-password:hover {
  color: #4CAF50;
}

/* Alert */
.alert {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
}

/* Social icons */
.social-icons {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  z-index: 20;
}

.social-icons a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: white;
  text-decoration: none;
  font-size: 18px;
  transition: transform 0.3s;
}

.social-icons a:hover {
  transform: scale(1.1);
}

.whatsapp-icon {
  background-color: #25D366;
}

.facebook-icon {
  background-color: #3b5998;
}

/* Background animation */
.bg-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #3bb13f, #237e28);
  opacity: 0.1;
}

.bg2 {
  background: linear-gradient(135deg, #70c875, #53bb58);
  animation: slide 10s infinite;
}

.bg3 {
  background: linear-gradient(135deg, #96d698, #41ad45);
  animation: slide 15s infinite;
}

@keyframes slide {
  0% {
    transform: translateX(-25%) rotate(0deg);
  }

  50% {
    transform: translateX(25%) rotate(180deg);
  }

  100% {
    transform: translateX(-25%) rotate(360deg);
  }
}

/* Quasar input adjustments */
:deep(.q-field__control) {
  height: auto !important;
  min-height: auto !important;
  padding-left: 40px !important;
}

:deep(.q-field__native) {
  padding: 12px 15px 12px 0 !important;
}

:deep(.q-field__marginal) {
  display: none !important;
}

:deep(.q-field__control:before) {
  border: none !important;
}
</style>
