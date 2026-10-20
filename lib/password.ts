export function isStrongPassword(password: string) {
  const byteLength = new TextEncoder().encode(password).length;

  return (
    password.length >= 8 &&
    byteLength <= 72 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    !/\s/.test(password)
  );
}
