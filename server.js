/**
 * server.js
 * Clean production setup for:
 * - AWS ECS Fargate
 * - Prisma + PostgreSQL (RDS)
 */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

/**
 * Validate required environment variables
 */
const requiredEnv = [
  'DB_USER',
  'DB_PASSWORD',
  'DB_HOST',
  'DB_NAME',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
}

/**
 * Build database connection URL
 */
const dbUser = encodeURIComponent(process.env.DB_USER);
const dbPass = encodeURIComponent(process.env.DB_PASSWORD);
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME;

const databaseUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

/**
 * Prisma client (lazy connection)
 */
const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

/**
 * Express app
 */
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running 🚀' });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // Simple ping to DB
    res.status(200).send('OK');
  } catch (err) {
    res.status(503).send('Database connection error');
  }
});

/**
 * Student Routes
 */

// GET all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { enrollments: true }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET single student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: { enrollments: { include: { class: true } } }
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching student' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { firstName, lastName, email, grade, enrollmentDate } = req.body;
    const newStudent = await prisma.student.create({
      data: { 
        firstName, 
        lastName, 
        email, 
        grade, 
        enrollmentDate: new Date(enrollmentDate) 
      },
    });
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create student', details: error.message });
  }
});

// PUT: Update an existing student (Requires an ID)
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedStudent = await prisma.student.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(updatedStudent);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
});

// DELETE: Remove a student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Delete failed' });
  }
});

/**
 * Teacher Routes
 */

app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: { classes: true }
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

app.get('/api/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: { classes: true }
    });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching teacher' });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, phone } = req.body;
    const newTeacher = await prisma.teacher.create({
      data: {
        firstName,
        lastName,
        email,
        subject,
        phone
      },
    });
    res.status(201).json(newTeacher);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create teacher', details: error.message });
  }
});

app.put('/api/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTeacher = await prisma.teacher.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(updatedTeacher);
  } catch (error) {
    res.status(400).json({ error: 'Update failed. Check if the ID exists.' });
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.teacher.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // Success, no content
  } catch (error) {
    res.status(400).json({ error: 'Delete failed. Teacher might not exist or has active classes.' });
  }
});

/**
 * Course Routes
 */

// GET all courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { 
        teacher: true, // Show teacher details
        enrollments: { include: { student: true } } // Show enrolled students
      }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// POST: Create a new course
app.post('/api/courses', async (req, res) => {
  try {
    const { name, code, description, teacherId } = req.body;
    const newCourse = await prisma.course.create({
      data: { 
        name, 
        code, 
        description,
        teacherId: teacherId ? parseInt(teacherId) : null 
      },
    });
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create course', details: error.message });
  }
});

// PUT: Update course info
app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
});

// DELETE: Remove a course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Delete failed' });
  }
});

/**
 * Enrollment Routes (The Bridge)
 */

// POST: Enroll a student in a course
app.post('/api/enrollments', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        enrollmentDate: new Date()
      },
    });
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ error: 'Enrollment failed. Ensure IDs are valid.' });
  }
});

// GET all enrollments (Audit log)
app.get('/api/enrollments', async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: true,
        course: true
      }
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// DELETE: Unenroll a student
app.delete('/api/enrollments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.enrollment.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Unenrollment failed' });
  }
});

/**
 * HTTP server
 */
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

/**
 * Graceful shutdown (ECS rolling deployments)
 */
const shutdown = async (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down...`);
  try {
    await prisma.$disconnect();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Shutdown error:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server, prisma };