# חיבור סוכן הוואטסאפ למערכת — מדריך התקנה

הסוכן מאזין להודעות וואטסאפ ומכניס אותן אוטומטית למערכת:

- **לקוח כותב למספר העסקי** ← נפתח ליד חדש עם השם, הטלפון וההודעה המקורית (מקור: וואטסאפ). הודעות המשך של אותו לקוח מצטרפות לליד הפתוח במקום לפתוח כפילויות.
- **אתה (הבעלים) כותב למספר העסקי** הודעה חופשית כמו: _"לקוח חדש: דנה לוי 052-1234567, טבעת אירוסין 1 קראט זהב לבן, תקציב 20000"_ ← הסוכן מפענח את הפרטים עם Claude, יוצר לקוח + ליד מלאים, ועונה לך באישור עם לינק ישיר לליד.

## שלב 1 — חשבון Meta Business ואפליקציה

1. היכנס אל [developers.facebook.com](https://developers.facebook.com) והתחבר עם חשבון הפייסבוק העסקי.
2. **My Apps ← Create App** ← בחר **Business** ← תן שם (למשל "PORAT CRM Bot").
3. במסך האפליקציה, תחת **Add products**, הוסף את **WhatsApp**.
4. Meta יוצרת עבורך **מספר בדיקה** זמני — אפשר להתחיל איתו מיד. למספר קבוע: **WhatsApp ← API Setup ← Add phone number** (מספר שלא מחובר כרגע לוואטסאפ רגיל — SIM ייעודי זול עובד מצוין).

## שלב 2 — איסוף המפתחות

| משתנה | איפה מוצאים |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp ← API Setup ← **Temporary access token** (לייצור: צור System User ב־Business Settings עם טוקן קבוע) |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp ← API Setup ← **Phone number ID** (לא המספר עצמו!) |
| `WHATSAPP_APP_SECRET` | App Settings ← Basic ← **App Secret** |
| `WHATSAPP_VERIFY_TOKEN` | מחרוזת שאתה ממציא (למשל `porat-verify-2026`) — תוזן גם ב־Meta וגם ב־Vercel |
| `WHATSAPP_OWNER_NUMBERS` | הטלפון הפרטי שלך, למשל `0521234567` (אפשר כמה, מופרדים בפסיק) |
| `ANTHROPIC_API_KEY` | [platform.claude.com](https://platform.claude.com) ← API Keys (נדרש רק לפענוח הודעות הבעלים) |
| `NEXT_PUBLIC_APP_URL` | כתובת המערכת בפרודקשן, למשל `https://jewellery-inquiry.vercel.app` (בשביל לינקים בתשובות הבוט) |

## שלב 3 — הזנת המשתנים ב־Vercel

Vercel ← הפרויקט ← **Settings ← Environment Variables** ← הוסף את כל המשתנים מהטבלה (סביבת Production) ← **Redeploy**.

## שלב 4 — חיבור ה־Webhook

1. ב־Meta: **WhatsApp ← Configuration ← Webhook ← Edit**.
2. **Callback URL**: `https://<הדומיין-שלך>/api/whatsapp/webhook`
3. **Verify token**: אותה מחרוזת שהזנת ב־`WHATSAPP_VERIFY_TOKEN`.
4. לחץ **Verify and save** — אם המשתנים הוזנו ונפרסו, האימות יעבור מיד.
5. תחת **Webhook fields** לחץ **Manage** וסמן **messages** ← Subscribe.

## שלב 5 — בדיקה

1. שלח הודעת וואטסאפ מהטלפון הפרטי שלך (שמוגדר ב־`WHATSAPP_OWNER_NUMBERS`) למספר העסקי: _"לקוח חדש: ישראל ישראלי 050-0000000, שרשרת זהב 14K"_.
2. תוך שניות אמורה לחזור תשובת אישור עם לינק, והליד יופיע במסך הלידים.
3. שלח הודעה ממספר אחר (לקוח) — ליד חדש ייפתח עם ההודעה המקורית ומקור "וואטסאפ".

## הערות

- **עלות**: שיחות שירות בוואטסאפ (לקוח פנה אליך) — בחינם. פענוח AI של הודעת בעלים — אגורות בודדות להודעה.
- **אבטחה**: כל בקשה נכנסת מאומתת בחתימת HMAC מול ה־App Secret; בקשות לא חתומות נדחות.
- **בלי מפתח Anthropic** המערכת עדיין עובדת: הודעות לקוחות נקלטות כלידים כרגיל, והודעות בעלים נשמרות כליד עם הטקסט המלא (בלי פענוח שדות).
