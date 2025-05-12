import Swal from "sweetalert2";

export const messageError = (
  message = "Error",
  text = "Ops! Verifique suas informações..."
) => {
  return Swal.fire({
    position: "top-end",
    toast: true,
    icon: "error",
    title: message,
    text: text,
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 4000,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
};
