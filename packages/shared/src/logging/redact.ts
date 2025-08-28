// Redacta emails, teléfonos y documentos en strings/objetos
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /\b\d{9,15}\b/g;
const DOC_REGEX = /\b\d{8}[A-Z]?\b/g; // Ejemplo: DNI/NIE simple

export function redactPII(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(PHONE_REGEX, '[REDACTED_PHONE]')
      .replace(DOC_REGEX, '[REDACTED_DOC]');
  }
  if (typeof input === 'object' && input !== null) {
    const out: any = Array.isArray(input) ? [] : {};
    for (const k in input) {
      out[k] = redactPII(input[k]);
    }
    return out;
  }
  return input;
}

export function safeLog(...args: any[]) {
  const redacted = args.map(redactPII);
  // eslint-disable-next-line no-console
  console.log(...redacted);
}