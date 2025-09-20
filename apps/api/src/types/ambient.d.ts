// Minimal ambient module declarations for packages lacking @types in this repo
declare module 'node-cron' {
  const cron: any;
  export default cron;
}

declare module 'archiver' {
  const archiver: any;
  export default archiver;
}

declare module 'xml2js' {
  export const parseStringPromise: any;
}
