// Usenet Provider Configuration
export interface ProviderConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  ssl: boolean
  connections: number
  retention: number
  enabled: boolean
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'eweka',
    name: 'Eweka',
    host: process.env.USENET_PROVIDER_HOST!,
    port: Number(process.env.USENET_PROVIDER_PORT ?? 563),
    username: process.env.USENET_PROVIDER_USERNAME!,
    password: process.env.USENET_PROVIDER_PASSWORD!,
    ssl: (process.env.USENET_PROVIDER_SSL ?? 'true') === 'true',
    connections: Number(process.env.USENET_PROVIDER_CONNECTIONS ?? 20),
    retention: Number(process.env.USENET_PROVIDER_RETENTION ?? 4000),
    enabled: true,
  },
]