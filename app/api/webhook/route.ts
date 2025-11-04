import { NextRequest, NextResponse } from 'next/server'

/**
 * Farcaster Mini App Webhook Handler
 * 
 * This endpoint handles webhooks from the Farcaster platform for mini app events.
 * It can be used to receive notifications about user interactions, app installations,
 * and other mini app lifecycle events.
 */
export async function POST(request: NextRequest) {
    try {
        // Parse the webhook payload
        const payload = await request.json()

        // Log the webhook event for debugging
        console.log('Farcaster webhook received:', {
            timestamp: new Date().toISOString(),
            payload: JSON.stringify(payload, null, 2)
        })

        // Verify webhook signature if needed
        // const signature = request.headers.get('x-farcaster-signature')
        // if (!verifyWebhookSignature(payload, signature)) {
        //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        // }

        // Handle different webhook event types
        switch (payload.type) {
            case 'miniapp.install':
                console.log('Mini app installed by user:', payload.data?.user?.fid)
                // Handle app installation
                break

            case 'miniapp.uninstall':
                console.log('Mini app uninstalled by user:', payload.data?.user?.fid)
                // Handle app uninstallation
                break

            case 'miniapp.interaction':
                console.log('Mini app interaction:', payload.data)
                // Handle user interactions
                break

            default:
                console.log('Unknown webhook event type:', payload.type)
        }

        // Return success response
        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully'
        })

    } catch (error) {
        console.error('Webhook processing error:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

/**
 * Handle GET requests for webhook endpoint verification
 */
export async function GET() {
    return NextResponse.json({
        message: 'Farcaster Mini App Webhook Endpoint',
        status: 'active',
        timestamp: new Date().toISOString()
    })
}