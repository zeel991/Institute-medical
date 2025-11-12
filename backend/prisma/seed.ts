import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting original stable seed...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const residentPassword = await bcrypt.hash('resident123', 10);

  // --- Users ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medical.com' },
    update: {},
    create: {
      email: 'admin@medical.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'admin',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@medical.com' },
    update: {},
    create: {
      email: 'manager@medical.com',
      password: managerPassword,
      name: 'Facility Manager',
      role: 'facility_manager',
    },
  });

  const resident = await prisma.user.upsert({
    where: { email: 'resident@medical.com' },
    update: {},
    create: {
      email: 'resident@medical.com',
      password: residentPassword,
      name: 'John Resident',
      role: 'resident',
    },
  });

  console.log('Users created:', { admin, manager, resident });

  // --- Facilities ---
  const facilities = [
    {
      name: 'Emergency Department',
      type: 'medical' as const,
      description: 'Emergency medical services and trauma care',
      location: 'Building A, Ground Floor',
    },
    {
      name: 'Radiology Department',
      type: 'medical' as const,
      description: 'X-Ray, CT Scan, MRI services',
      location: 'Building B, 2nd Floor',
    },
    {
      name: 'Cafeteria',
      type: 'general' as const,
      description: 'Main dining facility',
      location: 'Building C, Ground Floor',
    },
    {
      name: 'Parking Lot',
      type: 'general' as const,
      description: 'Patient and visitor parking',
      location: 'North Side',
    },
    {
      name: 'Laboratory',
      type: 'medical' as const,
      description: 'Blood tests, urinalysis, pathology',
      location: 'Building A, 3rd Floor',
    },
  ];

  for (const facility of facilities) {
    await prisma.facility.upsert({
      where: { name: facility.name },
      update: {},
      create: facility,
    });
  }

  console.log('Facilities created');

  const emergencyDept = await prisma.facility.findFirst({
    where: { name: 'Emergency Department' },
  });

  // --- Complaint ---
  if (emergencyDept) {
    await prisma.complaint.create({
      data: {
        title: 'Broken AC unit in waiting area',
        description: 'The air conditioning unit is not working properly, making the waiting area uncomfortable for patients.',
        priority: 'high',
        status: 'new',
        facilityId: emergencyDept.id,
        createdById: resident.id,
      },
    });
    console.log('Sample complaint created');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
