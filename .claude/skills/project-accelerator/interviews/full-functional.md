# Interview — Full Functional (fase 4)

> **Doel:** elk gat in `voorstel-specs.md` dichten richting een definitief `functional-design.md`. Ga module voor module.
>
> **Hoe te gebruiken:** stel ALLE vragen per module in één bericht aan Robin. 🔴 = blokkerend voor bouw, 🟡 = nice-to-have.

## 👥 Rollen & rechten — diep
🔴 Per rol: welke acties mag hij/zij uitvoeren? Welke data zien?
🔴 Bestaat er een rol-hiërarchie (admin > manager > user)?
🔴 Kan een gebruiker meerdere rollen hebben?
🔴 Hoe wordt een rol toegekend? (self-signup, invite, admin-only)
🟡 Audit log nodig voor rol-wijzigingen?

## 🔄 Per kernflow
*(Loop dit blok af voor ELKE flow uit voorstel-specs.md)*

🔴 Stap-voor-stap happy path:
🔴 Welke validaties op elk veld?
🔴 Welke business rules tussen velden? (bv. einddatum > startdatum)
🔴 Wat gebeurt er bij elke fout? (validatie / server / netwerk)
🔴 Welke edge cases kennen we?
🔴 Wat is de lege state? (geen data nog)
🔴 Wat is de loading state?
🟡 Kan de actie ongedaan gemaakt worden?
🟡 Audit log nodig?

## 📦 Datamodel — diep
🔴 Per entiteit: alle velden + types
🔴 Welke velden zijn verplicht?
🔴 Welke unieke constraints?
🔴 Welke relaties (1-1, 1-n, n-m)?
🔴 Welke velden zijn afgeleid / berekend?
🔴 Soft-delete of hard-delete?
🟡 Versionering / history nodig?

## 🔍 Zoeken & filteren
🔴 Op welke entiteiten moet gezocht kunnen worden?
🔴 Welke filters per lijst?
🔴 Sortering — welke velden, default?
🔴 Pagination, infinite scroll, of beide?

## 📨 Notificaties
🔴 Welke gebeurtenissen triggeren een notificatie?
🔴 Per notificatie: e-mail / in-app / push / combinatie?
🔴 Wie is ontvanger?
🔴 Kunnen gebruikers notificaties uitzetten?
🟡 Templating-engine voor e-mails?

## 📄 Rapportage / export
🟡 Welke rapporten moeten gegenereerd worden?
🟡 Export-formaten (CSV, PDF, Excel)?

## 🌐 Lokalisatie
🟡 Meertaligheid nodig?
🟡 Datum/getal-formaten per locale?

## ♿ Toegankelijkheid
🟡 WCAG-niveau (A, AA, AAA)?
🟡 Specifieke wensen (screenreader, keyboard-only)?
