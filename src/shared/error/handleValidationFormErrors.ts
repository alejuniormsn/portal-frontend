import { IVFormErrors } from "../forms";
import * as yup from "yup";

export const handleValidationFormErrors = (error: any, formRef: any) => {
  const validationErrors: IVFormErrors = {};
  error.inner.forEach((err: yup.ValidationError) => {
    if (err.path) {
      validationErrors[err.path] = err.message;
    }
  });
  formRef.current?.setErrors(validationErrors);
};
