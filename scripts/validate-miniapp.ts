#!/usr/bin/env tsx

/**
 * Farcaster Mini App Validation Script
 * 
 * This script validates that all required components for Farcaster mini app deployment
 * are properly configured and accessible.
 */

import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
config({ path: '.env.local' })
config({ path: '.env' })

interface ValidationResult {
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
}

const results: ValidationResult[] = []

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string) {
    results.push({ name, status, message })
}

async function validateManifest() {
    try {
        const manifestPath = join(process.cwd(), 'config/miniapp/manifest.json')
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

        // Check required fields
        const requiredFields = [
            'accountAssociation',
            'miniapp.name',
            'miniapp.homeUrl',
            'miniapp.iconUrl',
            'miniapp.description'
        ]

        for (const field of requiredFields) {
            const keys = field.split('.')
            let value = manifest

            for (const key of keys) {
                value = value?.[key]
            }

            if (!value) {
                addResult('Manifest', 'fail', `Missing required field: ${field}`)
            }
        }

        // Validate URLs
        const urlFields = ['miniapp.homeUrl', 'miniapp.iconUrl', 'miniapp.splashImageUrl', 'miniapp.heroImageUrl']
        for (const field of urlFields) {
            const keys = field.split('.')
            let value = manifest

            for (const key of keys) {
                value = value?.[key]
            }

            if (value && !value.startsWith('https://')) {
                addResult('Manifest', 'warning', `${field} should use HTTPS: ${value}`)
            }
        }

        // Check domain consistency
        const homeUrl = manifest.miniapp?.homeUrl
        const payloadDomain = manifest.accountAssociation?.payload

        if (homeUrl && payloadDomain) {
            try {
                const decodedPayload = JSON.parse(Buffer.from(payloadDomain, 'base64').toString())
                const manifestDomain = new URL(homeUrl).hostname

                if (decodedPayload.domain !== manifestDomain) {
                    addResult('Manifest', 'warning',
                        `Domain mismatch: homeUrl domain (${manifestDomain}) != accountAssociation domain (${decodedPayload.domain})`
                    )
                }
            } catch (error) {
                addResult('Manifest', 'warning', 'Could not decode accountAssociation payload')
            }
        }

        addResult('Manifest', 'pass', 'Manifest structure is valid')

    } catch (error) {
        addResult('Manifest', 'fail', `Failed to read manifest: ${error}`)
    }
}

async function validateRoutes() {
    try {
        // Check if farcaster.json route exists
        const farcasterRoutePath = join(process.cwd(), 'app/.well-known/farcaster.json/route.ts')
        readFileSync(farcasterRoutePath, 'utf8')
        addResult('Routes', 'pass', '/.well-known/farcaster.json route exists')

        // Check if webhook route exists
        const webhookRoutePath = join(process.cwd(), 'app/api/webhook/route.ts')
        readFileSync(webhookRoutePath, 'utf8')
        addResult('Routes', 'pass', '/api/webhook route exists')

    } catch (error) {
        addResult('Routes', 'fail', `Missing required routes: ${error}`)
    }
}

async function validateAssets() {
    const requiredAssets = [
        'public/icon.png',
        'public/splash.png',
        'public/opengraph.png'
    ]

    for (const asset of requiredAssets) {
        try {
            const assetPath = join(process.cwd(), asset)
            readFileSync(assetPath)
            addResult('Assets', 'pass', `${asset} exists`)
        } catch (error) {
            addResult('Assets', 'fail', `Missing asset: ${asset}`)
        }
    }
}

async function validateEnvironment() {
    const requiredEnvVars = [
        'NEXT_PUBLIC_WEB3_MODE',
        'NEXT_PUBLIC_DOMAIN',
        'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'
    ]

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            addResult('Environment', 'warning', `Missing environment variable: ${envVar}`)
        } else {
            addResult('Environment', 'pass', `${envVar} is set`)
        }
    }
}

async function main() {
    console.log('🔍 Validating Farcaster Mini App Configuration...\n')

    await validateManifest()
    await validateRoutes()
    await validateAssets()
    await validateEnvironment()

    console.log('📋 Validation Results:\n')

    const passCount = results.filter(r => r.status === 'pass').length
    const failCount = results.filter(r => r.status === 'fail').length
    const warningCount = results.filter(r => r.status === 'warning').length

    for (const result of results) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
        console.log(`${icon} [${result.name}] ${result.message}`)
    }

    console.log(`\n📊 Summary: ${passCount} passed, ${failCount} failed, ${warningCount} warnings`)

    if (failCount > 0) {
        console.log('\n❌ Mini app validation failed. Please fix the issues above.')
        process.exit(1)
    } else if (warningCount > 0) {
        console.log('\n⚠️  Mini app validation passed with warnings. Consider addressing them.')
    } else {
        console.log('\n✅ Mini app validation passed! Ready for deployment.')
    }
}

main().catch(console.error)