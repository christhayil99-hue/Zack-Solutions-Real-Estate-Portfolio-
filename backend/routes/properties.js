const express = require('express');
const router = express.Router();

const sampleProperties = [
  { _id: '1', title: 'Luxury Midtown Apartment', address: { street: '47 Park Ave', city: 'Manhattan', state: 'NY', zip: '10016' }, price: 1250000, type: 'sale', status: 'active', bedrooms: 3, bathrooms: 2, squareFeet: 1480, yearBuilt: 2004, description: 'Stunning corner unit in the heart of Midtown. Floor-to-ceiling windows with breathtaking city views. Steps from Grand Central.', features: ['Doorman', 'Rooftop', 'Gym', 'Parking'] },
  { _id: '2', title: 'Brooklyn Heights Brownstone', address: { street: '12 Elm St', city: 'Brooklyn', state: 'NY', zip: '11201' }, price: 4200, type: 'rent', status: 'active', bedrooms: 2, bathrooms: 1, squareFeet: 950, yearBuilt: 1998, description: 'Charming renovated brownstone in sought-after Brooklyn Heights. Exposed brick, hardwood floors, and private garden.', features: ['Garden', 'Laundry', 'Pet Friendly'] },
  { _id: '3', title: 'Queens Harbor Townhouse', address: { street: '5 Harbor Rd', city: 'Queens', state: 'NY', zip: '11369' }, price: 890000, type: 'sale', status: 'active', bedrooms: 4, bathrooms: 3, squareFeet: 2100, yearBuilt: 2010, description: 'Spacious modern townhouse with stunning harbor views. Open plan living, gourmet kitchen, and private rooftop terrace.', features: ['Rooftop Terrace', 'Garage', 'Smart Home'] },
  { _id: '4', title: 'Upper West Side Studio', address: { street: '88 Columbus Ave', city: 'Manhattan', state: 'NY', zip: '10023' }, price: 2800, type: 'rent', status: 'active', bedrooms: 1, bathrooms: 1, squareFeet: 620, yearBuilt: 2015, description: 'Modern studio steps from Central Park. Floor-to-ceiling windows, built-in storage, and luxury finishes throughout.', features: ['Doorman', 'Gym', 'Bike Storage'] },
  { _id: '5', title: 'Hoboken Waterfront Condo', address: { street: '200 River St', city: 'Hoboken', state: 'NJ', zip: '07030' }, price: 750000, type: 'sale', status: 'active', bedrooms: 2, bathrooms: 2, squareFeet: 1200, yearBuilt: 2018, description: 'Stunning waterfront condo with panoramic Manhattan skyline views. Open floor plan with premium finishes and private balcony.', features: ['Balcony', 'Pool', 'Concierge', 'Parking'] },
  { _id: '6', title: 'Astoria Modern Loft', address: { street: '31-10 Broadway', city: 'Astoria', state: 'NY', zip: '11106' }, price: 3500, type: 'rent', status: 'active', bedrooms: 2, bathrooms: 1, squareFeet: 1100, yearBuilt: 2020, description: 'Brand new modern loft in vibrant Astoria. High ceilings, exposed concrete, chef kitchen, and rooftop access.', features: ['Rooftop', 'Dishwasher', 'Video Intercom'] }
];

router.get('/', (req, res) => {
  let results = sampleProperties.filter(p => p.status === 'active');
  if (req.query.type) results = results.filter(p => p.type === req.query.type);
  if (req.query.bedrooms) results = results.filter(p => p.bedrooms >= Number(req.query.bedrooms));
  if (req.query.minPrice) results = results.filter(p => p.price >= Number(req.query.minPrice));
  if (req.query.maxPrice) results = results.filter(p => p.price <= Number(req.query.maxPrice));
  res.json({ success: true, count: results.length, data: results });
});

router.get('/:id', (req, res) => {
  const property = sampleProperties.find(p => p._id === req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
  res.json({ success: true, data: property });
});

router.post('/', (req, res) => {
  res.json({ success: true, data: { ...req.body, _id: Date.now().toString() } });
});

router.put('/:id', (req, res) => {
  res.json({ success: true, data: req.body });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Deleted' });
});

module.exports = router;
