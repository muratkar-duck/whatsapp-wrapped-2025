import type { Report } from '../../lib/data/types';

const StatCard = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="flex flex-col gap-1 rounded-xl bg-gradient-to-br from-primary/90 to-twilight/80 px-4 py-3 text-white shadow">
    <p className="text-xs uppercase tracking-[0.2em] text-white/70">{label}</p>
    <p className="text-3xl font-semibold">{value}</p>
    {hint ? <p className="text-sm text-white/70">{hint}</p> : null}
  </div>
);

export default function SummaryGrid({ report }: { report: Report }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Toplam Mesaj" value={report.metrics.totalMessages} />
      <StatCard
        label="Günlük Ortalama"
        value={report.metrics.dailyAverage.toFixed(1)}
        hint={`${report.metrics.activeDays} aktif gün`}
      />
      <StatCard label="En Yoğun Gün" value={report.metrics.peakDay.date ?? 'Bilinmiyor'} hint={report.metrics.peakDay.count ? `${report.metrics.peakDay.count} mesaj` : undefined} />
      <StatCard
        label="En Sakin Gün"
        value={report.metrics.quietDay.date ?? 'Bilinmiyor'}
        hint={report.metrics.quietDay.count ? `${report.metrics.quietDay.count} mesaj` : undefined}
      />
      <StatCard label="En Uzun Streak" value={`${report.metrics.longestStreak.days} gün`} hint={`${report.metrics.longestStreak.start ?? '???'} → ${report.metrics.longestStreak.end ?? '???'}`} />
      <StatCard label="GSM Arama Süresi" value={`${report.gsm.totalVoiceDurationSec ?? 0} sn`} hint={`${report.gsm.totalCalls ?? 0} çağrı`} />
    </div>
  );
}
