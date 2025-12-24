const routes = [
  {
    path: "/",
    redirect: "/login",
    children: [
      { path: "login", component: () => import("layouts/loginLayout.vue") },
    ],
  },
  {
    path: "/main",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/mainPage.vue") },
      {
        path: "/usuarios",
        component: () => import("pages/usuarios/Usuarios-Page.vue"),
      },
      {
        path: "/estudiantes",
        component: () => import("pages/estudiantes/estudiantePage.vue"),
      },
      {
        path: "/roles",
        component: () => import("pages/usuarios/Roles-Page.vue"),
      },
      {
        path: "/menus",
        component: () => import("pages/usuarios/Menus-Page.vue"),
      },
      {
        path: "/entrenamientos",
        component: () => import("pages/entrenamientos/Entrenamientos-Page.vue"),
      },
      {
        path: "/torneos",
        component: () => import("pages/torneos/Torneos-Module.vue"),
      },
      {
        path: "/torneos/seguimiento/:id",
        component: () => import("pages/torneos/SeguimientoTorneoPage.vue"),
      },
      {
        path: "/entrenadores",
        component: () => import("pages/entrenadores/Entrenadores-Page.vue"),
      },
      {
        path: "/inscripciones",
        component: () => import("pages/inscripciones/Inscripciones_Page.vue"),
      },
      {
        path: "/reportes",
        component: () => import("pages/reportes/Reportes-Page.vue"),
      },
      {
        path: "/reportePagos",
        component: () => import("pages/reportes/ReportePagos-Page.vue"),
      },
      {
        path: "/reporteEntrenamientos",
        component: () =>
          import("pages/reportes/ReporteEntrenamientos-Page.vue"),
      },
      {
        path: "/reporteTorneos",
        component: () => import("pages/reportes/reportesTorneo-page.vue"),
      },
      {
        path: "/reporteEstudiantes",
        component: () => import("pages/reportes/reporteEstudiantes-page.vue"),
      },
      {
        path: "/reporteInscripciones",
        component: () => import("pages/reportes/reporteInscripciones-page.vue"),
      },
      {
        path: "/reporteEntrenadores",
        component: () => import("pages/reportes/reporteEntrenadores-page.vue"),
      },
      {
        path: "/reportePaquetes",
        component: () => import("pages/reportes/reportePaquetes-page.vue"),
      },
      {
        path: "/reporteGastos",
        component: () => import("pages/reportes/reporteGastos-page.vue"),
      },
      {
        path: "/paisaje",
        component: () => import("pages/vista/paisaje-Page.vue"),
      },
      { path: "/pagos", component: () => import("pages/pagos/pagos-page.vue") },
      {
        path: "/disciplinas",
        component: () => import("pages/disciplinas/disciplinas-Page.vue"),
      },
      {
        path: "/paquetes",
        component: () => import("pages/paquetes/paquetes-page.vue"),
      },
      {
        path: "/niveles",
        component: () => import("pages/niveles/nivel-page.vue"),
      },
      {
        path: "/ubicaciones",
        component: () => import("pages/ubicaciones/ubicacion-page.vue"),
      },
      {
        path: "/gastos",
        component: () => import("pages/gastos/gastos-page.vue"),
      },
    ],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
