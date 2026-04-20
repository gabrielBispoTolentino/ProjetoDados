import './css/Skeleton.css';

type SkeletonBlockProps = {
  className?: string;
};

type CountProps = {
  count?: number;
};

function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return <span className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

export function ShopCardSkeletons({ count = 6 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`shop-skeleton-${index}`} className="shop-card skeleton-shop-card" aria-hidden="true">
      <div className="shop-content-wrapper">
        <div className="shop-image skeleton-panel" />
        <div className="shop-info">
          <div className="skeleton-inline-row">
            <SkeletonBlock className="skeleton-line skeleton-line-title" />
            <SkeletonBlock className="skeleton-chip" />
          </div>
          <SkeletonBlock className="skeleton-line skeleton-line-md" />
          <SkeletonBlock className="skeleton-line skeleton-line-sm" />
          <div className="shop-rating-row">
            <SkeletonBlock className="skeleton-line skeleton-line-xs" />
            <SkeletonBlock className="skeleton-circle skeleton-circle-md" />
          </div>
        </div>
      </div>
    </div>
  ));
}

export function AdminShopCardSkeletons({ count = 4 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`admin-shop-skeleton-${index}`} className="shop-card admin-shop-card skeleton-admin-card" aria-hidden="true">
      <div className="shop-image admin-shop-image skeleton-panel" />
      <div className="shop-info">
        <SkeletonBlock className="skeleton-line skeleton-line-title" />
        <SkeletonBlock className="skeleton-line skeleton-line-md" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      </div>
      <div className="admin-shop-actions">
        <SkeletonBlock className="skeleton-button" />
        <SkeletonBlock className="skeleton-button" />
        <SkeletonBlock className="skeleton-button" />
        <SkeletonBlock className="skeleton-button" />
        <SkeletonBlock className="skeleton-button skeleton-button-danger" />
      </div>
    </div>
  ));
}

export function AppointmentCardSkeletons({ count = 3 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`appointment-skeleton-${index}`} className="appointment-card skeleton-appointment-card" aria-hidden="true">
      <SkeletonBlock className="skeleton-line skeleton-line-title" />
      <SkeletonBlock className="skeleton-line skeleton-line-md" />
      <SkeletonBlock className="skeleton-line skeleton-line-md" />
      <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      <div className="appointment-actions">
        <SkeletonBlock className="skeleton-button" />
        <SkeletonBlock className="skeleton-button" />
      </div>
    </div>
  ));
}

export function BarberAppointmentCardSkeletons({ count = 3 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <article key={`barber-appointment-skeleton-${index}`} className="shop-card admin-shop-card skeleton-barber-card" aria-hidden="true">
      <div className="shop-info">
        <SkeletonBlock className="skeleton-line skeleton-line-title" />
        <SkeletonBlock className="skeleton-line skeleton-line-md" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-xs" />
        <div className="barber-appointment-actions">
          <SkeletonBlock className="skeleton-button" />
          <SkeletonBlock className="skeleton-button skeleton-button-danger" />
        </div>
      </div>
    </article>
  ));
}

export function BarberListSkeletons({ count = 4 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <article key={`barber-list-skeleton-${index}`} className="admin-barber-card skeleton-barber-list-card" aria-hidden="true">
      <SkeletonBlock className="skeleton-circle skeleton-circle-lg" />
      <div className="admin-barber-meta">
        <SkeletonBlock className="skeleton-line skeleton-line-md" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-xs" />
      </div>
      <SkeletonBlock className="skeleton-circle skeleton-circle-sm" />
    </article>
  ));
}

export function BarberPickerSkeletons({ count = 6 }: CountProps) {
  return (
    <div className="booking-barbers-grid skeleton-avatar-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonBlock key={`barber-picker-skeleton-${index}`} className="skeleton-circle skeleton-circle-xl" />
      ))}
    </div>
  );
}

export function BookedItemSkeletons({ count = 3 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`booked-skeleton-${index}`} className="booked-item skeleton-booked-item" aria-hidden="true">
      <SkeletonBlock className="skeleton-line skeleton-line-md" />
      <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      <SkeletonBlock className="skeleton-line skeleton-line-xs" />
    </div>
  ));
}

export function SubscriptionCardSkeletons({ count = 3 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`subscription-skeleton-${index}`} className="subscription-card skeleton-subscription-card" aria-hidden="true">
      <div className="subscription-header">
        <SkeletonBlock className="skeleton-line skeleton-line-md" />
        <SkeletonBlock className="skeleton-chip" />
      </div>
      <SkeletonBlock className="skeleton-line skeleton-line-lg" />
      <div className="subscription-details">
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      </div>
      <SkeletonBlock className="skeleton-button skeleton-button-danger" />
    </div>
  ));
}

export function PlanCardSkeletons({ count = 3 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`plan-skeleton-${index}`} className="plan-card skeleton-plan-card" aria-hidden="true">
      <div className="plan-header">
        <SkeletonBlock className="skeleton-line skeleton-line-md" />
        <div className="plan-badges">
          <SkeletonBlock className="skeleton-chip" />
          <SkeletonBlock className="skeleton-chip" />
        </div>
      </div>
      <SkeletonBlock className="skeleton-line skeleton-line-lg" />
      <div className="plan-details">
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      </div>
      <div className="plan-actions">
        <SkeletonBlock className="skeleton-button" />
        <SkeletonBlock className="skeleton-button" />
      </div>
    </div>
  ));
}

export function MarketplacePlanCardSkeletons({ count = 3 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`marketplace-plan-skeleton-${index}`} className="marketplace-card skeleton-marketplace-card" aria-hidden="true">
      <div className="marketplace-card-header">
        <SkeletonBlock className="skeleton-line skeleton-line-md" />
        <SkeletonBlock className="skeleton-chip" />
      </div>
      <SkeletonBlock className="skeleton-line skeleton-line-lg" />
      <div className="marketplace-details">
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      </div>
      <SkeletonBlock className="skeleton-button" />
    </div>
  ));
}

export function SubscriptionPlanCardSkeletons({ count = 3 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`subscription-plan-skeleton-${index}`} className="plan-subscription-card skeleton-subscription-plan-card" aria-hidden="true">
      <div className="plan-subscription-card-header">
        <SkeletonBlock className="skeleton-line skeleton-line-md" />
        <SkeletonBlock className="skeleton-chip" />
      </div>
      <SkeletonBlock className="skeleton-line skeleton-line-lg" />
      <div className="plan-subscription-price">
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-xs" />
      </div>
    </div>
  ));
}

export function PartnerItemSkeletons({ count = 4 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`partner-skeleton-${index}`} className="partner-item skeleton-partner-item" aria-hidden="true">
      <div className="partner-info">
        <div className="partner-name-row">
          <SkeletonBlock className="skeleton-line skeleton-line-md" />
          <SkeletonBlock className="skeleton-chip" />
        </div>
        <SkeletonBlock className="skeleton-line skeleton-line-sm" />
        <SkeletonBlock className="skeleton-line skeleton-line-xs" />
      </div>
    </div>
  ));
}

export function BenefitCardSkeletons({ count = 4 }: CountProps) {
  return Array.from({ length: count }, (_, index) => (
    <div key={`benefit-skeleton-${index}`} className="benefit-card skeleton-benefit-card" aria-hidden="true">
      <div className="benefit-card-header">
        <SkeletonBlock className="skeleton-chip skeleton-chip-sm" />
        <SkeletonBlock className="skeleton-chip" />
      </div>
      <SkeletonBlock className="skeleton-line skeleton-line-lg" />
      <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      <SkeletonBlock className="skeleton-line skeleton-line-xs" />
    </div>
  ));
}

export function ReportSkeleton() {
  return (
    <div className="skeleton-report" aria-hidden="true">
      <div className="report-summary">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={`report-summary-skeleton-${index}`} className="summary-card skeleton-summary-card">
            <SkeletonBlock className="skeleton-circle skeleton-circle-xl" />
            <div className="summary-info">
              <SkeletonBlock className="skeleton-line skeleton-line-sm" />
              <SkeletonBlock className="skeleton-line skeleton-line-md" />
            </div>
          </div>
        ))}
      </div>

      <div className="reports-table skeleton-reports-table">
        <div className="skeleton-table-head">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={`report-head-skeleton-${index}`} className="skeleton-line skeleton-line-xs" />
          ))}
        </div>
        <div className="skeleton-table-body">
          {Array.from({ length: 5 }, (_, rowIndex) => (
            <div key={`report-row-skeleton-${rowIndex}`} className="skeleton-table-row">
              {Array.from({ length: 5 }, (_, cellIndex) => (
                <SkeletonBlock key={`report-cell-skeleton-${rowIndex}-${cellIndex}`} className="skeleton-line skeleton-line-sm" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimeSlotSkeleton() {
  return (
    <div className="skeleton-timeslot" aria-hidden="true">
      <SkeletonBlock className="skeleton-line skeleton-line-sm" />
      <div className="timeslot-grid skeleton-timeslot-grid">
        {Array.from({ length: 12 }, (_, index) => (
          <SkeletonBlock key={`timeslot-skeleton-${index}`} className="skeleton-timeslot-button" />
        ))}
      </div>
      <div className="timeslot-legend">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={`timeslot-legend-skeleton-${index}`} className="timeslot-legend-item">
            <SkeletonBlock className="skeleton-circle skeleton-circle-xs" />
            <SkeletonBlock className="skeleton-line skeleton-line-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}
