/*

Bootweb $version - boot your web app
Copyright (C) $year Nicolas Karageuzian

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

*/

/**
 * 
 * Utilities for handling Applications
 * 
 */
 
var logger = require("./bootweb").getLogger("bootweb.apps"),
  appsRegistry = {
    apps: {},
    appsList: [],
    loadApp: function(appName, app, appConfig) {
      if (this.apps[appName] !== undefined) {
        throw "[Error] App already loaded " + appName;
      }
      if (typeof app.init !== "function") {
        throw "[Error] App must have an init() " + appName;
      }
      this.apps[appName] = {app: app, config:appConfig};
      this.appsList.push(appName);
    },
    initApps: function(app,cb) {
      var registry = this,
        mapAppsUrls, initsCount = 0;
      mapAppsUrls = function(err, appModule) {
        logger.info("App " + appModule.__filename + " is loaded");
        initsCount = initsCount + 1;
        if (initsCount < registry.appsList.length) {
          return ;
        }
        registry.appsList.forEach(function(appName) {
          if (typeof registry.apps[appName].app.mapUrls === "function") {
            registry.apps[appName].app.mapUrls(app);
          }
        });
        if (typeof cb === "function") {
          cb();
        }
      };
      registry.appsList.forEach(function(appName) {
          registry.apps[appName].app.init(registry.apps[appName].appConfig,mapAppsUrls);
      });
    }
  };

module.exports = appsRegistry;

