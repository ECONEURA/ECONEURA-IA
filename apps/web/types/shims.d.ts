// Shim para pacificar referencias implícitas de tipos a 'ioredis'
declare module 'ioredis' {
  const IORedis: any
  export default IORedis
  export type Redis = any
}
