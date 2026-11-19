---
title: "{{shop_name}} | Treatments booked in one message"
description: "Treatments booked in one WhatsApp message. See the menu, the prices and how to find us, then message us to book."
h1: "Treatments booked in one message"
---

## hero

[image: hero]

Eyebrow: Welcome

# Treatments booked in *one message*

Lead: A calm place to take some time for yourself. Choose a treatment from our menu and book it in one WhatsApp message.

- Button (primary, tag O): Book on WhatsApp
- Button (ghost): See the menu -> /treatments/

Facts strip (three pills; a pill whose fact is not known yet is left out):
- {{address}}
- {{hours_sentence}}
- Booked in one message

## offers

Offers from data/promotions.json, written by the shop's WhatsApp system after the shop manager confirms them. The section is not rendered when no offer is live today. Each card shows the offer's own title, detail, points and end date from the data file; only these words come from here.

Eyebrow: Current offers

## Our current offers

Small line: Valid until

- Button (primary, tag PR): Book this offer

## how-booking-works

Eyebrow: How booking works

## Three short messages and you are booked

No forms to fill in. Booking happens in one WhatsApp chat.

### 1. Message us
Tap any Book button. WhatsApp opens with a short message ready to send, naming the treatment you chose.

### 2. Pick a time
We check the diary and offer you times that are actually free. Choose the one that suits you.

### 3. Your time is confirmed
{{booking_terms_short}}

- Button (ghost on primary, tag O): Book on WhatsApp

## treatments-preview

Eyebrow: Our treatments

## Our treatments

Each treatment is listed with the lengths we offer, exactly as on our booking calendar.

Cards render one per treatment slug from `data/services.json`, in file order, using the `card` line from each `treatments/<slug>.md`. Each card: image, name, card line, option chips, "from £{{from_price}}", and:
- Link: Details -> /treatments/{{slug}}/
- Button (primary, tag H): Book

- Link under the cards: See the full menu and prices -> /treatments/

## our-story

[image: story]
Caption: A calm room, set apart from the day outside.

Eyebrow: Our story

## A quiet place in a busy day

We opened our doors to give people somewhere calm to slow down, with skilled hands and a simple way to book.

Every treatment on our menu is one we know well, and the team is glad to help you choose.

- Link: More about us -> /about/

## gift-vouchers-strip

[image: gift]

Eyebrow: Gift vouchers

## Give someone time for themselves

Our gift vouchers suit birthdays, anniversaries and thank-yous. Message us with who it is for and what you have in mind, and the team arranges the voucher with you on WhatsApp.

- Button (primary, tag G): Buy a voucher on WhatsApp

## visit

[image: room]

Eyebrow: Get in touch

## Come and see us

Address card (a line whose fact is not known yet is left out):
- {{address}}
- {{hours_sentence}}
- Link: Directions -> {{maps_url}}
- Link: Getting here -> /visit/

## closing-band

(from _shared.md, tag T)
