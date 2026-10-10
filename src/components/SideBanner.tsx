import { useLanguage } from '../i18n/LanguageContext';

/**
 * Decorative side banners of the topic page. They exist only from 1440 px up (see .side-banner in index.css): below that
 * there is not enough room next to the topic cards, so they are hidden and their picture is never downloaded.
 */
export default function SideBanner({ kind }: { kind: 'explore' | 'play' }) {
  const { t } = useLanguage();
  const explore = kind === 'explore';
  return <aside className={`side-banner side-banner-${kind}`} aria-hidden="true">
    <span className="side-banner-pill">{explore ? `✨ ${t('bannerExplorePill')}` : `🎈 ${t('bannerPlayPill')}`}</span>
    <h2>{explore ? t('bannerExploreTitle') : t('bannerPlayTitle')}</h2>
    <p>{explore ? t('bannerExploreText') : t('bannerPlayText')}</p>
    <div className="side-banner-art" />
    <span className="side-banner-foot">{explore ? `🌸 ${t('bannerExploreFoot')}` : `⭐ ${t('bannerPlayFoot')}`}</span>
  </aside>;
}
