import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';

/** 3 rows of 4 first; one more row per scroll gesture near the end, never more than MAX_TOPICS. */
export const VISIBLE_AT_FIRST = 12;
export const LOAD_STEP = 4;
export const MAX_TOPICS = 20;
const NEAR_END_PX = 200;
const LOAD_MS = 450;
/** Input events closer together than this belong to the same gesture (a wheel spin, a swipe, touchpad inertia). */
const GESTURE_GAP_MS = 220;

type Options = {
  sentinel: RefObject<HTMLDivElement | null>;
  total: number;
  visible: number;
  setVisible: Dispatch<SetStateAction<number>>;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
};

/**
 * Shows one more row per scroll GESTURE (wheel, swipe, keys, touchpad, scrollbar), also when the page is too short to
 * scroll at all: no scroll event fires then, so the wheel / touch / key events themselves are the trigger.
 * The scrolling element is the page (window): .nimo-app uses overflow: clip, which is not a scroll container.
 * An IntersectionObserver on a sentinel under the list says whether the list end is within NEAR_END_PX of the bottom of
 * the screen. Scrolling back up hides a row again once it has left the screen.
 */
export function useRowsOnScroll({ sentinel, total, visible, setVisible, isLoading, setIsLoading }: Options) {
  const nearEnd = useRef(false);
  const loading = useRef(false);          // synchronous guard: a state update arrives one render too late
  const visibleRef = useRef(visible);
  const lastInput = useRef(0);
  const consumed = useRef(false);         // this gesture already loaded its row
  const lastY = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const loadRowRef = useRef<() => void>(() => {});
  visibleRef.current = visible;
  loading.current = isLoading;

  const hasMore = visible < total;
  useEffect(() => {
    const node = sentinel.current;
    if (!node) { nearEnd.current = false; return; }
    if (typeof IntersectionObserver === 'undefined') { nearEnd.current = true; return; }
    const observer = new IntersectionObserver(entries => {
      nearEnd.current = entries.some(entry => entry.isIntersecting);
      // The end of the list has just come close because of something the child did a moment ago (End / PageDown key,
      // scrollbar drag): that gesture gets its row now. The page's own layout changes never count.
      if (nearEnd.current && Date.now() - lastInput.current < 600) loadRowRef.current();
    }, { rootMargin: `0px 0px ${NEAR_END_PX}px 0px` });
    observer.observe(node);
    return () => { observer.disconnect(); nearEnd.current = false; };
  }, [hasMore, sentinel]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    lastY.current = window.scrollY;
    let touchY = 0;

    const loadRow = () => {
      if (loading.current || consumed.current || !nearEnd.current || visibleRef.current >= total) return;
      consumed.current = true;
      loading.current = true;
      setIsLoading(true);
      // The topics are already in memory: a short, deliberate pause so the child sees that something is happening.
      timer.current = window.setTimeout(() => {
        setVisible(value => Math.min(value + LOAD_STEP, total));
        setIsLoading(false);
      }, LOAD_MS);
    };
    loadRowRef.current = loadRow;
    const hideRow = () => {
      if (loading.current || visibleRef.current <= VISIBLE_AT_FIRST) return;
      const tiles = document.querySelectorAll('.topic-cards .topic-tile');
      const last = tiles[tiles.length - 1];
      if (!last || last.getBoundingClientRect().top < window.innerHeight) return;
      const rows = Math.ceil((visibleRef.current - VISIBLE_AT_FIRST) / LOAD_STEP);
      setVisible(Math.min(total, VISIBLE_AT_FIRST + (rows - 1) * LOAD_STEP));
    };
    /** Every input event: a long enough pause since the previous one starts a new gesture. */
    const input = () => {
      const now = Date.now();
      if (now - lastInput.current > GESTURE_GAP_MS) consumed.current = false;
      lastInput.current = now;
    };

    const onWheel = (event: WheelEvent) => { input(); if (event.deltaY > 0) loadRow(); else if (event.deltaY < 0) hideRow(); };
    const onTouchStart = (event: TouchEvent) => { touchY = event.touches[0]?.clientY ?? 0; consumed.current = false; lastInput.current = Date.now(); };
    const onTouchMove = (event: TouchEvent) => {
      input();
      const y = event.touches[0]?.clientY ?? touchY;
      const delta = touchY - y;            // finger moving up = content scrolling down
      if (Math.abs(delta) < 12) return;
      touchY = y;
      if (delta > 0) loadRow(); else hideRow();
    };
    const onKey = (event: KeyboardEvent) => {
      if (['PageDown', 'ArrowDown', 'End', ' '].includes(event.key)) { input(); loadRow(); }
      else if (['PageUp', 'ArrowUp', 'Home'].includes(event.key)) { input(); hideRow(); }
    };
    // Scrollbar drag / touchpad momentum: counts only when the child did something a moment ago, never the page's own scrolls.
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY.current;
      lastY.current = y;
      if (Date.now() - lastInput.current > 1000) return;
      if (down) loadRow(); else hideRow();
    };
    const onMouseDown = () => input();

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, [total, setVisible, setIsLoading]);
}
