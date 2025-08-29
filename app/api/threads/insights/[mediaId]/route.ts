import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { createClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/utils/crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params
  console.log('[Insights API] Request received for media ID:', mediaId)

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('[Insights API] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const socialId = request.headers.get('x-social-id')
    console.log('[Insights API] Social ID:', socialId)

    if (!socialId) {
      console.log('[Insights API] Missing social account ID')
      return NextResponse.json({ error: 'Social account ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the social account to retrieve the access token
    const { data: socialAccount, error: socialError } = await supabase
      .from('social_accounts')
      .select('access_token')
      .eq('social_id', socialId)
      .eq('owner', session.user.id)
      .single()

    if (socialError || !socialAccount) {
      console.log('[Insights API] Social account not found:', socialError)
      return NextResponse.json({ error: 'Social account not found' }, { status: 404 })
    }

    if (!socialAccount.access_token) {
      console.log('[Insights API] Threads not connected - no access token')
      return NextResponse.json({ error: 'Threads not connected' }, { status: 400 })
    }

    // Decrypt the access token
    let decryptedToken: string
    try {
      decryptedToken = decryptToken(socialAccount.access_token)
      console.log('[Insights API] Access token decrypted successfully')
    } catch (error) {
      console.error('[Insights API] Failed to decrypt access token:', error)
      return NextResponse.json({ error: 'Failed to decrypt access token' }, { status: 500 })
    }

    console.log('[Insights API] Access token found, fetching insights...')

    // Fetch media insights from Threads API
    // According to docs: https://developers.facebook.com/docs/threads/insights
    const insightsUrl = `https://graph.threads.net/v1.0/${mediaId}/insights`
    const insightsParams = new URLSearchParams({
      metric: 'views,likes,replies,reposts,quotes,shares', // Added 'quotes' as per docs
      access_token: decryptedToken
    })

    const fullUrl = `${insightsUrl}?${insightsParams}`
    console.log('[Insights API] Fetching from Threads API:', insightsUrl)
    console.log('[Insights API] With metrics: views,likes,replies,reposts,quotes,shares')

    const insightsResponse = await fetch(fullUrl)

    console.log('[Insights API] Threads API response status:', insightsResponse.status)

    if (!insightsResponse.ok) {
      const errorText = await insightsResponse.text()
      console.error('[Insights API] Threads API error response:', errorText)

      // If the media doesn't exist or insights aren't available, return empty insights
      if (insightsResponse.status === 400 || insightsResponse.status === 404) {
        console.log('[Insights API] Media not found or insights not available, returning zeros')
        return NextResponse.json({
          insights: {
            views: 0,
            likes: 0,
            replies: 0,
            reposts: 0,
            quotes: 0,
            shares: 0
          }
        })
      }

      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }

    const insightsData = await insightsResponse.json()
    console.log('[Insights API] Raw insights data from Threads:', JSON.stringify(insightsData, null, 2))

    // Parse the insights data from Threads API response
    // According to docs, the response format is:
    // { "data": [ { "name": "views", "values": [ { "value": 100 } ] }, ... ] }
    const insights: any = {
      views: 0,
      likes: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
      shares: 0
    }

    if (insightsData.data && Array.isArray(insightsData.data)) {
      insightsData.data.forEach((metric: any) => {
        if (metric.name && metric.values && metric.values[0]) {
          insights[metric.name] = metric.values[0].value || 0
          console.log(`[Insights API] Metric ${metric.name}: ${metric.values[0].value}`)
        }
      })
    } else {
      console.log('[Insights API] No data array in response')
    }

    console.log('[Insights API] Final insights object:', insights)
    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error fetching media insights:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}