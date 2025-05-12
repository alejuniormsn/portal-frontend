export const handleErrorMessage = (error: any) => {
  return `${
    Array.isArray(error.message)
      ? error.message.map((item: any) => item.error).join(", ")
      : typeof error.message === "object"
      ? Object.values(error.message).join(", ")
      : error.message || "Backend offline"
  }`;
};
