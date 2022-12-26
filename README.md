# Text Scroller / 闪屏弹幕

https://play.google.com/store/apps/details?id=com.ttnnapps.LedTextDisplay&hl=en_CA&gl=US&pli=1

https://www.jqueryscript.net/blog/best-custom-qr-code-generator.html
https://github.com/ushelp/EasyQRCodeJS

# TODOs
v Text
   v Tweak icon
   v Position in Firefox
v Foreground
   v Color
   v Scrolling Speed
   v Size
   v Glow Effect, Frequency
v Background
   v Color
   v Image
v What if the site is not responding
+ Refine icons and favicon
+ README per language
+ Render README.md & LICENSE.md, via More, in new page
   + Markdown rendering
   + Replace openDoc
+ English version
v More
   v Share via qrcode
   v QRCode background opaque
   + Honor shared settings
   v Copyright and license
v Refine Add to Home Screen (less aggressive)

v Full screen
v Landscape orientation
v Configuration panel dock to bottom (portrait) or right (landscape)
   + Sliding in configuration panel
v Auto hide configuration panel
v Save settings
+ Beautify switch control

# Project Development

### Setup
The [http-server](https://github.com/http-party/http-server) is used for local development and manual testing.

To install http-server (globally):
```
npm install --global http-server
```

To setup local directory structure
```
# Windows commands
cd <project-dir>
mkdir ..\http-server.public
mklink /J ..\http-server.public\text-scroller .
```
OR
```
# Linux/Unix commands
cd <project-dir>
mkdir -p ../http-server.public
ln ./ ../http-server.public/text-scroller/
```

### Running locally
```
http-server ../http-server.public/ -c-1 -p 9088

# then, open http://localhost:9088/text-scroller/index.html
```

### Deploy / Publish
1. Push the changes to remote (`git@github.com:JohnWu-Pro/text-scroller.git`).
2. Open https://johnwu-pro.github.io/text-scroller/index.html?v=123.
   * NOTE: Using `?v=<random-number>` to workaround issues caused by page `index.html` caching.
