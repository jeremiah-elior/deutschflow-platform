import { ButtonHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';

type NoticeType = 'success' | 'error' | 'info';

export function PageNotice({ type, children }: { type: NoticeType; children?: ReactNode }) {
  if (!children) return null;
  const className = type === 'error' ? 'errorBox' : type === 'success' ? 'successBox' : 'infoBox';
  return <div className={className}>{children}</div>;
}

export function BusyOverlay({ show, label = 'Working…' }: { show: boolean; label?: string }) {
  if (!show) return null;
  return <div className="busyOverlay" role="status"><span className="spinner" /> {label}</div>;
}

export function AsyncButton({ busy, busyLabel = 'Working…', children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; busyLabel?: string }) {
  return <button {...props} disabled={disabled || busy}>{busy ? <><span className="tinySpinner" /> {busyLabel}</> : children}</button>;
}

export function Drawer({ open, title, subtitle, onClose, children, footer }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="drawerBackdrop" onMouseDown={onClose}>
      <aside className="drawerPanel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawerHeader">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="iconButton" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="drawerBody">{children}</div>
        {footer ? <div className="drawerFooter">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function ConfirmBar({ title, body, confirmLabel = 'Delete', busy, onCancel, onConfirm }: { title: string; body?: string; confirmLabel?: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="confirmBar">
      <div><strong>{title}</strong>{body ? <small>{body}</small> : null}</div>
      <div className="rowActions"><button type="button" onClick={onCancel}>Cancel</button><AsyncButton type="button" className="dangerButton" busy={busy} busyLabel="Deleting…" onClick={onConfirm}>{confirmLabel}</AsyncButton></div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return <div className="emptyState"><strong>{title}</strong>{body ? <p>{body}</p> : null}</div>;
}
