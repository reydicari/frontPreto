<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
  <q-page class="info-page bg-green-1">
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row justify-center q-mb-lg">
        <div class="col-12 text-center">
          <q-img
            src="~assets/quasar-logo-vertical.svg"
            style="max-width: 150px; margin: 0 auto;"
          />
          <h1 class="text-green-10 q-mt-md">Bienvenido a <span class="text-weight-bold">{{ appName }}</span></h1>
          <p class="text-green-9">Tu solución integral para la gestión de procesos</p>
        </div>
      </div>

      <!-- Features Cards -->
      <div class="row q-col-gutter-md q-mb-xl">
        <div class="col-12 col-md-4">
          <q-card class="feature-card bg-green-2">
            <q-card-section>
              <div class="text-center">
                <q-icon name="security" size="lg" color="green-8" class="q-mb-sm"/>
                <h5 class="text-green-10 q-mt-sm q-mb-xs">Seguridad</h5>
                <p class="text-green-9">Protegemos tus datos con encriptación de última generación.</p>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="feature-card bg-green-2">
            <q-card-section>
              <div class="text-center">
                <q-icon name="trending_up" size="lg" color="green-8" class="q-mb-sm"/>
                <h5 class="text-green-10 q-mt-sm q-mb-xs">Eficiencia</h5>
                <p class="text-green-9">Optimiza tus procesos y ahorra tiempo con nuestras herramientas.</p>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="feature-card bg-green-2">
            <q-card-section>
              <div class="text-center">
                <q-icon name="support_agent" size="lg" color="green-8" class="q-mb-sm"/>
                <h5 class="text-green-10 q-mt-sm q-mb-xs">Soporte</h5>
                <p class="text-green-9">Nuestro equipo está disponible para ayudarte cuando lo necesites.</p>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- App Description -->
      <div class="row justify-center q-mb-xl">
        <div class="col-12 col-md-8 text-center">
          <q-card class="bg-green-3 q-pa-lg">
            <h4 class="text-green-10 q-mt-none">¿Qué puedes hacer con nuestra plataforma?</h4>
            <p class="text-green-9">
              Nuestra solución te permite gestionar todos tus procesos de manera centralizada,
              con acceso desde cualquier dispositivo y en tiempo real. Simplifica tu trabajo
              diario con herramientas diseñadas para aumentar tu productividad.
            </p>
          </q-card>
        </div>
      </div>

      <!-- Testimonials -->
      <div class="row justify-center q-mb-xl">
        <div class="col-12">
          <h4 class="text-center text-green-10 q-mb-md">Lo que dicen nuestros usuarios</h4>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card class="testimonial-card bg-green-2">
                <q-card-section>
                  <q-avatar size="60px" class="q-mb-sm">
                    <img src="https://cdn.quasar.dev/img/avatar.png">
                  </q-avatar>
                  <p class="text-italic text-green-9">"Esta plataforma ha transformado nuestra forma de trabajar. ¡Altamente recomendada!"</p>
                  <p class="text-weight-bold text-green-10 q-mt-sm q-mb-none">- Carlos M.</p>
                  <p class="text-caption text-green-8">Director de Operaciones</p>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card class="testimonial-card bg-green-2">
                <q-card-section>
                  <q-avatar size="60px" class="q-mb-sm">
                    <img src="https://cdn.quasar.dev/img/avatar2.png">
                  </q-avatar>
                  <p class="text-italic text-green-9">"La facilidad de uso y el soporte son excepcionales. No podríamos estar más satisfechos."</p>
                  <p class="text-weight-bold text-green-10 q-mt-sm q-mb-none">- Laura G.</p>
                  <p class="text-caption text-green-8">Gerente de Proyectos</p>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="row justify-center">
        <div class="col-12 text-center">
          <q-btn
            label="Acceder a la plataforma"
            color="green-7"
            size="lg"
            class="q-px-xl q-py-sm"
            @click="goToLogin"
          />
          <p class="text-green-8 q-mt-md">¿Necesitas ayuda? <a href="#" class="text-green-10 text-weight-bold">Contáctanos</a></p>
        </div>
      </div>
    </div>
  </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'InfoPage',
  data() {
    return {
      appName: process.env.APP_NAME || 'Mi Aplicación'
    }
  },
  methods: {
    goToLogin() {
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.info-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feature-card {
  border-radius: 12px;
  transition: transform 0.3s;
  height: 100%;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.testimonial-card {
  border-radius: 12px;
  border-left: 4px solid green;
}

h1, h2, h3, h4, h5 {
  font-family: 'Roboto', sans-serif;
}

a {
  text-decoration: none;
}
</style>
