import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timerProgressBar: true,
  timer: 4000,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});
export const doNotRun = (
  message = "Ação permitida apenas pelo setor responsável se não estiver finalizado",
  title = "Ação não permitida"
) =>
  Toast.fire({
    icon: "warning",
    title: title,
    text: message,
  });

export const doNotDelete = (
  message = "Registro só pode ser excluído pelo setor responsável se não estiver finalizado",
  title = "Status não permite esta ação!"
) =>
  Toast.fire({
    icon: "warning",
    title: title,
    text: message,
  });
