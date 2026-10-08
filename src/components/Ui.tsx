import type { ReactNode } from 'react';

export function Icon({ file, className = '' }: { file: string; className?: string }) { return <img className={`design-icon ${className}`} src={`/assets/${file}.svg`} alt="" />; }

export function Speaker({ onClick, large = false, label = 'Replay question' }: { onClick: () => void; large?: boolean; label?: string }) {
  return <button className={`audio-button ${large ? 'large' : ''}`} onClick={onClick} aria-label={label}><Icon file={large ? 'fd9ff' : '8e6ac'} />{large && <span className="audio-dot" />}</button>;
}

export function Hint({ children }: { children: ReactNode }) { return <div className="friendly-hint"><span className="hint-star">🌟</span><div>{children}</div><span className="hint-stars" aria-hidden="true">☆ ☆ ☆</span></div>; }
