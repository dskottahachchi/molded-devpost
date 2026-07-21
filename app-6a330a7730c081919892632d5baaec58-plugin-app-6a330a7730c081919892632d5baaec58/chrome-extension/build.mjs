import { build } from 'esbuild'
await build({entryPoints:['src/recorder.ts'],bundle:true,format:'iife',target:'chrome110',outfile:'recorder.js',minify:true})
