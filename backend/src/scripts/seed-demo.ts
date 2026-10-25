import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/user.model.js';
import { Vehicle } from '../models/vehicle.model.js';

const DEMO_VEHICLES = [
  {
    make: 'Porsche',
    model: '911 GT3 RS',
    year: 2024,
    category: 'Coupe',
    price: 241300,
    quantityInStock: 2,
    description:
      'Track-focused naturally aspirated 4.0L flat-six producing 518 hp with active aerodynamics and Weissach package.',
    imageUrl:
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Mercedes-Benz',
    model: 'AMG G 63',
    year: 2024,
    category: 'SUV',
    price: 183000,
    quantityInStock: 3,
    description:
      'Handcrafted 4.0L V8 biturbo engine with 577 hp, triple locking differentials, and Nappa leather interior.',
    imageUrl:
      'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Audi',
    model: 'RS6 Avant',
    year: 2024,
    category: 'Sedan',
    price: 125800,
    quantityInStock: 4,
    description:
      'Twin-turbo 4.0L V8 executive estate with quattro all-wheel drive, 621 hp performance trim, and carbon ceramic brakes.',
    imageUrl:
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Tesla',
    model: 'Model S Plaid',
    year: 2024,
    category: 'EV',
    price: 89990,
    quantityInStock: 0,
    description:
      'Tri-motor all-wheel drive with 1,020 hp, 0-60 mph in 1.99s, and carbon-sleeved rotors. Currently out of stock.',
    imageUrl:
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'BMW',
    model: 'M4 Competition',
    year: 2024,
    category: 'Coupe',
    price: 83200,
    quantityInStock: 1,
    description:
      'M TwinPower Turbo inline 6-cylinder engine generating 503 hp with M xDrive and M carbon bucket seats.',
    imageUrl:
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Rivian',
    model: 'R1T Adventure',
    year: 2024,
    category: 'Truck',
    price: 73000,
    quantityInStock: 5,
    description:
      'Quad-motor electric adventure pickup with 835 hp, air suspension with 15 inches of ground clearance, and gear tunnel.',
    imageUrl:
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Aston Martin',
    model: 'DB12 Coupe',
    year: 2024,
    category: 'Coupe',
    price: 245000,
    quantityInStock: 2,
    description:
      'The world first Super Tourer with twin-turbo 4.0L V8 delivering 671 hp and handcrafted Bowers & Wilkins surround sound.',
    imageUrl:
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Porsche',
    model: 'Taycan Turbo S',
    year: 2024,
    category: 'EV',
    price: 194900,
    quantityInStock: 3,
    description:
      'Dual permanent magnet motors producing up to 750 hp overboost, 800-volt architecture, and rear-axle steering.',
    imageUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  },
];

async function seedDemoData(): Promise<void> {
  console.info('[Seed Demo] Connecting to development database...');
  await connectDatabase();

  // 1. Seed Admin
  const adminEmail = 'admin@dealership.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: 'AdminPassword123!',
      role: 'admin',
    });
    console.info(`[Seed Demo] Created admin account: ${adminEmail} (password: AdminPassword123!)`);
  } else {
    console.info(`[Seed Demo] Admin account ${adminEmail} already exists.`);
  }

  // 2. Seed Customer
  const customerEmail = 'customer@dealership.com';
  const existingCustomer = await User.findOne({ email: customerEmail });
  if (!existingCustomer) {
    await User.create({
      name: 'Alice Customer',
      email: customerEmail,
      password: 'CustomerPassword123!',
      role: 'customer',
    });
    console.info(
      `[Seed Demo] Created customer account: ${customerEmail} (password: CustomerPassword123!)`,
    );
  } else {
    console.info(`[Seed Demo] Customer account ${customerEmail} already exists.`);
  }

  // 3. Seed Vehicles
  const currentCount = await Vehicle.countDocuments();
  if (currentCount === 0) {
    await Vehicle.insertMany(DEMO_VEHICLES);
    console.info(`[Seed Demo] Successfully seeded ${DEMO_VEHICLES.length} inventory vehicles.`);
  } else {
    console.info(
      `[Seed Demo] Database already contains ${currentCount} vehicles. Skipping vehicle seed.`,
    );
  }

  await disconnectDatabase();
  console.info('[Seed Demo] Done!');
}

seedDemoData().catch(err => {
  console.error('[Seed Demo] Error seeding demo data:', err);
  process.exit(1);
});
