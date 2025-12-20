import { api } from "boot/axios.js";
const URL_PART = "/api/reportes";

export const reportePagosParams = async (params) => {
  try {
    const response = await api.post(URL_PART + "/pagos", params, {
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
    const response = await api.post(URL_PART + "/pagosExcel", params, {
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
    const response = await api.post(URL_PART + "/asistenciasPDF", params, {
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

// Excel para asistencias por entrenamiento
export const reporteAsistenciasEntrenamientoExcel = async (params) => {
  try {
    const response = await api.post(URL_PART + "/asistenciasExcel", params, {
      responseType: "blob",
    });

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

// PDF para inscripción
export const reporteInscripcionPDF = async (params) => {
  try {
    const response = await api.post(
      URL_PART + "/reporteInscripcionPDF",
      params,
      {
        params,
        responseType: "blob",
      },
    );
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store reporteInscripcionPDF", error);
    return error.response?.data;
  }
};

// Excel para inscripción
export const reporteInscripcionExcel = async (params) => {
  try {
    const response = await api.post(
      URL_PART + "/reporteInscripcionExcel",
      params,
      {
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
      `reporte_inscripcion_${new Date().toISOString().slice(0, 10)}.${ext}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return response.data;
  } catch (error) {
    console.log("error en reporteInscripcionExcel", error);
    return error.response?.data;
  }
};

// PDF para entrenadores
export const reporteEntrenadorPDF = async (params) => {
  try {
    const response = await api.post(
      URL_PART + "/reporteEntrenadorPDF",
      params,
      {
        params,
        responseType: "blob",
      },
    );
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store reporteEntrenadorPDF", error);
    return error.response?.data;
  }
};

// Excel para entrenadores
export const reporteEntrenadorExcel = async (params) => {
  try {
    const response = await api.post(
      URL_PART + "/reporteEntrenadorExcel",
      params,
      {
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
      `reporte_entrenadores_${new Date().toISOString().slice(0, 10)}.${ext}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return response.data;
  } catch (error) {
    console.log("error en reporteEntrenadorExcel", error);
    return error.response?.data;
  }
};

// PDF para paquetes
export const reportePaquetePDF = async (params) => {
  try {
    const response = await api.post(URL_PART + "/reportePaquetePDF", params, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store reportePaquetePDF", error);
    return error.response?.data;
  }
};

// Excel para paquetes
export const reportePaqueteExcel = async (params) => {
  try {
    const response = await api.post(URL_PART + "/reportePaqueteExcel", params, {
      responseType: "blob",
    });

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
      `reporte_paquetes_${new Date().toISOString().slice(0, 10)}.${ext}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return response.data;
  } catch (error) {
    console.log("error en el store reportePaqueteExcel", error);
    return error.response?.data;
  }
};

export const reporteTorneoPDF = async (params) => {
  try {
    const response = await api.post(URL_PART + "/reporteTorneoPDF", params, {
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

// Excel para asistencias por entrenamiento
export const reporteTorneoExcel = async (params) => {
  try {
    const response = await api.post(URL_PART + "/reporteTorneoExcel", params, {
      responseType: "blob",
    });

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

// PDF para gastos
export const reporteGastoPDF = async (params) => {
  try {
    const response = await api.post(URL_PART + "/reporteGastoPDF", params, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store reporteGastoPDF", error);
    return error.response?.data;
  }
};

// Excel para gastos
export const reporteGastoExcel = async (params) => {
  try {
    const response = await api.post(URL_PART + "/reporteGastoExcel", params, {
      responseType: "blob",
    });

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
      `reporte_gastos_${new Date().toISOString().slice(0, 10)}.${ext}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return response.data;
  } catch (error) {
    console.log("error en el store reporteGastoExcel", error);
    return error.response?.data;
  }
};
