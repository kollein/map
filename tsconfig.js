import fs from 'fs'

const mode = process.argv[2]

function copyFile(sourcePath, destinationPath) {
  try {
    fs.copyFileSync(sourcePath, destinationPath)
    console.log(`File copied successfully from ${sourcePath} to ${destinationPath}`)
  } catch (error) {
    console.error(`An error occurred while copying the file: ${error.message}`)
  }
}

const sourceFile = mode === 'build' ? 'tsconfig.build.json' : 'tsconfig.dev.json'
const destinationFile = 'tsconfig.json'
copyFile(sourceFile, destinationFile)
