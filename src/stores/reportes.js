import { api } from "boot/axios.js";
const URL_PART = "/api/reportes";
export const reportePagos = async () => {
  try {
    const response = await api.get(URL_PART + "/pagos", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const reportePagosParams = async (params) => {
  try {
    const response = await api.get(URL_PART + "/pagos", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store reportePagosParams", error);
    return error.response?.data;
  }
};

// Generar y descargar Excel con los mismos params (asume endpoint /pagos/excel)
export const reportePagosExcel = async (params) => {
  try {
    const response = await api.get(URL_PART + "/pagosExcel", {
      params,
      responseType: "blob",
    });

    // Detectar content-type para elegir extensión correcta
    const contentType =
      (response.headers &&
        (response.headers["content-type"] ||
          response.headers["Content-Type"])) ||
      "";
    let ext = "xlsx";
    let mime =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (contentType.includes("csv") || contentType.includes("text/plain")) {
      ext = "csv";
      mime = "text/csv;charset=utf-8";
    } else if (
      contentType.includes("spreadsheetml") ||
      contentType.includes(
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
    ) {
      ext = "xlsx";
      mime =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (contentType.includes("octet-stream")) {
      // puede ser xlsx o xls; mantener xlsx por defecto
      ext = "xlsx";
      mime = "application/octet-stream";
    }

    const blob = new Blob([response.data], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `reporte_pagos_${new Date().toISOString().slice(0, 10)}.${ext}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return response.data;
  } catch (error) {
    console.log("error en el store reportePagosExcel", error);
    return error.response?.data;
  }
};
export const reportePersonas = async () => {
  try {
    const response = await api.get(URL_PART + "/estudiantes", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const reportePagosPersona = async (params) => {
  try {
    const response = await api.get(URL_PART + `/reportePagosPersona`, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const reporteAsistenciasEntrenamiento = async (params) => {
  try {
    const response = await api.get(URL_PART + `/asistenciasEntrenamiento`, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};

// Excel para asistencias por entrenamiento
export const reporteAsistenciasEntrenamientoExcel = async (params) => {
  try {
    const response = await api.get(
      URL_PART + "/asistenciasEntrenamientoExcel",
      {
        params,
        responseType: "blob",
      },
    );

    const contentType =
      (response.headers &&
        (response.headers["content-type"] ||
          response.headers["Content-Type"])) ||
      "";
    let ext = "xlsx";
    let mime =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (contentType.includes("csv") || contentType.includes("text/plain")) {
      ext = "csv";
      mime = "text/csv;charset=utf-8";
    }

    const blob = new Blob([response.data], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `reporte_asistencias_entrenamiento_${new Date().toISOString().slice(0, 10)}.${ext}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return response.data;
  } catch (error) {
    console.log("error en reporteAsistenciasEntrenamientoExcel", error);
    return error.response?.data;
  }
};
