import { ApplicationCodePage } from '../../../../generated/openapi';

export type CodeRow = { code: string; title: string; bulk: string; fee: string };

export function mapCodeRows(page: ApplicationCodePage): CodeRow[] {
  const items = page?.content ?? [];
  return items.map(i => ({
    code: i.applicationCode ?? '',
    title: i.title ?? '',
    bulk: i.bulkRespondentAllowed ? 'Yes' : 'No',
    fee:  i.feeReference ?? '—',
  }));
}
