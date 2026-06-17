import { asyncHandler } from '../../utils/asyncHandler.js';
import { geocode, route, nearbyPois } from '../../utils/osm.js';

export const geocodeCtrl = asyncHandler(async (req, res) => {
  res.json((await geocode(req.query.q)) || {});
});

// /maps/directions?from=lat,lng&to=lat,lng
export const directions = asyncHandler(async (req, res) => {
  const parse = (s) => {
    const [lat, lng] = String(s).split(',').map(Number);
    return { lat, lng };
  };
  res.json((await route(parse(req.query.from), parse(req.query.to))) || {});
});

export const nearby = asyncHandler(async (req, res) => {
  const { lat, lng, category } = req.query;
  res.json(await nearbyPois(parseFloat(lat), parseFloat(lng), category));
});
