import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.routes.ts';
import facilitiesRoutes from './routes/facilities.routes.ts';
import complaintsRoutes from './routes/complaints.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import entryExitRoutes from './routes/entryExit.routes.ts';
import usersRoutes from './routes/users.routes.ts';
import medicineRoutes from './routes/medicine.routes.ts';
import medicalRoutes from './routes/medical.routes.ts'; // RESTORED
import schedulingRoutes from './routes/scheduling.routes.ts'; // RESTORED
import { errorHandler } from './middleware/errorHandler.middleware.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/entry-exit', entryExitRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/medical', medicalRoutes); // RESTORED
app.use('/api/scheduling', schedulingRoutes); // RESTORED

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
