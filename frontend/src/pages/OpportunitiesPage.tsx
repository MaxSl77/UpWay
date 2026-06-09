import { TopBar } from '@/components/layout/TopBar'
import { OpportunityFilters } from '@/features/opportunities/components/OpportunityFilters'
import { OpportunityGrid } from '@/features/opportunities/components/OpportunityGrid'
import { useOpportunities } from '@/features/opportunities/hooks/useOpportunities'

export default function OpportunitiesPage() {
  const { opportunities, filter, setFilter, isLoading } = useOpportunities()

  return (
    <>
      <TopBar title="Возможности" subtitle="Лагеря, просмотры и турниры" />
      <div className="flex-1 overflow-y-auto px-7 py-6 pb-16 scrollbar-thin">
        <OpportunityFilters active={filter} onChange={setFilter} />
        <OpportunityGrid items={opportunities} isLoading={isLoading} />
      </div>
    </>
  )
}
