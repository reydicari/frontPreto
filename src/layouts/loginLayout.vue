<template>
  <div id="contenedor">
    <!-- Panel Izquierdo - Información y Bienvenida -->
    <div class="left-panel">
      <div class="bg-animation">
        <div class="bg"></div>
        <div class="bg bg2"></div>
        <div class="bg bg3"></div>
      </div>

      <div class="left-content">
        <div class="brand-section">

          <h1 class="brand-title">Club Petroambiental</h1>
          <p class="brand-subtitle">Escuela deportiva</p>
        </div>

        <div class="motivational-section">
          <div class="quote-icon">
            <q-icon name="format_quote" size="48px" />
          </div>
          <p class="motivational-text">
            El éxito es la suma de pequeños esfuerzos repetidos día tras día.
          </p>
        </div>

        <div class="features-section">
          <div class="feature-item">
            <q-icon name="emoji_events" size="32px" />
            <span>Competitividad</span>
          </div>
          <div class="feature-item">
            <q-icon name="groups" size="32px" />
            <span>Registro de actividades</span>
          </div>
          <div class="feature-item">
            <q-icon name="trending_up" size="32px" />
            <span>Progreso Continuo</span>
          </div>
        </div>

        <div class="social-icons">
          <a href="https://wa.me/74545587" target="_blank" class="whatsapp-icon">
            <i class="bi bi-whatsapp"></i>
          </a>
          <a href="https://www.facebook.com/clubpetrotarija?locale=es_LA" target="_blank" class="facebook-icon">
            <q-icon name="facebook" />
          </a>
        </div>
      </div>
    </div>

    <!-- Panel Derecho - Formulario de Login -->
    <div class="right-panel">
      <div class="login-container">
        <div class="logo-container-large">
          <img src="~assets/logo.png" alt="Logo" class="logo-large">
        </div>
        <div class="login-header">

          <h2>Bienvenido de nuevo</h2>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <q-form @submit="onSubmit" class="login-form">
          <div class="form-group">
            <label class="form-label">Usuario</label>
            <q-input v-model="form.usuario" outlined dense placeholder="Ingresa tu usuario" :rules="[rules.required]"
              class="modern-input">
              <template v-slot:prepend>
                <q-icon name="person" color="primary" />
              </template>
            </q-input>
            <span class="form-hint">No olvides las mayúsculas o signos</span>
          </div>

          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <q-input v-model="form.clave" :type="showPassword ? 'text' : 'password'" outlined dense
              placeholder="Ingresa tu contraseña" :rules="[rules.required]" class="modern-input">
              <template v-slot:prepend>
                <q-icon name="lock" color="primary" />
              </template>
              <template v-slot:append>
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                  @click="showPassword = !showPassword" />
              </template>
            </q-input>
            <span class="form-hint">No olvides las mayúsculas o signos</span>
          </div>

          <div class="alert alert-warning" v-if="fallaUsu">
            <q-icon name="warning" />
            {{ mensaje }}
          </div>

          <q-btn type="submit" class="btn-login" :label="entrando ? 'Iniciando sesión...' : 'Iniciar sesión'"
            :loading="entrando" unelevated no-caps />

          <!-- <div class="additional-options">
            <a href="#" class="forgot-password">¿Olvidaste tu contraseña?</a>
          </div> -->
        </q-form>
      </div>
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

// Obtener la fecha/hora local como cadena ISO sin el sufijo 'Z' (evita desplazamientos al interpretar como UTC)
const getLocalIsoWithoutZ = () => {
  const d = new Date()
  // aplicar offset para obtener la representación local en una ISO 'naive'
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  // devolver 'YYYY-MM-DD HH:mm:ss' (sin zona) — muchos backends esperan esto como local datetime
  // reemplazamos la 'T' por un espacio para una representación más legible
  return local.toISOString().slice(0, 19).replace('T', ' ')
}

// Alternativa: si prefieres enviar epoch (ms) usa Date.now() y el backend lo interpretará sin ambigüedad.
const form = ref({
  usuario: 'angel1',
  clave: 'looneytunes',
  // usando string local para evitar que el servidor lo interprete como UTC y lo desplace
  ultimo_ingreso: getLocalIsoWithoutZ()
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
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  background: #ffffff;
}

/* ========== PANEL IZQUIERDO ========== */
.left-panel {
  flex: 1;
  min-height: 100vh;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 50%, #1B5E20 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

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
  background: linear-gradient(45deg, rgba(76, 175, 80, 0.3), rgba(35, 126, 40, 0.3));
}

.bg2 {
  background: linear-gradient(135deg, rgba(112, 200, 117, 0.2), rgba(83, 187, 88, 0.2));
  animation: slide 12s infinite;
}

.bg3 {
  background: linear-gradient(225deg, rgba(150, 214, 152, 0.15), rgba(65, 173, 69, 0.15));
  animation: slide 18s infinite reverse;
}

@keyframes slide {

  0%,
  100% {
    transform: translate(-25%, -25%) rotate(0deg) scale(1);
  }

  50% {
    transform: translate(25%, 25%) rotate(180deg) scale(1.1);
  }
}

.left-content {
  position: relative;
  z-index: 10;
  color: white;
  padding: 60px 40px;
  max-width: 600px;
  animation: fadeInLeft 0.8s ease-out;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.brand-section {
  text-align: center;
  margin-bottom: 60px;
}

.logo-container-large {
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.logo-large {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 5px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.logo-large:hover {
  transform: scale(1.1) rotate(5deg);
}

.brand-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

.brand-subtitle {
  font-size: 20px;
  font-weight: 300;
  margin: 0;
  opacity: 0.95;
  letter-spacing: 2px;
}

.motivational-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeIn 1s ease-out 0.3s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.quote-icon {
  text-align: center;
  margin-bottom: 16px;
  opacity: 0.6;
}

.motivational-text {
  font-size: 22px;
  font-style: italic;
  line-height: 1.6;
  margin: 0 0 12px 0;
  text-align: center;
}

.motivational-author {
  font-size: 14px;
  text-align: center;
  opacity: 0.8;
  margin: 0;
  font-weight: 500;
}

.features-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 1s ease-out 0.5s both;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(10px);
}

.feature-item span {
  font-size: 16px;
  font-weight: 500;
}

.social-icons {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  z-index: 20;
}

.social-icons a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: white;
  text-decoration: none;
  font-size: 20px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.social-icons a:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.whatsapp-icon:hover {
  background: #25D366;
  border-color: #25D366;
}

.facebook-icon:hover {
  background: #3b5998;
  border-color: #3b5998;
}

/* ========== PANEL DERECHO ========== */
.right-panel {
  flex: 1;
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  animation: fadeInRight 0.8s ease-out;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.login-container {
  width: 100%;
  max-width: 480px;
}

.login-header {
  margin-bottom: 40px;
  animation: fadeIn 1s ease-out 0.2s both;
}

.login-header h2 {
  font-size: 36px;
  font-weight: 700;
  color: #2E7D32;
  margin: 0 0 8px 0;
}

.login-header p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.login-form {
  animation: fadeIn 1s ease-out 0.4s both;
}

.form-group {
  margin-bottom: 28px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-hint {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  font-style: italic;
}

.modern-input {
  transition: all 0.3s ease;
}

.modern-input:hover {
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

.btn-login {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  color: white;
  font-weight: 600;
  font-size: 16px;
  border-radius: 12px;
  margin-top: 12px;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.btn-login:hover {
  background: linear-gradient(135deg, #43A047, #1B5E20);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  transform: translateY(-2px);
}

.btn-login:active {
  transform: translateY(0);
}

.alert {
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: shake 0.5s ease;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.additional-options {
  margin-top: 24px;
  text-align: center;
}

.forgot-password {
  color: #4CAF50;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s;
  font-weight: 500;
}

.forgot-password:hover {
  color: #2E7D32;
  text-decoration: underline;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .left-panel {
    display: none;
  }

  .right-panel {
    flex: 1;
    width: 100%;
  }
}

@media (max-width: 768px) {
  #contenedor {
    flex-direction: column;
  }

  .left-panel {
    display: flex;
    min-height: 35vh;
    flex: none;
  }

  .left-content {
    padding: 30px 20px;
  }

  .brand-section {
    margin-bottom: 30px;
  }

  .logo-large {
    width: 80px;
    height: 80px;
  }

  .brand-title {
    font-size: 32px;
  }

  .brand-subtitle {
    font-size: 16px;
  }

  .motivational-section {
    padding: 20px;
    margin-bottom: 20px;
  }

  .motivational-text {
    font-size: 16px;
  }

  .features-section {
    display: none;
  }

  .social-icons {
    position: static;
    transform: none;
    margin-top: 20px;
    justify-content: center;
  }

  .right-panel {
    min-height: 65vh;
    padding: 30px 20px;
  }

  .login-header h2 {
    font-size: 28px;
  }

  .login-header p {
    font-size: 14px;
  }
}

/* Quasar input adjustments */
:deep(.q-field__control) {
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.q-field__control:hover) {
  border-color: #4CAF50;
}

:deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.15);
}

:deep(.q-field__native) {
  padding: 12px 15px;
  font-size: 15px;
}
</style>
