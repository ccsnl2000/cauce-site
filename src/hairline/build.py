kit = open('/home/claude/cauce/hairline/src/kit.txt').read()
for n in ['lote','ciudad','fuentes','noches','pasos','gastos','costa']:
    s = open(f'/home/claude/cauce/hairline/src/{n}.js').read().replace('/*KIT*/', kit)
    open(f'/home/claude/cauce/hairline/{n}.js','w').write(s)
