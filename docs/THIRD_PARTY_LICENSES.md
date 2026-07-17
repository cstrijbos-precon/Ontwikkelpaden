# Licenties van dependencies buiten het standaard sjabloon

| Package | Versie | Licentie | Reden |
|---|---|---|---|
| `html2canvas` | ^1.4.1 | MIT | Verbeterplanning-tijdlijn: maakt een screenshot van de tabel voor de PDF-export. |
| `jspdf` | ^4.2.1 | MIT | Verbeterplanning-tijdlijn: bouwt de PDF rond de html2canvas-screenshot. Versie 2.5.x is bewust overgeslagen — die bevat een kwetsbare `dompurify`-afhankelijkheid (kritieke XSS-advisory), ook al gebruikt onze code jsPDF's HTML-renderpad niet. |

Beide zijn MIT-gelicenseerd en toegestaan volgens `.claude/rules/precon-licenses.mdc`.
