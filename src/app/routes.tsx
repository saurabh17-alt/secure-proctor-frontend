import { Routes, Route } from "react-router-dom";
import JoinExam from "../pages/candidate/JoinExam";
import SystemCheck from "../pages/candidate/SystemCheck";
import HardwareCheck from "../pages/candidate/HardwareCheck";
import Dashboard from "../pages/admin/Dashboard";
import ViolationsReport from "../pages/admin/ViolationsReport";
import CandidateLayout from "../components/layout/CandidateLayout";
import AdminLayout from "../components/layout/AdminLayout";
import Exam from "../pages/candidate/Exam";
import TestExam from "../pages/candidate/TestExam";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Candidate Routes */}
      <Route element={<CandidateLayout />}>
        <Route path="/join-exam" element={<JoinExam />} />
        <Route path="/system-check" element={<SystemCheck />} />
        <Route path="/hardware-check" element={<HardwareCheck />} />
        <Route path="/exam/:examId" element={<Exam />} />
        <Route path="/test-exam/:examId" element={<TestExam />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="violations" element={<ViolationsReport />} />
      </Route>
    </Routes>
  );
}
