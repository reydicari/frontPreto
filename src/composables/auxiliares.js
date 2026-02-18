export const currentUser = () => {
  const current = JSON.parse(sessionStorage.getItem("user"));
  console.log("usuario actual: ", current);
  return current ? current : null;
};

export const isNotStudent = () => {
  const savedRoleId = sessionStorage.getItem("selectedRoleId");
  return savedRoleId !== "3";
};
