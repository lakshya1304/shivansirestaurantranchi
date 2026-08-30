export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");
  
  // If exactly 10 digits, assume India and prepend +91
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  
  // If it's already 12 digits starting with 91, format it properly
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }
  
  // Return the original with a + if it has country code, or just as is
  return phone.startsWith("+") ? `+${digitsOnly}` : digitsOnly;
}
