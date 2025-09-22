import manifest from './manifest.json'

type MiniAppConfig = typeof manifest.miniapp

const config = manifest.miniapp ?? manifest.frame

if (!config) {
  throw new Error('Mini app manifest is missing the `miniapp` (or `frame`) section.')
}

const buildFcMiniAppMetadata = (miniApp: MiniAppConfig) => {
  const action: Record<string, string> = {
    type: 'launch_miniapp',
    name: miniApp.name,
    url: miniApp.homeUrl,
  }

  if (miniApp.splashImageUrl) {
    action.splashImageUrl = miniApp.splashImageUrl
  }

  if (miniApp.splashBackgroundColor) {
    action.splashBackgroundColor = miniApp.splashBackgroundColor
  }

  return {
    version: 'next',
    imageUrl: miniApp.heroImageUrl ?? miniApp.ogImageUrl ?? miniApp.iconUrl,
    button: {
      title: `Open ${miniApp.name}`,
      action,
    },
  }
}

export const miniAppManifest = manifest

export const fcMiniAppMetadata = buildFcMiniAppMetadata(config)

export const miniAppName = config.name
