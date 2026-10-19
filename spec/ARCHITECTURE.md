# ARCHITECTURE — משחק סיימון

תאריך המחקר והתכנון: 18.10.2026. מסמך מקור: PRD.md מתאריך 18.10.2026.

המסמך מתרגם את ה־PRD לתכנון טכני; אינו משנה את דרישות המוצר. כל המשחק פועל במכשיר המשתמש. GitHub Pages מגיש קבצים סטטיים בלבד. קיימים שני מסכים בלבד, בית ואודות, ממשק בעברית, עשרה שלבים, רצף מצטבר וחמש שניות לכל לחיצה.

## 1. Technology Stack שנבחר

| רכיב | טכנולוגיה | תפקיד |
| --- | --- | --- |
| Frontend | HTML סמנטי, TypeScript במצב strict ו־DOM APIs | ממשק ושני המסכים, טיפול בקלט ולוגיקת המשחק ללא UI Framework |
| עיצוב | CSS מקומי, CSS Grid ו־CSS Custom Properties | פריסת ארבעת הצבעים, הארה, RTL והתאמה לטלפון |
| Build ופיתוח | Vite, תבנית vanilla-ts | Development Server ויצירת חבילת קבצים סטטית ב־dist |
| סביבת כלים | Node.js 24 LTS ו־npm | התקנת תלויות, Build ובדיקות בלבד; אינם נדרשים במכשיר השחקן |
| צלילים | Web Audio API | ארבעה צלילים מסונתזים באמצעות OscillatorNode ו־GainNode |
| מצב משחק | TypeScript Modules ו־State Machine מקומי | מקור אמת יחיד בזיכרון, ללא ספריית State Management |
| ניקוד | Local Storage | תוצאת המשחק האחרון והשיא האישי בלבד |
| PWA ו־Offline | Web App Manifest, vite-plugin-pwa עם Workbox generateSW ו־Cache Storage | התקנה במכשירים תומכים ו־Precache של משאבי האפליקציה |
| Unit Tests | Vitest | בדיקת חוקי המשחק, זמן, השהיה ואחסון עם שעון ואקראיות ניתנים לשליטה |
| בדיקות דפדפן | Playwright | בדיקת תרחישי קצה, ניווט ו־Offline ב־Build אמיתי |
| ניהול קוד | Git ו־GitHub Repository | קוד, תצורה, Lockfile ותיעוד |
| CI/CD ו־Hosting | GitHub Actions ו־GitHub Pages ב־HTTPS | בדיקות, Build ופריסה אוטומטית מ־main |

אין Backend, Database, Authentication, שירות AI, אחסון קבצי משתמשים או API חיצוני. אייקונים וקבצי ממשק הם חלק מהאתר עצמו.

### החלטות ונימוקים

**Frontend ללא Framework:** נבחנו Vanilla TypeScript, React ו־Vue. שני מסכים ולוח של ארבעה כפתורים אינם מצדיקים מנגנון Components, Router או State Library נוסף. TypeScript מספק בדיקות טיפוסים לחוקי המשחק ולמעברי המצב; DOM ו־CSS תקניים מפחיתים תלויות בזמן ריצה. React ו־Vue מתאימים לממשקים מורכבים יותר, אך אינם מוסיפים כאן יכולת מוצר נדרשת. זו מסקנת התאמה למוצר, ולא טענה שהם פחות בשלים. [1–3]

**Vite:** נבחן מול webpack ומול כלי Build מצומצם המבוסס ישירות על esbuild. נבחר בזכות שילוב מוכן של TypeScript, שרת פיתוח, Build סטטי ותיעוד ייעודי לפריסה ב־GitHub Pages. הוא חוסך הרכבת שרשרת כלים עצמאית. יש להריץ בנפרד `tsc --noEmit`, משום ש־Vite מבצע Transpilation ולא בדיקת טיפוסים. [4–6,28–29]

**צליל מקומי:** נבחנו Web Audio API, קובצי אודיו דרך HTMLAudioElement ו־Howler.js. נבחר Web Audio API: ארבעה טונים קצרים אינם דורשים קובצי צליל, טעינה, Codecs או ספריית אודיו. יש שליטה בעוצמה ובתזמון, אך נדרשת התמודדות עם מדיניות Autoplay בנייד. [7–9]

**PWA:** נבחנו Service Worker ידני, Workbox generateSW ו־injectManifest. נבחר generateSW דרך vite-plugin-pwa: הצורך הוא Precache של אתר קטן, ללא Push או אסטרטגיות תקשורת מיוחדות. רשימת המשאבים נוצרת בזמן Build במקום להסתמך על רשימה ידנית שעלולה להתיישן. התוסף הוא תלות צד שלישי; לוגיקת המשחק אינה תלויה בו. [10–12]

**Hosting:** נבחנו GitHub Pages, Cloudflare Pages ו־Vercel. נבחר GitHub Pages בהתאם להעדפת הפרויקט ובזכות התאמה מלאה לאתר סטטי ופרסום מתוך GitHub. החלופות תומכות באירוח, אך אין כאן צורך בפלטפורמת Backend או בספק נוסף. [13–16]

**אחסון:** Local Storage הוא אילוץ מוצר מאושר ולא בחירה פתוחה ל־Database אחר. הוא מתאים לשני מספרים קטנים; IndexedDB מוסיף מורכבות ו־Session Storage אינו שומר את התוצאה בין הפעלות באופן הנדרש. [17]

**בדיקות:** Vitest נבחר מול Jest בזכות התאמה לסביבת Vite ו־TypeScript. Playwright נבחר מול Cypress לצורך בדיקות Chromium ו־WebKit והדמיית מובייל. בדיקות אלו הן כלי פיתוח, ללא שירות בדיקות בתשלום וללא קוד בדיקה ב־Production. הדמיה אינה תחליף לבדיקה על טלפון אמיתי. [18–21]

### בשלות, תאימות ועלות

הבסיס הוא Web APIs תקניים וכלי פיתוח מתועדים היטב. הבחירה אינה נשענת על דירוגי פופולריות לא מאומתים. מסמכי TypeScript, Vite, Workbox והדפדפנים מספקים דוגמאות ומפרטי API זמינים גם לפיתוח באמצעות כלי AI; זו הערכה הנדסית, לא הבטחת איכות לקוד שייווצר.

Node.js 24 הוא ענף LTS במועד המחקר ומתאים לדרישת Node המתועדת של Vite. יש לבחור גרסאות Stable תואמות של Vite, התוסף ו־Vitest, לבדוק את peerDependencies ואת ה־Build, ולקבע את ההתקנה המדויקת ב־package-lock.json. אין להשתמש בגרסאות Nightly או בעדכון אוטומטי בלתי מבוקר של Major Versions. לא הורץ במסגרת מסמך זה פרויקט שמוכיח שילוב של גרסאות Patch מסוימות. [4,22]

**בסיס תמחור:** GitHub Free עם Repository ציבורי וכתובת github.io, ללא Domain פרטי. Pages זמין כך ללא עלות Hosting, ו־Actions על Standard Runners ציבוריים זמין ללא חיוב דקות; יש לשמור על מכסות אחסון Artifacts ו־Cache. אין עלויות API או Database. Repository פרטי עם Pages דורש תוכנית מתאימה; לא הונחה הרשאה לפרסם את הקוד בפועל במסגרת הכנת המסמך. [13,23]

המגבלות המתועדות של Pages כוללות אתר עד 1 GB ו־Soft Limit של 100 GB תעבורה בחודש. אין צפי סביר להתקרב למגבלת גודל במשחק זה, אך אין להבטיח Scalability בלתי מוגבל. יותר שחקנים אינם דורשים הגדלת שרת משחק, משום שהחישוב מקומי; התעבורה עדיין כפופה ל־Hosting. Pages אינו מיועד להפעלת עסק מקוון או SaaS מסחרי כמפורט בתנאיו. לפי ה־PRD אין תשלום או שירות מסחרי; אם הייעוד ישתנה, יש לבחון מחדש את האירוח. [13]

## 2. מבנה המערכת והאחריות

האפליקציה היא SPA סטטית קטנה. אין SSR ואין תהליך Node.js ב־Production.

| Module לוגי | אחריות | קשרים |
| --- | --- | --- |
| UI / Navigation | הצגת בית ואודות, הודעות, שלב, ניקוד ולוח הצבעים | שולח אירועים ל־Game Controller וקורא מצב לתצוגה |
| Game Engine | בדיקת רצף, יצירת שלב, ניקוד, ניצחון וכישלון | עצמאי מ־DOM, Audio ו־Storage; מקבל זמן ואקראיות מבחוץ |
| Game Controller / Scheduler | תיאום זמן, הצגת הרצף ומעברי מצב | מפעיל Engine, UI, Audio ושמירת תוצאה |
| Audio Adapter | ניהול AudioContext ומשוב צליל | מופעל רק מה־Controller; אינו משנה ניקוד |
| Score Storage | קריאה, Validation וכתיבת הישגים | מחזיר ערכים תקינים או כשל הניתן להצגה |
| Lifecycle Adapter | זיהוי הסתרה, חזרה וטעינה מחדש | שולח אירועי השהיה וחידוש ל־Controller |
| PWA Registration | רישום Service Worker וזיהוי עדכון ממתין | מופרד מחוקי המשחק |
| Service Worker | הגשת משאבים שמורים ותחזוקת Cache | אינו מנהל משחק ואינו ניגש ל־Local Storage |

אין Event Bus או Dependency Injection Framework. Modules מתקשרים באמצעות קריאות ואירועים טיפוסיים ומוגדרים. ה־Controller הוא הגורם היחיד המתזמן תופעות לוואי; ה־Engine הוא מקור האמת לחוקי המשחק.

### ניווט וממשק

שני המצבים הניווטיים מיוצגים ב־Hash, למשל `#/` ו־`#/about`, ללא Router חיצוני. כך קישור לאודות אינו דורש Rewrite שאינו קיים ב־GitHub Pages. טעינה חדשה, גם אם הכתובת מצביעה לאודות, יוצרת משחק ריק; חזרה לבית מציגה „התחל”. ניווט פנימי שומר מצב משחק בזיכרון בלבד.

שורש ה־HTML כולל `lang="he"` ו־`dir="rtl"`. ארבעת אזורי המשחק הם כפתורי HTML, בעלי תוויות צבע בעברית; סדרם קבוע ואינו משתנה בין שלבים. CSS Grid יוצר לוח 2×2. מחלקת CSS מבטאת הארה, ללא Canvas או ספריית אנימציה. להשתמש ב־Viewport מתאים, יחידות גמישות וב־Safe Areas של הנייד. הגופן Heebo, שנקבע ב־DESIGN, מצורף לפרויקט כקובצי woff2 מקומיים (תת־קבוצת עברית ולטינית, במשקלים 400, 500 ו־700) ונטען באמצעות `@font-face` עם `font-display: swap`. כך אין תלות ברשת, והקבצים נכללים ב־Precache. אם הגופן לא נטען, משמש ה־Fallback `Arial, sans-serif`.

אירוע הפעלה אחד לכל כפתור, למשל `click`, משמש למגע ולמקלדת; אין לרשום במקביל Touch ו־Click שמכפילים תשובות. הכפתורים חסומים לוגית מחוץ לתור השחקן. „התחל” זמין רק לפני משחק ולאחר סיומו. תוצאה והודעות מופיעות בתוך מסך הבית בלבד.

## 3. מצב המשחק, תזמון ואקראיות

### State Machine

| מצב | התנהגות | מעבר מותר |
| --- | --- | --- |
| idle | המתנה ל־„התחל” | הכנת אודיו ואז presenting |
| presenting | הצגת הרצף וחסימת תשובות | awaitingInput בסיום ההצגה; paused בהסתרה |
| awaitingInput | בדיקת הצבע הבא עם Deadline | המשך תשובה, presenting בשלב הבא, finished או paused |
| paused | אין צלילים, הארות או שעון פעיל | presenting של אותו שלב לאחר חזרה תקינה |
| finished | תוצאה סופית נשמרת פעם אחת | idle/משחק חדש באמצעות „התחל” |

אין צורך בספריית State Machine. תקופות קצרות בין שלבים הן חלק מ־presenting; לא מקבלים בהן תשובות.

### כללי המעבר

- התחלה מאפסת Session, מגרילה צבע אחד ומציגה אותו. מקור האקראיות הוא `Math.random()` עם מיפוי אחיד לארבעה אינדקסים; אין צורך באקראיות קריפטוגרפית או AI. חזרות מותרות.
- בכל הצלחה מלאה של שלב מתעדכן `completedStages`. אם ערכו 10 המשחק מסתיים בניצחון; אחרת מוסיפים צבע אחד לרצף הקיים ומציגים את כולו.
- טעות או תום הזמן מסיימים את המשחק עם מספר השלבים שכבר הושלמו. אין נקודה על תשובה חלקית ואין עדכון תוצאה ברענון.
- כל Session וכל הצגת רצף מקבלים מזהה ריצה. השהיה, סיום או משחק חדש מבטלים Timers ומתעלמים מ־Callbacks ששייכים לריצה קודמת. כך לא יופיעו צלילים, כישלון או שלב חדש ממשחק שבוטל.
- סיום הוא פעולה Idempotent: כישלון וטיימר שחלים כמעט יחד אינם יוצרים שתי תוצאות.

### זמן תגובה והצגת רצף

לכל לחיצה נשמר `deadline = performance.now() + 5000`. הטיימר רק מעורר בדיקה; מקור האמת הוא ה־Deadline, לא מספר פעימות של setInterval. בעת קלט בודקים תחילה שהדף גלוי ושהמצב מתאים, ואז משווים את זמן הקבלה ל־Deadline. לחיצה במועד הסיום או אחריו נחשבת לתום הזמן. כל תשובה נכונה שאינה האחרונה מקבלת Deadline חדש; לאחר תשובה אחרונה מבטלים אותו. [24–25]

**הנחת מימוש לפרט שלא נקבע ב־PRD:** כל צבע ברצף מואר ונשמע 500 ms, עם הפסקה של 200 ms בין הצבעים; לפני שלב נוסף הפסקה של 500 ms. הערכים הם Constants הניתנים לכוונון בקוד, ללא מסך הגדרות או רמת קושי חדשה. חמש שניות התגובה מתחילות רק לאחר סיום פריט התצוגה האחרון וכיבויו. שתי הופעות של אותו צבע חייבות להיות מופרדות בכיבוי ברור.

בעת ירידת הדף לרקע אין להסתמך על Timers: דפדפנים עשויים לעכב אותם. `visibilitychange` ל־hidden משהה מיד ומבטל את כל התזמון. `pagehide` מטפל גם בניווט/מחזור חיים; ב־`pageshow` או חזרה ל־visible יש לבדוק את מצב המשחק. שחזור בזיכרון מ־Back/Forward Cache אינו סיבה לחדש Timers ישנים. [24]

### השהיה וחידוש

מעבר לאודות או הסתרת הדף שומרים בזיכרון את הרצף ומספר השלבים שהושלמו, מאפסים את התשובה החלקית, מכבים אור ועוצרים צלילים. משחק יכול להתחדש רק כאשר הדף גלוי ומסך הבית פעיל. אם שני התנאים התקיימו, מציגים שוב את אותו רצף מתחילתו ונותנים חמש שניות ללחיצה הראשונה. אין הוספת צבע ואין שינוי ניקוד במהלך החזרה.

אם מערכת ההפעלה מחקה את התהליך או שהדף נטען מחדש, נוצר Session חדש במצב idle. אין שחזור התקדמות מאחסון. זו מגבלה מאושרת של המוצר.

## 4. אודיו ומשוב

AudioContext יחיד נוצר או מחודש ישירות מתוך פעולת „התחל”. כל צבע מפיק גל פשוט בתדר קבוע ושונה; GainNode עם עלייה וירידה קצרות מונע קליקים חדים. משך הצליל בתצוגה תואם למשך ההארה. בעת לחיצת שחקן משוב קצר אינו מעכב את בדיקת התשובה או יוצר חסימת קלט נוספת.

**הנחת מימוש:** תדרים 261.63, 329.63, 392.00 ו־523.25 Hz משויכים בהתאמה לכחול, אדום, צהוב וירוק, בעוצמה מתונה. אין להם משמעות עסקית והם אינם פיצ׳ר לבחירה.

ביטול ריצה עוצר ומנתק גם Oscillators שכבר תוזמנו; clearTimeout לבדו אינו עוצר Web Audio. אור וצליל מופעלים מתוך אותו Scheduler, לפי הסדר, ואין מעבר לתור השחקן לפני שהסתיימה התצוגה.

Autoplay או AudioContext מחודש עלולים להיחסם לאחר חזרה מאפליקציה אחרת. יש לנסות `resume()`; אם נדרשת מחוות משתמש, להשאיר paused ולהציג בתוך מסך הבית „להמשך המשחק, הקישו כאן”. הפעולה מחדשת אודיו ומציגה שוב את הרצף; אין ספירת זמן עד אז. זו דרך טכנית למימוש דרישת החזרה, לא מסך נוסף. אם אודיו נכשל גם בהתחלה, להציג הודעה בעברית ולא לקרוס; אפשר להמשיך בחיווי חזותי לפי ה־PRD. אין להבטיח צליל במצב השתקה או כשמערכת ההפעלה חוסמת אותו. [7]

## 5. Data Model ואחסון

| ישות | שדות מרכזיים | משך חיים |
| --- | --- | --- |
| GameSession | phase, sequence: Color[], inputIndex, completedStages, outcome, deadline, runId | זיכרון בלבד; sequence באורך 1–10 בזמן משחק |
| NavigationState | screen: home/about | זיכרון ו־Hash בלבד |
| ScoreRecord | schemaVersion: 1, bestScore: number/null, lastScore: number/null | JSON ב־Local Storage תחת מפתח ייחודי לפרויקט |
| AppAssets | HTML, JS, CSS, Manifest, אייקונים ו־Workbox Runtime | Cache Storage מנוהל גרסה |

שלב נוכחי נגזר מאורך הרצף; הניקוד נגזר מ־completedStages. אין לשמור עותקים נפרדים העלולים לסתור זה את זה. `outcome` הוא win, wrongColor או timeout, ורלוונטי לסיום בלבד. אין שם שחקן, תאריך משחק או היסטוריה.

מפתח האחסון: `simon-memory.scores.v1`. בקריאה יש לעטוף getItem ו־JSON.parse בטיפול שגיאות, ולאמת כל ערך: null או מספר שלם בין 0 ל־10. לפני משחק ראשון שני הערכים null ומוצג „טרם שוחק משחק”. ערך פסול מטופל כחסר; כאשר קיימת תוצאה אחרונה תקינה ושיא חסר/קטן ממנה, מתקנים את השיא לפחות לערך התוצאה האחרונה.

בסיום משחק בלבד: לקרוא גם את השיא השמור העדכני, לחשב את המקסימום בינו, השיא בזיכרון והתוצאה, ולעדכן את שני הנתונים בכתיבת JSON אחת. שגיאת Storage מחזירה סטטוס כשל ל־UI: „לא ניתן לשמור ניקוד במכשיר זה”. התוצאה ממשיכה להופיע בזיכרון, ללא הבטחת שמירה לטעינה הבאה. אחסון מקומי ניתן לשינוי בידי המשתמש ואינו דירוג מאומת. [17]

Local Storage משותף ל־Origin ולא לנתיב. לכן נדרש מפתח ייחודי גם כאשר מספר פרויקטים מוגשים תחת אותו owner.github.io. אין גיבוי, סנכרון או נעילה בין לשוניות; MVP אינו מבטיח הכרעה אטומית בין משחקים המסתיימים בו־זמנית בכמה לשוניות. מחיקת נתוני האתר או שינוי Origin עלולים לאבד הישגים. גם PWA מותקן ודפדפן אינם מובטחים לחלוק אחסון בכל סביבה.

## 6. PWA, Cache ועדכונים

### Manifest ונתיבים

Manifest כולל name ו־short_name בעברית, `lang: he`, `dir: rtl`, `display: standalone`, צבעי מעטפת, אייקונים 192×192 ו־512×512 ואייקון maskable מתאים; להוסיף apple-touch-icon מקומי. `id`, `start_url` ו־`scope` נשארים בתוך נתיב הפרויקט ויציבים בין גרסאות.

בכתובת Project Pages מגדירים Vite base כ־`/<repository>/`. תחת כתובת שורש או Domain פרטי הערך `/`. כל נתיבי האייקונים, ה־Manifest, ה־Service Worker וה־Fallback נגזרים מאותו base. Service Worker נרשם תחת נתיב הפרויקט בלבד, כדי שלא ישלוט באתרים אחרים באותו Origin. [6,26]

### Precache ופעולה ללא אינטרנט

generateSW אוסף בזמן Build את HTML, JS, CSS, קובצי הגופן Heebo, האייקונים, ה־Manifest ואת Workbox Runtime. כולם מוגשים מקומית, ללא CDN, פונטים מרוחקים או ספריית צלילים דרך רשת. יש לכלול במפורש את קובצי public ולבדוק שאין משאב חיוני שנשמט בגלל תבנית סריקה או מגבלת גודל.

להגדיר Cache ID ייחודי לפרויקט, ניקוי Cache ישן בבקרה ו־Navigation Fallback ל־index.html של הפרויקט בלבד. אין Runtime Caching של צד שלישי ואין שמירת תוצאות ב־Cache. לאחר Precache מוצלח והפעלת ה־Service Worker, שני המסכים, המשחק והצלילים פועלים ללא רשת. התקנת PWA אינה תנאי ל־Offline. אין להבטיח זמינות לפני התקנת ה־Service Worker, לאחר פינוי אחסון בידי הדפדפן או בפתיחה ראשונה ללא אינטרנט. [10–12,27]

### מדיניות עדכון שאינה קוטעת משחק

להשתמש בהתנהגות המתנה לעדכון (`registerType: prompt`), ללא רענון אוטומטי וללא קריאה יזומה ל־skipWaiting במהלך Session. אין צורך להציג דיאלוג עדכון או להוסיף פיצ׳ר ממשק. Worker חדש יכול להמתין ולהיכנס לפעולה לפי מחזור החיים הרגיל לאחר סגירת הלקוחות הישנים; לא מפעילים `updateSW()` בזמן משחק. אותו Build טוען את כל קוד המשחק מראש ללא Lazy Loading, כדי לא לבקש Chunk ישן שנמחק במהלך פריסה.

המשמעות: Deployment מוצלח אינו מבטיח שה־PWA שכבר פתוח עבר מיד לגרסה החדשה. משתמשים עשויים להמשיך לשחק בגרסה השמורה עד לסגירה ופתיחה מחדש עם רשת. אין למחוק Local Storage במהלך עדכון או ניקוי Cache. [12,27]

### התקנה ותאימות מובייל

נדרשים HTTPS ו־Manifest תקין. ההתקנה נשענת על מנגנון הדפדפן; אין להניח `beforeinstallprompt` בכל מכשיר. ב־iOS ההתקנה דרך תפריט השיתוף, ואינה שקולה להזמנת התקנה תוכנתית ב־Android. אין פרסום ב־App Store או ב־Google Play. בדיקות התאימות מתמקדות ב־Safari ב־iOS וב־Chrome ב־Android עדכניים, בהתאם להנחת ה־PRD; לא נקבעה תמיכה בגרסאות ישנות. [26]

## 7. ממשקים ו־Data Flow

אין REST API, GraphQL, WebSocket או תקשורת עם שרת משחק. Browser APIs הם הממשקים החיצוניים היחידים בזמן המשחק: DOM, Web Audio, Local Storage, Page Visibility, History/Hash, Service Worker ו־Cache Storage.

1. **פתיחה:** הדפדפן טוען משאבים מ־Pages או מ־Cache. האפליקציה מאמתת את הניקוד המקומי ויוצרת Session ריק.
2. **התחלה:** פעולת משתמש מאפשרת אודיו; ה־Engine מגריל צבע; ה־Controller מציג ושומע את הרצף.
3. **תשובה:** UI מוסר צבע, Controller מאמת מצב וזמן, ו־Engine מחזיר תוצאה. רק אחרי סיום התצוגה נקלטות תשובות.
4. **התקדמות:** תשובה מלאה מגדילה ניקוד; נוסף צבע אחד ומוצג הרצף מחדש, או מסתיים משחק בשלב 10.
5. **סיום:** התוצאה מקובעת פעם אחת, נשמרת דרך Score Storage ומוצגת בבית. אודות קורא את אותו מודל הישגים.
6. **יציאה וחזרה:** Lifecycle/Navigation שולחים pause; חזרה לבית גלוי מפעילה תצוגה מחדש של אותו שלב. רענון יוצר Session ריק ללא כתיבת תוצאה חלקית.

כשל ברישום Service Worker אינו מונע משחק Online; כשל באחסון אינו מונע משחק; כשל אודיו מציג הודעה ואינו מפיל את היישום. רק הצלחה בהכנת Cache מאפשרת להסתמך על Offline.

## 8. אבטחה ופרטיות

אין Authentication או Authorization משום שאין חשבונות, נתונים משותפים או פעולות שרת מוגנות. אין סודות, API Keys או Environment Variables פרטיים בדפדפן. משתני Vite המגיעים ל־Build נחשבים ציבוריים.

לספק את האתר ב־HTTPS, להימנע מהזרקת HTML ולהשתמש ב־textContent עבור נתונים. Local Storage נחשב קלט בלתי מהימן. אין Analytics, Cookies יישומיים או בקשות צד שלישי. אין לטעון קוד Runtime מ־CDN. לנעול תלויות ולהגביל הרשאות Actions למינימום הדרוש.

המשחק אינו אוסף מידע אישי. עם זאת, GitHub מתעד כתובות IP של מבקרים לצורכי אבטחה לפי תיעוד Pages; לכן אין לטעון שכלל תשתית האירוח אינה מתעדת דבר. [14]

## 9. GitHub, Build ו־Deployment

### קוד ותצורה

Repository יחיד כולל קוד מקור, בדיקות, משאבים, PRD, מסמך זה, package-lock.json ותצורת GitHub Actions. אין להעלות node_modules או סודות. `dist` נוצר ב־CI ומשמש Artifact לפריסה, ללא צורך להחזיק עותק ידני של האתר בענף נוסף.

מקבעים Node.js 24 LTS באותה תצורה בפיתוח וב־CI. `npm ci` משתמש ב־Lockfile. Target הדפדפנים ב־Build צריך להיות מוגדר ומתאים לבדיקות המובייל; שינוי Target אינו מוסיף Polyfill ל־Web API חסר.

### מנגנון הפריסה

ב־Settings → Pages בוחרים Source של GitHub Actions. Push ל־main מפעיל Workflow אוטומטי: Checkout, התקנת Node ותלויות, `tsc --noEmit`, `vitest run`, `vite build`, בדיקות Playwright מול תוצר ה־Build, העלאת Pages Artifact ו־Deployment ל־github-pages. Pull Requests מריצים אימות ללא פריסה ל־Production. כל כשל מונע פריסה ושומר את האתר הקודם. [6]

יש להשתמש ב־Actions הרשמיים של GitHub ל־Pages, עם גרסאות מקובעות או Commit SHA, ובהרשאות `contents: read`, `pages: write`, `id-token: write` רק במקום הדרוש. להשתמש ב־Concurrency Group כדי שלא יהיו פריסות מתנגשות. אין צורך ב־Personal Access Token או בהעתקת קבצים ידנית בכל עדכון.

Development רץ ב־Vite מקומי; בדיקת PWA נעשית ב־Production Build המוגש ב־localhost באמצעות `vite preview`, ולא בהסתמכות על HMR. Production הוא Pages. אין צורך בפרויקט Cloud נפרד או במסד נתונים לפיתוח. Rollback מתבצע באמצעות Revert של Commit ופריסה מחדש; גם אז Worker פעיל עשוי להמשיך להגיש גרסה קיימת עד להחלפתו. אין במסמך זה יצירה של Repository או פריסה בפועל.

## 10. אימות הארכיטקטורה וסיכונים

אלה בדיקות התנהגות נדרשות למימוש, ולא Milestones או תוכנית עבודה:

- Unit Tests עם שעון ואקראיות מוזרקים: רצף מצטבר וחזרות, עשרה שלבים, ניקוד 0/6/10, Deadline של 5 שניות, סיום יחיד והתעלמות מקלט שאינו בתור השחקן.
- ביטול וחידוש: השהיה באמצע הצגה ובאמצע תשובה, ללא Callbacks ישנים, ללא הגרלה מחדש וללא ניקוד נוסף. רענון אינו שומר תוצאה חלקית.
- Local Storage: היעדר נתונים, JSON פגום, ערכים מחוץ לטווח, כשל גישה וכשל כתיבה.
- Playwright מול Build בנתיב משנה: שני מסכים בלבד, RTL, מעבר לאודות וחזרה, רענון, שמירת שני ערכי הניקוד ו־Offline לאחר הכנת Cache, לרבות פתיחה מחדש של הדף ללא רשת באותו Context.
- עדכוני PWA: שתי גרסאות עוקבות, Worker ממתין ללא קטיעת משחק, שמירת ניקוד והגבלה ל־scope הנכון.
- טלפונים אמיתיים: התקנה, צלילים לאחר פעולת משתמש ולאחר יציאה וחזרה, נעילת מסך, Safe Areas, נגיעות מהירות ופתיחה ללא אינטרנט. בדיקת WebKit ב־CI אינה הוכחה להתנהגות Safari מותקן ב־iOS.

הסיכונים העיקריים הם מדיניות אודיו של מערכת ההפעלה, פינוי אחסון מקומי, מחיקת תהליך ברקע, זמן התפשטות עדכון PWA ותלויות Build שאינן תואמות. ההתמודדות נכללת בתכנון; אין הבטחת שחזור משחק או ניקוד שאבד, ואין צורך להוסיף Backend כדי לטפל בהם.

## 11. מקורות

מקורות רשמיים שנבדקו במועד המחקר; הבחירות ההנדסיות מבוססות על התאמת היכולות המתועדות ל־PRD, ולא על השוואת Benchmarks שלא בוצעה.

1. [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
2. [React — Quick Start](https://react.dev/learn)
3. [Vue — Introduction](https://vuejs.org/guide/introduction.html)
4. [Vite — Getting Started](https://vite.dev/guide/)
5. [Vite — TypeScript ו־Features](https://vite.dev/guide/features)
6. [Vite — Static Deployment / GitHub Pages](https://vite.dev/guide/static-deploy.html)
7. [MDN — Web Audio Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
8. [MDN — HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
9. [Howler.js](https://howlerjs.com/)
10. [Chrome — Workbox generateSW / injectManifest](https://developer.chrome.com/docs/workbox/modules/workbox-build)
11. [Vite PWA — Strategies and Behaviors](https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors)
12. [Vite PWA — Waiting for Updates](https://vite-pwa-org.netlify.app/guide/prompt-for-update)
13. [GitHub Pages — Limits and Availability](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
14. [GitHub Pages — Hosting and Data Collection](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
15. [Cloudflare Pages — Limits](https://developers.cloudflare.com/pages/platform/limits/)
16. [Vercel — Hobby Plan](https://vercel.com/docs/plans/hobby)
17. [MDN — Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
18. [Vitest — Guide](https://vitest.dev/guide/)
19. [Jest — Getting Started](https://jestjs.io/docs/getting-started)
20. [Playwright — Mobile Emulation](https://playwright.dev/docs/emulation)
21. [Cypress — Introduction](https://docs.cypress.io/app/get-started/why-cypress)
22. [Node.js — Release Status](https://nodejs.org/en/about/previous-releases)
23. [GitHub Actions — Billing and Free Use](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
24. [MDN — Page Visibility and Background Timers](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
25. [MDN — performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
26. [MDN — PWA Installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
27. [MDN — Service Worker Lifecycle and Cache](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
28. [webpack — Concepts](https://webpack.js.org/concepts/)
29. [esbuild — Official Documentation](https://esbuild.github.io/)

## החלטות מרכזיות (ADRs)

### ADR-1: מקור קובצי הגופן Heebo

**הקשר:** הגופן Heebo צריך להיות מצורף לאתר כקובצי woff2 מקומיים (תת־קבוצת עברית ולטינית, משקלים 400, 500 ו־700), ללא טעינה משירות חיצוני. קובצי ה־CSS של תת־הקבוצות בחבילת `@fontsource/heebo` אינם כוללים `unicode-range`, ולכן ייבוא שתי תת־קבוצות באותו משקל היה גורם לאחת מהן לדרוס את השנייה.

**החלטה:** ששת קובצי ה־woff2 הועתקו פעם אחת מחבילת `@fontsource/heebo` 5.3.0 אל `src/assets/fonts/`, יחד עם רישיון SIL OFL 1.1. הגדרות `@font-face` נכתבו ב־`src/fonts.css`, עם `font-display: swap` ו־`unicode-range` לכל תת־קבוצה. החבילה אינה תלות של הפרויקט.

**השלכות:** Vite מוסיף את הקבצים ל־`dist` עם Hash בשם, ובהמשך הם ייכללו ב־Precache. אין תלות Runtime ב־npm או ב־CDN. עדכון הגופן ייעשה ידנית, אם בכלל יידרש.

### ADR-2: הצגת הודעת כשל הצליל

**הקשר:** לפי DESIGN מוצגת בשורת ההודעה הודעה אחת בכל רגע, ולכן „צפו ברצף” היה מחליף מיד את ההודעה „לא ניתן להשמיע צלילים. אפשר להמשיך לשחק לפי האורות.” שמתגלה בלחיצת „התחל”.

**החלטה (אושרה על ידי המשתמש):** כשהכנת האודיו נכשלת (אין AudioContext, יצירתו נכשלת, או שאחרי `resume()` והמתנה של עד 300ms הוא אינו במצב `running`), ההודעה מוצגת במקום „צפו ברצף” בהצגת הרצף הראשונה של המשחק בלבד. בהמשך מוצגות ההודעות הרגילות, והמשחק ממשיך באורות בלבד.

**השלכות:** המשחק אינו ממתין לאודיו יותר מ־300ms ואינו קורס. השתקה ברמת מערכת ההפעלה (למשל מתג שקט) אינה ניתנת לזיהוי ולכן אינה מציגה הודעה.

### ADR-3: Vitest ובדיקת דפדפן ב־Milestone 2

**הקשר:** ה־Engine וה־Controller צריכים בדיקות עם זמן ואקראיות נשלטים. Playwright נדרש במפורש רק החל מ־Milestone 4.

**החלטה:** Vitest 5.0.5 (תואם Vite 8) כתלות פיתוח; קובצי הבדיקה `src/*.test.ts` רצים בסביבת Node עם `vi.useFakeTimers()`, ו־View/Audio מדומים. ה־Controller מקבל `now`, `random` וטיימרים כפרמטרים. בדיקת הדפדפן של Milestone 2 נעשתה ידנית בדפדפן המובנה; Playwright יתווסף ב־Milestone 4. `npm run build` מריץ גם את ה־Unit Tests.

**השלכות:** אין צורך ב־jsdom. בדיקות הדפדפן האוטומטיות יתווספו בהמשך.

### ADR-4: מימוש השהיה וחזרה

**הקשר:** ב־Milestone 3 נוסף מצב `paused`. נדרש להחליט היכן „מקישים כאן” כשהדפדפן חוסם את הצליל בחזרה, ומה קורה כשמשהים בדיוק בהמתנה הקצרה שבין שלבים.

**החלטה (מיקום ההקשה אושר על ידי המשתמש):**
- כשהצליל לא מתחדש בחזרה, שורת ההודעה עצמה מציגה „להמשך המשחק, הקישו כאן” ונעשית לחיצה (ונגישה למקלדת) רק באותו זמן. ההקשה מחדשת את האודיו מתוך הנגיעה ומציגה את הרצף מחדש; אם גם אז אין צליל — ממשיכים באורות בלבד עם הודעת כשל הצליל בהצגה זו.
- הצבע של השלב הבא מוגרל מיד עם השלמת השלב (ולא אחרי ההמתנה של 500ms), כך שלרצף הנוכחי יש תמיד ערך מוגדר והשהיה בהמתנה זו חוזרת לאותו רצף בלי הגרלה נוספת.
- Lifecycle Adapter (`src/lifecycle.ts`) משהה ב־`visibilitychange` ל־hidden, ב־`pagehide` ובמעבר לאודות, ומנסה לחדש רק כשמסך הבית פעיל והדף גלוי.

**השלכות:** אין רכיב UI חדש. השהיה נוספת בזמן שממתינים לאודיו מבטלת את החידוש הממתין. Score Storage (`src/scoreStorage.ts`) הוא המודול היחיד שניגש ל־Local Storage.

### ADR-5: PWA, Offline ובדיקות דפדפן

**הקשר:** ב־Milestone 4 נדרשים Manifest, Precache, Worker מוגבל לנתיב הפרויקט, עדכון שאינו קוטע משחק ובדיקות Playwright מול Build אמיתי. עיצוב האייקון לא הוגדר במקור ואושר על ידי המשתמש (ראה DESIGN).

**החלטה:**
- base קבוע `/simon/` (Project Pages של ה־Repository `simon`); `id`, `start_url` ו־`scope` זהים לו.
- vite-plugin-pwa 2.0.0 (Workbox 7.4.1) עם generateSW, `registerType: 'prompt'` ו־`injectRegister: false`. `cacheId: simon-memory`, `skipWaiting: false`, `clientsClaim: true` (משפיע רק על ה־Worker הראשון), `cleanupOutdatedCaches`, ו־Navigation Fallback ל־index.html רק תחת `/simon/`. ה־Precache כולל HTML, JS, CSS, ששת קובצי Heebo, האייקונים וה־Manifest (15 קבצים).
- הרישום נעשה ב־`src/pwa.ts` באמצעות ייבוא סטטי של `workbox-window` ולא דרך `virtual:pwa-register`, משום שהאחרון יוצר Chunk נפרד שנטען בעיכוב — בניגוד לדרישה ל־Bundle אחד. אין `updateSW`/`skipWaiting` ואין רענון; כשל ברישום נבלע בשקט. בשרת הפיתוח אין רישום.
- האייקונים נוצרים פעם אחת מקובצי SVG ב־`public/icons` באמצעות Playwright (`npm run icons`), ללא תלות נוספת. ה־apple-touch-icon הוא ריבוע מלא, וגרסת ה־maskable מותאמת לאזור הבטוח העגול (רדיוס 40%).
- Playwright 1.64.1, Chromium בלבד בהדמיית Pixel 7, `npm run test:e2e`. בדיקת העדכון בונה שתי גרסאות (`SIMON_BUILD_ID`, מסומן ב־`data-build` בלתי נראה) ל־`dist-e2e/` ומגישה אותן בשרת סטטי קטן הניתן להחלפה.
- `@types/node` נוסף לטיפוסי קובצי התצורה והבדיקות.

**השלכות:** WebKit לא נבדק ב־Milestone זה; יוחלט ב־Milestone 5 אם להוסיפו ל־CI. בדיקת התקנה בטלפון אמיתי דורשת HTTPS ונדחתה ל־Milestone 5. משתמש עם Worker פעיל יקבל גרסה חדשה רק לאחר סגירת כל חלונות המשחק ופתיחה מחדש.

### ADR-6: פריסה אוטומטית ל־GitHub Pages

**הקשר:** ב־Milestone 5 נדרשים בדיקות ופריסה אוטומטיות מ־main, בדיקת Pull Requests בלי פריסה, ואימות על האתר החי. ADR-5 השאיר פתוחה את השאלה אם להוסיף WebKit ל־CI.

**החלטה:**
- Workflow יחיד `.github/workflows/deploy.yml` עם שני Jobs: `verify` (בכל push ל־main, Pull Request ל־main והפעלה ידנית) ו־`deploy` (`needs: verify`, רק ל־main ולא ל־Pull Request). הרשאות `contents: read` כברירת מחדל; `pages: write` ו־`id-token: write` רק ב־`deploy`. Concurrency `pages` בלי ביטול פריסה שהתחילה; בדיקות של אותו Pull Request מבטלות ריצה קודמת.
- Actions רשמיים בלבד, מקובעים לגרסה מדויקת: `actions/checkout@v7.0.1`, `actions/setup-node@v7.1.0` (Node מתוך `.nvmrc`), `actions/upload-artifact@v7.0.2` (דוח בדיקות בכשל בלבד, 7 ימים), `actions/configure-pages@v6.0.0`, `actions/upload-pages-artifact@v5.0.0`, `actions/deploy-pages@v5.0.1`.
- ה־Build נבנה פעם אחת עם `SIMON_BUILD_ID` = ה־commit SHA (סימון `data-build` בלתי נראה). ב־CI ‏Playwright רק מגיש את ה־`dist` הזה (`vite preview`), כך שהבדיקות רצות על הקבצים שמפורסמים בדיוק. מקומית `npm run test:e2e` ממשיך לבנות בעצמו.
- WebKit לא נוסף ל־CI (אושר על ידי המשתמש): הוא אינו מוכיח התנהגות של Safari מותקן ב־iOS; Safari נבדק בטלפון אמיתי.
- `npm run test:e2e:live` מריץ את בדיקות הדפדפן מול האתר החי (`E2E_BASE_URL`); בדיקת שתי הגרסאות מדולגת שם.
- כתובת האתר: https://sharoltastyle-web.github.io/simon/ (Source של Pages: GitHub Actions).
- Rollback: `git revert` ל־commit הבעייתי ו־push ← בדיקות ופריסה אוטומטיות. אפשר גם להריץ מחדש (Re-run) ריצה ירוקה קודמת או להפעיל ידנית. דפדפן עם Worker פעיל ממשיך להציג את הגרסה השמורה עד שכל חלונות המשחק נסגרים והוא נפתח מחדש עם רשת; Local Storage אינו נמחק.

**השלכות:** אין Secrets או Token. כשל בבדיקה כלשהי משאיר את האתר הקודם.

**תוצאות האימות (19.10.2026):**
- Push ל־main ‏(`4c15131`) ← ריצה ירוקה ופריסה; `npm run test:e2e:live` — 7 עברו, בדיקת שתי הגרסאות מדולגת כמתוכנן. אין 404 או שגיאות קונסול, `scope` = `/simon/`, וה־`data-build` באתר זהה ל־SHA.
- עדכון: commit ריק (`e19b6e6`) נפרס; דף פתוח נשאר על הגרסה הקודמת, ה־Worker החדש המתין, משחק התקדם לשלב 2 בלי טעינה מחדש. אחרי סגירה ופתיחה — הגרסה החדשה, Cache אחד בלבד, והניקוד נשאר.
- Rollback: `git revert` (`ddcbeab`, קוד זהה ל־`4c15131`) ← פריסה אוטומטית; אותה התנהגות — הדף הפתוח המשיך בגרסה הקודמת עד סגירה ופתיחה, והניקוד נשאר.
- Pull Request עם בדיקה שנכשלת בכוונה: `verify` נכשל, `deploy` דולג, האתר החי לא השתנה.
- טלפונים: iPhone 13, ‏iOS 27.0.1 — Safari וגם Chrome; Samsung Galaxy S25, ‏One UI 8.5 (Android 16), ‏Chrome 155.0.8059.84. בשניהם: שני המסכים, מגע, צלילים, השהיה וחזרה, ניקוד ורענון, התקנה ופתיחה Standalone, ו־Offline — עברו.
- מגבלה: ב־Galaxy S25 התקנה דרך Samsung Internet נחסמה על ידי Google Play Protect („תוכננה לגרסה ישנה של Android”), כי הדפדפן הזה אורז את ה־PWA ב־targetSdk ישן. זו מגבלה של הדפדפן ולא של האתר, ואין לה תיקון מצד האתר; ההתקנה דרך Chrome עובדת. אין לכבות את Play Protect כדי לעקוף.
