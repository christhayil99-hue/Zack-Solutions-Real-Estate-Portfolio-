const express = require('express');
const router = express.Router();

const sampleProperties = [
  { _id: '1', title: 'Luxury Midtown Apartment', category: 'home', address: { street: '47 Park Ave', city: 'Manhattan', state: 'NY', zip: '10016' }, price: 1250000, type: 'sale', status: 'active', bedrooms: 3, bathrooms: 2, squareFeet: 1480, yearBuilt: 2004, description: 'Stunning corner unit in the heart of Midtown. Floor-to-ceiling windows with breathtaking city views. Steps from Grand Central.', features: ['Doorman', 'Rooftop', 'Gym', 'Parking'] },
  { _id: '2', title: 'Brooklyn Heights Brownstone', category: 'home', address: { street: '12 Elm St', city: 'Brooklyn', state: 'NY', zip: '11201' }, price: 4200, type: 'rent', status: 'active', bedrooms: 2, bathrooms: 1, squareFeet: 950, yearBuilt: 1998, description: 'Charming renovated brownstone in sought-after Brooklyn Heights. Exposed brick, hardwood floors, and private garden.', features: ['Garden', 'Laundry', 'Pet Friendly'] },
  { _id: '3', title: 'Queens Harbor Townhouse', category: 'home', address: { street: '5 Harbor Rd', city: 'Queens', state: 'NY', zip: '11369' }, price: 890000, type: 'sale', status: 'active', bedrooms: 4, bathrooms: 3, squareFeet: 2100, yearBuilt: 2010, description: 'Spacious modern townhouse with stunning harbor views. Open plan living, gourmet kitchen, and private rooftop terrace.', features: ['Rooftop Terrace', 'Garage', 'Smart Home'] },
  { _id: '4', title: 'Upper West Side Studio', category: 'home', address: { street: '88 Columbus Ave', city: 'Manhattan', state: 'NY', zip: '10023' }, price: 2800, type: 'rent', status: 'active', bedrooms: 1, bathrooms: 1, squareFeet: 620, yearBuilt: 2015, description: 'Modern studio steps from Central Park. Floor-to-ceiling windows, built-in storage, and luxury finishes throughout.', features: ['Doorman', 'Gym', 'Bike Storage'] },
  { _id: '5', title: 'Hoboken Waterfront Condo', category: 'home', address: { street: '200 River St', city: 'Hoboken', state: 'NJ', zip: '07030' }, price: 750000, type: 'sale', status: 'active', bedrooms: 2, bathrooms: 2, squareFeet: 1200, yearBuilt: 2018, description: 'Stunning waterfront condo with panoramic Manhattan skyline views. Open floor plan with premium finishes and private balcony.', features: ['Balcony', 'Pool', 'Concierge', 'Parking'] },
  { _id: '6', title: 'Astoria Modern Loft', category: 'home', address: { street: '31-10 Broadway', city: 'Astoria', state: 'NY', zip: '11106' }, price: 3500, type: 'rent', status: 'active', bedrooms: 2, bathrooms: 1, squareFeet: 1100, yearBuilt: 2020, description: 'Brand new modern loft in vibrant Astoria. High ceilings, exposed concrete, chef kitchen, and rooftop access.', features: ['Rooftop', 'Dishwasher', 'Video Intercom'] },
  { _id: '7', title: 'Newark Distribution Warehouse', category: 'industrial', address: { street: '400 Frelinghuysen Ave', city: 'Newark', state: 'NJ', zip: '07114' }, price: 2400000, type: 'sale', status: 'active', bedrooms: 0, bathrooms: 1, squareFeet: 45000, yearBuilt: 2008, description: 'Large distribution warehouse with high clearance ceilings, multiple loading docks, and easy highway access.', features: ['Loading Docks', 'High Ceilings', 'Fenced Lot'] },
  { _id: '8', title: 'Linden Manufacturing Facility', category: 'industrial', address: { street: '88 Industrial Pkwy', city: 'Linden', state: 'NJ', zip: '07036' }, price: 18500, type: 'rent', status: 'active', bedrooms: 0, bathrooms: 2, squareFeet: 32000, yearBuilt: 1995, description: 'Heavy-duty manufacturing space with 3-phase power, freight elevator, and rail access nearby.', features: ['3-Phase Power', 'Freight Elevator', 'Rail Access'] },
  { _id: '9', title: 'Tribeca Penthouse Estate', category: 'luxury', address: { street: '15 Hudson St', city: 'Manhattan', state: 'NY', zip: '10013' }, price: 6800000, type: 'sale', status: 'active', bedrooms: 5, bathrooms: 4, squareFeet: 4200, yearBuilt: 2019, description: 'Sprawling penthouse with private elevator, wraparound terrace, and unobstructed skyline views.', features: ['Private Elevator', 'Wraparound Terrace', 'Wine Cellar', 'Smart Home'] },
  { _id: '10', title: 'Greenwich Luxury Villa', category: 'luxury', address: { street: '22 Lakeview Dr', city: 'Greenwich', state: 'CT', zip: '06830' }, price: 8200000, type: 'sale', status: 'active', bedrooms: 6, bathrooms: 5, squareFeet: 5800, yearBuilt: 2016, description: 'Gated estate on 2 acres with infinity pool, home theater, and chauffeur-ready motor court.', features: ['Infinity Pool', 'Home Theater', 'Gated Entry', 'Guest House'] },
  { _id: '11', title: 'Jersey City Sky Residence', category: 'modern', address: { street: '99 Hudson St', city: 'Jersey City', state: 'NJ', zip: '07302' }, price: 3100, type: 'rent', status: 'active', bedrooms: 1, bathrooms: 1, squareFeet: 780, yearBuilt: 2021, description: 'Sleek high-rise residence with floor-to-ceiling windows, smart thermostat, and resident lounge.', features: ['Smart Thermostat', 'Resident Lounge', 'Co-Working Space'] },
  { _id: '12', title: 'Long Island City Modern Flat', category: 'modern', address: { street: '5-21 47th Ave', city: 'Long Island City', state: 'NY', zip: '11101' }, price: 695000, type: 'sale', status: 'active', bedrooms: 2, bathrooms: 2, squareFeet: 1050, yearBuilt: 2019, description: 'Contemporary flat with minimalist finishes, in-unit washer/dryer, and skyline views from the balcony.', features: ['In-Unit Laundry', 'Balcony', 'Gym'] },
  { _id: '13', title: 'Montclair Family Home', category: 'family', address: { street: '14 Maple St', city: 'Montclair', state: 'NJ', zip: '07042' }, price: 825000, type: 'sale', status: 'active', bedrooms: 4, bathrooms: 3, squareFeet: 2600, yearBuilt: 2001, description: 'Charming family home on a quiet tree-lined street, walking distance to top-rated schools and parks.', features: ['Fenced Yard', 'Finished Basement', 'Near Schools'] },
  { _id: '14', title: 'Westfield Suburban Colonial', category: 'family', address: { street: '7 Birchwood Ln', city: 'Westfield', state: 'NJ', zip: '07090' }, price: 749000, type: 'sale', status: 'active', bedrooms: 4, bathrooms: 2, squareFeet: 2350, yearBuilt: 1998, description: 'Classic colonial with updated kitchen, two-car garage, and large backyard perfect for families.', features: ['2-Car Garage', 'Large Backyard', 'Updated Kitchen'] },
  { _id: '15', title: 'Midtown Class A Office Suite', category: 'office', address: { street: '350 Madison Ave', city: 'Manhattan', state: 'NY', zip: '10017' }, price: 12500, type: 'rent', status: 'active', bedrooms: 0, bathrooms: 2, squareFeet: 6500, yearBuilt: 2012, description: 'Full-floor Class A office suite with private elevator lobby, conference center, and city views.', features: ['Elevator Lobby', 'Conference Center', 'Fiber Internet'] },
  { _id: '16', title: 'Hoboken Creative Office Loft', category: 'office', address: { street: '60 Hudson Pl', city: 'Hoboken', state: 'NJ', zip: '07030' }, price: 1450000, type: 'sale', status: 'active', bedrooms: 0, bathrooms: 2, squareFeet: 4200, yearBuilt: 2006, description: 'Open-concept office loft with exposed brick, high ceilings, and flexible layout for growing teams.', features: ['Exposed Brick', 'Open Floor Plan', 'Bike Storage'] },
  { _id: '17', title: 'Fifth Avenue Retail Storefront', category: 'retail', address: { street: '725 5th Ave', city: 'Manhattan', state: 'NY', zip: '10022' }, price: 35000, type: 'rent', status: 'active', bedrooms: 0, bathrooms: 1, squareFeet: 3200, yearBuilt: 1999, description: 'Premier flagship retail space on a high-traffic avenue with massive storefront windows and signage rights.', features: ['Storefront Windows', 'Signage Rights', 'High Foot Traffic'] },
  { _id: '18', title: 'Edgewater Strip Mall Unit', category: 'retail', address: { street: '120 River Rd', city: 'Edgewater', state: 'NJ', zip: '07020' }, price: 685000, type: 'sale', status: 'active', bedrooms: 0, bathrooms: 1, squareFeet: 1800, yearBuilt: 2003, description: 'End-cap retail unit in busy shopping plaza with ample parking and excellent road visibility.', features: ['Ample Parking', 'Road Visibility', 'End-Cap Unit'] }
];

router.get('/', (req, res) => {
  let results = sampleProperties.filter(p => p.status === 'active');
  if (req.query.type) results = results.filter(p => p.type === req.query.type);
  if (req.query.bedrooms) results = results.filter(p => p.bedrooms >= Number(req.query.bedrooms));
  if (req.query.minPrice) results = results.filter(p => p.price >= Number(req.query.minPrice));
  if (req.query.maxPrice) results = results.filter(p => p.price <= Number(req.query.maxPrice));
  if (req.query.category) results = results.filter(p => p.category === req.query.category);
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
