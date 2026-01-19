require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const dbUser = process.env.DB_USER;
const dbPass = encodeURIComponent(process.env.DB_PASSWORD || '');
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME;

const databaseUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?sslmode=require`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ============ HEALTH CHECK ============
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// ============ STUDENTS ============
app.get('/api/students', async (req, res) => {
  try {
    const { grade, classId } = req.query;
    const where = {};
    if (grade) where.grade = grade;
    if (classId) where.classId = parseInt(classId);
    
    const students = await prisma.student.findMany({ where, orderBy: { id: 'asc' } });
    res.json({ success: true, data: students, count: students.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { enrollments: { include: { class: true } } }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { firstName, lastName, email, grade, classId } = req.body;
    if (!firstName || !lastName || !email || !grade) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const student = await prisma.student.create({
      data: { firstName, lastName, email, grade, classId: classId || null }
    });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, grade, classId } = req.body;
    const student = await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(grade && { grade }),
        ...(classId !== undefined && { classId })
      }
    });
    res.json({ success: true, data: student });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Student not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await prisma.student.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Student deleted', data: student });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Student not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

// ============ TEACHERS ============
app.get('/api/teachers', async (req, res) => {
  try {
    const { subject } = req.query;
    const where = subject ? { subject: { contains: subject, mode: 'insensitive' } } : {};
    const teachers = await prisma.teacher.findMany({ where, orderBy: { id: 'asc' } });
    res.json({ success: true, data: teachers, count: teachers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.get('/api/teachers/:id', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { classes: true }
    });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, phone } = req.body;
    if (!firstName || !lastName || !email || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const teacher = await prisma.teacher.create({
      data: { firstName, lastName, email, subject, phone }
    });
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

app.put('/api/teachers/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, phone } = req.body;
    const teacher = await prisma.teacher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(subject && { subject }),
        ...(phone !== undefined && { phone })
      }
    });
    res.json({ success: true, data: teacher });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Teacher not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    const teacher = await prisma.teacher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Teacher deleted', data: teacher });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Teacher not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

// ============ CLASSES ============
app.get('/api/classes', async (req, res) => {
  try {
    const { teacherId } = req.query;
    const where = teacherId ? { teacherId: parseInt(teacherId) } : {};
    const classes = await prisma.class.findMany({
      where,
      include: { teacher: true, _count: { select: { enrollments: true } } },
      orderBy: { id: 'asc' }
    });
    res.json({ success: true, data: classes, count: classes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.get('/api/classes/:id', async (req, res) => {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { teacher: true, enrollments: { include: { student: true } } }
    });
    if (!classData) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.post('/api/classes', async (req, res) => {
  try {
    const { name, teacherId, room, schedule, capacity } = req.body;
    if (!name || !teacherId || !room) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const classData = await prisma.class.create({
      data: { name, teacherId, room, schedule, capacity: capacity || 30 }
    });
    res.status(201).json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.put('/api/classes/:id', async (req, res) => {
  try {
    const { name, teacherId, room, schedule, capacity } = req.body;
    const classData = await prisma.class.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(teacherId && { teacherId }),
        ...(room && { room }),
        ...(schedule !== undefined && { schedule }),
        ...(capacity && { capacity })
      }
    });
    res.json({ success: true, data: classData });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Class not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

app.delete('/api/classes/:id', async (req, res) => {
  try {
    const classData = await prisma.class.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Class deleted', data: classData });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Class not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

// ============ COURSES ============
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data: courses, count: courses.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { name, code, credits, description } = req.body;
    if (!name || !code || !credits) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const course = await prisma.course.create({ data: { name, code, credits, description } });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Course code already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { name, code, credits, description } = req.body;
    const course = await prisma.course.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(credits && { credits }),
        ...(description !== undefined && { description })
      }
    });
    res.json({ success: true, data: course });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Course not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const course = await prisma.course.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Course deleted', data: course });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Course not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

// ============ ENROLLMENTS ============
app.get('/api/enrollments', async (req, res) => {
  try {
    const { studentId, classId, status } = req.query;
    const where = {};
    if (studentId) where.studentId = parseInt(studentId);
    if (classId) where.classId = parseInt(classId);
    if (status) where.status = status;
    
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: { student: true, class: true },
      orderBy: { id: 'asc' }
    });
    res.json({ success: true, data: enrollments, count: enrollments.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.post('/api/enrollments', async (req, res) => {
  try {
    const { studentId, classId, status } = req.body;
    if (!studentId || !classId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const enrollment = await prisma.enrollment.create({
      data: { studentId, classId, status: status || 'active' }
    });
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Enrollment already exists' });
    } else if (error.code === 'P2003') {
      res.status(404).json({ success: false, message: 'Student or Class not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

app.delete('/api/enrollments/:id', async (req, res) => {
  try {
    const enrollment = await prisma.enrollment.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Enrollment deleted', data: enrollment });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
    } else {
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  }
});

// ============ STATISTICS ============
app.get('/api/stats', async (req, res) => {
  try {
    const [students, teachers, classes, courses, enrollments, activeEnrollments] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: 'active' } })
    ]);
    res.json({
      success: true,
      data: {
        total_students: students,
        total_teachers: teachers,
        total_classes: classes,
        total_courses: courses,
        total_enrollments: enrollments,
        active_enrollments: activeEnrollments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, prisma };