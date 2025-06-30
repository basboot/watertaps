import * as geolib from "geolib";

// Use chrome.storage.session to cache tap_data per session
async function getTapData() {
  return new Promise((resolve, reject) => {
    chrome.storage.session.get(["tap_data"], async (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      if (result.tap_data) {
        resolve(result.tap_data);
        return;
      }
      try {
        console.log("read data from rivm");
        const response = await fetch(
          "https://data.rivm.nl/geo/alo/wfs?request=GetFeature&service=WFS&version=1.1.0&outputFormat=application%2Fjson&typeName=alo:rivm_drinkwaterkranen_actueel"
        );
        if (!response.ok) {
          reject(new Error(`Failed to fetch tap data: ${response.statusText}`));
          return;
        }
        const tap_data = await response.json();
        chrome.storage.session.set({ tap_data }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve(tap_data);
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

const randomUUID = () => crypto.randomUUID();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function addWaterTaps(jwtToken, cookie, userId, routeId, referrer) {
  const currentDateTime = new Date().toISOString();

  try {
    // Fetch tap_data using chrome.storage.session
    const tap_data = await getTapData();

    // set headers to replay browser requests
    const route_uri = `https://dashboard.hammerhead.io/v1/users/${userId}/routes/${routeId}`;
    const request_headers = {
      accept: "*/*",
      authorization: `Bearer ${jwtToken}`,
      cookie: `${cookie}`,
      Referer: `${referrer}`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    // GET route data
    const route_response = await fetch(route_uri, {
      headers: request_headers,
      body: null,
      method: "GET",
    });

    const route_data = await route_response.json();

    // remove all current watertaps from the route
    // if there are no pois for this route the pointsOfInterest key is not in the JSON
    const pois = (route_data.pointsOfInterest || []).filter((poi) => poi.type !== "water");

    // find taps nearby waypoints, use set to avoid duplicates
    const nearby_taps = new Set();

    for (const waypoint of route_data.waypoints) {
      for (let i = 0; i < tap_data.features.length; i++) {
        // calculate for all waypoints the distance to all watertaps
        const start = { latitude: waypoint.lat, longitude: waypoint.lng };
        const end = {
          latitude: tap_data.features[i].properties.latitude,
          longitude: tap_data.features[i].properties.longitude,
        };

        const dist = geolib.getDistance(start, end);

        // if dist < 1km add it to the Set of nearby taps
        // TODO: put in config
        if (dist < 1000) {
          console.log(dist);
          nearby_taps.add(i);
        }
      }
    }

    // nearby taps identified, add them to the route
    for (const tab_id of nearby_taps) {
      console.log(
        `${tap_data.features[tab_id].properties.latitude}, ${tap_data.features[tab_id].properties.longitude} - ${tap_data.features[tab_id].properties.beschrijvi}`
      );

      pois.push({
        id: randomUUID(),
        type: "water",
        name: "",
        description: tap_data.features[tab_id].properties.beschrijvi,
        location: {
          lng: tap_data.features[tab_id].properties.longitude,
          lat: tap_data.features[tab_id].properties.latitude,
        },
        sourceId: route_data.id,
        notify: false,
        global: false,
      });
    }

    console.log(pois);

    // create json_object for PUT
    const modified_route = {
      id: route_data.id,
      name: route_data.name,
      source: route_data.source,
      routingType: route_data.routingType,
      waypoints: route_data.waypoints,
      routePolyline: route_data.routePolyline,
      pointsOfInterest: pois,
      surfaceSummary: route_data.surfaceSummary,
    };

    await delay(100);
    // send modified route to Hammerhead

    await fetch(route_uri, {
      headers: {
        authorization: request_headers.authorization,
        "content-type": "application/json",
        Referer: request_headers.Referer,
      },
      body: JSON.stringify(modified_route),
      method: "PUT",
    });

    // save and finish save (?)
    await fetch("https://dashboard.hammerhead.io/event", {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        Referer: request_headers.Referer,
      },
      body:
        '{"hasManualSections":false,"source":"dashboard","startTime":"' +
        currentDateTime +
        '","flow":"routeEditor","eventType":"save","version":"2.0.0.master_594","environment":"prod","userId":"40857"}',
      method: "POST",
    });

    await fetch("https://dashboard.hammerhead.io/event", {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        Referer: request_headers.Referer,
      },
      body:
        '{"saved":true,"dirty":true,"source":"dashboard","startTime":"' +
        currentDateTime +
        '","flow":"routeEditor","eventType":"exit","version":"2.0.0.master_594","environment":"prod","userId":"40857"}',
      method: "POST",
    });
  } catch (e) {
    console.log("Something went wrong", e);
  }
}
