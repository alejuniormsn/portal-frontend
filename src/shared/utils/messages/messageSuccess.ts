import Swal from "sweetalert2";

export const messageSuccess = (message: string) => {
  return Swal.fire({
    position: "top-end",
    toast: true,
    icon: "success",
    title: "Sucesso!",
    text: message,
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 3000,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
};
