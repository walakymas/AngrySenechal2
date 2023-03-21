// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  url: "http://senechalweb.duckdns.org:8080/",
//  url: "http://senechalweb.duckdns.org:8881/senechal/",
  prefix: '!',
  hook: 'https://discord.com/api/webhooks/931592114595323934/xKVarpSCk48qtjpN2_JHI-h---gBDW9c6rVR8m1zmvRRZOUP86-TBWvDBIY5xgeETIEk'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
