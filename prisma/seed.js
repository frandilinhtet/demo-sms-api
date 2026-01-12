const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Teachers
  const teacher1 = await prisma.teacher.upsert({
    where: { email: 'r.johnson@school.com' },
    update: {},
    create: {
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'r.johnson@school.com',
      subject: 'Mathematics',
      phone: '123-456-7890',
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { email: 'e.williams@school.com' },
    update: {},
    create: {
      firstName: 'Emily',
      lastName: 'Williams',
      email: 'e.williams@school.com',
      subject: 'English',
      phone: '123-456-7891',
    },
  });

  // Classes
  const class1 = await prisma.class.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Math 101',
      teacherId: teacher1.id,
      room: 'A-201',
      schedule: 'Mon-Wed-Fri 9:00-10:00',
      capacity: 30,
    },
  });

  const class2 = await prisma.class.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'English 101',
      teacherId: teacher2.id,
      room: 'B-105',
      schedule: 'Tue-Thu 10:00-11:00',
      capacity: 25,
    },
  });

  // Students
  const student1 = await prisma.student.upsert({
    where: { email: 'john.doe@school.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@school.com',
      grade: '10',
      classId: class1.id,
    },
  });

  const student2 = await prisma.student.upsert({
    where: { email: 'jane.smith@school.com' },
    update: {},
    create: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@school.com',
      grade: '9',
      classId: class2.id,
    },
  });

  // Courses
  await prisma.course.upsert({
    where: { code: 'MATH401' },
    update: {},
    create: {
      name: 'Advanced Mathematics',
      code: 'MATH401',
      credits: 4,
      description: 'Calculus and Linear Algebra',
    },
  });

  await prisma.course.upsert({
    where: { code: 'ENG301' },
    update: {},
    create: {
      name: 'Literature',
      code: 'ENG301',
      credits: 3,
      description: 'World Literature Analysis',
    },
  });

  // Enrollments
  await prisma.enrollment.upsert({
    where: { 
      studentId_classId: { 
        studentId: student1.id, 
        classId: class1.id 
      }
    },
    update: {},
    create: {
      studentId: student1.id,
      classId: class1.id,
      status: 'active',
    },
  });

  await prisma.enrollment.upsert({
    where: { 
      studentId_classId: { 
        studentId: student2.id, 
        classId: class2.id 
      }
    },
    update: {},
    create: {
      studentId: student2.id,
      classId: class2.id,
      status: 'active',
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });