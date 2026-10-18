# תוכנית — Milestone 1: כניסה למשחק וקריאת הוראות

תאריך: 18.10.2026. מקורות: `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `MILESTONES.md`, והתמונות `wireframes.png`, `mockups.png`, `style-guide.png`.

## מטרה

מעטפת אפליקציה עובדת: מסך בית מעוצב (Header, שורת מצב, לוח 2×2, שורת הודעה ריקה, כפתור „התחל”) ומסך אודות מעוצב (תיאור, הוראות, שני כרטיסי ניקוד), עם ניווט Hash ביניהם, בעברית וב־RTL. **אין** לוגיקת משחק, צלילים, Local Storage או PWA — אלה שייכים ל־Milestones 2–4.

## דרישה מקדימה (פעולה של המשתמש)

Node.js ו־npm **אינם מותקנים** כרגע במחשב (נבדק: הפקודה `node` אינה מזוהה). לפני הבנייה יש להתקין Node.js 24 LTS (כולל npm) מהאתר הרשמי nodejs.org. Claude ידריך צעד אחר צעד בתחילת הבנייה ויוודא `node -v` ≥ 24.

## החלטות מימוש ל־Milestone זה

1. **פרויקט Vite** בתבנית vanilla-ts, נוצר ידנית בשורש הפרויקט (לא בתת־תיקייה), כדי לא לדרוס את `.gitignore` הקיים. תלויות פיתוח בלבד: `vite`, `typescript`. גרסאות Stable, מקובעות ב־`package-lock.json`.
2. **Node 24:** `"engines": { "node": ">=24" }` ב־`package.json` וקובץ `.nvmrc` עם `24`.
3. **גופן Heebo מקומי:** החבילה `@fontsource/heebo` (משקלים 400, 500, 700). היא מספקת קובצי woff2 ו־`@font-face` עם `font-display: swap`; Vite מעתיק את הקבצים ל־`dist` כך שהם מוגשים מהאתר עצמו, ללא CDN. ייובאו רק תת־הקבוצות `hebrew` ו־`latin` (קובצי CSS לפי subset, למשל `@fontsource/heebo/hebrew-400.css`, `latin-400.css` וכו'). Fallback: `Arial, sans-serif`. תתועד כ־ADR קצר ב־ARCHITECTURE.md (מקור קובצי ה־woff2).
4. **Vite `base`:** `./` (נתיבים יחסיים) בשלב זה, כך שה־Build עובד גם מתחת לנתיב משנה. הערך הסופי `/<repository>/` ייקבע ב־Milestone 5 לפי שם ה־Repository.
5. **ניווט:** `#/` = בית, `#/about` = אודות. Hash לא מוכר → בית. האזנה ל־`hashchange`, החלפת המסך המוצג (`hidden`) בלי טעינה מחדש. קישורי ה־Header הם `<a href="#/about">` / `<a href="#/">`.
6. **HTML סטטי:** שני המסכים כתובים ישירות ב־`index.html` כ־`<section>`; ה־TypeScript רק מחליף ביניהם ומעדכן את `document.title`. אין יצירת HTML דינמית (ובהתאם — אין `innerHTML`).
7. **מבנה קוד מינימלי:** `main.ts` (כניסה) ו־`navigation.ts` (ניווט). Modules נוספים (Engine, Controller, Audio, Storage) ייווצרו רק ב־Milestones הבאים.

## קבצים ליצור / לשנות

| קובץ | תוכן |
| --- | --- |
| `package.json` | שם `simon-memory`, `"type": "module"`, scripts: `dev` (`vite`), `build` (`tsc --noEmit && vite build`), `preview` (`vite preview`), `typecheck` (`tsc --noEmit`); engines node ≥24 |
| `package-lock.json` | נוצר ע"י `npm install` |
| `.nvmrc` | `24` |
| `tsconfig.json` | לפי תבנית vanilla-ts: `strict: true`, `noEmit`, `moduleResolution: bundler`, `target: ES2022`, `lib: [ES2022, DOM, DOM.Iterable]`, `include: ["src"]` |
| `vite.config.ts` | `base: './'`, `build.target: 'es2022'` |
| `index.html` | `<html lang="he" dir="rtl">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="theme-color" content="#171717">`, `<title>סיימון</title>`, שני ה־sections (פירוט למטה), `<script type="module" src="/src/main.ts">` |
| `src/main.ts` | ייבוא קובצי הגופן וה־CSS, הפעלת הניווט |
| `src/navigation.ts` | `parseRoute(hash): 'home' \| 'about'`, `showScreen()`, האזנה ל־`hashchange` |
| `src/style.css` | Tokens, פריסה ועיצוב (פירוט למטה) |
| `src/vite-env.d.ts` | `/// <reference types="vite/client" />` |
| `.gitignore` | ללא שינוי — כבר כולל `node_modules/` ו־`dist/` |
| `CLAUDE.md` | מילוי „פקודות הרצה”: dev = `npm run dev`; בדיקות = `npm run build` (בדיקת טיפוסים + Build; Unit Tests יתווספו ב־Milestone 2) |
| `spec/ARCHITECTURE.md` | הוספת `## החלטות מרכזיות (ADRs)` עם ADR-1 (מקור גופן Heebo מ־@fontsource) |
| `spec/MILESTONES.md` | סימון 🟡 ליד כותרת Milestone 1 בסיום הבנייה |

## מבנה ה־HTML

### מסך בית — `<section id="screen-home">`

```
header.app-header
  h1  „סיימון”                       (ימין)
  a[href="#/about"]  „אודות”         (שמאל)
main
  div.status-bar
    span  „שלב: 0 מתוך 10”           (ימין)
    span  „ניקוד: 0”                 (שמאל)
  div.board  (Grid 2×2, סדר DOM: כחול, אדום, צהוב, ירוק)
    button.pad.pad--blue    „כחול”   aria-label="כחול"
    button.pad.pad--red     „אדום”
    button.pad.pad--yellow  „צהוב”
    button.pad.pad--green   „ירוק”
  p.message  (ריק; aria-live="polite"; גובה קבוע של שתי שורות)
  button.start-button  „התחל”
```

- ב־RTL, Grid ממקם את הפריט הראשון בימין: כחול ימין־עליון, אדום שמאל־עליון, צהוב ימין־תחתון, ירוק שמאל־תחתון — בדיוק לפי DESIGN. אין לשקף ידנית.
- כפתורי הצבע ו־„התחל” עדיין לא מבצעים דבר (אין Listeners). הם נשארים לחיצים ונראים במצב רגיל, כמו ב־Mockup. „התחל” אינו Disabled (ב־Mockup הוא פעיל).
- הערכים „0” במספרים יושבו בתוך `<span>` נפרדים (`#stage-value`, `#score-value`) כדי שיהיה קל לעדכן אותם ב־Milestone 2.

### מסך אודות — `<section id="screen-about" hidden>`

```
header.app-header
  h1  „אודות”                         (ימין)
  a[href="#/"]  „חזרה למשחק”          (שמאל)
main
  p  „משחק זיכרון עם אורות וצלילים”
  h2  „איך משחקים?”
  ul.instructions  (ללא תבליטים/מספור) — 7 השורות מ־DESIGN.md, בסדר ובניסוח המדויק
  section.score-card
    h3.score-card__title  „השיא האישי”
    p.score-card__value   „טרם שוחק משחק”    (#best-score)
  section.score-card
    h3.score-card__title  „תוצאת המשחק האחרון”
    p.score-card__value   „טרם שוחק משחק”    (#last-score)
```

## עיצוב (`style.css`)

**Tokens על `:root`** (רק ערכים מאושרים ב־DESIGN):
`--color-bg #171717`, `--color-surface #262626`, `--color-text #F5F5F5`, `--color-border #4A4A4A`, `--color-blue #009FE3`, `--color-red #D9232B`, `--color-yellow #E4D600`, `--color-green #23AD4A`, `--radius 16px`, `--shadow 0 4px 12px rgba(0,0,0,0.24)`, `--space-1..4: 8/16/24/32px`, גדלי טיפוגרפיה H1 32/700, H2 24/700, Body 16/400, Label 14/500, Button 18/700. גופן: `'Heebo', Arial, sans-serif`.

**פריסה כללית:**
- `body` ברקע `--color-bg`, טקסט `--color-text`, `margin: 0`, `overflow-x: hidden`. ריפוד צדדי עם `env(safe-area-inset-*)`.
- עמודה אחת ברוחב מלא במובייל, עם `max-width` מתון (כ־480px) ממורכז — אין עיצוב Desktop נפרד.
- **Header:** משטח `--color-surface`, קו תחתון 1px `--color-border`, Flex עם `justify-content: space-between`; כותרת H1 בימין, קישור בצד שמאל. קישור: טקסט בהיר, ללא קו תחתון, אזור לחיצה ≥48×48px (padding).
- **מסך בית** ממלא את גובה ה־Viewport (`min-height: 100dvh`), בלי גלילה במסך טלפון רגיל: Header ← שורת מצב ← לוח ← שורת הודעה ← „התחל”.
- **מסך אודות:** זרימה רגילה עם גלילה אנכית כשצריך.

**לוח המשחק:**
- מסגרת כהה סביב הלוח (כמו ב־Mockup), `display: grid; grid-template-columns: 1fr 1fr; gap` כהה בינוני (8px).
- כפתורים מרובעים (`aspect-ratio: 1`), גודל הלוח מוגבל כך שגם במסך נמוך „התחל” נשאר גלוי (רוחב מוגבל לפי `min(100%, גובה זמין)`).
- כל כפתור: צבע הבסיס + שכבת `linear-gradient` שקופה להברקה עליונה ועומק תחתון, מסגרת כהה עבה (≈3px, כמעט שחור), `border-radius: var(--radius)`, `inset` highlight עדין — התאמה ל־Mockup בלי להחליף את צבעי הבסיס.
- תוויות: ממורכזות, מודגשות (700), גודל גדול יחסית (`clamp`, בערך 28–36px); כחול/אדום/ירוק בטקסט בהיר, צהוב בטקסט כהה (כמו ב־Mockup).
- מחלקת Active (`.pad.is-active`: `filter: brightness(1.25)` + `box-shadow` Glow בצבע הכפתור) **מוגדרת כבר עכשיו ב־CSS** אך אינה מופעלת עד Milestone 2.
- `touch-action: manipulation` ו־`-webkit-tap-highlight-color: transparent` על הכפתורים.

**שורת הודעה:** ממורכזת, Body 16px, `min-height` של שתי שורות (`calc(2 * line-height)`), ריקה כעת.

**כפתור „התחל”:** ברוחב מלא, גובה ≥56px, `border-radius: var(--radius)`, מסגרת כהה, Gradient כסוף בהיר (מלמעלה בהיר למטה אפור; גוונים מותאמים ל־Mockup ואינם נרשמים כ־Tokens מאושרים), טקסט כהה 18px/700, `--shadow`. סגנון Disabled (`:disabled` — כהה עם ניגודיות מופחתת) מוגדר ב־CSS לשימוש עתידי.

**כרטיסי ניקוד:** `--color-surface`, מסגרת 1px `--color-border`, `--radius`, `--shadow`. אזור כותרת (Label מודגש, רקע מעט בהיר יותר) מופרד בקו 1px מאזור הערך; טקסט מיושר לימין.

**הוראות:** רשימה ללא סימני תבליט, Body 16px, `line-height` נדיב (≈1.7) כדי למנוע צפיפות.

## בדיקות שאריץ בעצמי (לפני סימון 🟡)

1. `npm ci` מתיקייה נקייה (מחיקת `node_modules` — תיקייה שנוצרה בבנייה עצמה), `npm run typecheck`, `npm run build` — כולם מצליחים.
2. הרצת `npm run dev` ו־`npm run preview`, ופתיחה בדפדפן המובנה:
   - בית → „אודות” → „חזרה למשחק”: המסך מתחלף בלי טעינה מלאה (בדיקה שמשתנה JS שהוצב בדף נשמר אחרי המעבר).
   - פתיחה ישירה של `#/about` מציגה את אודות; Hash לא מוכר מציג בית.
3. השוואה חזותית (צילומי מסך) מול `wireframes.png`, `mockups.png`, `style-guide.png`: שני מסכים בלבד, כל הטקסטים במדויק, אין רכיבים נוספים, הלוח מרובע ולא עגול.
4. בדיקת מיקומי הצבעים באמצעות מיקום הכפתורים בפועל (`getBoundingClientRect`).
5. מידות טלפון (375×812, וגם מסך קטן 320×568): אין גלילה אופקית (`scrollWidth <= clientWidth`), כפתורים לא חתוכים, אודות נגלל אנכית; מדידת אזורי לחיצה ≥48px (כפתורי צבע, „התחל”, קישורי Header).
6. וידוא שהגופן Heebo נטען מקומית (`document.fonts`, ובקשות רשת רק ל־localhost).
7. סגירת השרתים בסיום.

## מה לא נכלל (ייאמר במפורש בדיווח)

- מנגנון המשחק, הארות, צלילים ושורת ההודעה הפעילה — Milestone 2.
- השהיה, שמירת ניקוד והצגתו באודות — Milestone 3.
- PWA ו־Offline — Milestone 4.
- Vitest/Playwright — יתווספו כשיש לוגיקה לבדוק (Milestone 2).

## Definition of Done — איך כל סעיף ייבדק

| סעיף | אופן הבדיקה |
| --- | --- |
| `npm ci`, `tsc --noEmit`, `vite build` מצליחים | הרצה בפועל בבדיקה 1 |
| מעבר בית → אודות → בית ללא טעינה מלאה; `#/about` ישיר תקין | בדיקה 2 |
| התאמה חזותית לשלוש התמונות, שני מסכים, ללא רכיבים נוספים | בדיקה 3 |
| מיקומי הצבעים | בדיקה 4 |
| מידות טלפון, גלילה, קריאות, 48px | בדיקה 5 |
| הקוד ב־GitHub ללא `node_modules` או סודות | **תלוי בבקשת „דחוף שינויים לגיטהאב”** (לפי CLAUDE.md אין commit/push לפני כן). בבנייה אוודא ש־`git status` אינו כולל `node_modules`/`dist`/`.env`. בדחיפה הראשונה אבקש את כתובת ה־Repository ב־GitHub. |
