import { ExternalLink, PlayCircle } from 'lucide-react';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { normalizeAttachments } from './community-utils';

export function AttachmentRenderer({ attachments }: { attachments?: unknown }) {
  const items = normalizeAttachments(attachments);
  if (items.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {items.map((item, index) => {
        const type = item?.type || (item?.image ? 'image' : item?.url ? 'link' : 'unknown');
        const rawUrl = item?.url || item?.image;
        const url = rawUrl ? resolveAttachmentUrl(rawUrl, API_ORIGIN) : '';
        if (!url) return null;

        if (type === 'image') {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${url}-${index}`}
              src={url}
              alt={item?.alt || 'Community attachment'}
              className="max-h-[520px] w-full rounded-xl border border-slate-100 object-cover"
            />
          );
        }

        if (type === 'video') {
          return (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
            >
              <PlayCircle className="h-8 w-8 text-sky-600" />
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{item?.title || 'Video attachment'}</p>
                <p className="truncate text-xs text-slate-500">{url}</p>
              </div>
            </a>
          );
        }

        return (
          <a
            key={`${url}-${index}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-200 hover:bg-sky-50/40"
          >
            {item?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-14 w-20 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <ExternalLink className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="line-clamp-1 font-bold text-slate-900">{item?.title || 'Open link'}</p>
              {item?.description ? <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p> : null}
              <p className="truncate text-xs text-slate-400">{url}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
