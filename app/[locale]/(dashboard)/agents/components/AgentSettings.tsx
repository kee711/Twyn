"use client"
import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Settings = {
  autoGenerate: boolean
  autoPickTopic: boolean
  autoConfirm: boolean
}

export default function AgentSettings() {
  const [settings, setSettings] = useState<Settings>({
    autoGenerate: false,
    autoPickTopic: false,
    autoConfirm: false,
  })

  useEffect(() => {
    const raw = localStorage.getItem('agent-settings')
    if (raw) setSettings(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('agent-settings', JSON.stringify(settings))
  }, [settings])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span>포스트 자동 생성 활성화</span>
          <Switch
            checked={settings.autoGenerate}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, autoGenerate: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <span>토픽 자동 선택 활성화</span>
          <Switch
            checked={settings.autoPickTopic}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, autoPickTopic: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <span>자동 Confirm 활성화</span>
          <Switch
            checked={settings.autoConfirm}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, autoConfirm: v }))}
          />
        </div>
      </CardContent>
    </Card>
  )
}

