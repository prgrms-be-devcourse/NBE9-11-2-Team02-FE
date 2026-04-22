"use client";

import { useRouter, usePathname } from "next/navigation";
import styles from "./bottom-nav.module.css";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  // 특정 페이지에서 숨기고 싶다면 추가 (예: 로그인, 회원가입)
  const hidePaths = ["/login", "/register"];
  if (hidePaths.includes(pathname)) return null;

  return (
    <div className={styles.navWrapper}>
      <nav className={styles.bottomNav}>
        <div 
          className={pathname === "/dashboard" || pathname === "/" ? styles.navActive : styles.navItem}
          onClick={() => router.push("/dashboard")}
        >
          main
        </div>
        <div 
          className={pathname.startsWith("/stocks") ? styles.navActive : styles.navItem}
          onClick={() => router.push("/stocks")}
        >
          전체종목
        </div>
        <div 
          className={pathname === "/ranking" ? styles.navActive : styles.navItem}
          onClick={() => router.push("/ranking")}
        >
          순위
        </div>
      </nav>
    </div>
  );
}