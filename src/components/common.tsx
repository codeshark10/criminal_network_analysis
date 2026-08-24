import type { ReactNode } from 'react'
import { Activity, Banknote, Building2, Car, CircleDollarSign, MapPin, Phone, UserRound, Workflow } from 'lucide-react'
import type { Entity, EntityType, Priority } from '../types'

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow ?? 'NEXUS INTELLIGENCE'}</p><h1>{title}</h1>{children && <div className="page-subtitle">{children}</div>}</div>{actions && <div className="page-actions">{actions}</div>}</header>
}

export function PriorityBadge({ priority }: { priority: Priority | string }) { return <span className={`badge priority-${priority.toLowerCase().replace(' ', '-')}`}>{priority} {priority === 'HIGH' ? 'PRIORITY' : ''}</span> }
export function StatusBadge({ children, tone = 'cyan' }: { children: ReactNode; tone?: 'cyan' | 'green' | 'amber' | 'red' | 'muted' | 'purple' }) { return <span className={`badge status-${tone}`}>{children}</span> }

export function MetricCard({ label, value, change, icon, tone = 'cyan' }: { label: string; value: string | number; change?: string; icon: ReactNode; tone?: 'cyan' | 'amber' | 'red' | 'purple' }) {
  return <article className={`metric-card metric-${tone}`}><div className="metric-icon">{icon}</div><div><p>{label}</p><strong>{value}</strong>{change && <span>{change}</span>}</div></article>
}

const entityIcon: Record<EntityType, typeof UserRound> = { PERSON: UserRound, ORGANIZATION: Building2, LOCATION: MapPin, PHONE: Phone, VEHICLE: Car, ACCOUNT: Banknote, TRANSACTION: CircleDollarSign, EVENT: Activity }
export function EntityIcon({ type, size = 15 }: { type: EntityType; size?: number }) { const Icon = entityIcon[type] ?? Workflow; return <Icon size={size} strokeWidth={1.8} /> }
export function EntityBadge({ entity }: { entity: Entity }) { return <span className={`entity-badge entity-${entity.type.toLowerCase()}`}><EntityIcon type={entity.type} size={13} />{entity.type.replace('_', ' ')}</span> }

export function EmptyState({ title, description }: { title: string; description: string }) { return <div className="empty-state"><Workflow size={28} /><h3>{title}</h3><p>{description}</p></div> }

export function Disclaimer() { return <p className="disclaimer">AI-generated investigation insights assist investigators and require human verification. <b>SYNTHETIC DEMONSTRATION DATA</b></p> }
