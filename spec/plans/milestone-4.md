# תוכנית — Milestone 4: משחק מותקן ו־Offline

תאריך: 19.10.2026. מבוסס על MILESTONES.md (Milestone 4), ARCHITECTURE.md (סעיפים 1, 2, 5, 6, 9, 10) ו־PRD.md (PWA ופעולה ללא אינטרנט), ועל הקוד הקיים אחרי Milestone 3.

## מטרה בקצרה

אחרי טעינה ראשונה מוצלחת והכנת ה־Cache, המשחק כולו (בית, אודות, אורות, צלילים, שמירת ניקוד) עובד בלי אינטרנט, ובמכשיר תומך אפשר להתקין אותו כ־PWA. אין מסך, כפתור, דיאלוג או הודעה חדשים.

## החלטות לתכנון (לאישור המשתמש)

1. **עיצוב האייקון — חסר ב־spec.** ה־spec דורש אייקונים מקומיים אבל לא מגדיר איך הם נראים. הצעה, שנגזרת רק מהעיצוב הקיים: לוח 2×2 בארבעת צבעי המשחק (באותם מיקומים כמו במסך: כחול ימין־עליון, אדום שמאל־עליון, צהוב ימין־תחתון, ירוק שמאל־תחתון), עם פינות מעוגלות, על רקע `#171717`, בלי טקסט. גרסת maskable: אותו ציור מוקטן לאזור הבטוח (כ־80% מהמרכז) עם רקע מלא. **אושר על ידי המשתמש (19.10.2026).**
2. **base סופי:** ה־Repository הוא `sharoltastyle-web/simon`, ולכן לפי ARCHITECTURE §6 (Project Pages) ה־base הוא `/simon/` — במקום `./` הזמני. כך ה־Manifest, ה־scope וה־Service Worker מקבלים נתיב קבוע, וכל הבדיקות המקומיות רצות ממילא תחת נתיב משנה. משמעות למשתמש: כתובות ההרצה המקומיות יהיו `http://localhost:5173/simon/` ו־`http://localhost:4173/simon/`.
3. **בדיקת התקנה בטלפון:** אין כרגע כתובת HTTPS לבדיקה, ו־ARCHITECTURE אינו מגדיר פריסת בדיקה זמנית. לכן בדיקת ההתקנה האמיתית בטלפון נדחית במפורש ל־Milestone 5 (כפי שה־DoD מאפשר) ומדווחת כ"לא בוצעה". ב־Milestone זה נבדקים תקינות ה־Manifest והאייקונים ב־Chromium בלבד.

## תלויות חדשות (devDependencies)

- `vite-plugin-pwa` — גרסה Stable עדכנית שה־peerDependencies שלה תומכות ב־Vite 8 (לבדוק לפני ההתקנה; אם אין גרסה תואמת — לעצור ולדווח, לא להוריד את Vite). מושך איתו את `workbox-build` / `workbox-window`.
- `@playwright/test` — בדיקות דפדפן מול Build אמיתי. התקנת דפדפן Chromium בלבד (`npx playwright install chromium`).
- אין תלויות Runtime חדשות מלבד קוד הרישום ש־vite-plugin-pwa מוסיף ל־Bundle.
- לקבע את הגרסאות ב־`package-lock.json`, ולתעד ב־ADR-5 את הגרסאות שנבחרו.

## קבצים ליצור או לשנות

| קובץ | שינוי |
| --- | --- |
| `vite.config.ts` | `base: '/simon/'`; הוספת `VitePWA({...})` (פירוט למטה); `define` של מזהה Build (`__APP_BUILD__`) מתוך משתנה סביבה `SIMON_BUILD_ID` (ברירת מחדל `'dev'`), לצורך בדיקת שתי גרסאות; הגבלת Vitest ל־`src/**/*.test.ts` כדי שקובצי Playwright לא ירוצו בו. |
| `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png` | אייקונים מקומיים (נוצרים פעם אחת מקובץ ה־SVG, ונשמרים ב־Git). |
| `public/icons/icon.svg`, `public/icons/icon-maskable.svg` | מקור האייקונים, לפי העיצוב שיאושר. |
| `scripts/generate-icons.ts` | סקריפט חד־פעמי שמרנדר את ה־SVG ל־PNG בגדלים הנדרשים באמצעות Playwright (ללא תלות נוספת כמו sharp). מורץ ידנית דרך `npm run icons`. |
| `index.html` | `<link rel="apple-touch-icon">`, `<link rel="icon">` מקומי; `theme-color` כבר קיים (`#171717`). ה־`<link rel="manifest">` מוזרק על ידי התוסף. |
| `src/pwa.ts` | **PWA Registration** — מודול נפרד מחוקי המשחק: `registerSW` מ־`virtual:pwa-register` עם `immediate: true`, בלי `onNeedRefresh` שמבצע פעולה, בלי `updateSW()` ובלי רענון. כל כשל ברישום (או דפדפן ללא Service Worker) נבלע בשקט — המשחק Online ממשיך כרגיל, ללא הודעת UI. כותב את `__APP_BUILD__` ל־`document.documentElement.dataset.build` (בלתי נראה; משמש את בדיקת העדכון בלבד). |
| `src/main.ts` | קריאה ל־`initPwa()` בסוף האתחול. |
| `src/vite-env.d.ts` (או הרחבה של `tsconfig.json`) | טיפוסים ל־`virtual:pwa-register` (`vite-plugin-pwa/client`) ול־`__APP_BUILD__`. |
| `playwright.config.ts` | Chromium עם הדמיית טלפון (Pixel 7), `baseURL: http://localhost:4173/simon/`, `webServer` שמריץ Build ואז `vite preview --port 4173 --strictPort`. |
| `e2e/app.spec.ts` | תרחישי הדפדפן (פירוט למטה). |
| `e2e/offline.spec.ts` | תרחיש Offline על ה־Build. |
| `e2e/update.spec.ts` + `e2e/staticServer.ts` | בדיקת שתי גרסאות עם שרת סטטי קטן (Node `http`) שאפשר להחליף בו תיקייה (v1 ← v2) בזמן הבדיקה. |
| `tsconfig.json` | הוספת `e2e`, `scripts`, `playwright.config.ts` ל־include. |
| `package.json` | scripts: `test:e2e` (`playwright test`), `icons`; ה־`build` הקיים נשאר `tsc --noEmit && vitest run && vite build`. |
| `.gitignore` | הוספת `dist-e2e/` (תיקיות ה־Build של בדיקת העדכון). `playwright-report/` ו־`test-results/` כבר קיימים. |
| `CLAUDE.md` | עדכון פקודות ההרצה: הכתובות עם `/simon/`, ו־`npm run test:e2e`. |
| `spec/ARCHITECTURE.md` | הוספת ADR-5 בלבד (ראה למטה). |
| `spec/MILESTONES.md` | סימון 🟡 בסיום הבנייה. |

## הגדרת vite-plugin-pwa

- `registerType: 'prompt'`, `injectRegister: false` (הרישום נעשה ב־`src/pwa.ts`), `strategies: 'generateSW'`.
- `manifest`:
  - `name: 'סיימון'`, `short_name: 'סיימון'`, `description: 'משחק זיכרון עם אורות וצלילים'` (הטקסט הקיים במסך אודות).
  - `lang: 'he'`, `dir: 'rtl'`, `display: 'standalone'`, `orientation` — לא מוגדר (לא נקבע ב־spec).
  - `background_color: '#171717'`, `theme_color: '#171717'` (Background מ־DESIGN).
  - `id: '/simon/'`, `start_url: '/simon/'`, `scope: '/simon/'` — יציבים בין גרסאות.
  - `icons`: 192 (`any`), 512 (`any`), 512 (`maskable`).
- `workbox`:
  - `cacheId: 'simon-memory'` — Cache ייחודי לפרויקט.
  - `globPatterns: ['**/*.{html,js,css,woff2,png,svg,webmanifest}']` — HTML, JS, CSS, ששת קובצי Heebo, האייקונים וה־Manifest. לוודא אחרי ה־Build ברשימת ה־precache שכל ששת קובצי ה־woff2 וכל האייקונים נכללו ושאין אזהרת "exceeds maximumFileSizeToCacheInBytes".
  - `navigateFallback: 'index.html'`, `navigateFallbackAllowlist: [/^\/simon\//]` — רק נתיבי הפרויקט.
  - `cleanupOutdatedCaches: true`.
  - `skipWaiting: false` — Worker חדש ממתין ואינו משתלט באמצע משחק.
  - `clientsClaim: true` — חל רק בהפעלה הראשונה של Worker (כשאין Worker קודם), כדי שהדף הראשון יהיה מבוקר בלי רענון; אינו משפיע על Worker ממתין.
  - אין `runtimeCaching` (אין משאבים חיצוניים).
- `devOptions.enabled: false` — אין Service Worker בשרת הפיתוח; כל בדיקות ה־PWA מול `vite preview`.
- ה־Worker נוצר כ־`/simon/sw.js` ולכן ה־scope שלו הוא `/simon/` בלבד.
- לוודא שה־Build מפיק Bundle JS אחד (אין Lazy Loading / dynamic import) — כבר כך היום; לבדוק שזה נשאר.

## תרחישי Playwright

כל התרחישים מול Production Build תחת `/simon/`, ב־Chromium בהדמיית טלפון. כדי לשחק בצורה צפויה: `page.addInitScript` מחליף את `Math.random` בפונקציה קבועה (`() => 0`, כלומר תמיד כחול) — שינוי בתוך הבדיקה בלבד, לא בקוד המוצר. זיהוי סוף הצגת הרצף: המתנה להודעת התור בשורת ההודעה (הטקסט הקיים ב־homeView) ולמחלקת `is-active` שירדה מהכפתורים.

**`e2e/app.spec.ts`** (מחליף את בדיקות הדפדפן הידניות של Milestones 1–3 בבדיקות קבועות):
1. פתיחה: `lang="he"`, `dir="rtl"`, מסך בית בלבד גלוי, „שלב: 0 מתוך 10”, „ניקוד: 0”, ארבעה כפתורים בסדר ובמיקום הנכונים.
2. ניווט בית ← אודות ← בית בלי טעינה מלאה; פתיחה ישירה של `#/about`.
3. משחק קצר: התחל ← השלמת שלב 1 ← טעות בשלב 2 ← תוצאה 1 בבית ← אודות מציג שיא 1 ותוצאה אחרונה 1 ← רענון ← הערכים נשארים.
4. רענון באמצע משחק: Session ריק, הניקוד הקודם לא השתנה.

**`e2e/offline.spec.ts`:**
1. טעינה ראשונה ← המתנה ל־`navigator.serviceWorker.ready` ולכך שהדף מבוקר (`controller` קיים).
2. בדיקה שכל המשאבים החיוניים נמצאים ב־Cache: רשימת ה־precache (מתוך `caches`) כוללת את index.html, ה־JS, ה־CSS, ששת קובצי ה־woff2, ה־Manifest והאייקונים.
3. `context.setOffline(true)` ← `page.reload()` ← בית נטען, אודות נפתח, `document.fonts` מראה ש־Heebo נטען.
4. ללא רשת: משחק שלם עד תוצאה (אורות; ניסיון יצירת AudioContext לא מציג את הודעת כשל הצליל ב־Chromium), שמירת ניקוד וקריאתו באודות, ורענון נוסף ללא רשת שמראה שהניקוד נשאר.
5. מאזין `page.on('request')` מאשר שאין בקשה לשום Host חיצוני לאורך כל הבדיקה.
6. בדיקת scope: `registration.scope` מסתיים ב־`/simon/`.
7. כשל רישום: בדיקה נפרדת שבה `addInitScript` גורם ל־`navigator.serviceWorker.register` להיכשל ← המשחק Online עובד כרגיל ואין הודעה חדשה במסך. (הבדיקה מתעדת שבמקרה הזה אין Offline — לא מדווחים עליו כהצלחה.)

**`e2e/update.spec.ts`** (שתי גרסאות):
1. Build של v1 (`SIMON_BUILD_ID=1`) ושל v2 (`SIMON_BUILD_ID=2`) לשתי תיקיות תחת `dist-e2e/`, ושרת סטטי קטן תחת `/simon/` שמגיש אחת מהן.
2. טעינת v1, המתנה ל־Worker פעיל, סיום משחק אחד כדי שיהיה ניקוד שמור, ואז התחלת משחק חדש.
3. החלפת השרת ל־v2 ← `registration.update()` ← יש Worker ב־`waiting`; הדף עדיין `data-build="1"`, לא נטען מחדש (סמן ב־`window` שנשמר), והמשחק ממשיך באותו שלב ונענה ללחיצות.
4. סגירת כל הדפים של v1 ופתיחה מחדש באותו Context ← `data-build="2"`, ניקוד השמור מ־v1 עדיין מוצג באודות, ורק Cache של הגרסה הנוכחית נשאר.

## בדיקה ידנית (בדפדפן המובנה)

- Build + `npm run preview`, פתיחת `http://localhost:4173/simon/`: אין שגיאות 404 בקונסול (Manifest, אייקונים, sw.js, גופנים), ה־Manifest נקרא כראוי (שם, צבעים, אייקונים).
- המראה של שני המסכים לא השתנה מ־Milestone 3.
- `npm run dev` ממשיך לעבוד בכתובת `/simon/` בלי Service Worker.

## ADR-5 שיתווסף ל־ARCHITECTURE.md

**PWA ו־Offline:** base `/simon/`; vite-plugin-pwa (גרסה שנבחרה) עם generateSW, `registerType: 'prompt'`, רישום ידני ב־`src/pwa.ts` ללא פעולת עדכון; `skipWaiting: false` + `clientsClaim: true`; `cacheId: simon-memory`; אייקונים שנוצרו פעם אחת מ־SVG באמצעות Playwright; Playwright ב־Chromium בלבד בשלב זה (WebKit ב־Windows אינו מדמה Service Worker באופן מהימן — יוחלט ב־Milestone 5 אם להוסיף אותו ב־CI); בדיקת התקנה בטלפון נדחתה ל־Milestone 5.

## מה לא נכלל

- אין GitHub Actions, פריסה או push (Milestone 5).
- אין הודעת "גרסה חדשה זמינה", כפתור התקנה, `beforeinstallprompt` או כל רכיב UI חדש.
- אין שינוי בחוקי המשחק, ב־Score Storage או במראה המסכים.

## מיפוי ל־Definition of Done

| תנאי | איך נבדק |
| --- | --- |
| Manifest, אייקונים, SW ומשאבים נטענים תחת נתיב משנה | כל בדיקות Playwright רצות תחת `/simon/`; בדיקה ידנית של קונסול ורשת בלי 404 |
| Offline אחרי Precache: בית, אודות, משחק עם צלילים, שמירה וקריאה | `e2e/offline.spec.ts` שלבים 1–4 (צליל: AudioContext פועל ב־Chromium; שמיעה בפועל — רק בטלפון ב־Milestone 5) |
| Offline על Build אמיתי ב־Playwright, בלי משאב חיצוני | `e2e/offline.spec.ts` שלבים 2 ו־5 |
| פתיחה ראשונה בלי Cache / כשל רישום לא מוצגים כ־Offline; כשל לא משבית משחק | `e2e/offline.spec.ts` שלב 7; ניסוח מפורש בדיווח |
| עדכון ממתין לא קוטע משחק, הגרסה החדשה נטענת אחרי מחזור החלפה, הניקוד נשאר | `e2e/update.spec.ts` |
| תיעוד בדיקת התקנה בנייד או מגבלה | מדווח כ"לא בוצע — נדחה ל־Milestone 5" (אין HTTPS לבדיקה) |
| שאר הבדיקות וה־Build עוברים, בלי מסכים או יכולות חדשים | `npm run build`, `npm run test:e2e`, ובדיקה חזותית שהמסכים לא השתנו |
