# King's Cup

King's Cup without a deck of cards. Pass one phone around the table, or mirror it to the TV.

- **Play in the browser:** https://ngfamclam-cpu.github.io/kings-cup/
- **Android app (APK):** https://github.com/ngfamclam-cpu/kings-cup/releases/latest/download/kings-cup.apk

## Features

- Shuffled 52-card deck, rule shown for every card, King counter (4th King ends the game)
- Optional player names with turn reminders
- Question Master and Jack rules stay on screen
- House rules editor: change any card, saved on the device
- Landscape / TV layout with big text, fullscreen, and a screen that stays on
- Works offline once loaded, and resumes the game after an accidental refresh
- Age gate on first launch

## Playing on a TV

Mirror the phone (Android Quick Settings → *Cast* / *Smart View*; iPhone Control Center → *Screen Mirroring*), then turn it sideways. On a laptop, use Chrome's *Cast…* menu and press **F** for fullscreen. **Space** or **Enter** draws a card.

## Installing the APK

Download it on the phone, open it, and allow "install unknown apps" for your browser when Android asks.

The APK is signed with a throwaway debug key that changes on every build, so to install a newer version you have to **uninstall the old one first**. Fixing that needs a permanent signing key (a good next step).

## Project layout

```
www/            the whole game: plain HTML/CSS/JS, no build step
  index.html    screens and dialogs
  app.js        game logic
  rules.js      default card rules
  styles.css    phone + TV layouts
  sw.js         offline cache (bump VERSION when files change)
.github/workflows/
  pages.yml     publishes www/ to GitHub Pages on every push to main
  android.yml   wraps www/ with Capacitor and builds the APK
```

## Making changes

Edit files in `www/`, then test locally with any static server, for example:

```bash
py -m http.server 8080 --directory www
```

Push to `main` and the web version updates in a minute or two. To publish a new APK release:

```bash
git tag v0.1.1
git push origin v0.1.1
```

## Credits

Card faces are drawn with CSS and Unicode suit symbols, so there are no third-party art licenses to worry about.
