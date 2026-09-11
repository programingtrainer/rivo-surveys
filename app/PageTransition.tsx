"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const EXIT_DURATION = 180;

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const navigatingRef = useRef(false);

  useEffect(() => {
    navigatingRef.current = false;
    setExiting(false);
    setVisible(false);

    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const navigateWithTransition = useCallback(
    (href: string) => {
      if (navigatingRef.current) return;

      navigatingRef.current = true;
      setExiting(true);

      window.setTimeout(() => {
        router.push(href);
      }, EXIT_DURATION);
    },
    [router]
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) return;

      const link = target.closest("a");

      if (!link) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;
      if (link.getAttribute("data-no-transition") !== null) return;

      const href = link.getAttribute("href");

      if (!href || href.startsWith("#")) return;

      let url: URL;

      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const currentUrl = new URL(window.location.href);

      if (
        url.pathname === currentUrl.pathname &&
        url.search === currentUrl.search &&
        url.hash === currentUrl.hash
      ) {
        return;
      }

      event.preventDefault();
      navigateWithTransition(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [navigateWithTransition]);

  return (
    <div
      className={`page-transition ${
        visible ? "page-transition-visible" : ""
      } ${exiting ? "page-transition-exiting" : ""}`}
    >
      {children}
    </div>
  );
}
