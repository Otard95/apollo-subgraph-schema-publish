import { config as dotenvConfig } from 'dotenv'

process.env = {
  ...(dotenvConfig()?.parsed || {}),
  ...process.env,
}
