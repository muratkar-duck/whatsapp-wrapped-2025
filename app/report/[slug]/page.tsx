import { promises as fs } from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import SummaryGrid from '../../../components/pages/SummaryGrid';
import type { Report } from '../../../lib/data/types';
import { reportSchema } from '../../../lib/data/schema';

async function loadReport(slug: string): Promise<Report | null> {
  const reportPath = path.join(process.cwd(), 'dist', 'report.json');
  try {
    const content = await fs.readFile(reportPath, 'utf-8');
    const parsed = JSON.parse(content);
    const result = reportSchema.safeParse(parsed);
    if (!result.success) {
      console.error('Report validation failed', result.error.message);
      return null;
    }
    return result.data;
  } catch (error) {
    console.error('Report file missing', error);
    return null;
  }
}

export default async function ReportPage({ params }: { params: { slug: string } }) {
  const report = await loadReport(params.slug);

  if (!report) {
    notFound();
  }

  return (
    <section className="page">
      <div className="flex flex-col gap-4">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Wrapped {report.year}</p>
        <h1 className="text-4xl font-bold text-primary">{report.ownerName} x {report.partnerName}</h1>
        <p className="text-gray-700">Çift yönlü mesajlaşma verinizden hesaplanan özet gösterge panosu.</p>
        <SummaryGrid report={report} />
      </div>
    </section>
  );
}
