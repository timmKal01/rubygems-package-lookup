import { Actor, log } from 'apify';
import { fetchGems } from './rubygems.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { gemNames = ['rails'] } = input;

if (!Array.isArray(gemNames) || gemNames.length === 0) {
    throw new Error('Input "gemNames" must be a non-empty array, e.g. ["rails"].');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const PACKAGE_LOOKUP_EVENT = 'package-lookup';

const results = await fetchGems(gemNames);

for (const result of results) {
    await Actor.pushData(result);
}

await Actor.charge({ eventName: PACKAGE_LOOKUP_EVENT });

log.info(`Pushed ${results.length} gem(s)`);

await Actor.exit();
