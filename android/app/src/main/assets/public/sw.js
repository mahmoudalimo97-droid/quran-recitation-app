/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "caaf3b8885d6187fb5cb009f4f66bf82"
  }, {
    "url": "pwa-512x512.png",
    "revision": "ec414bf53bab88bc7ecf5d66840437c5"
  }, {
    "url": "pwa-192x192.png",
    "revision": "d6161a07f937c65e9eff10859611df92"
  }, {
    "url": "index.html",
    "revision": "390711dd442495736ed95913862973d5"
  }, {
    "url": "favicon.svg",
    "revision": "e28fedd934fa3461ee50dfc12827fa9e"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d864f30b3de3a7c7567c7aa8f0823a7c"
  }, {
    "url": "fonts/Cairo-Regular.woff2",
    "revision": "4d90a59cb1819bdd41f970549ab90a16"
  }, {
    "url": "fonts/Cairo-Bold.woff2",
    "revision": "4d90a59cb1819bdd41f970549ab90a16"
  }, {
    "url": "fonts/AmiriQuran-Regular.woff2",
    "revision": "cff83e6ef038aa6e208e3f9c01f2e1df"
  }, {
    "url": "fonts/Amiri-Regular.woff2",
    "revision": "b640f7cc591829e5c15f75cbce147288"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-D-0efgI8.js",
    "revision": null
  }, {
    "url": "assets/web-CvYGxtM-.js",
    "revision": null
  }, {
    "url": "assets/index-RlJtCYyt.js",
    "revision": null
  }, {
    "url": "assets/index-BxtMUNqw.css",
    "revision": null
  }, {
    "url": "assets/favicon-Dfnjhd-n.svg",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d864f30b3de3a7c7567c7aa8f0823a7c"
  }, {
    "url": "favicon.svg",
    "revision": "e28fedd934fa3461ee50dfc12827fa9e"
  }, {
    "url": "pwa-192x192.png",
    "revision": "d6161a07f937c65e9eff10859611df92"
  }, {
    "url": "pwa-512x512.png",
    "revision": "ec414bf53bab88bc7ecf5d66840437c5"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "caaf3b8885d6187fb5cb009f4f66bf82"
  }, {
    "url": "fonts/Amiri-Regular.woff2",
    "revision": "b640f7cc591829e5c15f75cbce147288"
  }, {
    "url": "fonts/AmiriQuran-Regular.woff2",
    "revision": "cff83e6ef038aa6e208e3f9c01f2e1df"
  }, {
    "url": "fonts/Cairo-Bold.woff2",
    "revision": "4d90a59cb1819bdd41f970549ab90a16"
  }, {
    "url": "fonts/Cairo-Regular.woff2",
    "revision": "4d90a59cb1819bdd41f970549ab90a16"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6fc1a4ba1e8112c536b9a269ed5ac875"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
