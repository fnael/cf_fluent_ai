export function handleError(error, message = "Server error") {
  return {
    error: message,
    details: error?.message || String(error),
  };
}

