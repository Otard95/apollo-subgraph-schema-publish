require('dotenv/config')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')
const nodemon = require('nodemon')
const TscWatchClient = require('tsc-watch/client')
const typescriptWatch = new TscWatchClient()
const tscAlias = require('tsc-alias')

const ViewController = require('../console/view-controller')

const config = require('../src/config.json')

// Constants
const EXIT_CODES = {
  ENDPOINT_SETUP_SAVE_FAIL: 1,
  INTERNALS_FOLDER_UNEXPECTED_CREATE_ERROR: 2,
}
const INTERNALS_FOLDER = '.dev-gateway-internal'
const INTERNALS = {
  EndpointSetup: 'eps.json'
}

// Globals
let exit, VC, devServer

const arraySameContents = (arr1, arr2) => {
  arr1.sort()
  arr2.sort()
  return arr1.join(',') === arr2.join(',')
}

const getInternal = (file) => {
  const path2file = path.resolve(process.cwd(), INTERNALS_FOLDER, file)
  try {
    return JSON.parse(
      fs.readFileSync(
        path2file,
        { encoding: 'utf-8' }
      )
    )
  } catch (e) {
    return false
  }
}

const setInternal = (file, contents) => {
  const path2file = path.resolve(process.cwd(), INTERNALS_FOLDER, file)
  try {
    fs.writeFileSync(
      path2file,
      JSON.stringify(contents),
      { encoding: 'utf-8' }
    )
    return true
  } catch (e) {
    return false
  }
}

const createEndpointSetup = async () => {

  const questions = config.endpoints.map(ep => ([
    {
      type: 'confirm',
      name: `${ep.name}.useLocal`,
      message: `Use local endpoint for ${ep.name}`,
      default: false,
    },
    {
      type: 'input',
      name: `${ep.name}.host`,
      message: 'Hostname',
      default: 'http://localhost',
      when: answers => answers[ep.name].useLocal,
    },
    {
      type: 'number',
      name: `${ep.name}.port`,
      message: 'Port',
      default: 4000,
      when: answers => answers[ep.name].useLocal,
    }
  ]))
  .flat()

  return await inquirer.prompt(questions)

}

/**
 *
 * @param {string} prefix
 */
const prefixLines = (prefix, buff) => {
  return `${buff}`
    .split(/[\n\r]/)
    .map(line => line.length > 0 ? `${prefix} | ${line}` : line)
    .map(line => line.trim())
    .join('\n')
}

const writeEndpointsFile = (setup) => {
  const endpoints = []
  for (const [key, opt] of Object.entries(setup)) {
    endpoints.push({
      name: key,
      url: opt.useLocal
        ? `${opt.host}:${opt.port}/graphql`
        : config.endpoints.find(ep => ep.name === key).url
    })
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), 'src', 'dev-endpoints.json'),
    JSON.stringify(endpoints),
    { encoding: 'utf-8' }
  )
}

const printEndpointSetup = (eps) => `${chalk.cyan('Current setup')}:\n\n${
  Object.keys(eps)
    .map(key => `  ${chalk.cyan(key)}: ${
      eps[key].useLocal ? chalk.magenta('local') : chalk.rgb(255, 165, 0)('development')
      } ${
      chalk.rgb(120, 120, 120)(
        eps[key].useLocal
          ? `(${eps[key].host}:${eps[key].port}/graphql)`
          : `(${config.endpoints.find(ep => ep.name === key).url})`
      )
      }`
    )
    .join('\n')
  }`


function clear() {
  process.stdout.write(new Array(process.stdout.rows).fill('\n').join(''))
  process.stdout.cursorTo(0, 0)
}

/**
 * @param {nodemon} nm
 * @param {ViewController} VC
*/
const printHelp = (_nm, VC) => {
  VC.writeBottom(
    ' KEY     ACTION',
    '  q       Shutdown the gateway and quit to console',
    '  r       Restart nodemon',
    '  e       Edit endpoints',
    '  h       Print this...',
  )
}

/**
 * @param {nodemon} nm
 * @param {ViewController} VC
*/
const editEndpoints = async (nm, VC) => {
  // Stop custom keystroke handler
  process.stdin.removeListener('data', handleKeystroke)

  // Pause ViewController and clear console
  VC.pause()
  clear()

  // Let the user create the new endpoint setup and save to internals and src
  endpointSetup = await createEndpointSetup()
  if (!setInternal(INTERNALS.EndpointSetup, endpointSetup)) {
    console.error(`Failed to save endpoint setup`)
    process.exit(EXIT_CODES.ENDPOINT_SETUP_SAVE_FAIL)
  }
  writeEndpointsFile(endpointSetup)

  // Restart custom keystroke handler
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', handleKeystroke)

  // Write the new setup to ViewController, restart nodemon
  VC.writeTop(printEndpointSetup(endpointSetup))
  nm.emit('restart')
  VC.unpause()
}

const ACTIONS = {
  'h': printHelp,
  'r': nm => nm.emit('restart'),
  'e': editEndpoints,
  'j': (_nm, view) => view.scrollDown(10),
  'k': (_nm, view) => view.scrollUp(10),
  'a': (_nm, view) => view.attach(),
  'd': (_nm, view) => view.detach(),
}

const handleKeystroke = (key) => {
    if (key === '\u0003' || key === 'q') {
      exit()
    }
    if (ACTIONS[key]) ACTIONS[key](devServer, VC)
    if (key !== 'h')
      VC.writeBottom(
        'Running GQL Gateway development server',
        '  Press `q` or `ctrl+c` at any time to quit',
        '  Press `h` for more help',
        '',
        '  Scroll with j and k. Detach/Attach with d/a',
      )
  }


const initEndpoints = async () => {

  let endpointSetup = getInternal(INTERNALS.EndpointSetup)

  if (endpointSetup && arraySameContents(Object.keys(endpointSetup), config.endpoints.map(o => o.name))) {
    const { useLast } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useLast',
        message: printEndpointSetup(endpointSetup)
          .concat('\n\nDo you want to use this configuration'),
        default: true,
      }
    ])
    if (!useLast) {
      console.log()
      endpointSetup = await createEndpointSetup()
      if (!setInternal(INTERNALS.EndpointSetup, endpointSetup)) {
        console.error(`Failed to save endpoint setup`)
        process.exit(EXIT_CODES.ENDPOINT_SETUP_SAVE_FAIL)
      }
    }
  } else {
    endpointSetup = await createEndpointSetup()
    if (!setInternal(INTERNALS.EndpointSetup, endpointSetup)) {
      console.error(`Failed to save endpoint setup`)
      process.exit(EXIT_CODES.ENDPOINT_SETUP_SAVE_FAIL)
    }
  }

  writeEndpointsFile(endpointSetup)

  return espString = printEndpointSetup(endpointSetup)

}

async function main() {

  // Make sure internals folder exists
  const { S_IRUSR, S_IWUSR, S_IXUSR, S_IRGRP, S_IROTH } = fs.constants
  try {
    fs.mkdirSync(path.resolve(process.cwd(), INTERNALS_FOLDER), {
      recursive: false,
      mode: S_IRUSR | S_IWUSR | S_IXUSR | S_IRGRP | S_IROTH
    })
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.error('Unexpected error while trying to create internals folder', e)
      process.exit(EXIT_CODES.INTERNALS_FOLDER_UNEXPECTED_CREATE_ERROR)
    }
  }

  let useApolloStudio = false
  if ('APOLLO_STUDIO_KEY' in process.env) {
    const { useApolloStudioIn } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useApolloStudioIn',
      message: 'Use Apollo Studio',
      default: false,
    }])
    useApolloStudio = useApolloStudioIn
  } else {
    console.log(
      chalk`\n\n{yellow WARNING} No Apollo Studio Key found!\n`,
      '  Add APOLLO_KEY to you environments or .env file to be able to use Apollo Studio\n\n'
    )
  }

  const topDisplayText = useApolloStudio
    ? 'Using Apollo Studio'
    : await initEndpoints()

  VC = new ViewController(process.stdout, {
    topBufferSize: topDisplayText.split('\n').length,
    bottomBufferSize: 5
  })

  VC.writeTop(topDisplayText)

  const nodemonEnv = {
    'NODE_ENV': process.env.NODE_ENV || 'development',
    'LOCAL_DEV_CONSOLE': 'true',
    ...(useApolloStudio
      ? {'APOLLO_KEY': process.env['APOLLO_STUDIO_KEY']}
      : {}),
  }
  VC.write(`[STARTING](nodemon) envs: ${JSON.stringify(nodemonEnv, null, 2)}`)
  devServer = nodemon({
    env: {...process.env, ...nodemonEnv},
    script: 'build/index.js',
    exec: 'node --inspect=9230',
    watch: 'build/**/*',
    colours: true,
    cwd: process.cwd(),
    stdout: false,
    delay: 1,
    runOnChangeOnly: true,
  })

  devServer.on('log', (args) => {
    VC.write(prefixLines(chalk.cyan('nodemon'), args.colour))
  })
  devServer.on('stdout', (data) => {
    VC.write(prefixLines(chalk.cyan('nodemon'), data))
  })
  devServer.on('stderr', (data) => {
    VC.write(prefixLines(chalk.cyan('nodemon'), data))
  })

  typescriptWatch.start('--project', '.', '--preserveWatchOutput')

  const replaceTscAliasPaths = () => {
    // As we use paths for aliasing src root, this won't be translated for the compiled code. Runtime would then still use the @-prefix
    // Solved by using tsc-alias as mentioned here: https://github.com/Microsoft/TypeScript/issues/15479#issuecomment-660226606
    tscAlias.replaceTscAliasPaths({ silent:true })
  }

  typescriptWatch.on('success', replaceTscAliasPaths)
  typescriptWatch.on('compile_errors', replaceTscAliasPaths)

  exit = (code = 0) => {
    console.log(`Shutting down server...`)
    typescriptWatch.kill()
    devServer.on(
      'exit',
      () => {
        if (VC.ready)
          process.nextTick(() => process.exit(code))
        else
          VC.on('ready', () => process.nextTick(() => process.exit(code)))
      }
    )
    devServer.emit('quit')
  }

  process.on('SIGTERM', () => {
    exit()
  })
  process.on('beforeExit', () => {
    exit()
  })

  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', handleKeystroke)

  VC.writeBottom(
    'Running GQL Gateway development server',
    '  Press `q` or `ctrl+c` at any time to quit',
    '  Press `h` for more help',
    '',
    '  Scroll with j and k. Detach with d and reattach with a',
  )

}

try {

  clear()
  main()

} catch (e) {
  console.error(`uncaught error in main()`, e)
  if (exit) exit(-1)
}
