# Booking and payment terms (single source)

Everything about booking, paying, moving and cancelling on the site renders from this file; nothing about money terms is written anywhere else. Set by a person when the site is built (the shop system never changes it). If the shop takes a deposit, set `deposit_gbp` in `data/business.json` and add a `### Deposit` section and a `- Deposit:` line that use `{{deposit}}` (the README shows the wording); without `deposit_gbp`, any text with `{{deposit}}` is left out of the site.

## booking_terms_short

One sentence, used under booking buttons on the home page, the menu and every treatment page.

Once we have agreed a time on WhatsApp, we confirm your booking in the same chat.

## booking_terms_full

Used on `/faq/`. Headings are read by their first word: Booking, Deposit, Paying, Moving, Cancelling.

### Booking

Every booking is made on WhatsApp. Tell us the treatment and the length you would like and when suits you, and we reply with free times and confirm your booking in the same chat.

### Paying the rest

You pay at the shop on the day. Ask us in the chat which ways to pay we accept.

### Moving your booking

If you need to move your booking, message us at least 24 hours before and we will find you a new time.

### Cancelling, or changes at short notice

Please message us as early as you can and the team will help.

## booking_terms_lines

One-liners for the "Good to know" cards. Read by their first word.

- Booking: We confirm your booking in the same WhatsApp chat.
- Paying: You pay at the shop on the day.
- Changes: Need to move it? Give us at least 24 hours' notice. Anything else, message us as early as you can.
