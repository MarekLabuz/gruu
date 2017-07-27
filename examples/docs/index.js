const prettyHTML = html => {
  let counter = 0
  const tab = '   '
  return html
    .replace(/>/g, '>\n')
    .replace(/</g, '\n<')
    .replace(/\n\n/g, '\n')
    .split(/\n/)
    .slice(1, -1)
    .map((v) => {
      const r1 = /<[^(>|/)]*>/.test(v)
      const r2 = /<\/[^(>)]*>/.test(v)
      counter += r1 ? 1 : 0
      const a = `${Array(!r1 && !r2 ? counter + 1 : counter).fill(tab).join('')}${v}`
      counter -= (r2 || v === '<input>') ? 1 : 0
      return a
    })
    .join('\n')
}

