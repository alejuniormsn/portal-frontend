import Swal from "sweetalert2";

export const confirmDialog = (
  title = "Realmente deseja prosseguir ?",
  text = "Este processo não poderá ser revertido!"
) =>
  Swal.fire({
    title: title,
    text: text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f9a825",
    cancelButtonColor: "#d11",
    confirmButtonText: "Sim, estou certo disso",
  }).then((result) => {
    if (result.isConfirmed) return true;
  });
