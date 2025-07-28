'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { LogOutIcon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import useSocialAccountStore from '@/stores/useSocialAccountStore'
import { PricingModal } from '@/components/modals/PricingModal'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [language, setLanguage] = useState('ko')
  const [showPricingModal, setShowPricingModal] = useState(false)

  // 유저 프로필 상태 (user_profiles 테이블)
  const [userProfile, setUserProfile] = useState<{
    id?: string;
    name?: string;
    email?: string;
    user_id?: string;
    plan_type?: string;
  } | null>(null)

  // 소셜 계정 관련 상태 (social_accounts 테이블)
  const { accounts } = useSocialAccountStore()
  const [selectedSocialAccount, setSelectedSocialAccount] = useState('')
  const [accountInfo, setAccountInfo] = useState('')
  const [accountType, setAccountType] = useState<string>('')
  const [accountTags, setAccountTags] = useState<string[]>([])
  const [profileDescription, setProfileDescription] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)


  // 사용자 프로필 정보 로드
  const fetchUserProfile = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, plan_type')
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        console.error('User profile load error:', error)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error occurred while loading user profile:', error)
    }
  }, [status, session?.user?.id])

  useEffect(() => {
    fetchUserProfile()
  }, [session?.user?.id, status, fetchUserProfile])

  // 계정 정보 로드
  useEffect(() => {
    if (!selectedSocialAccount) return

    const fetchAccountDetails = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        // social_accounts 테이블에서 계정 정보 로드
        const { data: accountData, error: accountError } = await supabase
          .from('social_accounts')
          .select('account_type, account_info, account_tags, profile_description')
          .eq('social_id', selectedSocialAccount)
          .single()

        if (!accountError && accountData) {
          setAccountType(accountData.account_type || '')
          setAccountInfo(accountData.account_info || '')
          setAccountTags(accountData.account_tags || [])
          setProfileDescription(accountData.profile_description || '')
        } else {
          setAccountType('')
          setAccountInfo('')
          setAccountTags([])
          setProfileDescription('')
        }
      } catch (error) {
        console.error('Account information load error:', error)
        toast.error('An error occurred while loading account information.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccountDetails()
  }, [selectedSocialAccount])


  // 계정 정보 저장
  const saveAccountInfo = async () => {
    if (!selectedSocialAccount) {
      toast.error('No account selected.')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      // social_accounts 테이블에 직접 업데이트
      const { error: updateError } = await supabase
        .from('social_accounts')
        .update({
          account_type: accountType || null,
          account_info: accountInfo || null,
          account_tags: accountTags.length > 0 ? accountTags : null,
          profile_description: profileDescription.trim() || null
        })
        .eq('social_id', selectedSocialAccount)

      if (updateError) throw updateError

      toast.success('Account information has been updated.')
    } catch (error) {
      console.error('Account information save error:', error)
      toast.error('An error occurred while saving account information.')
    } finally {
      setIsLoading(false)
    }
  }

  // 태그 추가/삭제 핸들러
  const addTag = () => {
    if (newTag && !accountTags.includes(newTag)) {
      setAccountTags([...accountTags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setAccountTags(accountTags.filter(tag => tag !== tagToRemove))
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }



  // PricingModal 종료 시 사용자 프로필 다시 로드
  const handlePricingModalClose = () => {
    setShowPricingModal(false)
    fetchUserProfile() // 변경된 플랜 정보를 다시 로드
  }

  return (
    <div className="h-full w-full bg-white rounded-[20px] overflow-auto">
      <div className="p-6 md:p-8">
        {/* 상단에 세션 로딩 상태 처리 */}
        {status === 'loading' && (
          <div className="text-center py-4 mb-4 bg-muted rounded">
            Loading session information...
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button
            variant="outline"
            onClick={handleSignOut}
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6">
          {/* 계정 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account related settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 소셜 계정 관련 설정 */}
              <div className="space-y-6">
                <div>
                  <Label htmlFor="socialAccount" className="mb-4 block">Social Account</Label>
                  <Select
                    value={selectedSocialAccount}
                    onValueChange={setSelectedSocialAccount}
                    disabled={isLoading || accounts.length === 0}
                  >
                    <SelectTrigger id="socialAccount">
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.social_id} value={account.social_id}>
                          {account.username || account.social_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSocialAccount && (
                  <div className="space-y-4 bg-muted rounded-2xl p-4">
                    <div>
                      <Label htmlFor="accountType" className="mb-2 block">Account Type</Label>
                      <Select
                        value={accountType}
                        onValueChange={setAccountType}
                        disabled={isLoading}
                      >
                        <SelectTrigger id="accountType">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="biz">Business Marketing Channel</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="casual">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="accountInfo" className="mb-2 block">Account Information</Label>
                      <Textarea
                        id="accountInfo"
                        value={accountInfo}
                        onChange={(e) => setAccountInfo(e.target.value)}
                        placeholder="Enter a description for your account"
                        className="min-h-[100px]"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="profileDescription" className="mb-2 block">Profile Description</Label>
                      <Textarea
                        id="profileDescription"
                        value={profileDescription}
                        onChange={(e) => setProfileDescription(e.target.value)}
                        placeholder="Enter a detailed description of your profile. Include what your profile is about, target audience, unique characteristics, etc."
                        className="min-h-[120px]"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This description is used for more accurate AI content generation.
                      </p>
                    </div>

                    <div>
                      <Label className="mb-2 block">Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {accountTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1"
                              disabled={isLoading}
                            >
                              <X size={14} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter' && !isLoading) {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          disabled={isLoading}
                        />
                        <Button
                          variant="outline"
                          onClick={addTag}
                          disabled={isLoading}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <Button onClick={saveAccountInfo} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 플랜 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription>Check and manage your current subscription.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Current Plan: {userProfile?.plan_type || 'Free'}</p>
                </div>
                {(userProfile?.plan_type === 'Free' || !userProfile?.plan_type) && (
                  <Button onClick={() => setShowPricingModal(true)}>Upgrade Plan</Button>
                )}
                {userProfile?.plan_type === 'Pro' && (
                  <Button onClick={() => setShowPricingModal(true)}>Manage Plan</Button>
                )}
                {userProfile?.plan_type === 'Expert' && (
                  <Button onClick={() => setShowPricingModal(true)}>Manage Plan</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 외관 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Configure language settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 items-center">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 계정 삭제 요청 */}
          <Card>
            <CardHeader>
              <CardTitle>Delete Account</CardTitle>
              <CardDescription>Please contact us via email to request account deletion.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => window.open('mailto:twyn.sh@gmail.com?subject=Account Deletion Request&body=I request to delete my account.%0A%0AEmail: ' + encodeURIComponent(userProfile?.email || ''), '_blank')}
                >
                  Request Account Deletion
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* PricingModal */}
        <PricingModal
          open={showPricingModal}
          onClose={handlePricingModalClose}
          currentUserPlan={userProfile?.plan_type || 'Free'}
        />
      </div>
    </div>
  )
} 