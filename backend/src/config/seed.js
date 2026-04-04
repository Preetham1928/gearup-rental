require('dotenv').config();
const { connectPostgres } = require('./postgres');
const { sequelize } = require('./postgres');
const { connectMongo } = require('./mongo');
const User = require('../models/user.model');
const Equipment = require('../models/equipment.model');
const Rental = require('../models/rental.model');
const Maintenance = require('../models/maintenance.model');
const bcrypt = require('bcryptjs');

async function seed() {
  await connectPostgres();
  await connectMongo();
  await sequelize.sync({ force: true });
  console.log('Seeding...');
  const pw = await bcrypt.hash('password123', 12);

  const users = await User.bulkCreate([
    { name: 'Alex Johnson', email: 'admin@gearup.io',   password: pw, role: 'admin',      company: 'GearUp' },
    { name: 'Sam Rivera',   email: 'manager@gearup.io', password: pw, role: 'manager',    company: 'GearUp' },
    { name: 'Priya Patel',  email: 'priya@college.edu', password: pw, role: 'customer',   company: 'SR University' },
    { name: 'Arjun Mehta',  email: 'arjun@college.edu', password: pw, role: 'customer',   company: 'SR University' },
    { name: 'Jordan Lee',   email: 'jordan@gearup.io',  password: pw, role: 'technician', company: 'GearUp' },
  ], { individualHooks: true });

  const equipment = await Equipment.bulkCreate([
    { name: 'MacBook Pro M3',        equipmentId: 'EQ-001', category: 'laptop',  emoji: '💻', dailyRate: 800, specifications: { RAM: '16GB', Storage: '512GB' },   status: 'available',   totalRentals: 24, totalRevenue: 19200 },
    { name: 'Canon EOS R50 Camera',  equipmentId: 'EQ-002', category: 'camera',  emoji: '📷', dailyRate: 600, specifications: { MP: '24.2MP', Type: 'Mirrorless'},  status: 'available',   totalRentals: 18, totalRevenue: 10800 },
    { name: 'PlayStation 5',         equipmentId: 'EQ-003', category: 'gaming',  emoji: '🎮', dailyRate: 400, specifications: { Storage: '825GB', Res: '4K' },      status: 'rented',      totalRentals: 30, totalRevenue: 12000 },
    { name: 'DJI Mini 3 Drone',      equipmentId: 'EQ-004', category: 'camera',  emoji: '🚁', dailyRate: 700, specifications: { Camera: '4K', Flight: '38min' },    status: 'available',   totalRentals: 12, totalRevenue: 8400  },
    { name: 'Acoustic Guitar',       equipmentId: 'EQ-005', category: 'music',   emoji: '🎸', dailyRate: 150, specifications: { Brand: 'Yamaha', Strings: '6' },    status: 'available',   totalRentals: 20, totalRevenue: 3000  },
    { name: 'Cricket Kit Full Set',  equipmentId: 'EQ-006', category: 'sports',  emoji: '🏏', dailyRate: 200, specifications: { Includes: 'Bat Pads Helmet' },      status: 'available',   totalRentals: 15, totalRevenue: 3000  },
    { name: 'iPad Pro 12.9 inch',    equipmentId: 'EQ-007', category: 'laptop',  emoji: '📱', dailyRate: 500, specifications: { Chip: 'M2', Storage: '256GB' },     status: 'available',   totalRentals: 22, totalRevenue: 11000 },
    { name: 'Sony WH-1000XM5',       equipmentId: 'EQ-008', category: 'music',   emoji: '🎧', dailyRate: 100, specifications: { Type: 'Noise Cancelling' },         status: 'available',   totalRentals: 35, totalRevenue: 3500  },
    { name: 'Projector 4K',          equipmentId: 'EQ-009', category: 'events',  emoji: '📽', dailyRate: 300, specifications: { Resolution: '4K', Lumens: '3500' }, status: 'available',   totalRentals: 10, totalRevenue: 3000  },
    { name: 'GoPro Hero 12',         equipmentId: 'EQ-010', category: 'camera',  emoji: '🎥', dailyRate: 350, specifications: { Resolution: '5.3K', WP: 'Yes' },    status: 'available',   totalRentals: 16, totalRevenue: 5600  },
    { name: 'Badminton Set',         equipmentId: 'EQ-011', category: 'sports',  emoji: '🏸', dailyRate: 80,  specifications: { Rackets: '4', Net: 'Included' },     status: 'available',   totalRentals: 25, totalRevenue: 2000  },
    { name: 'Electric Keyboard 61k', equipmentId: 'EQ-012', category: 'music',   emoji: '🎹', dailyRate: 200, specifications: { Keys: '61', Brand: 'Casio' },        status: 'maintenance', totalRentals: 8,  totalRevenue: 1600  },
  ]);

  await Rental.bulkCreate([
    { orderId: 'ORD-1001', customerId: users[2].id, equipmentId: equipment[0].id, startDate: '2026-01-10', endDate: '2026-01-15', totalDays: 5, dailyRate: 800, totalAmount: 4000, status: 'active',    purpose: 'College project' },
    { orderId: 'ORD-1002', customerId: users[2].id, equipmentId: equipment[1].id, startDate: '2026-01-08', endDate: '2026-01-12', totalDays: 4, dailyRate: 600, totalAmount: 2400, status: 'completed', purpose: 'Photography assignment' },
    { orderId: 'ORD-1003', customerId: users[3].id, equipmentId: equipment[2].id, startDate: '2026-01-18', endDate: '2026-01-20', totalDays: 2, dailyRate: 400, totalAmount: 800,  status: 'active',    purpose: 'Gaming tournament' },
    { orderId: 'ORD-1004', customerId: users[3].id, equipmentId: equipment[4].id, startDate: '2026-01-20', endDate: '2026-01-25', totalDays: 5, dailyRate: 150, totalAmount: 750,  status: 'active',    purpose: 'Music practice' },
  ]);

  await Maintenance.bulkCreate([
    { ticketId: 'MNT-501', equipmentId: equipment[11].id, reportedBy: users[4].id, assignedTo: users[4].id, issue: 'Keys sticking on left side', priority: 'medium', status: 'in_progress', estimatedCost: 500 },
    { ticketId: 'MNT-502', equipmentId: equipment[2].id,  reportedBy: users[1].id, assignedTo: users[4].id, issue: 'Controller joystick drift',  priority: 'low',    status: 'pending',     estimatedCost: 800 },
  ]);

  console.log('Done!');
  console.log('admin@gearup.io / password123');
  console.log('manager@gearup.io / password123');
  console.log('priya@college.edu / password123');
  console.log('jordan@gearup.io / password123');
  process.exit(0);
}
seed().catch(err => { console.error(err); process.exit(1); });
