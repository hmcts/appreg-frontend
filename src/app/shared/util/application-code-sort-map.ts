export function toApplicationCodeSortKey(key: string): string {
  switch (key) {
    case 'code':
      return 'code';
    case 'title':
      return 'title';
    case 'bulk':
      return 'bulkRespondentAllowed';
    case 'isFeeDue':
      return 'feeDue';
    default:
      return 'code';
  }
}
