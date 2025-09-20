import fs from 'node:fs'

// Try to use YAML parser if available
let yaml = null
try{
  yaml = (await import('yaml')).default
}catch(e){
  yaml = null
}

const specPath = 'apps/api/openapi/openapi.yaml'
const runtimePath = 'snapshots/openapi.runtime.json'

if(!fs.existsSync(specPath)){
  console.error('OpenAPI spec not found at', specPath); process.exit(1)
}
if(!fs.existsSync(runtimePath)){
  console.error('Runtime snapshot not found at', runtimePath); process.exit(1)
}

const specRaw = fs.readFileSync(specPath,'utf8')
let spec
if(yaml){
  spec = yaml.parse(specRaw)
}else{
  try{ spec = JSON.parse(specRaw) }catch(e){
    console.error('No YAML parser available and spec is not JSON. Install "yaml" package.'); process.exit(1)
  }
}

const runtime = JSON.parse(fs.readFileSync(runtimePath,'utf8'))

const specPaths = spec.paths || {}
const runtimePaths = runtime.paths || runtime.v1Paths || {}

// Focus on /v1/ paths if available
function pickV1(paths){
  const out = {}
  for(const p of Object.keys(paths||{})){
    if(p.startsWith('/v1/')) out[p] = paths[p]
  }
  return out
}

const sPaths = Object.keys(pickV1(specPaths)).length ? pickV1(specPaths) : specPaths
const rPaths = Object.keys(pickV1(runtimePaths)).length ? pickV1(runtimePaths) : runtimePaths

const added = []
const removed = []
const modified = []

const all = new Set([...Object.keys(sPaths), ...Object.keys(rPaths)])
for(const p of all){
  const s = sPaths[p]
  const r = rPaths[p]
  if(s && !r) added.push(p)
  else if(!s && r) removed.push(p)
  else if(s && r){
    const sMethods = Object.keys(s)
    const rMethods = Object.keys(r)
    const mAll = new Set([...sMethods, ...rMethods])
    let changed = false
    for(const m of mAll){
      if(!s[m] && r[m]) { changed = true; break }
      if(s[m] && !r[m]) { changed = true; break }
    }
    if(changed) modified.push(p)
  }
}

const diff = { timestamp: new Date().toISOString(), added, removed, modified, hasChanges: added.length>0||removed.length>0||modified.length>0 }
fs.mkdirSync('reports',{recursive:true})
fs.writeFileSync('reports/openapi-diff.json', JSON.stringify(diff, null, 2))

if(diff.hasChanges){
  console.error('OpenAPI spec differs from runtime snapshot')
  console.error('Wrote reports/openapi-diff.json')
  process.exit(1)
}

console.log('OpenAPI matches runtime')
process.exit(0)