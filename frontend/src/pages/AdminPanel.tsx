import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, Gift, Signal } from 'lucide-react'
import { fetchAirdrops } from '../services/airdrops'
import { fetchSignalStats } from '../services/signals'
import AirdropAdminTab from '../components/admin/AirdropAdminTab'
import SignalAdminTab from '../components/admin/SignalAdminTab'

type Tab = 'airdrops' | 'signals'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('airdrops')

  const { data: airdropsData } = useQuery({
    queryKey: ['admin-airdrops-stats'],
    queryFn: () => fetchAirdrops({ limit: 1 }),
  })

  const { data: signalStats } = useQuery({
    queryKey: ['admin-signal-stats'],
    queryFn: fetchSignalStats,
  })

  const stats = [
    { label: 'Total Airdrops', value: airdropsData?.total ?? 0 },
    { label: 'Total Signals', value: signalStats?.total_signals ?? 0 },
    { label: 'Win Rate', value: `${signalStats?.win_rate ?? 0}%` },
  ]

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'airdrops', label: 'Airdrops', icon: Gift },
    { key: 'signals', label: 'Signals', icon: Signal },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'airdrops' ? <AirdropAdminTab /> : <SignalAdminTab />}
    </div>
  )
}
