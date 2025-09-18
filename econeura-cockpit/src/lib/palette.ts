// Paleta de colores y tokens de diseño - ECONEURA Cockpit
export type DeptKey = 'ceo' | 'ia' | 'cso' | 'cto' | 'ciso' | 'coo' | 'chro' | 'cgo' | 'cfo' | 'cdo';

export const palette: Record<DeptKey, { name: string; primary: string }> = {
  ceo: { name: 'Ejecutivo (CEO)', primary: '#5D7177' },
  ia: { name: 'Plataforma IA', primary: '#7084B5' },
  cso: { name: 'Estrategia (CSO)', primary: '#896D67' },
  cto: { name: 'Tecnología (CTO)', primary: '#9194A4' },
  ciso: { name: 'Seguridad (CISO)', primary: '#7E9099' },
  coo: { name: 'Operaciones (COO)', primary: '#C7A98C' },
  chro: { name: 'RRHH (CHRO)', primary: '#EED1B8' },
  cgo: { name: 'Marketing y Ventas (CGO)', primary: '#B49495' },
  cfo: { name: 'Finanzas (CFO)', primary: '#899796' },
  cdo: { name: 'Datos (CDO)', primary: '#AAB7CA' },
};

export const ui = {
  bg: '#F7F7F2',
  ink: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  r: 16,
  bw: 1.5,
};

export const getDeptColor = (dept: DeptKey): string => palette[dept].primary;
export const getDeptName = (dept: DeptKey): string => palette[dept].name;

