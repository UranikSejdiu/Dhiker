const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function getGitVersion() {
  try {
    const commitCount = parseInt(
      execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim(),
      10
    )
    const patch = commitCount % 10
    const minor = Math.floor(commitCount / 10) % 10
    const major = 1 + Math.floor(commitCount / 100)
    return `${major}.${minor}.${patch}`
  } catch {
    return '1.0.0'
  }
}

const version = getGitVersion()
const filePath = path.join(__dirname, '..', 'src', 'constants', 'version.ts')
const dirPath = path.dirname(filePath)

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true })
}

fs.writeFileSync(
  filePath,
  `// Generated automatically by prebuild script. Do not edit.\nexport const APP_VERSION = '${version}';\n`,
  'utf-8'
)

console.log(`Version ${version}`)
