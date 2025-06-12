import * as geolib from 'geolib';

import tap_data from "./rivm_20240502_drinkwaterkranen" with {"type": "json"};
const randomUUID = () => crypto.randomUUID();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function addWaterTaps(jwtToken, cookie, userId, routeId, referrer) {
    const nearby_taps = new Set();

    const currentDateTime = new Date().toISOString();


    try {
        // set headers to replay browser requests
        const route_uri = `https://dashboard.hammerhead.io/v1/users/${userId}/routes/${routeId}`;
        const request_headers = {
            "accept": "*/*",
            "accept-language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6",
            "authorization": `Bearer ${jwtToken}`,
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": `${cookie}`,
            "Referer": `${referrer}`,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        };


        // GET route data
        const route_response = await fetch(route_uri, {
            "headers": request_headers,
            "body": null,
            "method": "GET"
        });

        const route_data = await route_response.json();


        console.log(route_data);

        for (const waypoint of route_data.waypoints) {
            // console.log(">>>", seg)

            for (let i = 0; i < tap_data.features.length; i++) {

                // calculate for all waypoints the distance to all watertaps
                const start = {latitude: waypoint.lat, longitude: waypoint.lng};
                const end = {
                    latitude: tap_data.features[i].properties.latitude,
                    longitude: tap_data.features[i].properties.longitude
                };

                const dist = geolib.getDistance(
                    start,
                    end
                );

                // if dist < 1km add it to the Set of nearby taps
                if (dist < 1000) {
                    console.log(dist);
                    nearby_taps.add(i);
                }
            }
        }

        console.log(nearby_taps);

        // nearby taps identified, create array with pois to add to the route
        const pois = [];

        for (const tab_id of nearby_taps) {
            console.log(`${tap_data.features[tab_id].properties.latitude}, ${tap_data.features[tab_id].properties.longitude} - ${tap_data.features[tab_id].properties.beschrijvi}`);

            pois.push(
                {
                    id: randomUUID(),
                    type: 'water',
                    name: '',
                    description: tap_data.features[tab_id].properties.beschrijvi,
                    location: {
                        lng: tap_data.features[tab_id].properties.longitude,
                        lat: tap_data.features[tab_id].properties.latitude
                    },
                    sourceId: route_data.id,
                    notify: false,
                    global: false
                });
        }

        console.log(pois);


        //         {
        //             "type": "control",
        //             "name": "14",
        //             "description": "",
        //             "location": {
        //                 "lat": 51.962275015486085,
        //                 "lng": 4.23428211349156
        //             },
        //             "sourceId": "40857.route.4d7390e9-3698-45f8-a803-b1a68209a3ad"
        //         }

        // create json_object for PUT
        const modified_route = {
            "id": route_data.id,
            "name": route_data.name,
            "source": route_data.source,
            "routingType": route_data.routingType,
            "waypoints": route_data.waypoints,
            "routePolyline": route_data.routePolyline,
            "pointsOfInterest": pois, // TODO: merge instead of replace
            "surfaceSummary": route_data.surfaceSummary
        };

        await delay(1000);
        // send modified route to Hammerhead

        await fetch(route_uri, {
            "headers": {
                "authorization": request_headers.authorization,
                "content-type": "application/json",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "Referer": request_headers.Referer,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": JSON.stringify(modified_route),
            "method": "PUT"
        });


        // save and finish save (?)
        await fetch("https://dashboard.hammerhead.io/event", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "Referer": request_headers.Referer,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": "{\"hasManualSections\":false,\"source\":\"dashboard\",\"startTime\":\"" + currentDateTime + "\",\"flow\":\"routeEditor\",\"eventType\":\"save\",\"version\":\"2.0.0.master_594\",\"environment\":\"prod\",\"userId\":\"40857\"}",
            "method": "POST"
        });

        await fetch("https://dashboard.hammerhead.io/event", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "Referer": request_headers.Referer,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": "{\"saved\":true,\"dirty\":true,\"source\":\"dashboard\",\"startTime\":\"" + currentDateTime + "\",\"flow\":\"routeEditor\",\"eventType\":\"exit\",\"version\":\"2.0.0.master_594\",\"environment\":\"prod\",\"userId\":\"40857\"}",
            "method": "POST"
        });


        console.log(modified_route)

    } catch (e) {
        console.log("Something went wrong", e);
    }
}


