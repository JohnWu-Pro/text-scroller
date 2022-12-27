# [Text Scroller](en/README.md) / [闪屏弹幕](zh-CN/README.md)

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
